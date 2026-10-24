import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { examsApi } from '../api';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  BookOpen,
  AlertCircle,
  HelpCircle,
  FileCheck2
} from 'lucide-react';

const ExamResultPage = () => {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await examsApi.getResultDetail(attemptId);
        setResult(res.data);
      } catch (err) {
        console.error('Failed to load result:', err);
        setError('Failed to load examination result.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Calculating assessment score and preparing detailed solution report...
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-lg mx-auto text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-base text-slate-800">Result Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'Unable to retrieve test submission.'}</p>
        <Link
          to="/exams"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800"
        >
          Back to Examinations
        </Link>
      </div>
    );
  }

  const { attempt, answers } = result;
  const score = attempt.score || 0;
  const totalQuestions = answers.length;
  const correctCount = answers.filter((a) => a.marks_awarded > 0).length;
  const wrongCount = answers.filter((a) => a.selected_answer && a.marks_awarded <= 0).length;
  const unattemptedCount = answers.filter((a) => !a.selected_answer).length;
  const maxPossibleMarks = answers.reduce((acc, curr) => acc + (curr.marks || 1), 0);
  const percentage = maxPossibleMarks > 0 ? Math.round((score / maxPossibleMarks) * 100) : 0;
  const isPassed = percentage >= 40;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Result Score Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f1d35] via-[#172d4a] to-[#1e3a5f] p-6 sm:p-8 text-white shadow-xl border border-slate-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-3">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Assessment Evaluation Report</span>
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isPassed ? 'Congratulations on Completing the Exam!' : 'Exam Completed'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Submitted on {new Date(attempt.submitted_at || Date.now()).toLocaleString()}
            </p>
          </div>

          {/* Score Badge */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 min-w-[170px] text-center">
            <span className="text-[11px] font-semibold text-teal-300 uppercase tracking-wider">
              Total Score
            </span>
            <div className="text-4xl font-black text-white mt-1">
              {score} <span className="text-lg font-normal text-slate-300">/ {maxPossibleMarks}</span>
            </div>
            <span
              className={`mt-2 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isPassed ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' : 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
              }`}
            >
              {percentage}% • {isPassed ? 'Passed' : 'Needs Review'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Questions</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalQuestions}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center">
          <div className="text-xs font-semibold text-emerald-600 uppercase flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Correct</span>
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{correctCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center">
          <div className="text-xs font-semibold text-red-500 uppercase flex items-center justify-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Incorrect</span>
          </div>
          <div className="text-xl font-bold text-red-600 mt-1">{wrongCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase">Unattempted</div>
          <div className="text-xl font-bold text-slate-600 mt-1">{unattemptedCount}</div>
        </div>
      </div>

      {/* Question by Question Detailed Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>Detailed Question Review & Model Solutions</span>
          </h2>
          <span className="text-xs text-slate-400">{answers.length} items evaluated</span>
        </div>

        {answers.map((ans, idx) => {
          const isCorrect = ans.marks_awarded > 0;
          const isAttempted = Boolean(ans.selected_answer);

          return (
            <div
              key={ans.question_id || idx}
              className={`p-5 rounded-2xl bg-white border transition-all ${
                !isAttempted
                  ? 'border-slate-200'
                  : isCorrect
                  ? 'border-emerald-200 shadow-xs'
                  : 'border-red-200 shadow-xs'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      !isAttempted
                        ? 'bg-slate-100 text-slate-600'
                        : isCorrect
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    Q{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase">
                    {ans.question_type || 'MCQ'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                      isCorrect
                        ? 'bg-emerald-50 text-emerald-700'
                        : ans.marks_awarded < 0
                        ? 'bg-red-50 text-red-700'
                        : 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {ans.marks_awarded > 0 ? `+${ans.marks_awarded}` : ans.marks_awarded} / {ans.marks || 1} Marks
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="font-semibold text-sm text-slate-900 leading-relaxed mb-3">
                {ans.question_text}
              </h3>

              {/* Answers Comparison */}
              <div className="space-y-2 text-xs mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium min-w-[110px]">Your Answer:</span>
                  <span
                    className={`font-semibold ${
                      !isAttempted
                        ? 'text-slate-400 italic'
                        : isCorrect
                        ? 'text-emerald-700'
                        : 'text-red-600'
                    }`}
                  >
                    {ans.selected_answer || 'Skipped / Unattempted'}
                  </span>
                </div>

                {ans.correct_answer && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium min-w-[110px]">Correct Answer:</span>
                    <span className="font-bold text-emerald-700">{ans.correct_answer}</span>
                  </div>
                )}
              </div>

              {/* Model Answer / Explanation */}
              {ans.model_answer && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-800 block mb-1">Model Solution & Explanation:</span>
                  <span>{ans.model_answer}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <Link
          to="/exams"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Back to Examinations</span>
        </Link>

        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-xs"
        >
          <span>View All Results in History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default ExamResultPage;
