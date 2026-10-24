import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examsApi } from '../api';
import {
  Clock,
  AlertCircle,
  Flag,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
  Award,
  AlertTriangle
} from 'lucide-react';

const ExamLivePage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [question_id]: selectedOptionString }
  const [flagged, setFlagged] = useState({}); // { [question_id]: boolean }
  const [timeLeft, setTimeLeft] = useState(1800); // in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const timerRef = useRef(null);

  // Initialize Exam & Start Attempt
  useEffect(() => {
    const initExam = async () => {
      try {
        setLoading(true);
        // Start or resume attempt in backend
        await examsApi.start(examId);

        // Fetch questions
        const [qRes, examsList] = await Promise.all([
          examsApi.getQuestions(examId),
          examsApi.list(),
        ]);

        const currentExam = (examsList.data || []).find((e) => e.id === examId);
        setExam(currentExam || null);
        setQuestions(qRes.data || []);

        if (currentExam?.duration_minutes) {
          setTimeLeft(currentExam.duration_minutes * 60);
        }
      } catch (err) {
        console.error('Failed to start exam:', err);
        setError(err.response?.data?.detail || 'Failed to start examination.');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [examId]);

  // Countdown Timer
  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, timeLeft]);

  // Handle Option Select
  const handleSelectOption = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  // Clear Option
  const handleClearOption = (questionId) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  // Toggle Flag for Review
  const toggleFlag = (questionId) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Submit Handler
  const handleSubmitExam = async () => {
    setSubmitting(true);
    try {
      const payloadAnswers = questions.map((q) => ({
        question_id: q.id,
        selected_answer: answers[q.id] || null,
      }));

      const res = await examsApi.submit(examId, payloadAnswers);
      const attemptId = res.data.attempt_id;
      navigate(`/exams/results/${attemptId}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit exam');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    alert('Time has expired! Submitting your answers automatically.');
    handleSubmitExam();
  };

  // Formatting Time
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 300; // less than 5 minutes

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center text-slate-400 text-xs">
        Preparing secure examination session...
      </div>
    );
  }

  if (error || !currentQ) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-lg mx-auto text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-base text-slate-800">Cannot load exam session</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'No questions found for this exam.'}</p>
        <button
          onClick={() => navigate('/exams')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700"
        >
          Return to Exams
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Exam Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block">
            Assessment in Progress
          </span>
          <h1 className="font-bold text-base text-slate-900 leading-tight">
            {exam?.title || 'Academic Examination'}
          </h1>
        </div>

        {/* Live Timer Pill */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold shadow-xs transition-colors ${
            isUrgent
              ? 'bg-red-50 text-red-600 border border-red-300 animate-pulse'
              : 'bg-slate-900 text-teal-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>

        {/* Finish / Submit CTA */}
        <button
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs cursor-pointer transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Submit Exam</span>
        </button>
      </div>

      {/* Main Grid: Question Content (8 cols) + Question Palette (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Question Workspace */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs min-h-[460px] flex flex-col justify-between">
            <div>
              {/* Question Meta Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    {currentQ.question_type || 'MCQ'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      flagged[currentQ.id]
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${flagged[currentQ.id] ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span>{flagged[currentQ.id] ? 'Flagged' : 'Flag for Review'}</span>
                  </button>

                  <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    {currentQ.marks || 1} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-base font-semibold text-slate-900 leading-relaxed mb-6">
                {currentQ.question_text}
              </h2>

              {/* Options */}
              {currentQ.options && currentQ.options.length > 0 && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    const isSelected = answers[currentQ.id] === opt;

                    return (
                      <div
                        key={oIdx}
                        onClick={() => handleSelectOption(currentQ.id, opt)}
                        className={`p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-teal-50 border-teal-400 text-teal-950 ring-1 ring-teal-400 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {letter}
                        </div>
                        <span className="leading-snug flex-1">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Question Controls */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3 mt-6">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {answers[currentQ.id] && (
                <button
                  onClick={() => handleClearOption(currentQ.id)}
                  className="text-xs text-slate-400 hover:text-red-600 underline font-medium"
                >
                  Clear Selection
                </button>
              )}

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-xs transition-colors"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-colors"
                >
                  <span>Review & Finish</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-3">Question Palette</h3>

            {/* Palette Status Summary */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-800">
                <div className="font-bold text-sm">{answeredCount}</div>
                <div className="text-[10px] font-medium">Answered</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                <div className="font-bold text-sm">{unansweredCount}</div>
                <div className="text-[10px] font-medium">Remaining</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                <div className="font-bold text-sm">{flaggedCount}</div>
                <div className="text-[10px] font-medium">Flagged</div>
              </div>
            </div>

            {/* Question Buttons Matrix */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flagged[q.id];

                let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
                if (isFlagged) {
                  bgClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                } else if (isAnswered) {
                  bgClass = 'bg-teal-600 text-white border-teal-600 font-semibold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg text-xs border flex items-center justify-center transition-all cursor-pointer ${bgClass} ${
                      isCurrent ? 'ring-2 ring-teal-500 ring-offset-2' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="mt-5 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-sm bg-teal-600 shrink-0" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-sm bg-amber-200 shrink-0" />
                <span>Flagged for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-sm bg-slate-100 border border-slate-200 shrink-0" />
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Submit Examination?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Once submitted, your answers will be automatically evaluated and you cannot re-attempt this session.
            </p>

            <div className="bg-slate-50 rounded-xl p-3 mb-5 border border-slate-200 text-xs grid grid-cols-3 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px]">Answered</span>
                <span className="font-bold text-teal-600 text-sm">{answeredCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Unanswered</span>
                <span className="font-bold text-slate-700 text-sm">{unansweredCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Flagged</span>
                <span className="font-bold text-amber-600 text-sm">{flaggedCount}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="mb-4 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You still have {unansweredCount} unanswered questions!</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Continue Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitExam}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Grading Answers...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamLivePage;
