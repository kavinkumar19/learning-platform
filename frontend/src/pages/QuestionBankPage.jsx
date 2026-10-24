import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { examsApi, academicApi } from '../api';
import {
  HelpCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  BookOpen,
  Filter,
  Plus,
  Trash2,
  X,
  Award
} from 'lucide-react';

const QuestionBankPage = () => {
  const { isAdmin } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  // Load available exams
  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        const res = await examsApi.list();
        setExams(res.data);
        if (res.data.length > 0) {
          setSelectedExamId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load exams:', err);
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, []);

  // When selected exam changes, load questions
  useEffect(() => {
    if (!selectedExamId) {
      setQuestions([]);
      return;
    }
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const res = await examsApi.getQuestions(selectedExamId);
        setQuestions(res.data || []);
        setRevealedAnswers({});
        setSelectedAnswers({});
      } catch (err) {
        console.error('Failed to load questions:', err);
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, [selectedExamId]);

  const toggleReveal = (qId) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const selectOption = (qId, opt) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: opt,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <HelpCircle className="w-6 h-6 text-teal-600" />
            <span>Question Bank & Exam Practice</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Self-paced practice questions with interactive answer reveal, model explanations, and key concepts.
          </p>
        </div>

        {/* Exam Select Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Select Exam Set:</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading practice questions...</div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-800">No questions found in this set</h3>
          <p className="text-xs text-slate-500 mt-1">Select another exam set or check back soon.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {questions.map((q, idx) => {
            const isRevealed = revealedAnswers[q.id];
            const chosen = selectedAnswers[q.id];
            const hasOptions = q.options && q.options.length > 0;

            return (
              <div
                key={q.id || idx}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center border border-teal-200">
                      Q{idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                      {q.question_type || 'MCQ'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    {q.marks || 1} {q.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed mb-4">
                  {q.question_text}
                </h3>

                {/* Multiple Choice Options (if present) */}
                {hasOptions && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isSelected = chosen === opt;
                      const isCorrect = isRevealed && q.correct_answer === opt;

                      return (
                        <div
                          key={optIdx}
                          onClick={() => selectOption(q.id, opt)}
                          className={`p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center gap-2.5 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : isSelected
                              ? 'bg-teal-50 border-teal-300 text-teal-800'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : isSelected
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action Bar / Reveal Answer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleReveal(q.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                  >
                    {isRevealed ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide Model Answer</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Reveal Model Answer & Solution</span>
                      </>
                    )}
                  </button>

                  {chosen && !isRevealed && (
                    <span className="text-xs text-slate-400">Option selected. Click reveal to check!</span>
                  )}
                </div>

                {/* Model Answer Drawer */}
                {isRevealed && (
                  <div className="mt-4 p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 space-y-2">
                    {q.correct_answer && (
                      <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Correct Answer: {q.correct_answer}</span>
                      </div>
                    )}
                    {q.model_answer ? (
                      <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        <strong>Explanation / Model Answer:</strong> {q.model_answer}
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">No additional explanation provided for this question.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestionBankPage;
