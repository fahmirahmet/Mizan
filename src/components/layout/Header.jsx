import React from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { useStorage } from '../../context/StorageContext';

export function Header({ setIsMobileOpen, onOpenQuickAdd }) {
  const { selectedDate, setSelectedDate, goToPreviousDay, goToNextDay, goToToday, diskSyncStatus } = useStorage();

  const parsedDate = parseISO(selectedDate);
  const isSelectedToday = isToday(parsedDate);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(prev => !prev)}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Life Balance
            </span>

            {/* Cloud & Local Persistence Status Indicator */}
            {diskSyncStatus === 'synced' && (
              <span className="text-[11px] font-medium text-emerald-400/90 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded-md flex items-center gap-1.5" title="All changes saved and synchronized">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                Synced
              </span>
            )}
            {diskSyncStatus === 'syncing' && (
              <span className="text-[11px] font-medium text-sky-400/90 bg-sky-950/40 border border-sky-900/60 px-2 py-0.5 rounded-md flex items-center gap-1.5" title="Syncing changes...">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping shrink-0" />
                Syncing...
              </span>
            )}
            {diskSyncStatus === 'offline' && (
              <span className="text-[11px] font-medium text-amber-400/90 bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded-md flex items-center gap-1.5" title="Operating in offline IndexedDB mode">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                Local Cache
              </span>
            )}
            {diskSyncStatus === 'error' && (
              <span className="text-[11px] font-medium text-rose-400/90 bg-rose-950/40 border border-rose-900/60 px-2 py-0.5 rounded-md flex items-center gap-1.5" title="Sync error - local cache intact">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                Sync Issue
              </span>
            )}
          </div>
        </div>

        {/* Center: Interactive Date Navigator */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/70 border border-slate-700/60 p-1 rounded-xl shadow-inner">
          <button
            onClick={goToPreviousDay}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <CalendarIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-100 whitespace-nowrap">
              {isSelectedToday ? 'Today, ' : ''}{format(parsedDate, 'EEE, MMM d, yyyy')}
            </span>
          </div>

          <button
            onClick={goToNextDay}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isSelectedToday && (
            <button
              onClick={goToToday}
              className="ml-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Today
            </button>
          )}
        </div>

        {/* Right: Quick log CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenQuickAdd}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            + Log Activity
          </button>
        </div>
      </div>
    </header>
  );
}
