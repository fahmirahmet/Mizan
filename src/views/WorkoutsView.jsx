import React, { useState } from 'react';
import {
  Dumbbell,
  Plus,
  Trash2,
  Activity,
  Flame,
  Clock,
  MapPin,
  TrendingUp,
  Layers
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { format, parseISO } from 'date-fns';

export function WorkoutsView() {
  const {
    selectedDate,
    workoutsForDate,
    allWorkouts,
    addWorkout,
    deleteWorkout
  } = useStorage();

  const [isCreating, setIsCreating] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [category, setCategory] = useState('Strength');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [distanceKm, setDistanceKm] = useState('');
  const [notes, setNotes] = useState('');

  // Sets state
  const [sets, setSets] = useState([
    { setNumber: 1, reps: 10, weightKg: 0, rpe: 8 },
    { setNumber: 2, reps: 10, weightKg: 0, rpe: 8 },
    { setNumber: 3, reps: 10, weightKg: 0, rpe: 8.5 }
  ]);

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([
      ...sets,
      {
        setNumber: sets.length + 1,
        reps: lastSet ? lastSet.reps : 10,
        weightKg: lastSet ? lastSet.weightKg : 0,
        rpe: lastSet ? lastSet.rpe : 8
      }
    ]);
  };

  const handleRemoveSet = (index) => {
    if (sets.length === 1) return;
    const updated = sets.filter((_, i) => i !== index).map((s, idx) => ({ ...s, setNumber: idx + 1 }));
    setSets(updated);
  };

  const handleUpdateSet = (index, field, value) => {
    const updated = [...sets];
    updated[index] = {
      ...updated[index],
      [field]: field === 'rpe' ? parseFloat(value) || 0 : parseInt(value, 10) || 0
    };
    setSets(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    await addWorkout({
      date: selectedDate,
      exerciseName: exerciseName.trim(),
      category,
      sets: category === 'Cardio' ? [] : sets,
      distanceKm: distanceKm ? parseFloat(distanceKm) : null,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
      notes: notes.trim()
    });

    setExerciseName('');
    setNotes('');
    setDistanceKm('');
    setIsCreating(false);
  };

  // Quick stats
  const totalVolume = workoutsForDate?.reduce((acc, w) => {
    const setVol = w.sets?.reduce((sAcc, s) => sAcc + (s.reps * (s.weightKg || 1)), 0) || 0;
    return acc + setVol;
  }, 0) || 0;

  const totalMinutes = workoutsForDate?.reduce((acc, w) => acc + (w.durationMinutes || 0), 0) || 0;

  return (
    <div className="space-y-8 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Dumbbell className="w-6 h-6 text-sky-400" />
            Physical Health & Workouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track resistance training sets, reps, calisthenics, and endurance mileage.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(prev => !prev)}
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 self-start shadow-md shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          {isCreating ? 'Close Logger' : 'Log New Exercise'}
        </button>
      </div>

      {/* Stats Summary for Selected Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Exercises Logged</div>
            <div className="text-lg font-bold text-slate-100">{workoutsForDate?.length || 0} movements</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Training Duration</div>
            <div className="text-lg font-bold text-slate-100">{totalMinutes} minutes</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Volume / Reps</div>
            <div className="text-lg font-bold text-slate-100">{totalVolume > 0 ? `${totalVolume.toLocaleString()} kg/reps` : 'Cardio/Mobility'}</div>
          </div>
        </div>
      </div>

      {/* Workout Logger Form */}
      {isCreating && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-sky-500/40 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-sky-400 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Record Training Session
            </h2>
            <span className="text-xs text-slate-400 font-medium">Date: {selectedDate}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Exercise Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Weighted Pull-ups, Squats, 5K Run"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              >
                <option value="Strength">Strength / Calisthenics</option>
                <option value="Cardio">Cardio / Running</option>
                <option value="Mobility">Mobility & Flexibility</option>
                <option value="Sports">Martial Arts / Sports</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Session Duration (mins)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          {/* Cardio Specific field */}
          {category === 'Cardio' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Distance (km)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 5.2"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full sm:w-1/3 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
              />
            </div>
          )}

          {/* Dynamic Sets Table for Strength */}
          {category !== 'Cardio' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sets & Reps Breakdown</span>
                <button
                  type="button"
                  onClick={handleAddSet}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Set
                </button>
              </div>

              <div className="space-y-2">
                {sets.map((set, idx) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-4 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-xs font-bold text-slate-400 w-8 text-center">#{set.setNumber}</span>

                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Reps</span>
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(idx, 'reps', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Weight (kg)</span>
                        <input
                          type="number"
                          value={set.weightKg}
                          onChange={(e) => handleUpdateSet(idx, 'weightKg', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">RPE (1-10)</span>
                        <input
                          type="number"
                          step="0.5"
                          value={set.rpe}
                          onChange={(e) => handleUpdateSet(idx, 'rpe', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-100 text-center"
                        />
                      </div>
                    </div>

                    {sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes & Form Feedback</label>
            <input
              type="text"
              placeholder="e.g. Strict 2-second pause at bottom; felt energetic."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
            >
              Save Workout Log
            </button>
          </div>
        </form>
      )}

      {/* Workout Logs for Selected Date */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-400" />
          Sessions on {selectedDate}
        </h2>

        {workoutsForDate && workoutsForDate.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workoutsForDate.map(workout => (
              <div
                key={workout.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{workout.exerciseName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950/60 border border-sky-800/50 text-sky-300 font-semibold">
                        {workout.category}
                      </span>
                      {workout.durationMinutes && (
                        <span className="text-xs text-slate-400">{workout.durationMinutes} mins</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteWorkout(workout.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sets Table */}
                {workout.sets && workout.sets.length > 0 && (
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <div className="grid grid-cols-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-700/50 text-center">
                      <span>Set</span>
                      <span>Reps</span>
                      <span>Weight</span>
                      <span>RPE</span>
                    </div>
                    <div className="divide-y divide-slate-700/30 text-center text-xs">
                      {workout.sets.map((s, idx) => (
                        <div key={idx} className="grid grid-cols-4 py-1.5 text-slate-200">
                          <span className="text-slate-400 font-medium">#{s.setNumber || idx + 1}</span>
                          <span className="font-bold">{s.reps}</span>
                          <span>{s.weightKg ? `${s.weightKg} kg` : 'BW'}</span>
                          <span className="text-sky-400">{s.rpe || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {workout.distanceKm && (
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Distance:</span>
                    <span className="font-bold text-emerald-400">{workout.distanceKm} km</span>
                  </div>
                )}

                {workout.notes && (
                  <p className="text-xs text-slate-400 italic bg-slate-800/20 p-2.5 rounded-lg border border-slate-800">
                    "{workout.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center">
            <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">No workout records found for this date.</p>
            <p className="text-xs text-slate-500 mt-1">Consistency compounds over months and years.</p>
          </div>
        )}
      </div>
    </div>
  );
}
