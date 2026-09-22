import React from 'react';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Layers,
  Flame,
  BookOpen,
  CheckSquare
} from 'lucide-react';
import { useStorage } from '../../context/StorageContext';
import { subDays, format } from 'date-fns';

export function CrossCheckWidget({ compact = false }) {
  const {
    salahHistory,
    allReadingLogs,
    allGoals,
    allHabits,
    allHabitLogs,
    selectedDate
  } = useStorage();

  // 1. Calculate 7-Day Salah Consistency
  const last7DaysDates = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(selectedDate), i), 'yyyy-MM-dd')
  );

  let totalPrayersDone = 0;
  last7DaysDates.forEach(d => {
    const log = salahHistory.find(s => s.date === d);
    if (log) {
      totalPrayersDone += [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha].filter(Boolean).length;
    }
  });
  const salahPct = Math.round((totalPrayersDone / 35) * 100);

  // 2. Calculate 7-Day Reading Velocity
  let totalPagesLast7 = 0;
  if (allReadingLogs) {
    allReadingLogs.forEach(r => {
      if (last7DaysDates.includes(r.date)) {
        totalPagesLast7 += r.pagesRead || 0;
      }
    });
  }
  const avgPagesPerDay = Math.round(totalPagesLast7 / 7);
  const targetPagesPerDay = 20;

  // 3. Calculate Weekly Tasks & Targets
  const weeklyGoals = allGoals ? allGoals.filter(g => g.level === 'weekly' || g.level === 'daily') : [];
  const completedWeeklyGoals = weeklyGoals.filter(g => g.status === 'completed').length;
  const weeklyTaskPct = weeklyGoals.length > 0 ? Math.round((completedWeeklyGoals / weeklyGoals.length) * 100) : 100;

  // 4. Overall Alignment Status
  let status = 'On Track';
  let badgeColor = 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300';
  let statusIcon = CheckCircle2;
  let statusDesc = 'Daily execution is aligned with monthly milestones and semester goals.';

  if (salahPct >= 85 && avgPagesPerDay >= targetPagesPerDay && weeklyTaskPct >= 70) {
    status = 'Ahead of Schedule';
    badgeColor = 'bg-amber-950/60 border-amber-500/40 text-amber-300';
    statusIcon = Sparkles;
    statusDesc = 'Exceptional discipline. You are outpacing your weekly targets.';
  } else if (salahPct < 70 || weeklyTaskPct < 40) {
    status = 'Needs Attention';
    badgeColor = 'bg-rose-950/60 border-rose-500/40 text-rose-300';
    statusIcon = AlertTriangle;
    statusDesc = 'Discipline drift detected in prayer or weekly tasks. Refocus on daily essentials.';
  }

  const StatusIcon = statusIcon;

  // Active Semester & Monthly Goals
  const activeSemester = allGoals?.find(g => g.level === 'semester' && g.status !== 'completed') || allGoals?.find(g => g.level === 'semester');
  const activeMonthly = allGoals?.find(g => g.level === 'monthly' && g.status !== 'completed') || allGoals?.find(g => g.level === 'monthly');

  if (compact) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">5-Tier Alignment Engine</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${badgeColor}`}>
                {status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Salah: <strong className="text-slate-200">{salahPct}%</strong> • Reading: <strong className="text-slate-200">{avgPagesPerDay} pgs/day</strong> • Tasks: <strong className="text-slate-200">{completedWeeklyGoals}/{weeklyGoals.length} done</strong>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full"
              style={{ width: `${Math.min(100, (salahPct + weeklyTaskPct) / 2)}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-emerald-400">
            {Math.round((salahPct + weeklyTaskPct) / 2)}% Health
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Hierarchical Cross-Check Alignment Matrix</h2>
            <p className="text-xs text-slate-400">Auditing daily micro-actions against macro semester pillars</p>
          </div>
        </div>

        <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 self-start sm:self-center ${badgeColor}`}>
          <StatusIcon className="w-4 h-4" />
          <span>Status: {status}</span>
        </div>
      </div>

      <p className="text-xs text-slate-300 italic bg-slate-800/40 p-3 rounded-xl border border-slate-800">
        "{statusDesc}"
      </p>

      {/* Alignment Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Spiritual */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Salah Discipline
            </span>
            <span className="text-xs font-bold text-amber-400">{salahPct}%</span>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${salahPct}%` }} />
          </div>
          <p className="text-[11px] text-slate-400">
            {totalPrayersDone} / 35 prayers completed in rolling 7-day window.
          </p>
        </div>

        {/* Intellectual */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Reading Velocity
            </span>
            <span className="text-xs font-bold text-indigo-400">
              {avgPagesPerDay} / {targetPagesPerDay} pgs
            </span>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-400 h-full rounded-full"
              style={{ width: `${Math.min(100, (avgPagesPerDay / targetPagesPerDay) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {totalPagesLast7} total pages read this week. Target: 140 pgs/wk.
          </p>
        </div>

        {/* Execution */}
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Sprint Execution
            </span>
            <span className="text-xs font-bold text-emerald-400">{weeklyTaskPct}%</span>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${weeklyTaskPct}%` }} />
          </div>
          <p className="text-[11px] text-slate-400">
            {completedWeeklyGoals} / {weeklyGoals.length} active sprint tasks achieved.
          </p>
        </div>
      </div>

      {/* Macro Milestones Being Advanced */}
      <div className="pt-2 border-t border-slate-800/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" /> Active Macro Goals Driven By Today's Habits
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeSemester && (
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-purple-300 uppercase">Tier 2: Semester Goal</span>
                <span className="text-xs font-bold text-purple-400">{activeSemester.progress || 0}%</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{activeSemester.title}</h4>
            </div>
          )}

          {activeMonthly && (
            <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-800/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-sky-300 uppercase">Tier 3: Monthly Goal</span>
                <span className="text-xs font-bold text-sky-400">{activeMonthly.progress || 0}%</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{activeMonthly.title}</h4>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
