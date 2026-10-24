from typing import Any
from bson import ObjectId


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, list):
            result[key] = [serialize_doc(v) if isinstance(v, dict) else str(v) if isinstance(v, ObjectId) else v for v in value]
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        else:
            result[key] = value
    return result


def serialize_list(docs: list) -> list:
    return [serialize_doc(d) for d in docs]


def to_object_id(id_str: str) -> ObjectId:
    """Safely convert string to ObjectId, raise ValueError if invalid."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise ValueError(f"Invalid id: {id_str}")
