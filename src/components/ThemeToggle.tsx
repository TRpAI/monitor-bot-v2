import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '../theme';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { mode, isDark, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isOpen]);

  const getActiveIcon = () => {
    if (mode === 'system') {
      return <Monitor className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />;
    }
    if (mode === 'dark') {
      return <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
    }
    return <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  };

  const getLabel = () => {
    if (mode === 'system') return '跟随系统';
    if (mode === 'dark') return '深色';
    return '浅色';
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={`切换主题 (当前: ${getLabel()})`}
        aria-label="切换色彩主题"
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shrink-0"
      >
        {getActiveIcon()}
        <span className="hidden xl:inline text-slate-700 dark:text-slate-300">{getLabel()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono border-b border-slate-100 dark:border-slate-800/80 mb-1">
            外观设置
          </div>

          <button
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
              mode === 'light'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>浅色模式</span>
            </div>
            {mode === 'light' && <Check className="w-3 h-3 text-amber-500" />}
          </button>

          <button
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
              mode === 'dark'
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>深色模式</span>
            </div>
            {mode === 'dark' && <Check className="w-3 h-3 text-indigo-400" />}
          </button>

          <button
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors cursor-pointer ${
              mode === 'system'
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-cyan-500" />
              <span>跟随系统</span>
            </div>
            {mode === 'system' && <Check className="w-3 h-3 text-cyan-500" />}
          </button>
        </div>
      )}
    </div>
  );
};
