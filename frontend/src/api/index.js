import api from './client';

// ── Auth API ──
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// ── Academic API (Semesters, Subjects, Units) ──
export const academicApi = {
  // Semesters
  getSemesters: () => api.get('/semesters'),
  createSemester: (data) => api.post('/admin/semesters', data),
  updateSemester: (id, data) => api.put(`/admin/semesters/${id}`, data),
  deleteSemester: (id) => api.delete(`/admin/semesters/${id}`),

  // Subjects
  getSubjects: (semesterId) => api.get(`/semesters/${semesterId}/subjects`),
  createSubject: (data) => api.post('/admin/subjects', data),
  updateSubject: (id, data) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),

  // Units
  getUnits: (subjectId) => api.get(`/subjects/${subjectId}/units`),
  createUnit: (data) => api.post('/admin/units', data),
  updateUnit: (id, data) => api.put(`/admin/units/${id}`, data),
  deleteUnit: (id) => api.delete(`/admin/units/${id}`),
};

// ── Materials API ──
export const materialsApi = {
  list: (params) => api.get('/materials', { params }),
  search: (query, params) => api.get('/materials/search', { params: { q: query, ...params } }),
  get: (id) => api.get(`/materials/${id}`),
  downloadUrl: (id) => `/api/materials/${id}/download`,
  upload: (formData) => api.post('/admin/materials', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/admin/materials/${id}`),
  toggleStatus: (id, status) => api.patch(`/admin/materials/${id}/status`, null, { params: { status_value: status } }),
};

// ── Assignments API ──
export const assignmentsApi = {
  list: (params) => api.get('/assignments', { params }),
  get: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/admin/assignments', data),
  update: (id, data) => api.put(`/admin/assignments/${id}`, data),
  delete: (id) => api.delete(`/admin/assignments/${id}`),

  // Drafts
  saveDraft: (assignmentId, draftText) => api.post(`/assignments/${assignmentId}/drafts`, { draft_text: draftText }),
  getMyDraft: (assignmentId) => api.get(`/assignments/${assignmentId}/drafts/my`),
  getAllDrafts: () => api.get('/assignments/drafts/all'),
  updateDraft: (draftId, draftText) => api.put(`/assignments/drafts/${draftId}`, { draft_text: draftText }),
  deleteDraft: (draftId) => api.delete(`/assignments/drafts/${draftId}`),
};

// ── Exams API ──
export const examsApi = {
  list: (params) => api.get('/exams', { params }),
  getQuestions: (examId) => api.get(`/exams/${examId}/questions`),
  start: (examId) => api.post(`/exams/${examId}/start`),
  submit: (examId, answers) => api.post(`/exams/${examId}/submit`, { answers }),
  getResults: () => api.get('/results'),
  getResultDetail: (attemptId) => api.get(`/results/${attemptId}`),

  // Admin
  createExam: (data) => api.post('/admin/exams', data),
  updateExam: (id, data) => api.put(`/admin/exams/${id}`, data),
  deleteExam: (id) => api.delete(`/admin/exams/${id}`),
  addQuestion: (examId, data) => api.post(`/admin/exams/${examId}/questions`, data),
  deleteQuestion: (questionId) => api.delete(`/admin/questions/${questionId}`),
};

// ── History & Analytics API ──
export const analyticsApi = {
  getHistory: (params) => api.get('/history', { params }),
  getAdminAnalytics: () => api.get('/admin/analytics'),
};
