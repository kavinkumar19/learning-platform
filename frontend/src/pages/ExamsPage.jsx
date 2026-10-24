import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { examsApi, academicApi } from '../api';
import {
  CheckSquare,
  Clock,
  Award,
  AlertCircle,
  Play,
  Plus,
  Trash2,
  X,
  FileCheck2,
  Calendar
} from 'lucide-react';

const ExamsPage = () => {
  const { isAdmin } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Admin Create Exam Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [newTotalMarks, setNewTotalMarks] = useState(50);
  const [newPassMarks, setNewPassMarks] = useState(25);
  const [newNegMarking, setNewNegMarking] = useState(0.25);
  const [subjects, setSubjects] = useState([]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await examsApi.list();
      setExams(res.data);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      academicApi.getSemesters().then((semRes) => {
        if (semRes.data.length > 0) {
          academicApi.getSubjects(semRes.data[0].id).then((subRes) => {
            setSubjects(subRes.data);
            if (subRes.data.length > 0) setNewSubject(subRes.data[0].id);
          });
        }
      });
    }
  }, [isAdmin]);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await examsApi.createExam({
        title: newTitle,
        description: newDesc,
        subject_id: newSubject,
        duration_minutes: Number(newDuration),
        total_marks: Number(newTotalMarks),
        passing_marks: Number(newPassMarks),
        negative_marking: Number(newNegMarking),
        status: 'published',
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create exam');
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Delete this exam and all its questions?')) return;
    try {
      await examsApi.deleteExam(id);
      fetchExams();
    } catch (err) {
      alert('Failed to delete exam');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-teal-600" />
            <span>Online Examinations & Tests</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard timed multiple choice testing environment with automated grading and negative marking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
            <span>View Exam History</span>
          </Link>

          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Exam</span>
            </button>
          )}
        </div>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading examinations...</div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-800">No examinations currently scheduled</h3>
          <p className="text-xs text-slate-500 mt-1">Check back later when faculty schedules tests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                    Live Assessment
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-600"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-base text-slate-900 leading-snug">{exam.title}</h3>
                {exam.description && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {exam.description}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Duration:
                    </span>
                    <span className="font-semibold text-slate-800">{exam.duration_minutes} Mins</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      Total Marks:
                    </span>
                    <span className="font-semibold text-slate-800">{exam.total_marks} Marks</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                      Passing Marks:
                    </span>
                    <span className="font-semibold text-emerald-600">{exam.passing_marks} Marks</span>
                  </div>

                  {exam.negative_marking > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-red-500">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Negative Penalty:
                      </span>
                      <span className="font-semibold text-red-600">-{exam.negative_marking} / wrong</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to={`/exams/${exam.id}/take`}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-white bg-teal-600 hover:bg-teal-500 shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Examination</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Create Exam Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Create Online Examination</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Mid-Term DBMS Examination"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                <select
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.subject_code} - {s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions</label>
                <textarea
                  rows="2"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Instructions for students taking this exam..."
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min="5"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={newTotalMarks}
                    onChange={(e) => setNewTotalMarks(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pass Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={newPassMarks}
                    onChange={(e) => setNewPassMarks(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Negative Pen.</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={newNegMarking}
                    onChange={(e) => setNewNegMarking(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300"
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg"
                >
                  Create Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsPage;
