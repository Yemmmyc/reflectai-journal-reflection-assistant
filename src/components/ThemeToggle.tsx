import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <button
      id="btn-theme-toggle"
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer border shadow-sm ${
        isDark
          ? 'bg-stone-900/90 border-stone-700/80 text-amber-300 hover:bg-stone-800 hover:border-amber-400/50'
          : 'bg-white/90 border-stone-200 text-stone-800 hover:bg-stone-100 hover:border-amber-400/60'
      } ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode (Currently: ${theme.toUpperCase()})`}
      aria-label={`Toggle theme, current is ${theme}`}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300 ${isDark ? 'rotate-12' : 'rotate-0'}`}>
        {isDark ? (
          <Moon className="w-4 h-4 text-amber-300 fill-amber-300/20" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
        )}
      </div>
      <span className="text-xs font-bold tracking-wide capitalize select-none text-stone-800 dark:text-stone-200">
        {theme}
      </span>
    </button>
  );
};
