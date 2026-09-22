import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Dumbbell,
  BookOpen,
  Feather,
  CheckCircle2,
  Circle,
  ArrowRight,
  Clock,
  Activity,
  Heart
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';

export function HistoryView({ setActiveTab }) {
  const {
    selectedDate,
    setSelectedDate,
    salahHistory,
    allWorkouts,
    books,
    allReadingLogs,
    allHabitLogs,
    allHabits,
    recentJournalEntries
  } = useStorage();

  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date(selectedDate)));
  const [inspectedDate, setInspectedDate] = useState(selectedDate);

  // Month navigation
  const prevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const jumpToToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    setInspectedDate(format(today, 'yyyy-MM-dd'));
  };

  // Generate calendar grid days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Inspected Day data
  const inspectedSalah = salahHistory?.find(s => s.date === inspectedDate);
  const inspectedWorkouts = allWorkouts?.filter(w => w.date === inspectedDate) || [];
  const inspectedReading = allReadingLogs?.filter(r => r.date === inspectedDate) || [];
  const inspectedJournal = recentJournalEntries?.find(j => j.date === inspectedDate);
  const inspectedHabits = allHabitLogs?.filter(h => h.date === inspectedDate && h.completed) || [];

  const prayerCount = inspectedSalah
    ? [inspectedSalah.fajr, inspectedSalah.dhuhr, inspectedSalah.asr, inspectedSalah.maghrib, inspectedSalah.isha].filter(Boolean).length
    : 0;

  const totalPagesOnInspectedDate = inspectedReading.reduce((acc, r) => acc + (r.pagesRead || 0), 0);

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case 'great': return '🌟';
      case 'good': return '🌿';
      case 'neutral': return '⚖️';
      case 'low': return '🌧️';
      case 'challenging': return '🔥';
      default: return '📝';
    }
  };

  const handleSelectDay = (dateStr) => {
    setInspectedDate(dateStr);
  };

  const handleSetGlobalDate = () => {
    setSelectedDate(inspectedDate);
    if (setActiveTab) setActiveTab('dashboard');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-emerald-400" />
            Historical Review & Calendar Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Explore past consistency, inspect daily snapshots, and review your compounding journey.
          </p>
        </div>

        <button
          onClick={jumpToToday}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all self-start"
        >
          Today ({format(new Date(), 'MMM d')})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Matrix (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
          {/* Month Header Switcher */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = dateStr === inspectedDate;
              const isTodayDate = isToday(day);

              // Daily indicators
              const daySalah = salahHistory?.find(s => s.date === dateStr);
              const daySalahCount = daySalah
                ? [daySalah.fajr, daySalah.dhuhr, daySalah.asr, daySalah.maghrib, daySalah.isha].filter(Boolean).length
                : 0;

              const hasWorkout = allWorkouts?.some(w => w.date === dateStr);
              const hasReading = allReadingLogs?.some(r => r.date === dateStr);
              const dayJournal = recentJournalEntries?.find(j => j.date === dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => handleSelectDay(dateStr)}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left min-h-[72px] sm:min-h-[85px] flex flex-col justify-between transition-all relative ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/50 shadow-md'
                      : isCurrentMonth
                      ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                      : 'bg-slate-900/30 border-slate-800/40 text-slate-600 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isTodayDate
                          ? 'w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center'
                          : isSelected
                          ? 'text-emerald-300'
                          : isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Salah indicator badge */}
                    {daySalahCount > 0 && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          daySalahCount === 5
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {daySalahCount}/5
                      </span>
                    )}
                  </div>

                  {/* Multi-Pillar Micro Icons */}
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {hasWorkout && (
                      <span className="p-0.5 rounded bg-sky-950/60 border border-sky-800/40 text-sky-400" title="Workout Logged">
                        <Dumbbell className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {hasReading && (
                      <span className="p-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-indigo-400" title="Reading Logged">
                        <BookOpen className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {dayJournal && (
                      <span className="text-[10px]" title={`Journal: ${dayJournal.mood}`}>
                        {getMoodEmoji(dayJournal.mood)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 5/5 Salah
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 1-4 Salah
              </span>
              <span className="flex items-center gap-1.5">
                <Dumbbell className="w-3 h-3 text-sky-400" /> Workout
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-indigo-400" /> Reading
              </span>
            </div>
            <span>Click any day to inspect</span>
          </div>
        </div>

        {/* Day Snapshot Inspector Card (1 Col) */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-5 flex flex-col justify-between">
          <div>
            {/* Inspector Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Day Snapshot</span>
                <h3 className="text-base font-bold text-white">
                  {format(parseISO(inspectedDate), 'EEEE, MMM d, yyyy')}
                </h3>
              </div>

              <button
                onClick={handleSetGlobalDate}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs transition-colors flex items-center gap-1"
                title="Make this the active dashboard date"
              >
                <span>Focus Date</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4 pt-2">
              {/* 1. Salah Snapshot */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Salah ({prayerCount}/5)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {inspectedSalah?.tahajjud ? '+Tahajjud ' : ''}
                    {inspectedSalah?.duha ? '+Duha ' : ''}
                    {inspectedSalah?.rawatib ? '+Rawatib' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
                  {[
                    { key: 'fajr', label: 'F' },
                    { key: 'dhuhr', label: 'D' },
                    { key: 'asr', label: 'A' },
                    { key: 'maghrib', label: 'M' },
                    { key: 'isha', label: 'I' }
                  ].map(p => {
                    const isDone = inspectedSalah ? !!inspectedSalah[p.key] : false;
                    return (
                      <div
                        key={p.key}
                        className={`py-1 rounded ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-900 text-slate-600'
                        }`}
                      >
                        {p.label}
                      </div>
                    );
                  })}
                </div>
                {inspectedSalah?.notes && (
                  <p className="text-[11px] text-slate-400 italic mt-1">"{inspectedSalah.notes}"</p>
                )}
              </div>

              {/* 2. Workout Snapshot */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-sky-400" /> Training ({inspectedWorkouts.length})
                  </span>
                </div>
                {inspectedWorkouts.length > 0 ? (
                  <div className="space-y-1.5">
                    {inspectedWorkouts.map(w => (
                      <div key={w.id} className="text-xs text-slate-300 flex items-center justify-between bg-slate-900/60 p-2 rounded-lg">
                        <span className="font-semibold">{w.exerciseName}</span>
                        <span className="text-slate-400 text-[11px]">
                          {w.sets?.length ? `${w.sets.length} sets` : ''}
                          {w.distanceKm ? `${w.distanceKm} km` : ''}
                          {w.durationMinutes ? ` (${w.durationMinutes}m)` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No workouts recorded.</p>
                )}
              </div>

              {/* 3. Reading Snapshot */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Reading ({totalPagesOnInspectedDate} pgs)
                  </span>
                </div>
                {inspectedReading.length > 0 ? (
                  <div className="space-y-1.5">
                    {inspectedReading.map(r => {
                      const b = books?.find(bk => bk.id === r.bookId);
                      return (
                        <div key={r.id} className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold line-clamp-1">{b?.title || 'Book'}</span>
                            <span className="text-indigo-400 font-bold">+{r.pagesRead} pgs</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Pages {r.startPage} - {r.endPage} ({r.durationMinutes} mins)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No reading logged.</p>
                )}
              </div>

              {/* 4. Journal Snapshot */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Feather className="w-3.5 h-3.5 text-rose-400" /> Reflection
                  </span>
                  {inspectedJournal?.mood && (
                    <span className="text-xs capitalize flex items-center gap-1 text-slate-300">
                      {getMoodEmoji(inspectedJournal.mood)} {inspectedJournal.mood}
                    </span>
                  )}
                </div>
                {inspectedJournal?.content || inspectedJournal?.gratitude?.length ? (
                  <div className="space-y-1">
                    {inspectedJournal.gratitude?.filter(Boolean).length > 0 && (
                      <p className="text-[11px] text-slate-400">
                        <strong className="text-rose-300">Grateful:</strong> {inspectedJournal.gratitude.filter(Boolean).join(', ')}
                      </p>
                    )}
                    {inspectedJournal.content && (
                      <p className="text-[11px] text-slate-300 italic line-clamp-3 mt-1 bg-slate-900/50 p-2 rounded">
                        "{inspectedJournal.content}"
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No journal reflection saved.</p>
                )}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 text-center border-t border-slate-800 pt-3">
            Local data snapshot stored in IndexedDB
          </p>
        </div>
      </div>
    </div>
  );
}
