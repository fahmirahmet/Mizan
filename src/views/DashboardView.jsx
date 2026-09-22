import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Dumbbell,
  BookOpen,
  CheckSquare,
  Feather,
  Flame,
  ArrowUpRight,
  Plus,
  Heart,
  Zap,
  Activity,
  Award,
  ChevronRight,
  Send
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { format, parseISO, subDays } from 'date-fns';
import { CrossCheckWidget } from '../components/planner/CrossCheckWidget';

export function DashboardView({ setActiveTab, onOpenQuickAdd }) {
  const {
    selectedDate,
    todaySalah,
    toggleSalah,
    salahHistory,
    allHabits,
    selectedDateHabitLogs,
    toggleHabit,
    workoutsForDate,
    logWorkoutPreset,
    books,
    updateBookCurrentPage,
    allGoals,
    addGoal,
    toggleGoalStatus,
    journalEntry
  } = useStorage();

  // Inline reading logger state
  const activeBook = books ? books.find(b => b.status === 'reading' && b.currentPage < b.totalPages) || books[0] : null;
  const [inlineEndPage, setInlineEndPage] = useState('');

  // Dashboard quick task input state
  const [dashTaskInput, setDashTaskInput] = useState('');

  const salahList = [
    { key: 'fajr', label: 'Fajr', time: 'Dawn', ar: 'الفجر' },
    { key: 'dhuhr', label: 'Dhuhr', time: 'Noon', ar: 'الظهر' },
    { key: 'asr', label: 'Asr', time: 'Afternoon', ar: 'العصر' },
    { key: 'maghrib', label: 'Maghrib', time: 'Sunset', ar: 'المغرب' },
    { key: 'isha', label: 'Isha', time: 'Night', ar: 'العشاء' }
  ];

  const prayersDone = todaySalah
    ? salahList.filter(p => todaySalah[p.key]).length
    : 0;

  // 7-day sparkline dots for Salah
  const last7DaysSalah = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(selectedDate), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const log = salahHistory.find(s => s.date === dateStr);
    const count = log ? [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha].filter(Boolean).length : 0;
    return {
      dateStr,
      dayName: format(d, 'EEEEE'),
      count,
      isToday: dateStr === selectedDate
    };
  });

  // Daily tasks (Tier 5 goals)
  const todayTasks = allGoals ? allGoals.filter(g => g.level === 'daily') : [];

  // Workout Presets
  const workoutPresets = [
    { label: '+15 Push-ups', name: 'Standard Push-ups', category: 'Strength', reps: 15, duration: 5 },
    { label: '+20 Sit-ups', name: 'Core Sit-ups', category: 'Strength', reps: 20, duration: 5 },
    { label: '+30 Squats', name: 'Bodyweight Squats', category: 'Strength', reps: 30, duration: 5 },
    { label: '+10 Pull-ups', name: 'Overhand Pull-ups', category: 'Strength', reps: 10, duration: 5 },
    { label: '🏃 10m Jog', name: 'Quick 10-Min Jog', category: 'Cardio', reps: 0, duration: 10, distance: 1.5 },
    { label: '🧘 5m Stretch', name: 'Full Body Mobility', category: 'Mobility', reps: 0, duration: 5 }
  ];

  const handleInlineReadingSubmit = async (e) => {
    e.preventDefault();
    if (!activeBook || !inlineEndPage) return;

    const end = parseInt(inlineEndPage, 10);
    if (!isNaN(end) && end > (activeBook.currentPage || 0)) {
      await updateBookCurrentPage(activeBook.id, end);
      setInlineEndPage('');
    }
  };

  const handleQuickAddDashboardTask = async (e) => {
    e.preventDefault();
    if (!dashTaskInput.trim()) return;

    await addGoal({
      title: dashTaskInput.trim(),
      level: 'daily',
      priority: 'medium',
      targetDate: selectedDate,
      status: 'pending',
      progress: 0
    });

    setDashTaskInput('');
  };

  const hasWorkoutToday = workoutsForDate && workoutsForDate.length > 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                Mizan Overview
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {format(parseISO(selectedDate), 'EEEE, MMMM do, yyyy')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Calibrate Your Balance Today
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Spiritual alignment, physical vigor, intellectual expansion, and intentional daily execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenQuickAdd}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Quick Log
            </button>
          </div>
        </div>
      </div>

      {/* 5-Tier Cross-Check Alignment Widget */}
      <CrossCheckWidget compact={true} />

      {/* Grid Row 1: Salah Tracker & Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salah Checklist Card */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-md relative overflow-hidden space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Daily Salah Tracker</h2>
                <p className="text-xs text-slate-400">5 Obligatory Prayers & Sunnah</p>
              </div>
            </div>

            {/* 7-Day Rolling Mini-Strip Sparkline */}
            <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl border border-slate-700/50 self-start sm:self-center">
              <span className="text-[10px] text-slate-400 font-medium mr-1">7-Day:</span>
              <div className="flex items-center gap-1.5">
                {last7DaysSalah.map(d => (
                  <div key={d.dateStr} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-slate-500 font-mono">{d.dayName}</span>
                    <div
                      title={`${d.dateStr}: ${d.count}/5`}
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                        d.count === 5
                          ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                          : d.count > 0
                          ? 'bg-amber-500/40 text-amber-200 border border-amber-500/60'
                          : 'bg-slate-700/60 text-slate-500'
                      } ${d.isToday ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900' : ''}`}
                    >
                      {d.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5 Daily Prayers Interactive Grid with Framer Motion */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {salahList.map((prayer) => {
              const isDone = todaySalah ? !!todaySalah[prayer.key] : false;
              return (
                <motion.button
                  key={prayer.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSalah(prayer.key)}
                  className={`relative p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between ${
                    isDone
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-950/80 ring-1 ring-emerald-500/40'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-slate-400">{prayer.time}</span>
                    <motion.div
                      animate={{ scale: isDone ? [1, 1.25, 1] : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                      )}
                    </motion.div>
                  </div>
                  <div>
                    <h4 className={`text-sm sm:text-base font-bold capitalize ${isDone ? 'text-emerald-200' : 'text-slate-200'}`}>
                      {prayer.label}
                    </h4>
                    <span className="text-[10px] text-emerald-400/80 font-arabic font-semibold">{prayer.ar}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Sunnah & Nawafil Badges */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Voluntary:</span>
              {[
                { key: 'tahajjud', label: 'Tahajjud' },
                { key: 'duha', label: 'Duha' },
                { key: 'rawatib', label: 'Sunnah Rawatib' }
              ].map(item => {
                const isChecked = todaySalah ? !!todaySalah[item.key] : false;
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleSalah(item.key)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
                      isChecked
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isChecked ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> : <Circle className="w-3.5 h-3.5" />}
                    {item.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setActiveTab('salah-habits')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
            >
              Salah History <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Daily Habits Checklist */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Daily Habits</h3>
                  <p className="text-xs text-slate-400">Atomic discipline</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('salah-habits')}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {allHabits && allHabits.length > 0 ? (
                allHabits.slice(0, 5).map(habit => {
                  const log = selectedDateHabitLogs?.find(l => l.habitId === habit.id);
                  const isDone = log ? !!log.completed : false;
                  return (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isDone
                          ? 'bg-teal-950/30 border-teal-500/30 text-teal-200 ring-1 ring-teal-500/20'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : ''}`}>
                          {habit.title}
                        </span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium capitalize">
                        {habit.category}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No habits defined yet.</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('salah-habits')}
            className="mt-4 w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 font-medium border-t border-slate-800"
          >
            + Add New Habit
          </button>
        </div>
      </div>

      {/* Grid Row 2: Workouts, Reading, & To-Do Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Workout Widget with One-Tap Presets */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Physical Training</h3>
                  <p className="text-xs text-slate-400">Quick movement log</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('workouts')}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5"
              >
                Full Log <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Glowing Movement Completed Badge */}
            {hasWorkoutToday && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/40 flex items-center justify-between mb-3 shadow-md shadow-sky-950"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-xs font-bold text-sky-200">Movement Complete for Today</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                  {workoutsForDate.length} session{workoutsForDate.length > 1 ? 's' : ''}
                </span>
              </motion.div>
            )}

            {/* One-Tap Bodyweight Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                One-Tap Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                {workoutPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => logWorkoutPreset(preset.name, preset.category, preset.reps, preset.duration, preset.distance || null)}
                    className="px-2.5 py-2 rounded-xl bg-slate-800/70 hover:bg-sky-950/50 hover:border-sky-500/50 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-sky-300 transition-all text-left flex items-center justify-between"
                  >
                    <span>{preset.label}</span>
                    <Plus className="w-3 h-3 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenQuickAdd}
            className="w-full py-2 text-center text-xs font-semibold text-sky-400 hover:text-sky-300 border-t border-slate-800 pt-3"
          >
            + Custom Sets / Weighted Workout
          </button>
        </div>

        {/* Reading Widget with In-Place Progress */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Intellectual Growth</h3>
                  <p className="text-xs text-slate-400">Active Reading</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('reading')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5"
              >
                Library <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeBook ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{activeBook.title}</h4>
                    <p className="text-[11px] text-slate-400">by {activeBook.author}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Progress</span>
                      <span className="text-indigo-400 font-semibold">
                        {activeBook.currentPage} / {activeBook.totalPages} pgs ({Math.round((activeBook.currentPage / activeBook.totalPages) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((activeBook.currentPage / activeBook.totalPages) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Page Update Form */}
                <form onSubmit={handleInlineReadingSubmit} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
                    <span>In-Place Progress</span>
                    <span className="text-indigo-400">{activeBook.totalPages - activeBook.currentPage} pgs left</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      placeholder={`New page (curr: ${activeBook.currentPage})`}
                      value={inlineEndPage}
                      onChange={(e) => setInlineEndPage(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:border-indigo-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm"
                    >
                      Update
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-800/30 border border-dashed border-slate-700/60">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No active book in reading list.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('reading')}
            className="w-full py-2 text-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 border-t border-slate-800 pt-3"
          >
            + View Full Bookshelf
          </button>
        </div>

        {/* Daily Tasks To-Do Checklist Widget */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-md flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Daily To-Do List</h3>
                  <p className="text-xs text-slate-400">
                    {todayTasks.filter(t => t.status === 'completed').length}/{todayTasks.length} done
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('planner')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
              >
                All Tasks <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fast Single-Line Input */}
            <form onSubmit={handleQuickAddDashboardTask} className="flex items-center gap-1.5 mb-3">
              <input
                type="text"
                placeholder="Add quick task... (Press Enter)"
                value={dashTaskInput}
                onChange={(e) => setDashTaskInput(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                disabled={!dashTaskInput.trim()}
                className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Task Items */}
            <div className="space-y-2">
              {todayTasks && todayTasks.length > 0 ? (
                todayTasks.slice(0, 5).map(task => {
                  const isDone = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleGoalStatus(task.id, task.status)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-200 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className={`text-xs font-medium truncate ${isDone ? 'line-through text-slate-500' : ''}`}>
                          {task.title}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                          task.priority === 'high' ? 'text-rose-400 bg-rose-950/60' : 'text-slate-400 bg-slate-800'
                        }`}
                      >
                        {task.priority || 'med'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No tasks yet. Type above to add one.</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('planner')}
            className="w-full py-1.5 text-center text-xs font-semibold text-emerald-400 hover:text-emerald-300 border-t border-slate-800 pt-3"
          >
            + Manage Full Task Checklist
          </button>
        </div>
      </div>

      {/* Grid Row 3: Daily Reflection Prompt Preview */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800/90 border border-slate-800 p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <Feather className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Daily Journal & Reflection</span>
            <h4 className="text-sm sm:text-base font-bold text-slate-100 mt-0.5">
              {journalEntry?.content
                ? 'Reflection recorded for today'
                : 'Pause and record your wins, gratitude, and intentions'}
            </h4>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              {journalEntry?.content || 'What was the single most impactful action you completed today?'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('journal')}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Heart className="w-4 h-4 text-rose-400" /> Open Micro-Journal
        </button>
      </div>
    </div>
  );
}
