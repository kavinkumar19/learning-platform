import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api';
import {
  BarChart3,
  Users,
  BookOpen,
  Award,
  CheckSquare,
  FileEdit,
  TrendingUp,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getAdminAnalytics();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        Compiling real-time student performance metrics and database metrics...
      </div>
    );
  }

  // Format exam performance for Recharts
  const chartData = (data?.exam_performance || []).map((ep, idx) => ({
    name: `Exam #${String(ep._id).slice(-4)}`,
    avgScore: Math.round(ep.avg_score * 10) / 10,
    attempts: ep.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          <span>Faculty Analytics & Student Performance</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time aggregated department metrics, exam completion rates, and score distributions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Students</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{data?.total_students ?? 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Subjects</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{data?.total_subjects ?? 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Materials</div>
          <div className="text-2xl font-bold text-teal-600 mt-1">{data?.total_materials ?? 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Assignments</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{data?.total_assignments ?? 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Exams Scheduled</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{data?.total_exams ?? 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Evaluations</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{data?.total_attempts ?? 0}</div>
        </div>
      </div>

      {/* Recharts Analytics: Exam Average Score Performance */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Exam Performance Distribution (Average Score)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Aggregated across all submissions</span>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No completed exam attempts submitted yet to plot averages.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1d35',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="avgScore" name="Average Score" fill="#4f5fa8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attempts" name="Attempt Count" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Submissions Log */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Latest Completed Exam Submissions</span>
        </h2>

        {(!data?.recent_attempts || data.recent_attempts.length === 0) ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No submissions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Attempt ID</th>
                  <th className="py-2.5 px-3">Exam ID</th>
                  <th className="py-2.5 px-3">Student Ref</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                      #{att.id.slice(-6)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {att.exam_id.slice(-6)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      Student #{att.student_id.slice(-4)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-teal-600">
                      {att.score ?? 0} Pts
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {att.submitted_at ? new Date(att.submitted_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
