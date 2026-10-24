import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, GraduationCap, ShieldCheck, Menu } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-800 flex items-center justify-center text-teal-400 shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 block leading-tight">
                IT LearnHub
              </span>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Academic Portal
              </span>
            </div>
          </div>
        </div>

        {/* Right: Role indicator & User profile dropdown / logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Faculty / Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                <GraduationCap className="w-3.5 h-3.5" />
                Student
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-semibold text-slate-800 leading-snug">{user?.name}</div>
              <div className="text-slate-400 text-[11px] truncate max-w-[130px]">{user?.email}</div>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              className="ml-1 p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
