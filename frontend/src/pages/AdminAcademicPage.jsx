import React, { useState, useEffect } from 'react';
import { academicApi } from '../api';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Calendar,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const AdminAcademicPage = () => {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Semester Modal
  const [showSemModal, setShowSemModal] = useState(false);
  const [semNumber, setSemNumber] = useState(1);
  const [semYear, setSemYear] = useState('2024-25');
  const [semRegulation, setSemRegulation] = useState('R2021');

  // Subject Modal
  const [showSubModal, setShowSubModal] = useState(false);
  const [subCode, setSubCode] = useState('');
  const [subTitle, setSubTitle] = useState('');

  // Unit Modal
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitNumber, setUnitNumber] = useState(1);
  const [unitTitle, setUnitTitle] = useState('');
  const [unitDesc, setUnitDesc] = useState('');

  const loadSemesters = async () => {
    try {
      setLoading(true);
      const res = await academicApi.getSemesters();
      setSemesters(res.data);
      if (res.data.length > 0 && !selectedSemester) {
        handleSelectSemester(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load semesters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSemesters();
  }, []);

  const handleSelectSemester = async (sem) => {
    setSelectedSemester(sem);
    setSelectedSubject(null);
    setUnits([]);
    try {
      const res = await academicApi.getSubjects(sem.id);
      setSubjects(res.data);
      if (res.data.length > 0) {
        handleSelectSubject(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const handleSelectSubject = async (sub) => {
    setSelectedSubject(sub);
    try {
      const res = await academicApi.getUnits(sub.id);
      setUnits(res.data);
    } catch (err) {
      console.error('Failed to load units:', err);
    }
  };

  // Add Semester
  const handleAddSemester = async (e) => {
    e.preventDefault();
    try {
      await academicApi.createSemester({
        semester_number: Number(semNumber),
        academic_year: semYear,
        regulation: semRegulation,
      });
      setShowSemModal(false);
      loadSemesters();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add semester');
    }
  };

  const handleDeleteSemester = async (id) => {
    if (!window.confirm('Delete semester and its contents?')) return;
    try {
      await academicApi.deleteSemester(id);
      loadSemesters();
    } catch (err) {
      alert('Failed to delete semester');
    }
  };

  // Add Subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!selectedSemester) return;
    try {
      await academicApi.createSubject({
        semester_id: selectedSemester.id,
        subject_code: subCode.trim().toUpperCase(),
        title: subTitle.trim(),
      });
      setShowSubModal(false);
      setSubCode('');
      setSubTitle('');
      handleSelectSemester(selectedSemester);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete subject?')) return;
    try {
      await academicApi.deleteSubject(id);
      if (selectedSemester) handleSelectSemester(selectedSemester);
    } catch (err) {
      alert('Failed to delete subject');
    }
  };

  // Add Unit
  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return;
    try {
      await academicApi.createUnit({
        subject_id: selectedSubject.id,
        unit_number: Number(unitNumber),
        title: unitTitle.trim(),
        description: unitDesc.trim(),
      });
      setShowUnitModal(false);
      setUnitTitle('');
      setUnitDesc('');
      handleSelectSubject(selectedSubject);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add unit');
    }
  };

  const handleDeleteUnit = async (id) => {
    if (!window.confirm('Delete unit?')) return;
    try {
      await academicApi.deleteUnit(id);
      if (selectedSubject) handleSelectSubject(selectedSubject);
    } catch (err) {
      alert('Failed to delete unit');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600" />
            <span>Academic Curriculum Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize semesters, department subjects, and modular units for note categorization and exam mappings.
          </p>
        </div>

        <button
          onClick={() => setShowSemModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Semester</span>
        </button>
      </div>

      {/* 3-Column Hierarchy View: Semesters | Subjects | Units */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: Semesters */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col h-full min-h-[460px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              1. Semesters ({semesters.length})
            </h3>
            <button
              onClick={() => setShowSemModal(true)}
              className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {semesters.map((s) => {
              const isSelected = selectedSemester?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectSemester(s)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-sm">Semester {s.semester_number}</div>
                    <div className="text-[11px] font-normal text-slate-400">
                      Year: {s.academic_year} • {s.regulation}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSemester(s.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Subjects */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col h-full min-h-[460px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              2. Subjects ({subjects.length})
            </h3>
            {selectedSemester && (
              <button
                onClick={() => setShowSubModal(true)}
                className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {!selectedSemester ? (
            <div className="py-12 text-center text-slate-400 text-xs">Select a semester first</div>
          ) : subjects.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No subjects added to Semester {selectedSemester.semester_number}
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto">
              {subjects.map((sub) => {
                const isSelected = selectedSubject?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => handleSelectSubject(sub)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-sm">{sub.title}</div>
                      <div className="text-[11px] font-normal text-slate-400">
                        Code: {sub.subject_code}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubject(sub.id);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3: Units */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col h-full min-h-[460px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              3. Units & Modules ({units.length})
            </h3>
            {selectedSubject && (
              <button
                onClick={() => {
                  setUnitNumber(units.length + 1);
                  setShowUnitModal(true);
                }}
                className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {!selectedSubject ? (
            <div className="py-12 text-center text-slate-400 text-xs">Select a subject first</div>
          ) : units.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No units defined for {selectedSubject.subject_code}
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto">
              {units.map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-start justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Unit {u.unit_number}: {u.title}
                    </div>
                    {u.description && (
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {u.description}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteUnit(u.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Semester */}
      {showSemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Semester</h3>
              <button onClick={() => setShowSemModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSemester} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Semester Number</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  required
                  value={semNumber}
                  onChange={(e) => setSemNumber(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  required
                  value={semYear}
                  onChange={(e) => setSemYear(e.target.value)}
                  placeholder="2024-25"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Regulation</label>
                <input
                  type="text"
                  required
                  value={semRegulation}
                  onChange={(e) => setSemRegulation(e.target.value)}
                  placeholder="R2021"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSemModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Subject */}
      {showSubModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Subject</h3>
              <button onClick={() => setShowSubModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  placeholder="CS8492"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Title</label>
                <input
                  type="text"
                  required
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  placeholder="Database Management Systems"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Unit */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Add Unit</h3>
              <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddUnit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Number</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Title</label>
                <input
                  type="text"
                  required
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  placeholder="Relational Model & SQL"
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={unitDesc}
                  onChange={(e) => setUnitDesc(e.target.value)}
                  placeholder="Unit topics..."
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
                >
                  Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAcademicPage;
