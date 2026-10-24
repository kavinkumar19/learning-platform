import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { materialsApi, examsApi, assignmentsApi, analyticsApi } from '../api';
import {
  BookOpen,
  CheckSquare,
  FileEdit,
  Search,
  Award,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    materialsCount: 0,
    examsCount: 0,
    assignmentsCount: 0,
    avgScore: null,
  });
  const [availableExams, setAvailableExams] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (isAdmin) {
          const res = await analyticsApi.getAdminAnalytics();
          setAdminAnalytics(res.data);
        } else {
          const [matRes, examRes, assignRes, histRes, resultsRes] = await Promise.all([
            materialsApi.list({ limit: 1 }),
            examsApi.list({ limit: 4 }),
            assignmentsApi.list({ limit: 1 }),
            analyticsApi.getHistory({ limit: 5 }),
            examsApi.getResults(),
          ]);

          const attempts = resultsRes.data || [];
          const avg = attempts.length > 0
            ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / attempts.length)
            : null;

          setStats({
            materialsCount: matRes.data?.total || 0,
            examsCount: examRes.data?.length || 0,
            assignmentsCount: assignRes.data?.length || 0,
            avgScore: avg,
          });
          setAvailableExams(examRes.data || []);
          setRecentHistory(histRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f1d35] via-[#172d4a] to-[#1e3a5f] p-6 sm:p-8 text-white shadow-lg border border-slate-700/50">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Session 2024-2025</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Scholar'}!
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {isAdmin
              ? 'Manage study curricula, question banks, examine student progress, and oversee department evaluations.'
              : 'Prepare for exams, review semester notes, practise unit-wise questions, and complete assignment drafts.'}
          </p>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Enrolled Students</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{adminAnalytics?.total_students ?? 0}</div>
            <div className="mt-1 text-xs text-slate-400">Registered department students</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Active Subjects</div>
            <div className="mt-2 text-2xl font-bold text-indigo-600">{adminAnalytics?.total_subjects ?? 0}</div>
            <div className="mt-1 text-xs text-slate-400">DBMS, Operating Systems, etc.</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Study Materials</div>
            <div className="mt-2 text-2xl font-bold text-teal-600">{adminAnalytics?.total_materials ?? 0}</div>
            <div className="mt-1 text-xs text-slate-400">PDFs, PPTs, notes indexed</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Exam Attempts</div>
            <div className="mt-2 text-2xl font-bold text-amber-600">{adminAnalytics?.total_attempts ?? 0}</div>
            <div className="mt-1 text-xs text-slate-400">Evaluated online tests</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Course Notes</span>
              <BookOpen className="w-5 h-5 text-teal-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{stats.materialsCount}</div>
            <div className="mt-1 text-xs text-teal-600 font-medium">Available for download</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">MCQ Exams</span>
              <CheckSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-indigo-600">{stats.examsCount}</div>
            <div className="mt-1 text-xs text-slate-400">Available to take</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Assignments</span>
              <FileEdit className="w-5 h-5 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-600">{stats.assignmentsCount}</div>
            <div className="mt-1 text-xs text-slate-400">Ready for drafting</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Average Score</span>
              <Award className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600">
              {stats.avgScore !== null ? `${stats.avgScore} pts` : 'No attempts'}
            </div>
            <div className="mt-1 text-xs text-slate-400">Cumulative test score</div>
          </div>
        </div>
      )}

      {/* Quick Access Tiles */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3">Academic Workspaces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/materials"
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900 group-hover:text-teal-600">Study Materials</h3>
              <p className="text-xs text-slate-500 mt-1">Browse notes by semester, subject & unit.</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-teal-600">
              <span>View Materials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/search"
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600">Search Notes</h3>
              <p className="text-xs text-slate-500 mt-1">Full-text keyword search across extracted PDFs.</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-600">
              <span>Search Database</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/exams"
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900 group-hover:text-emerald-600">MCQ Tests & Exams</h3>
              <p className="text-xs text-slate-500 mt-1">Timed online examinations with instant scoring.</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <span>Open Exams</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            to="/assignments"
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileEdit className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900 group-hover:text-amber-600">Assignment Drafts</h3>
              <p className="text-xs text-slate-500 mt-1">Auto-saving student draft editor with word count.</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-600">
              <span>Open Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* Available Exams / Pending Work Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-600" />
              <span>Available Examinations</span>
            </h2>
            <Link to="/exams" className="text-xs font-semibold text-teal-600 hover:underline">
              View All
            </Link>
          </div>

          {availableExams.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No exams scheduled at this time.
            </div>
          ) : (
            <div className="space-y-3">
              {availableExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors gap-3"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800">{exam.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {exam.duration_minutes} Minutes
                      </span>
                      <span>Total Marks: {exam.total_marks}</span>
                      {exam.negative_marking > 0 && (
                        <span className="text-red-600 font-medium">-{exam.negative_marking} Neg. Marking</span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/exams/${exam.id}/take`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors shrink-0"
                  >
                    <span>Start Test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Recent Activity</span>
          </h2>

          {recentHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No recent activity recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentHistory.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs pb-3 border-b border-slate-100 last:border-b-0">
                  <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 capitalize">
                      {item.activity_type.replace('_', ' ')}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
