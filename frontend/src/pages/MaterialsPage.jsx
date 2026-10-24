import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { materialsApi, academicApi } from '../api';
import {
  BookOpen,
  Upload,
  Download,
  Trash2,
  FileText,
  Filter,
  Eye,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Presentation,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MaterialsPage = () => {
  const { isAdmin } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');

  // Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadSemester, setUploadSemester] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadUnit, setUploadUnit] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Load initial semesters
  useEffect(() => {
    const loadSemesters = async () => {
      try {
        const res = await academicApi.getSemesters();
        setSemesters(res.data);
        if (res.data.length > 0) {
          setSelectedSemester(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load semesters:', err);
      }
    };
    loadSemesters();
  }, []);

  // When selected semester changes, load subjects
  useEffect(() => {
    if (!selectedSemester) {
      setSubjects([]);
      setSelectedSubject('');
      return;
    }
    const loadSubjects = async () => {
      try {
        const res = await academicApi.getSubjects(selectedSemester);
        setSubjects(res.data);
        if (res.data.length > 0) {
          setSelectedSubject(res.data[0].id);
        } else {
          setSelectedSubject('');
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    loadSubjects();
  }, [selectedSemester]);

  // When selected subject changes, load units
  useEffect(() => {
    if (!selectedSubject) {
      setUnits([]);
      setSelectedUnit('');
      return;
    }
    const loadUnits = async () => {
      try {
        const res = await academicApi.getUnits(selectedSubject);
        setUnits(res.data);
        setSelectedUnit(''); // optional filter
      } catch (err) {
        console.error('Failed to load units:', err);
      }
    };
    loadUnits();
  }, [selectedSubject]);

  // When filters change, fetch materials
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSemester) params.semester_id = selectedSemester;
      if (selectedSubject) params.subject_id = selectedSubject;
      if (selectedUnit) params.unit_id = selectedUnit;
      if (selectedFileType) params.file_type = selectedFileType;

      const res = await materialsApi.list(params);
      setMaterials(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [selectedSemester, selectedSubject, selectedUnit, selectedFileType]);

  // Handle Material Upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('description', uploadDesc);
    formData.append('semester_id', uploadSemester);
    formData.append('subject_id', uploadSubject);
    if (uploadUnit) formData.append('unit_id', uploadUnit);
    formData.append('file', uploadFile);

    try {
      await materialsApi.upload(formData);
      setUploadSuccess('Material uploaded and text indexed successfully!');
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadTitle('');
        setUploadDesc('');
        setUploadFile(null);
        setUploadSuccess('');
        fetchMaterials();
      }, 1200);
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) return;
    try {
      await materialsApi.delete(id);
      fetchMaterials();
    } catch (err) {
      alert('Failed to delete material');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await materialsApi.toggleStatus(id, nextStatus);
      fetchMaterials();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'pptx':
        return <Presentation className="w-6 h-6 text-amber-500" />;
      case 'docx':
        return <FileSpreadsheet className="w-6 h-6 text-blue-500" />;
      default:
        return <FileText className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-teal-600" />
            <span>Study Materials & Notes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access curated semester syllabus notes, unit modules, and lecture presentations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search Text in Notes</span>
          </Link>

          {isAdmin && (
            <button
              onClick={() => {
                setUploadSemester(selectedSemester || (semesters[0]?.id ?? ''));
                setUploadSubject(selectedSubject || (subjects[0]?.id ?? ''));
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Semester select */}
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium"
        >
          <option value="">All Semesters</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              Semester {s.semester_number} ({s.academic_year})
            </option>
          ))}
        </select>

        {/* Subject select */}
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium"
        >
          <option value="">All Subjects</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.subject_code} - {sub.title}
            </option>
          ))}
        </select>

        {/* Unit select */}
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium"
        >
          <option value="">All Units</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              Unit {u.unit_number}: {u.title}
            </option>
          ))}
        </select>

        {/* File Type filter */}
        <select
          value={selectedFileType}
          onChange={(e) => setSelectedFileType(e.target.value)}
          className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium"
        >
          <option value="">All File Types</option>
          <option value="pdf">PDF Documents (.pdf)</option>
          <option value="pptx">Presentations (.pptx)</option>
          <option value="docx">Word Documents (.docx)</option>
          <option value="txt">Text Files (.txt)</option>
        </select>

        <span className="text-xs text-slate-400 ml-auto font-medium">
          Showing {materials.length} of {total} notes
        </span>
      </div>

      {/* Materials List / Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading materials...
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-800">No study materials found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isAdmin
              ? 'Upload PDF, DOCX or PPTX notes for this subject to help students prepare.'
              : 'Notes for this selection have not been uploaded or published yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      {getFileIcon(item.file_type)}
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-600">
                        {item.file_type}
                      </span>
                      {isAdmin && (
                        <span
                          className={`ml-1.5 inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase ${
                            item.status === 'published'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        title="Toggle Publish / Draft"
                        className="p-1 rounded-md text-slate-400 hover:text-teal-600 hover:bg-slate-50 text-xs"
                      >
                        {item.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        title="Delete material"
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-sm text-slate-900 leading-snug line-clamp-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                )}

                <div className="mt-3 text-[11px] text-slate-400 space-y-0.5">
                  <div>File: <span className="font-medium text-slate-600">{item.file_name}</span></div>
                  <div>Uploaded: {new Date(item.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={materialsApi.downloadUrl(item.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Note</span>
                </a>

                <Link
                  to={`/search?q=${encodeURIComponent(item.title)}`}
                  className="text-xs text-slate-400 hover:text-indigo-600 font-medium inline-flex items-center gap-1"
                >
                  <Search className="w-3 h-3" />
                  <span>Search Topic</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal (Admin only) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Upload Study Material</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-2 text-xs text-teal-700">
                <CheckCircle className="w-4 h-4 shrink-0 text-teal-500 mt-0.5" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Relational Algebra and SQL Joins Guide"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Summary of topics covered..."
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester *</label>
                  <select
                    required
                    value={uploadSemester}
                    onChange={(e) => setUploadSemester(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        Semester {s.semester_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                  <select
                    required
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.subject_code} - {sub.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit (Optional)</label>
                <select
                  value={uploadUnit}
                  onChange={(e) => setUploadUnit(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unit_number}: {u.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File (.pdf, .docx, .pptx, .txt up to 20MB) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.pptx,.txt"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? 'Extracting Text & Saving...' : 'Upload & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsPage;
