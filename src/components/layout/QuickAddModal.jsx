import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dumbbell, BookOpen, CheckSquare, Plus, Sparkles, Feather } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';

export function QuickAddModal({ isOpen, onClose }) {
  const {
    addWorkout,
    addBook,
    logReadingSession,
    addGoal,
    addHabit,
    books,
    allGoals,
    selectedDate
  } = useStorage();

  const [activeTab, setActiveTab] = useState('workout');

  // Workout state
  const [workoutName, setWorkoutName] = useState('');
  const [workoutCategory, setWorkoutCategory] = useState('Strength');
  const [setsCount, setSetsCount] = useState('3');
  const [repsCount, setRepsCount] = useState('12');
  const [weightKg, setWeightKg] = useState('');
  const [durationMins, setDurationMins] = useState('30');
  const [distanceKm, setDistanceKm] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');

  // Reading state
  const [selectedBookId, setSelectedBookId] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [readingMinutes, setReadingMinutes] = useState('25');
  const [readingNotes, setReadingNotes] = useState('');

  // Task / Goal state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalLevel, setGoalLevel] = useState('daily');
  const [goalParentId, setGoalParentId] = useState('');
  const [goalPriority, setGoalPriority] = useState('medium');

  // Habit state
  const [habitTitle, setHabitTitle] = useState('');
  const [habitCategory, setHabitCategory] = useState('health');

  if (!isOpen) return null;

  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    if (!workoutName.trim()) return;

    const numSets = parseInt(setsCount, 10) || 3;
    const numReps = parseInt(repsCount, 10) || 10;
    const wt = parseFloat(weightKg) || 0;

    const sets = Array.from({ length: numSets }, (_, i) => ({
      setNumber: i + 1,
      reps: numReps,
      weightKg: wt,
      rpe: 8
    }));

    await addWorkout({
      date: selectedDate,
      exerciseName: workoutName.trim(),
      category: workoutCategory,
      sets,
      durationMinutes: durationMins ? parseInt(durationMins, 10) : null,
      distanceKm: distanceKm ? parseFloat(distanceKm) : null,
      notes: workoutNotes
    });

    setWorkoutName('');
    setWorkoutNotes('');
    onClose();
  };

  const handleReadingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookId || !endPage) return;

    await logReadingSession({
      bookId: selectedBookId,
      date: selectedDate,
      startPage: startPage || 0,
      endPage: parseInt(endPage, 10),
      pagesRead: Math.max(0, parseInt(endPage, 10) - (parseInt(startPage, 10) || 0)),
      durationMinutes: parseInt(readingMinutes, 10) || 20,
      notes: readingNotes
    });

    setEndPage('');
    setReadingNotes('');
    onClose();
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    await addGoal({
      title: goalTitle.trim(),
      level: goalLevel,
      parentId: goalParentId || null,
      priority: goalPriority,
      targetDate: selectedDate,
      status: 'pending',
      progress: 0
    });

    setGoalTitle('');
    onClose();
  };

  const handleHabitSubmit = async (e) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;

    await addHabit({
      title: habitTitle.trim(),
      category: habitCategory,
      frequency: 'daily'
    });

    setHabitTitle('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Quick Log Activity
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Selector Tabs */}
          <div className="flex border-b border-slate-800 px-6 pt-3 gap-2 overflow-x-auto bg-slate-950/40">
            {[
              { id: 'workout', label: 'Workout', icon: Dumbbell },
              { id: 'reading', label: 'Reading', icon: BookOpen },
              { id: 'task', label: 'Task / Goal', icon: CheckSquare },
              { id: 'habit', label: 'Habit', icon: Sparkles }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'workout' && (
              <form onSubmit={handleWorkoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Exercise Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Push-ups, 5K Run, Squats, Pull-ups"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <select
                      value={workoutCategory}
                      onChange={(e) => setWorkoutCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Strength">Strength / Calisthenics</option>
                      <option value="Cardio">Cardio / Running</option>
                      <option value="Mobility">Mobility & Stretch</option>
                      <option value="Sports">Sports</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Duration (mins)
                    </label>
                    <input
                      type="number"
                      placeholder="30"
                      value={durationMins}
                      onChange={(e) => setDurationMins(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {workoutCategory === 'Cardio' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 5.0"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Sets
                      </label>
                      <input
                        type="number"
                        value={setsCount}
                        onChange={(e) => setSetsCount(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Reps / set
                      </label>
                      <input
                        type="number"
                        value={repsCount}
                        onChange={(e) => setRepsCount(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        placeholder="Bodyweight"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Tempo, intensity, feeling..."
                    value={workoutNotes}
                    onChange={(e) => setWorkoutNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20"
                  >
                    Save Workout
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'reading' && (
              <form onSubmit={handleReadingSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Select Book
                  </label>
                  <select
                    required
                    value={selectedBookId}
                    onChange={(e) => {
                      setSelectedBookId(e.target.value);
                      const b = books.find(x => x.id === parseInt(e.target.value, 10));
                      if (b) setStartPage(b.currentPage || 0);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose a book from library --</option>
                    {books && books.map(book => (
                      <option key={book.id} value={book.id}>
                        {book.title} (Page {book.currentPage}/{book.totalPages})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Start Page
                    </label>
                    <input
                      type="number"
                      value={startPage}
                      onChange={(e) => setStartPage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      End Page
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 235"
                      value={endPage}
                      onChange={(e) => setEndPage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Minutes Read
                  </label>
                  <input
                    type="number"
                    value={readingMinutes}
                    onChange={(e) => setReadingMinutes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Key takeaway or note
                  </label>
                  <input
                    type="text"
                    placeholder="Chapter insights, reflections..."
                    value={readingNotes}
                    onChange={(e) => setReadingNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20"
                  >
                    Save Reading Session
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'task' && (
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target / Task Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Build authentication UI, Review Surah Al-Mulk"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Hierarchy Tier
                    </label>
                    <select
                      value={goalLevel}
                      onChange={(e) => setGoalLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="daily">Daily Task (Tier 5)</option>
                      <option value="weekly">Weekly Target (Tier 4)</option>
                      <option value="monthly">Monthly Goal (Tier 3)</option>
                      <option value="semester">Semester Goal (Tier 2)</option>
                      <option value="yearly">Yearly Goal (Tier 1)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Priority
                    </label>
                    <select
                      value={goalPriority}
                      onChange={(e) => setGoalPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                  </div>
                </div>

                {goalLevel !== 'yearly' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Link to Parent Goal (Optional)
                    </label>
                    <select
                      value={goalParentId}
                      onChange={(e) => setGoalParentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Standalone (No parent) --</option>
                      {allGoals &&
                        allGoals
                          .filter(g => g.level !== 'daily')
                          .map(g => (
                            <option key={g.id} value={g.id}>
                              [{g.level.toUpperCase()}] {g.title}
                            </option>
                          ))}
                    </select>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20"
                  >
                    Add to Planner
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'habit' && (
              <form onSubmit={handleHabitSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Read 10 Pages, Cold Shower, No Sugar"
                    value={habitTitle}
                    onChange={(e) => setHabitTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Pillar / Category
                  </label>
                  <select
                    value={habitCategory}
                    onChange={(e) => setHabitCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="spiritual">Spiritual (Salah, Quran, Dhikr)</option>
                    <option value="health">Physical Health & Fitness</option>
                    <option value="intellect">Intellect & Deep Work</option>
                    <option value="mindfulness">Mindfulness & Mental Clarity</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20"
                  >
                    Create Habit
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
