import React from 'react';
import { 
  Sparkles, 
  LogOut, 
  PlusCircle, 
  History, 
  BookMarked,
  User as UserIcon 
} from 'lucide-react';
import type { UserProfile } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  user: UserProfile;
  currentView: 'editor' | 'history';
  onViewChange: (view: 'editor' | 'history') => void;
  onNewReflection: () => void;
  onSignOut: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentView,
  onViewChange,
  onNewReflection,
  onSignOut,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-stone-900/85 backdrop-blur-xl border-b border-stone-200/80 dark:border-stone-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-5 sm:gap-7">
          <div 
            onClick={() => onViewChange('editor')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg tracking-tight text-stone-900 dark:text-stone-100">
                  ReflectAI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-500/30">
                  Gemini 3.6
                </span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium block">
                Journal & Reflection Studio
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden sm:flex items-center gap-1.5 bg-stone-100/90 dark:bg-stone-800/80 p-1 rounded-2xl border border-stone-200/70 dark:border-stone-700/60 backdrop-blur-md">
            <button
              id="nav-tab-editor"
              onClick={() => onViewChange('editor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'editor'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Studio</span>
            </button>

            <button
              id="nav-tab-history"
              onClick={() => onViewChange('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentView === 'history'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Past Entries</span>
              <span className="ml-1 px-2 py-0.2 rounded-full bg-stone-200/80 dark:bg-stone-850 text-stone-700 dark:text-stone-300 text-[10px] font-bold">
                {historyCount}
              </span>
            </button>
          </nav>
        </div>

        {/* Right Actions: Theme Toggle, New Reflection, User Info & Logout */}
        <div className="flex items-center gap-3">
          {/* Global Theme Toggle Button */}
          <ThemeToggle />

          {/* New Reflection CTA */}
          <button
            id="btn-new-reflection"
            onClick={onNewReflection}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-stone-900 to-stone-800 dark:from-stone-100 dark:to-stone-200 text-white dark:text-stone-900 text-xs font-bold hover:shadow-md hover:scale-102 transition-all cursor-pointer active:scale-95"
            title="Start a new reflection"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-300 dark:text-amber-600" />
            <span className="hidden xs:inline">New Entry</span>
          </button>

          {/* User profile capsule */}
          <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full border-2 border-amber-400/50 dark:border-amber-400/30 object-cover shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-tight max-w-[120px] truncate">
                {user.displayName || 'Reflector'}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 truncate max-w-[120px]">
                {user.email || 'Google Auth'}
              </span>
            </div>

            <button
              id="btn-signout"
              onClick={onSignOut}
              className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
