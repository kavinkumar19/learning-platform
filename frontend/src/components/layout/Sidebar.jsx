import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Search,
  FileEdit,
  CheckSquare,
  HelpCircle,
  History,
  BarChart3,
  Layers,
  X,
  Sparkles,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();

  const studentLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/materials', label: 'Study Materials', icon: BookOpen },
    { to: '/search', label: 'Search Notes', icon: Search },
    { to: '/questions', label: 'Question Bank', icon: HelpCircle },
    { to: '/assignments', label: 'Assignment Drafts', icon: FileEdit },
    { to: '/exams', label: 'MCQ Tests & Exams', icon: CheckSquare },
    { to: '/history', label: 'Results & History', icon: History },
  ];

  const adminLinks = [
    { to: '/admin/curriculum', label: 'Academic Structure', icon: Layers },
    { to: '/admin/analytics', label: 'Performance Analytics', icon: BarChart3 },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/10 text-teal-400 border border-teal-500/30 shadow-xs'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0f1d35] text-slate-300 z-50 flex flex-col border-r border-[#1e3a5f] transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-wide">IT LearnHub</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Learning Portal
            </div>
            <nav className="space-y-1">
              {studentLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => onClose?.()}
                    className={linkClass}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {isAdmin && (
            <div>
              <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
                <span>Faculty / Admin</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-indigo-900/80 text-indigo-300">Staff</span>
              </div>
              <nav className="space-y-1">
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => onClose?.()}
                      className={linkClass}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer info box */}
        <div className="p-3.5 border-t border-[#1e3a5f]">
          <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-teal-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Conventional Engine</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standard DBMS keyword indexing & verified departmental questions.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
