import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, subDays, addDays } from 'date-fns';
import { db } from '../db';
import { populateSeedData } from '../utils/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import confetti from 'canvas-confetti';

const StorageContext = createContext(null);

const DEFAULT_SALAH = (dateStr) => ({
  date: dateStr,
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
  tahajjud: false,
  duha: false,
  rawatib: false,
  notes: ''
});

const DEFAULT_JOURNAL = (dateStr) => ({
  date: dateStr,
  mood: 'good',
  gratitude: ['', '', ''],
  wins: ['', ''],
  promptAnswers: { dailyFocus: '', challengeOvercome: '' },
  content: '',
  tags: []
});

export function StorageProvider({ children }) {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [isInitialized, setIsInitialized] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Cloud & Local Sync State: 'synced' | 'syncing' | 'offline' | 'error'
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? 'syncing' : 'synced');
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const pendingSaveTimerRef = useRef(null);

  // Trigger celebratory confetti
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#34d399', '#f59e0b', '#38bdf8']
      });
    } catch (e) {
      // ignore
    }
  };

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(prev => (prev?.id ? null : prev));
    }, 3500);
  };

  // Helper: Extract current state envelope from Dexie
  const getCurrentStateEnvelope = async () => {
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      salahLogs: await db.salahLogs.toArray().catch(() => []),
      habits: await db.habits.toArray().catch(() => []),
      habitLogs: await db.habitLogs.toArray().catch(() => []),
      workouts: await db.workouts.toArray().catch(() => []),
      books: await db.books.toArray().catch(() => []),
      readingLogs: await db.readingLogs.toArray().catch(() => []),
      goals: await db.goals.toArray().catch(() => []),
      journalEntries: await db.journalEntries.toArray().catch(() => []),
      settings: await db.settings.toArray().catch(() => [])
    };
  };

  // Helper: Hydrate Dexie tables atomically from an envelope
  const hydrateIndexedDB = async (data) => {
    if (!data || typeof data !== 'object') return;
    await db.transaction('rw', [
      db.salahLogs,
      db.habits,
      db.habitLogs,
      db.workouts,
      db.books,
      db.readingLogs,
      db.goals,
      db.journalEntries,
      db.settings
    ], async () => {
      if (Array.isArray(data.salahLogs)) {
        await db.salahLogs.clear();
        await db.salahLogs.bulkAdd(data.salahLogs);
      }
      if (Array.isArray(data.habits)) {
        await db.habits.clear();
        await db.habits.bulkAdd(data.habits);
      }
      if (Array.isArray(data.habitLogs)) {
        await db.habitLogs.clear();
        await db.habitLogs.bulkAdd(data.habitLogs);
      }
      if (Array.isArray(data.workouts)) {
        await db.workouts.clear();
        await db.workouts.bulkAdd(data.workouts);
      }
      if (Array.isArray(data.books)) {
        await db.books.clear();
        await db.books.bulkAdd(data.books);
      }
      if (Array.isArray(data.readingLogs)) {
        await db.readingLogs.clear();
        await db.readingLogs.bulkAdd(data.readingLogs);
      }
      if (Array.isArray(data.goals)) {
        await db.goals.clear();
        await db.goals.bulkAdd(data.goals);
      }
      if (Array.isArray(data.journalEntries)) {
        await db.journalEntries.clear();
        await db.journalEntries.bulkAdd(data.journalEntries);
      }
      if (Array.isArray(data.settings)) {
        await db.settings.clear();
        await db.settings.bulkAdd(data.settings);
      }
    });
  };

  // --- Synchronization Engine (Supabase Cloud + 500ms Debounce + Local IndexedDB) ---
  const syncAllToCloud = async (immediate = false) => {
    if (pendingSaveTimerRef.current) {
      clearTimeout(pendingSaveTimerRef.current);
      pendingSaveTimerRef.current = null;
    }

    const doSave = async () => {
      try {
        setSyncStatus('syncing');
        const currentEnvelope = await getCurrentStateEnvelope();
        const now = new Date().toISOString();

        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase
            .from('mizan_state')
            .upsert(
              {
                id: 'primary_user',
                data: currentEnvelope,
                updated_at: now
              },
              { onConflict: 'id' }
            );

          if (error) {
            console.warn('[Storage] Supabase sync error:', error.message);
            setSyncStatus('error');
          } else {
            setSyncStatus('synced');
            setLastSavedTime(now);
          }
        } else {
          // Supabase credentials not set or local offline mode
          // Optionally notify local dev server if available
          try {
            const res = await fetch('/api/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(currentEnvelope)
            });
            if (res.ok) {
              const json = await res.json();
              setSyncStatus('synced');
              setLastSavedTime(json.savedAt || now);
              return;
            }
          } catch (_) {
            // Local dev server not running (e.g. Vercel deployment)
          }

          setSyncStatus('synced');
          setLastSavedTime(now);
        }
      } catch (err) {
        console.warn('[Storage] Auto-sync error:', err);
        setSyncStatus('error');
      }
    };

    if (immediate) {
      await doSave();
    } else {
      pendingSaveTimerRef.current = setTimeout(doSave, 500);
    }
  };

  // Alias for backwards compatibility
  const syncAllToDisk = syncAllToCloud;

  // Safe Initialization: Supabase is Cloud SSOT, Dexie is instant reactive cache
  useEffect(() => {
    async function initDB() {
      try {
        setSyncStatus('syncing');
        let dataHydrated = false;

        // 1. Fetch data from Supabase table mizan_state where id = 'primary_user'
        if (isSupabaseConfigured && supabase) {
          try {
            console.log('[Storage] Checking Supabase cloud state for primary_user...');
            const { data: row, error } = await supabase
              .from('mizan_state')
              .select('data, updated_at')
              .eq('id', 'primary_user')
              .maybeSingle();

            if (error) {
              console.warn('[Storage] Supabase query error:', error.message);
            } else if (row && row.data) {
              console.log('[Storage] Hydrating local IndexedDB state from Supabase...');
              await hydrateIndexedDB(row.data);
              dataHydrated = true;
              setSyncStatus('synced');
              setLastSavedTime(row.updated_at || new Date().toISOString());
              localStorage.setItem('mizan_initialized', 'true');
            }
          } catch (supaErr) {
            console.warn('[Storage] Could not reach Supabase on startup:', supaErr.message);
          }
        }

        // 2. If not hydrated from Supabase, check local dev server if running
        if (!dataHydrated) {
          try {
            const res = await fetch('/api/data');
            if (res.ok) {
              const result = await res.json();
              if (result.success && result.data && result.initialized) {
                console.log('[Storage] Hydrating local state from local dev server...');
                await hydrateIndexedDB(result.data);
                dataHydrated = true;
                setSyncStatus('synced');
                setLastSavedTime(result.lastSaved || new Date().toISOString());
                localStorage.setItem('mizan_initialized', 'true');
              }
            }
          } catch (_) {
            // Local dev server not running
          }
        }

        // 3. Check Dexie IndexedDB cache
        const goalsCount = await db.goals.count().catch(() => 0);
        const booksCount = await db.books.count().catch(() => 0);
        const salahCount = await db.salahLogs.count().catch(() => 0);
        const dexieHasData = (goalsCount + booksCount + salahCount) > 0;

        if (!dataHydrated && dexieHasData) {
          // Local Dexie has data; upsert to Supabase if configured
          if (isSupabaseConfigured && supabase) {
            console.log('[Storage] Local IndexedDB has data; syncing to Supabase cloud...');
            await syncAllToCloud(true);
          }
          setSyncStatus('synced');
        } else if (!dataHydrated && !dexieHasData) {
          // Clean install detected
          const isLocalStorageInit = localStorage.getItem('mizan_initialized');
          if (!isLocalStorageInit) {
            console.log('[Storage] Clean install detected. Populating initial seed data...');
            await populateSeedData(db, false);
            localStorage.setItem('mizan_initialized', 'true');
            await syncAllToCloud(true);
          }
          setSyncStatus('synced');
        }
      } catch (err) {
        console.error('[Storage] Error during initialization:', err);
      } finally {
        setIsInitialized(true);
      }
    }

    initDB();

    // On window unload, flush pending debounced saves immediately
    const handleBeforeUnload = () => {
      if (pendingSaveTimerRef.current) {
        syncAllToCloud(true);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // --- Live Queries with Guaranteed Default Values ---

  // 1. Salah
  const todaySalah = useLiveQuery(
    async () => {
      try {
        const record = await db.salahLogs.where('date').equals(selectedDate).first();
        return record || DEFAULT_SALAH(selectedDate);
      } catch (e) {
        return DEFAULT_SALAH(selectedDate);
      }
    },
    [selectedDate],
    DEFAULT_SALAH(selectedDate)
  );

  const salahHistory = useLiveQuery(
    () => db.salahLogs.orderBy('date').reverse().limit(30).toArray().catch(() => []),
    [],
    []
  );

  // 2. Habits & Logs
  const allHabits = useLiveQuery(
    () => db.habits.toArray().then(list => list.filter(h => !h.archived)).catch(() => []),
    [],
    []
  );

  const selectedDateHabitLogs = useLiveQuery(
    () => db.habitLogs.where('date').equals(selectedDate).toArray().catch(() => []),
    [selectedDate],
    []
  );

  const allHabitLogs = useLiveQuery(
    () => db.habitLogs.toArray().catch(() => []),
    [],
    []
  );

  // 3. Workouts
  const workoutsForDate = useLiveQuery(
    () => db.workouts.where('date').equals(selectedDate).toArray().catch(() => []),
    [selectedDate],
    []
  );

  const allWorkouts = useLiveQuery(
    () => db.workouts.orderBy('date').reverse().limit(50).toArray().catch(() => []),
    [],
    []
  );

  // 4. Books & Reading Logs
  const books = useLiveQuery(
    () => db.books.toArray().catch(() => []),
    [],
    []
  );

  const readingLogsForDate = useLiveQuery(
    () => db.readingLogs.where('date').equals(selectedDate).toArray().catch(() => []),
    [selectedDate],
    []
  );

  const allReadingLogs = useLiveQuery(
    () => db.readingLogs.orderBy('date').reverse().limit(50).toArray().catch(() => []),
    [],
    []
  );

  // 5. Goals & Planning Hierarchy
  const allGoals = useLiveQuery(
    () => db.goals.toArray().catch(() => []),
    [],
    []
  );

  // 6. Journal Entries
  const journalEntry = useLiveQuery(
    async () => {
      try {
        const entry = await db.journalEntries.where('date').equals(selectedDate).first();
        return entry || DEFAULT_JOURNAL(selectedDate);
      } catch (e) {
        return DEFAULT_JOURNAL(selectedDate);
      }
    },
    [selectedDate],
    DEFAULT_JOURNAL(selectedDate)
  );

  const recentJournalEntries = useLiveQuery(
    () => db.journalEntries.orderBy('date').reverse().limit(15).toArray().catch(() => []),
    [],
    []
  );

  // --- Helper: Cascade Parent Goal Progress Recursively ---
  const recalculateParentProgress = async (parentId) => {
    if (!parentId) return;
    try {
      const parent = await db.goals.get(parentId);
      if (!parent) return;

      const siblings = await db.goals.where('parentId').equals(parentId).toArray();
      if (siblings && siblings.length > 0) {
        const completedCount = siblings.filter(s => s.status === 'completed').length;
        const inProgressCount = siblings.filter(s => s.status === 'in_progress').length;
        const progress = Math.round(
          siblings.reduce((acc, s) => acc + (s.progress || (s.status === 'completed' ? 100 : 0)), 0) / siblings.length
        );

        let status = 'in_progress';
        if (completedCount === siblings.length) {
          status = 'completed';
        } else if (completedCount === 0 && inProgressCount === 0) {
          status = 'pending';
        }

        await db.goals.update(parentId, {
          progress,
          status,
          updatedAt: new Date().toISOString()
        });

        if (parent.parentId) {
          await recalculateParentProgress(parent.parentId);
        }
      }
    } catch (err) {
      console.error('Error recalculating parent progress:', err);
    }
  };

  // --- CRUD Operations (Dexie + Debounced 500ms Cloud Persistence) ---

  // 1. Salah Operations
  const toggleSalah = async (prayerKey, dateStr = selectedDate) => {
    try {
      const existing = await db.salahLogs.where('date').equals(dateStr).first();
      const currentVal = existing ? !!existing[prayerKey] : false;
      const newVal = !currentVal;

      if (existing) {
        await db.salahLogs.update(existing.id, {
          [prayerKey]: newVal,
          updatedAt: new Date().toISOString()
        });
      } else {
        await db.salahLogs.add({
          date: dateStr,
          fajr: prayerKey === 'fajr',
          dhuhr: prayerKey === 'dhuhr',
          asr: prayerKey === 'asr',
          maghrib: prayerKey === 'maghrib',
          isha: prayerKey === 'isha',
          tahajjud: prayerKey === 'tahajjud',
          duha: prayerKey === 'duha',
          rawatib: prayerKey === 'rawatib',
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      if (newVal) {
        triggerCelebration();
      }
      syncAllToCloud();
    } catch (err) {
      console.error('Error toggling salah:', err);
      showToast('Error updating prayer status', 'error');
    }
  };

  const updateSalahNotes = async (notes, dateStr = selectedDate) => {
    const existing = await db.salahLogs.where('date').equals(dateStr).first();
    if (existing) {
      await db.salahLogs.update(existing.id, { notes, updatedAt: new Date().toISOString() });
    } else {
      await db.salahLogs.add({
        date: dateStr,
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
        tahajjud: false,
        duha: false,
        rawatib: false,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    syncAllToCloud();
    showToast('Prayer notes saved');
  };

  // 2. Habit Operations
  const addHabit = async (habit) => {
    const id = await db.habits.add({
      title: habit.title,
      description: habit.description || '',
      category: habit.category || 'health',
      frequency: habit.frequency || 'daily',
      targetDaysPerWeek: habit.targetDaysPerWeek || 7,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    syncAllToCloud();
    showToast('Habit added successfully');
    return id;
  };

  const updateHabit = async (id, updates) => {
    await db.habits.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    syncAllToCloud();
    showToast('Habit updated');
  };

  const deleteHabit = async (id) => {
    await db.transaction('rw', [db.habits, db.habitLogs], async () => {
      await db.habits.delete(id);
      await db.habitLogs.where('habitId').equals(id).delete();
    });
    syncAllToCloud();
    showToast('Habit removed');
  };

  const toggleHabit = async (habitId, dateStr = selectedDate) => {
    try {
      const existing = await db.habitLogs
        .where('habitId')
        .equals(habitId)
        .and(l => l.date === dateStr)
        .first();

      if (existing) {
        const newStatus = !existing.completed;
        await db.habitLogs.update(existing.id, {
          completed: newStatus,
          updatedAt: new Date().toISOString()
        });
        if (newStatus) triggerCelebration();
      } else {
        await db.habitLogs.add({
          habitId,
          date: dateStr,
          completed: true,
          value: 1,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        triggerCelebration();
      }
      syncAllToCloud();
    } catch (err) {
      console.error('Error toggling habit:', err);
    }
  };

  // 3. Workout Operations
  const addWorkout = async (workout) => {
    const id = await db.workouts.add({
      date: workout.date || selectedDate,
      exerciseName: workout.exerciseName,
      category: workout.category || 'Strength',
      sets: workout.sets || [],
      distanceKm: workout.distanceKm ? parseFloat(workout.distanceKm) : null,
      durationMinutes: workout.durationMinutes ? parseInt(workout.durationMinutes, 10) : null,
      notes: workout.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    triggerCelebration();
    syncAllToCloud();
    showToast('Workout logged!');
    return id;
  };

  const logWorkoutPreset = async (presetName, presetCategory, reps, durationMins, distanceKm = null) => {
    const sets = reps > 0 ? [{ setNumber: 1, reps, weightKg: 0, rpe: 8 }] : [];
    const id = await addWorkout({
      date: selectedDate,
      exerciseName: presetName,
      category: presetCategory,
      sets,
      durationMinutes: durationMins,
      distanceKm,
      notes: 'Quick logged preset'
    });
    return id;
  };

  const updateWorkout = async (id, updates) => {
    await db.workouts.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    syncAllToCloud();
    showToast('Workout updated');
  };

  const deleteWorkout = async (id) => {
    await db.workouts.delete(id);
    syncAllToCloud();
    showToast('Workout deleted');
  };

  // 4. Reading Operations
  const addBook = async (book) => {
    const totalPages = parseInt(book.totalPages, 10) || 100;
    const currentPage = parseInt(book.currentPage, 10) || 0;
    const status = currentPage >= totalPages ? 'finished' : (currentPage > 0 ? 'reading' : 'want-to-read');

    const id = await db.books.add({
      title: book.title,
      author: book.author || 'Unknown',
      totalPages,
      currentPage,
      category: book.category || 'General',
      coverUrl: book.coverUrl || '',
      status: book.status || status,
      startedDate: book.startedDate || (currentPage > 0 ? selectedDate : null),
      finishedDate: book.finishedDate || null,
      rating: book.rating || 5,
      notes: book.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    syncAllToCloud();
    showToast('Book added to library');
    return id;
  };

  const updateBook = async (id, updates) => {
    const current = await db.books.get(id);
    const newPage = updates.currentPage !== undefined ? parseInt(updates.currentPage, 10) : current?.currentPage;
    const totalPages = updates.totalPages !== undefined ? parseInt(updates.totalPages, 10) : current?.totalPages;
    const isFinished = newPage >= totalPages;

    const payload = {
      ...updates,
      currentPage: newPage,
      totalPages,
      status: isFinished ? 'finished' : (newPage > 0 ? 'reading' : 'want-to-read'),
      finishedDate: isFinished ? (current?.finishedDate || selectedDate) : current?.finishedDate,
      updatedAt: new Date().toISOString()
    };

    await db.books.update(id, payload);
    syncAllToCloud();
    showToast('Book updated');
  };

  // In-place page update helper for single book cards
  const updateBookCurrentPage = async (bookId, newPageNumber, durationMinutes = 20) => {
    const book = await db.books.get(bookId);
    if (!book) return;

    const previousPage = book.currentPage || 0;
    const targetPage = Math.min(book.totalPages, Math.max(0, parseInt(newPageNumber, 10)));
    const pagesRead = Math.max(0, targetPage - previousPage);
    const isFinished = targetPage >= book.totalPages;

    await db.transaction('rw', [db.books, db.readingLogs], async () => {
      // 1. Update book record in-place
      await db.books.update(bookId, {
        currentPage: targetPage,
        status: isFinished ? 'finished' : 'reading',
        finishedDate: isFinished ? (book.finishedDate || selectedDate) : null,
        updatedAt: new Date().toISOString()
      });

      // 2. If pages progressed, record a log entry for selected date
      if (pagesRead > 0) {
        await db.readingLogs.add({
          bookId,
          date: selectedDate,
          startPage: previousPage,
          endPage: targetPage,
          pagesRead,
          durationMinutes: parseInt(durationMinutes, 10) || 20,
          notes: 'In-place page update',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });

    triggerCelebration();
    syncAllToCloud();
    showToast(`Updated to page ${targetPage} (+${pagesRead} pgs)!`);
  };

  const deleteBook = async (id) => {
    await db.transaction('rw', [db.books, db.readingLogs], async () => {
      await db.books.delete(id);
      await db.readingLogs.where('bookId').equals(id).delete();
    });
    syncAllToCloud();
    showToast('Book deleted');
  };

  const logReadingSession = async (logData) => {
    const startPage = parseInt(logData.startPage, 10) || 0;
    const endPage = parseInt(logData.endPage, 10);
    const pagesRead = parseInt(logData.pagesRead, 10) || (endPage - startPage);
    const bookId = parseInt(logData.bookId, 10);

    await db.transaction('rw', [db.books, db.readingLogs], async () => {
      await db.readingLogs.add({
        bookId,
        date: logData.date || selectedDate,
        startPage,
        endPage,
        pagesRead: pagesRead > 0 ? pagesRead : 0,
        durationMinutes: parseInt(logData.durationMinutes, 10) || 20,
        notes: logData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const book = await db.books.get(bookId);
      if (book) {
        const newPage = Math.max(book.currentPage || 0, endPage);
        const isFinished = newPage >= book.totalPages;
        await db.books.update(bookId, {
          currentPage: newPage,
          status: isFinished ? 'finished' : 'reading',
          finishedDate: isFinished ? (book.finishedDate || selectedDate) : book.finishedDate,
          updatedAt: new Date().toISOString()
        });
      }
    });

    triggerCelebration();
    syncAllToCloud();
    showToast(`Recorded ${pagesRead > 0 ? pagesRead : 0} pages read!`);
  };

  // 5. Goals & Planning Hierarchy Operations
  const addGoal = async (goal) => {
    const parentId = goal.parentId ? parseInt(goal.parentId, 10) : null;
    const id = await db.goals.add({
      title: goal.title,
      description: goal.description || '',
      level: goal.level || 'daily',
      parentId,
      year: goal.year || new Date().getFullYear(),
      semester: goal.semester || (new Date().getMonth() >= 6 ? 2 : 1),
      month: goal.month || (new Date().getMonth() + 1),
      weekNumber: goal.weekNumber || 1,
      targetDate: goal.targetDate || selectedDate,
      status: goal.status || 'pending',
      progress: goal.progress || (goal.status === 'completed' ? 100 : 0),
      priority: goal.priority || 'medium',
      tags: Array.isArray(goal.tags) ? goal.tags : (goal.tags ? goal.tags.split(',').map(t => t.trim()) : []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (parentId) {
      await recalculateParentProgress(parentId);
    }

    syncAllToCloud();
    showToast('Goal / Task added');
    return id;
  };

  const updateGoal = async (id, updates) => {
    const existing = await db.goals.get(id);
    await db.goals.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    const parentId = updates.parentId !== undefined ? updates.parentId : existing?.parentId;
    if (parentId) {
      await recalculateParentProgress(parentId);
    }

    syncAllToCloud();
    showToast('Task / Goal updated');
  };

  const deleteGoal = async (id) => {
    const existing = await db.goals.get(id);
    await db.goals.delete(id);

    if (existing?.parentId) {
      await recalculateParentProgress(existing.parentId);
    }

    syncAllToCloud();
    showToast('Removed');
  };

  const toggleGoalStatus = async (id, currentStatus) => {
    let nextStatus = 'completed';
    let progress = 100;

    if (currentStatus === 'completed') {
      nextStatus = 'pending';
      progress = 0;
    } else {
      nextStatus = 'completed';
      progress = 100;
      triggerCelebration();
    }

    await db.goals.update(id, {
      status: nextStatus,
      progress,
      updatedAt: new Date().toISOString()
    });

    const goal = await db.goals.get(id);
    if (goal?.parentId) {
      await recalculateParentProgress(goal.parentId);
    }

    syncAllToCloud();
  };

  // 6. Journal Operations
  const saveJournalEntry = async (entry, showNotification = true) => {
    const existing = await db.journalEntries.where('date').equals(entry.date || selectedDate).first();
    const cleanEntry = {
      date: entry.date || selectedDate,
      mood: entry.mood || 'good',
      gratitude: entry.gratitude || [],
      wins: entry.wins || [],
      promptAnswers: entry.promptAnswers || {},
      content: entry.content || '',
      tags: entry.tags || [],
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      await db.journalEntries.update(existing.id, cleanEntry);
    } else {
      await db.journalEntries.add({
        ...cleanEntry,
        createdAt: new Date().toISOString()
      });
    }

    syncAllToCloud();
    if (showNotification) {
      showToast('Journal reflection saved');
    }
  };

  const deleteJournalEntry = async (id) => {
    await db.journalEntries.delete(id);
    syncAllToCloud();
    showToast('Journal entry deleted');
  };

  // 7. System Tools (Export / Import / Seed / Reset / Backups)
  const seedSampleData = async () => {
    await populateSeedData(db, true);
    await syncAllToCloud(true);
    showToast('Demo seed data loaded successfully!');
  };

  const resetAllData = async () => {
    await db.transaction('rw', [
      db.salahLogs,
      db.habits,
      db.habitLogs,
      db.workouts,
      db.books,
      db.readingLogs,
      db.goals,
      db.journalEntries,
      db.settings
    ], async () => {
      await db.salahLogs.clear();
      await db.habits.clear();
      await db.habitLogs.clear();
      await db.workouts.clear();
      await db.books.clear();
      await db.readingLogs.clear();
      await db.goals.clear();
      await db.journalEntries.clear();
      await db.settings.clear();
    });
    await syncAllToCloud(true);
    showToast('All local and cloud data cleared', 'info');
  };

  const exportDataJSON = async () => {
    const envelope = await getCurrentStateEnvelope();
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mizan-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON exported successfully');
  };

  const importDataJSON = async (jsonString) => {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      await hydrateIndexedDB(data);
      await syncAllToCloud(true);
      showToast('Data restored successfully!');
    } catch (err) {
      console.error('Failed to import JSON:', err);
      showToast('Failed to parse and import backup JSON', 'error');
    }
  };

  // Optional local server backups support (safe fallback for production)
  const createDiskBackup = async () => {
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(`Disk backup saved: ${data.filename}`, 'success');
        return data;
      }
    } catch (_) {
      // Not on local server
    }
    // Fallback: trigger browser JSON download
    await exportDataJSON();
    return null;
  };

  const fetchDiskBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const json = await res.json();
        return json.backups || [];
      }
    } catch (_) {
      // Local dev server not running
    }
    return [];
  };

  const restoreFromDiskBackup = async (filename) => {
    try {
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          await hydrateIndexedDB(json.data);
          await syncAllToCloud(true);
          showToast('Successfully restored from backup!');
          return true;
        }
      }
    } catch (err) {
      showToast('Error restoring backup: ' + err.message, 'error');
    }
    return false;
  };

  const fetchDiskStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {
      // Not connected to local Express
    }
    return {
      status: isSupabaseConfigured ? 'online' : 'offline',
      persistence: isSupabaseConfigured ? 'supabase_cloud' : 'indexeddb'
    };
  };

  // Date Navigation Helpers
  const goToPreviousDay = () => {
    setSelectedDate(prev => format(subDays(new Date(prev), 1), 'yyyy-MM-dd'));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => format(addDays(new Date(prev), 1), 'yyyy-MM-dd'));
  };

  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const value = {
    selectedDate,
    setSelectedDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    isInitialized,
    toastMessage,
    showToast,
    // Cloud & local synchronization status
    syncStatus,
    cloudSyncStatus: syncStatus,
    diskSyncStatus: syncStatus, // Alias for full backwards compatibility
    isSupabaseConfigured,
    lastSavedTime,
    syncAllToCloud,
    syncAllToDisk,
    createDiskBackup,
    fetchDiskBackups,
    restoreFromDiskBackup,
    fetchDiskStatus,
    // Live entities with guaranteed safe arrays/objects
    todaySalah: todaySalah || DEFAULT_SALAH(selectedDate),
    salahHistory: salahHistory || [],
    allHabits: allHabits || [],
    selectedDateHabitLogs: selectedDateHabitLogs || [],
    allHabitLogs: allHabitLogs || [],
    workoutsForDate: workoutsForDate || [],
    allWorkouts: allWorkouts || [],
    books: books || [],
    readingLogsForDate: readingLogsForDate || [],
    allReadingLogs: allReadingLogs || [],
    allGoals: allGoals || [],
    journalEntry: journalEntry || DEFAULT_JOURNAL(selectedDate),
    recentJournalEntries: recentJournalEntries || [],
    // Operations
    toggleSalah,
    updateSalahNotes,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabit,
    addWorkout,
    logWorkoutPreset,
    updateWorkout,
    deleteWorkout,
    addBook,
    updateBook,
    updateBookCurrentPage,
    deleteBook,
    logReadingSession,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalStatus,
    saveJournalEntry,
    deleteJournalEntry,
    seedSampleData,
    resetAllData,
    exportDataJSON,
    importDataJSON
  };

  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
