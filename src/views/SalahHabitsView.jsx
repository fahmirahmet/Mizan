import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Flame,
  Calendar,
  Layers,
  Heart,
  Brain,
  Dumbbell
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { format, parseISO, subDays } from 'date-fns';

export function SalahHabitsView() {
  const {
    selectedDate,
    todaySalah,
    toggleSalah,
    updateSalahNotes,
    salahHistory,
    allHabits,
    selectedDateHabitLogs,
    toggleHabit,
    addHabit,
    deleteHabit
  } = useStorage();

  const [notes, setNotes] = useState(todaySalah?.notes || '');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitDesc, setNewHabitDesc] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('spiritual');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  const salahList = [
    { key: 'fajr', label: 'Fajr', nameAr: 'الفجر', description: 'Dawn Prayer (2 Rakats)' },
    { key: 'dhuhr', label: 'Dhuhr', nameAr: 'الظهر', description: 'Noon Prayer (4 Rakats)' },
    { key: 'asr', label: 'Asr', nameAr: 'العصر', description: 'Afternoon Prayer (4 Rakats)' },
    { key: 'maghrib', label: 'Maghrib', nameAr: 'المغرب', description: 'Sunset Prayer (3 Rakats)' },
    { key: 'isha', label: 'Isha', nameAr: 'العشاء', description: 'Night Prayer (4 Rakats)' }
  ];

  const handleSaveNotes = (e) => {
    e.preventDefault();
    updateSalahNotes(notes);
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    await addHabit({
      title: newHabitTitle.trim(),
      description: newHabitDesc.trim(),
      category: newHabitCategory,
      frequency: 'daily'
    });

    setNewHabitTitle('');
    setNewHabitDesc('');
    setIsAddingHabit(false);
  };

  // Filter habits
  const filteredHabits = allHabits
    ? allHabits.filter(h => activeCategoryFilter === 'all' || h.category === activeCategoryFilter)
    : [];

  // Generate last 7 days for the history strip
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const log = salahHistory.find(s => s.date === dateStr);
    const completedCount = log
      ? [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha].filter(Boolean).length
      : 0;
    return {
      dateStr,
      dayName: format(d, 'EEE'),
      dayNum: format(d, 'd'),
      completedCount,
      isPerfect: completedCount === 5
    };
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'spiritual':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'health':
        return <Dumbbell className="w-4 h-4 text-sky-400" />;
      case 'intellect':
        return <Brain className="w-4 h-4 text-indigo-400" />;
      default:
        return <Heart className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* View Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Spiritual Discipline & Habits
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build consistency through the 5 daily prayers and intentional atomic habits.
          </p>
        </div>
      </div>

      {/* 7-Day Consistency Strip */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" /> 7-Day Prayer Consistency
          </span>
          <span className="text-xs text-slate-400">Aim: 5/5 Prayers Daily</span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4">
          {last7Days.map(day => (
            <div
              key={day.dateStr}
              className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                day.dateStr === selectedDate
                  ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500/50'
                  : 'border-slate-800 bg-slate-800/40'
              }`}
            >
              <div className="text-[11px] font-medium text-slate-400">{day.dayName}</div>
              <div className="text-sm font-bold text-slate-200 my-1">{day.dayNum}</div>
              <div
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block ${
                  day.isPerfect
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : day.completedCount > 0
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {day.completedCount}/5
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 1: Daily Salah Suite */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Daily Obligatory Prayers (الصلوات الخمس)</h2>
            <p className="text-xs text-slate-400">Mark off each prayer upon completion</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {todaySalah ? [todaySalah.fajr, todaySalah.dhuhr, todaySalah.asr, todaySalah.maghrib, todaySalah.isha].filter(Boolean).length : 0} / 5 Finished
          </span>
        </div>

        {/* 5 Main Prayer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4">
          {salahList.map((prayer) => {
            const isDone = todaySalah ? !!todaySalah[prayer.key] : false;
            return (
              <button
                key={prayer.key}
                onClick={() => toggleSalah(prayer.key)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-32 ${
                  isDone
                    ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm shadow-emerald-950'
                    : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-arabic font-bold text-emerald-400">{prayer.nameAr}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                </div>
                <div>
                  <h3 className={`text-base font-bold capitalize ${isDone ? 'text-emerald-200' : 'text-slate-100'}`}>
                    {prayer.label}
                  </h3>
                  <p className="text-[11px] text-slate-400">{prayer.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Voluntary Prayers & Sunnah */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Voluntary Sunnah & Nawafil
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'tahajjud', label: 'Tahajjud (Qiyam al-Layl)', desc: 'Late night prayer of serenity' },
              { key: 'duha', label: 'Duha Prayer', desc: 'Forenoon prayer of gratitude' },
              { key: 'rawatib', label: 'Sunnah Rawatib', desc: '12 Rakats established Sunnah' }
            ].map(item => {
              const isChecked = todaySalah ? !!todaySalah[item.key] : false;
              return (
                <button
                  key={item.key}
                  onClick={() => toggleSalah(item.key)}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    isChecked
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{item.label}</h4>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prayer Notes Form */}
        <form onSubmit={handleSaveNotes} className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-400">
              Spiritual Reflections / Khushoo Notes for Today
            </label>
            <button
              type="submit"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              Save Note
            </button>
          </div>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Read Surah Al-Kahf; prayed Fajr at the mosque; renewed intention..."
            className="w-full p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </form>
      </div>

      {/* SECTION 2: Atomic Habits Matrix */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-teal-400" />
              Daily Habit Tracker
            </h2>
            <p className="text-xs text-slate-400">Atomic habits repeated daily build lifelong transformation.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingHabit(prev => !prev)}
              className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingHabit ? 'Cancel' : 'New Habit'}
            </button>
          </div>
        </div>

        {/* New Habit Form */}
        {isAddingHabit && (
          <form onSubmit={handleCreateHabit} className="p-4 rounded-xl bg-slate-800/70 border border-teal-500/30 space-y-3">
            <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">Define New Habit</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Habit Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15-Minute Quran Recitation"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Pillar</label>
                <select
                  value={newHabitCategory}
                  onChange={(e) => setNewHabitCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
                >
                  <option value="spiritual">Spiritual</option>
                  <option value="health">Physical Health</option>
                  <option value="intellect">Intellect / Deep Work</option>
                  <option value="mindfulness">Mindfulness</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Description / Implementation Intent</label>
              <input
                type="text"
                placeholder="e.g. Immediately after Fajr prayer, I will recite at least 1 Juz."
                value={newHabitDesc}
                onChange={(e) => setNewHabitDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingHabit(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs"
              >
                Save Habit
              </button>
            </div>
          </form>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['all', 'spiritual', 'health', 'intellect', 'mindfulness'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                activeCategoryFilter === cat
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Habit List */}
        <div className="space-y-3">
          {filteredHabits.length > 0 ? (
            filteredHabits.map(habit => {
              const log = selectedDateHabitLogs?.find(l => l.habitId === habit.id);
              const isDone = log ? !!log.completed : false;
              return (
                <div
                  key={habit.id}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    isDone
                      ? 'bg-teal-950/20 border-teal-500/30'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className="p-1 text-slate-400 hover:text-teal-400 transition-colors"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-teal-400 shrink-0" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-500 shrink-0" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                          {habit.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium capitalize flex items-center gap-1">
                          {getCategoryIcon(habit.category)} {habit.category}
                        </span>
                      </div>
                      {habit.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{habit.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete Habit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">No habits found for this category.</p>
          )}
        </div>
      </div>
    </div>
  );
}
