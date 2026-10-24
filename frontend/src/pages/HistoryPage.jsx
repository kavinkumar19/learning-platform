import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examsApi, analyticsApi } from '../api';
import {
  History,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  BookOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const HistoryPage = () => {
  const [attempts, setAttempts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [attRes, actRes] = await Promise.all([
          examsApi.getResults(),
          analyticsApi.getHistory(),
        ]);
        setAttempts(attRes.data || []);
        setActivities(actRes.data || []);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format data for Recharts score progression
  const chartData = attempts
    .slice()
    .reverse()
    .map((att, idx) => ({
      name: `Test ${idx + 1}`,
      score: att.score || 0,
      date: att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : `Attempt ${idx + 1}`,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <History className="w-6 h-6 text-teal-600" />
          <span>Student Examination & Learning History</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your previous examination submissions, score progression over time, and activity records.
        </p>
      </div>

      {/* Progress Chart (if attempts exist) */}
      {attempts.length > 0 && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Score Progression Over Time</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">{attempts.length} attempts recorded</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1d35',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Score"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0f1d35', stroke: '#14b8a6', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grid: Previous Exam Attempts & Learning Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Exam Submissions Table (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-teal-600" />
            <span>Completed Test Attempts ({attempts.length})</span>
          </h2>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading records...</div>
          ) : attempts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-semibold text-sm text-slate-700">No examination attempts yet</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Take your first online MCQ test to track your learning performance here.
              </p>
              <Link
                to="/exams"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500"
              >
                Browse Exams
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="divide-y divide-slate-100">
                {attempts.map((att) => (
                  <div
                    key={att.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                          Evaluated
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800">
                        Exam Session #{att.id.slice(-6)}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Completed at {att.submitted_at ? new Date(att.submitted_at).toLocaleTimeString() : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 sm:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">Score</span>
                        <span className="text-lg font-black text-slate-900">{att.score ?? 0} Pts</span>
                      </div>

                      <Link
                        to={`/exams/results/${att.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                      >
                        <span>View Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Activity Timeline (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Activity Log</span>
          </h2>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            {activities.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">No activity logged yet.</div>
            ) : (
              <div className="space-y-4">
                {activities.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-b-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block capitalize">
                        {act.activity_type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {act.created_at ? new Date(act.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
