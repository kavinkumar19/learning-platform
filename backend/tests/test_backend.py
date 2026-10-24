"""
Tests for IT LearnHub backend.
Run: pytest tests/ -v
Requires a running MongoDB instance (or mongomock).
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch
import os

# Set test environment before importing app
os.environ["MONGODB_URI"] = "mongodb://localhost:27017"
os.environ["DATABASE_NAME"] = "it_learnhub_test"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"

from app.main import app
from app.core.security import hash_password, verify_password, create_access_token, decode_token


# ──────────────────────────── UNIT TESTS ────────────────────────────────────

class TestSecurity:
    def test_hash_and_verify_password(self):
        hashed = hash_password("mysecret")
        assert verify_password("mysecret", hashed)
        assert not verify_password("wrong", hashed)

    def test_create_and_decode_token(self):
        token = create_access_token({"sub": "user123", "role": "student"})
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user123"
        assert payload["role"] == "student"

    def test_invalid_token_returns_none(self):
        result = decode_token("not.a.valid.token")
        assert result is None

    def test_tampered_token_returns_none(self):
        token = create_access_token({"sub": "user123"})
        tampered = token[:-5] + "XXXXX"
        assert decode_token(tampered) is None


# ──────────────────────────── INTEGRATION TESTS ─────────────────────────────
# These tests require a running MongoDB. They use the real FastAPI app.

@pytest.mark.asyncio
class TestAuthEndpoints:
    """Integration tests for /auth/* endpoints."""

    @pytest_asyncio.fixture(autouse=True)
    async def setup(self):
        """Setup: use test transport and ensure test users exist in test DB."""
        self.transport = ASGITransport(app=app)
        from app.database.connection import get_db
        from app.core.security import hash_password
        db = await get_db()
        await db["users"].update_one(
            {"email": "alice@student.com"},
            {"$set": {"name": "Alice Student", "password_hash": hash_password("student123"), "role": "student"}},
            upsert=True
        )
        await db["users"].update_one(
            {"email": "admin@itlearnhub.com"},
            {"$set": {"name": "Admin Faculty", "password_hash": hash_password("admin123"), "role": "admin"}},
            upsert=True
        )

    async def test_health_check(self):
        async with AsyncClient(transport=self.transport, base_url="http://test") as client:
            response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    async def test_register_and_login(self):
        async with AsyncClient(transport=self.transport, base_url="http://test") as client:
            # Register
            reg = await client.post("/auth/register", json={
                "name": "Test User",
                "email": "testuser_unique@example.com",
                "password": "testpass123",
            })
            # 201 if new, 400 if already exists (idempotent across runs)
            assert reg.status_code in (201, 400)

            if reg.status_code == 201:
                data = reg.json()
                assert "access_token" in data
                assert data["user"]["role"] == "student"

            # Login
            login = await client.post("/auth/login", json={
                "email": "testuser_unique@example.com",
                "password": "testpass123",
            })
            assert login.status_code == 200
            token_data = login.json()
            assert "access_token" in token_data

    async def test_login_wrong_password(self):
        async with AsyncClient(transport=self.transport, base_url="http://test") as client:
            resp = await client.post("/auth/login", json={
                "email": "nobody@nowhere.com",
                "password": "wrongpass",
            })
        assert resp.status_code == 401

    async def test_me_without_token(self):
        async with AsyncClient(transport=self.transport, base_url="http://test") as client:
            resp = await client.get("/auth/me")
        assert resp.status_code in (401, 403)  # No bearer token

    async def test_student_cannot_access_admin_endpoint(self):
        """Students must not reach admin-only endpoints."""
        async with AsyncClient(transport=self.transport, base_url="http://test") as client:
            # Login as student
            login = await client.post("/auth/login", json={
                "email": "alice@student.com",
                "password": "student123",
            })
            if login.status_code != 200:
                pytest.skip("Seed data not loaded; run seed.py first")

            token = login.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Attempt to create a semester — must be denied
            resp = await client.post(
                "/admin/semesters",
                json={"semester_number": 9, "academic_year": "2025-26", "regulation": "R2021"},
                headers=headers,
            )
        assert resp.status_code == 403

    async def test_admin_can_access_analytics(self):
        async with AsyncClient(transport=self.transport, base_url="http://test") as client:
            login = await client.post("/auth/login", json={
                "email": "admin@itlearnhub.com",
                "password": "admin123",
            })
            if login.status_code != 200:
                pytest.skip("Seed data not loaded; run seed.py first")

            token = login.json()["access_token"]
            resp = await client.get(
                "/admin/analytics",
                headers={"Authorization": f"Bearer {token}"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert "total_students" in data
        assert isinstance(data["total_students"], int)
