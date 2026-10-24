import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignmentsApi, academicApi } from '../api';
import {
  FileEdit,
  Save,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Calendar,
  BookOpen,
  Award
} from 'lucide-react';

const AssignmentsPage = () => {
  const { isAdmin } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMarks, setNewMarks] = useState(20);
  const [subjects, setSubjects] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const autoSaveTimeoutRef = useRef(null);

  // Load assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await assignmentsApi.list();
      setAssignments(res.data);
      if (res.data.length > 0 && !selectedAssignment) {
        selectAssignment(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // When admin opens modal, load academic structure
  useEffect(() => {
    if (isAdmin) {
      academicApi.getSemesters().then((res) => {
        setSemesters(res.data);
        if (res.data.length > 0) {
          academicApi.getSubjects(res.data[0].id).then((subRes) => {
            setSubjects(subRes.data);
            if (subRes.data.length > 0) setNewSubject(subRes.data[0].id);
          });
        }
      });
    }
  }, [isAdmin]);

  // Select an assignment and load existing draft
  const selectAssignment = async (assignment) => {
    setSelectedAssignment(assignment);
    setIsDirty(false);
    try {
      const draftRes = await assignmentsApi.getMyDraft(assignment.id);
      setDraftText(draftRes.data?.draft_text || '');
      setSavedAt(draftRes.data?.updated_at || null);
    } catch (err) {
      // 404 means no draft created yet
      setDraftText('');
      setSavedAt(null);
    }
  };

  // Save draft to backend
  const handleSaveDraft = async () => {
    if (!selectedAssignment) return;
    setIsSaving(true);
    try {
      const res = await assignmentsApi.saveDraft(selectedAssignment.id, draftText);
      setSavedAt(res.data.updated_at);
      setIsDirty(false);
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Text change handler with auto-save debounce
  const handleTextChange = (e) => {
    const val = e.target.value;
    setDraftText(val);
    setIsDirty(true);

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Auto-save after 2 seconds of pause
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (selectedAssignment) {
        handleSaveDraft();
      }
    }, 2000);
  };

  // Admin Create Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await assignmentsApi.create({
        title: newTitle,
        description: newDesc,
        subject_id: newSubject,
        unit_id: newUnit || null,
        due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
        total_marks: Number(newMarks),
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create assignment');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment and associated drafts?')) return;
    try {
      await assignmentsApi.delete(id);
      fetchAssignments();
      if (selectedAssignment?.id === id) setSelectedAssignment(null);
    } catch (err) {
      alert('Failed to delete assignment');
    }
  };

  const wordCount = draftText.trim() ? draftText.trim().split(/\s+/).length : 0;
  const charCount = draftText.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileEdit className="w-6 h-6 text-amber-600" />
            <span>Assignment Drafts & Submissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Work on assignment problem sets, write answers with real-time auto-saving, and prepare submissions.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        )}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assignments List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            Assigned Work ({assignments.length})
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <FileEdit className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">No active assignments</div>
              <div className="text-[11px] text-slate-400 mt-1">Check back later or ask your faculty.</div>
            </div>
          ) : (
            assignments.map((item) => {
              const isSelected = selectedAssignment?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => selectAssignment(item)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold text-sm leading-snug ${isSelected ? 'text-amber-900' : 'text-slate-800'}`}>
                      {item.title}
                    </h3>

                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAssignment(item.id);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      {item.total_marks} Marks
                    </span>
                    {item.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Due {new Date(item.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Draft Editor Workspace (8 cols) */}
        <div className="lg:col-span-8">
          {selectedAssignment ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-full min-h-[560px]">
              {/* Assignment Prompt Banner */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h2 className="text-base font-bold text-slate-900">{selectedAssignment.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      {selectedAssignment.total_marks} Marks
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                  {selectedAssignment.description || 'No prompt instructions provided.'}
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Your Response Draft
                  </label>

                  <div className="flex items-center gap-2 text-xs">
                    {isSaving ? (
                      <span className="text-amber-600 font-medium animate-pulse flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Saving...
                      </span>
                    ) : isDirty ? (
                      <span className="text-slate-400">Unsaved edits</span>
                    ) : savedAt ? (
                      <span className="text-teal-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Auto-saved {new Date(savedAt).toLocaleTimeString()}
                      </span>
                    ) : null}
                  </div>
                </div>

                <textarea
                  rows="14"
                  value={draftText}
                  onChange={handleTextChange}
                  placeholder="Draft your solution here. Your work will auto-save automatically as you type..."
                  className="w-full flex-1 p-4 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-sans leading-relaxed transition-all resize-y"
                />

                {/* Editor Footer / Word Count & Save Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span><strong>{wordCount}</strong> words</span>
                    <span><strong>{charCount}</strong> characters</span>
                  </div>

                  <button
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Draft Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center text-slate-400 text-xs">
              Select an assignment on the left to view questions and start drafting answers.
            </div>
          )}
        </div>
      </div>

      {/* Admin Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Create New Assignment</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Normalization and BCNF Decomposition"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                <select
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.subject_code} - {s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Problem Description *</label>
                <textarea
                  rows="4"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="State the questions, constraints, and submission criteria..."
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={newMarks}
                    onChange={(e) => setNewMarks(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
