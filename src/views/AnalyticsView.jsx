import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Dumbbell,
  BookOpen,
  CheckSquare,
  Flame,
  Award,
  Calendar,
  Activity,
  BarChart3,
  Compass
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { subDays, format, parseISO } from 'date-fns';

export function AnalyticsView() {
  const {
    salahHistory,
    allWorkouts,
    allReadingLogs,
    books,
    allGoals,
    allHabits,
    allHabitLogs,
    selectedDate
  } = useStorage();

  const [timeRange, setTimeRange] = useState('14'); // '14' | '30'

  const numDays = parseInt(timeRange, 10);
  const dateRange = Array.from({ length: numDays }, (_, i) => {
    const d = subDays(new Date(selectedDate), numDays - 1 - i);
    return format(d, 'yyyy-MM-dd');
  });

  // --- 1. Salah Analytics ---
  const salahDaysData = dateRange.map(dateStr => {
    const log = salahHistory?.find(s => s.date === dateStr);
    const count = log ? [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha].filter(Boolean).length : 0;
    return {
      dateStr,
      label: format(parseISO(dateStr), 'MMM d'),
      shortLabel: format(parseISO(dateStr), 'd'),
      count,
      pct: (count / 5) * 100
    };
  });

  const totalPossiblePrayers = numDays * 5;
  const totalActualPrayers = salahDaysData.reduce((acc, d) => acc + d.count, 0);
  const overallSalahRate = Math.round((totalActualPrayers / totalPossiblePrayers) * 100);

  // Prayer-by-prayer breakdown in range
  const prayerBreakdown = [
    { key: 'fajr', label: 'Fajr', count: 0 },
    { key: 'dhuhr', label: 'Dhuhr', count: 0 },
    { key: 'asr', label: 'Asr', count: 0 },
    { key: 'maghrib', label: 'Maghrib', count: 0 },
    { key: 'isha', label: 'Isha', count: 0 }
  ];

  dateRange.forEach(d => {
    const log = salahHistory?.find(s => s.date === d);
    if (log) {
      prayerBreakdown.forEach(p => {
        if (log[p.key]) p.count += 1;
      });
    }
  });

  // --- 2. Fitness & Volume Analytics ---
  const workoutDaysData = dateRange.map(dateStr => {
    const dayWorkouts = allWorkouts?.filter(w => w.date === dateStr) || [];
    const totalReps = dayWorkouts.reduce((acc, w) => {
      const setReps = w.sets?.reduce((sAcc, s) => sAcc + (s.reps || 0), 0) || 0;
      return acc + setReps;
    }, 0);
    const totalDuration = dayWorkouts.reduce((acc, w) => acc + (w.durationMinutes || 0), 0);
    const totalKm = dayWorkouts.reduce((acc, w) => acc + (w.distanceKm || 0), 0);

    return {
      dateStr,
      label: format(parseISO(dateStr), 'MMM d'),
      shortLabel: format(parseISO(dateStr), 'd'),
      hasWorkout: dayWorkouts.length > 0,
      workoutCount: dayWorkouts.length,
      totalReps,
      totalDuration,
      totalKm
    };
  });

  const activeWorkoutDays = workoutDaysData.filter(d => d.hasWorkout).length;
  const totalRepsRange = workoutDaysData.reduce((acc, d) => acc + d.totalReps, 0);
  const totalDurationRange = workoutDaysData.reduce((acc, d) => acc + d.totalDuration, 0);

  // --- 3. Reading Velocity Analytics ---
  const targetPagesPerDay = 20;
  const readingDaysData = dateRange.map(dateStr => {
    const logs = allReadingLogs?.filter(r => r.date === dateStr) || [];
    const pages = logs.reduce((acc, r) => acc + (r.pagesRead || 0), 0);
    return {
      dateStr,
      label: format(parseISO(dateStr), 'MMM d'),
      shortLabel: format(parseISO(dateStr), 'd'),
      pages,
      isTargetMet: pages >= targetPagesPerDay
    };
  });

  const totalPagesRange = readingDaysData.reduce((acc, d) => acc + d.pages, 0);
  const avgPagesPerDay = Math.round(totalPagesRange / numDays);
  const maxPagesDay = Math.max(...readingDaysData.map(d => d.pages), 30);

  // --- 4. 5-Tier Task & Sprint Execution ---
  const tierStats = [
    { level: 'yearly', label: 'Yearly Goals', color: 'text-amber-400 bg-amber-500' },
    { level: 'semester', label: 'Semester Goals', color: 'text-purple-400 bg-purple-500' },
    { level: 'monthly', label: 'Monthly Goals', color: 'text-sky-400 bg-sky-500' },
    { level: 'weekly', label: 'Weekly Targets', color: 'text-indigo-400 bg-indigo-500' },
    { level: 'daily', label: 'Daily Tasks', color: 'text-emerald-400 bg-emerald-500' }
  ].map(t => {
    const items = allGoals?.filter(g => g.level === t.level) || [];
    const completed = items.filter(g => g.status === 'completed').length;
    const inProgress = items.filter(g => g.status === 'in_progress').length;
    const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
    return {
      ...t,
      total: items.length,
      completed,
      inProgress,
      pct
    };
  });

  return (
    <div className="space-y-8 pb-12">
      {/* View Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Visual Analytics & Balance Trends
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quantitative metrics across spiritual adherence, fitness volume, reading velocity, and sprint execution.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setTimeRange('14')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === '14'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Last 14 Days
          </button>
          <button
            onClick={() => setTimeRange('30')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === '30'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Top High-Level Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Sparkles className="w-4 h-4" /> Salah Adherence
          </div>
          <div className="text-2xl font-bold text-white">{overallSalahRate}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{totalActualPrayers} / {totalPossiblePrayers} prayers</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
            <Dumbbell className="w-4 h-4" /> Active Training Days
          </div>
          <div className="text-2xl font-bold text-white">{activeWorkoutDays} / {numDays} days</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{totalDurationRange} mins total volume</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <BookOpen className="w-4 h-4" /> Reading Velocity
          </div>
          <div className="text-2xl font-bold text-white">{avgPagesPerDay} pgs/day</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{totalPagesRange} total pages read</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <CheckSquare className="w-4 h-4" /> Daily Tasks Completed
          </div>
          <div className="text-2xl font-bold text-white">
            {tierStats.find(t => t.level === 'daily')?.completed || 0} tasks
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {tierStats.find(t => t.level === 'daily')?.pct || 0}% completion rate
          </div>
        </div>
      </div>

      {/* Row 1: Salah Consistency Bar Chart & Prayer Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Salah Bars */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Daily Salah Consistency ({timeRange} Days)
              </h2>
              <p className="text-xs text-slate-400">Aim: 5/5 daily obligatory prayers</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {overallSalahRate}% Average
            </span>
          </div>

          {/* SVG Bar Chart for Salah */}
          <div className="pt-2">
            <div className="h-44 flex items-end gap-1.5 sm:gap-2 pt-4 px-2 border-b border-slate-800 pb-2">
              {salahDaysData.map(d => (
                <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-800 text-slate-100 text-[10px] font-bold px-2 py-1 rounded border border-slate-700 pointer-events-none whitespace-nowrap z-10">
                    {d.label}: {d.count}/5
                  </div>

                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      d.count === 5
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                        : d.count > 0
                        ? 'bg-amber-400'
                        : 'bg-slate-800'
                    }`}
                    style={{ height: `${Math.max(6, (d.count / 5) * 100)}%` }}
                  />
                  <span className="text-[9px] text-slate-500 font-mono">{d.shortLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Prayer-by-Prayer Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Award className="w-5 h-5 text-amber-400" />
            Prayer Adherence Breakdown
          </h2>

          <div className="space-y-3 pt-1">
            {prayerBreakdown.map(p => {
              const pct = Math.round((p.count / numDays) * 100);
              return (
                <div key={p.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 capitalize">{p.label}</span>
                    <span className="font-semibold text-amber-400">{pct}% ({p.count}/{numDays}d)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Reading Velocity & Fitness Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reading Velocity Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Reading Pace (Pages/Day)
              </h2>
              <p className="text-xs text-slate-400">Target Line: {targetPagesPerDay} pages/day</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Avg {avgPagesPerDay} pgs/d
            </span>
          </div>

          <div className="h-44 flex items-end gap-1.5 sm:gap-2 pt-4 px-2 border-b border-slate-800 pb-2 relative">
            {/* Target Line */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-indigo-400/50 z-0 pointer-events-none"
              style={{ bottom: `${(targetPagesPerDay / maxPagesDay) * 100}%` }}
            >
              <span className="text-[9px] text-indigo-300 font-bold px-1 absolute right-2 -top-4 bg-slate-900 rounded">
                Target: {targetPagesPerDay}p
              </span>
            </div>

            {readingDaysData.map(d => (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end z-10">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-800 text-slate-100 text-[10px] font-bold px-2 py-1 rounded border border-slate-700 pointer-events-none whitespace-nowrap">
                  {d.label}: {d.pages} pgs
                </div>

                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    d.pages >= targetPagesPerDay
                      ? 'bg-indigo-500 shadow-sm shadow-indigo-500/30'
                      : d.pages > 0
                      ? 'bg-indigo-700/70'
                      : 'bg-slate-800'
                  }`}
                  style={{ height: `${Math.min(100, Math.max(4, (d.pages / maxPagesDay) * 100))}%` }}
                />
                <span className="text-[9px] text-slate-500 font-mono">{d.shortLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5-Tier Task & Sprint Execution Gauges */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                5-Tier Execution Ratio
              </h2>
              <p className="text-xs text-slate-400">Planned vs Completed across life hierarchy</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {tierStats.map(t => (
              <div key={t.level} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{t.label}</span>
                  <span className="font-semibold text-slate-300">
                    {t.completed} / {t.total} ({t.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${t.color.split(' ')[1]}`}
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
