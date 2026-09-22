import { format, subDays } from 'date-fns';

export async function populateSeedData(db, forceReset = false) {
  // Check if data already exists in database when not forcing reset
  if (!forceReset) {
    const goalsCount = await db.goals.count().catch(() => 0);
    const booksCount = await db.books.count().catch(() => 0);
    const salahCount = await db.salahLogs.count().catch(() => 0);
    const habitsCount = await db.habits.count().catch(() => 0);

    if (goalsCount > 0 || booksCount > 0 || salahCount > 0 || habitsCount > 0) {
      console.log('Database already contains records. Skipping seed data insertion.');
      return { success: true, count: 0, skipped: true };
    }
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const dMinus1 = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const dMinus2 = format(subDays(new Date(), 2), 'yyyy-MM-dd');
  const dMinus3 = format(subDays(new Date(), 3), 'yyyy-MM-dd');
  const dMinus4 = format(subDays(new Date(), 4), 'yyyy-MM-dd');
  const dMinus5 = format(subDays(new Date(), 5), 'yyyy-MM-dd');
  const dMinus6 = format(subDays(new Date(), 6), 'yyyy-MM-dd');

  // 1. Salah Logs (Past 7 days)
  const salahSeed = [
    {
      date: today,
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: false,
      isha: false,
      tahajjud: true,
      duha: true,
      rawatib: true,
      notes: 'Prayed Fajr in congregation; great focus during Dhuhr.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      date: dMinus1,
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      tahajjud: false,
      duha: true,
      rawatib: true,
      notes: 'Completed all 5 on time with Rawatib sunnahs.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      date: dMinus2,
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      tahajjud: true,
      duha: false,
      rawatib: true,
      notes: '',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      date: dMinus3,
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      tahajjud: false,
      duha: true,
      rawatib: false,
      notes: '',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 259200000).toISOString()
    },
    {
      date: dMinus4,
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      tahajjud: true,
      duha: true,
      rawatib: true,
      notes: '',
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      updatedAt: new Date(Date.now() - 345600000).toISOString()
    },
    {
      date: dMinus5,
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      tahajjud: false,
      duha: false,
      rawatib: true,
      notes: '',
      createdAt: new Date(Date.now() - 432000000).toISOString(),
      updatedAt: new Date(Date.now() - 432000000).toISOString()
    },
    {
      date: dMinus6,
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      tahajjud: true,
      duha: true,
      rawatib: true,
      notes: 'Friday blessed day, recited Surah Al-Kahf.',
      createdAt: new Date(Date.now() - 518400000).toISOString(),
      updatedAt: new Date(Date.now() - 518400000).toISOString()
    }
  ];

  // 2. Habits
  const habitSeed = [
    {
      id: 1,
      title: 'Morning Adhkar & Quran',
      description: 'Recite morning supplications and at least 1 rub` of Quran',
      category: 'spiritual',
      frequency: 'daily',
      targetDaysPerWeek: 7,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      title: '3 Liters of Water',
      description: 'Stay hydrated with electrolyte-rich water',
      category: 'health',
      frequency: 'daily',
      targetDaysPerWeek: 7,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      title: 'Deep Work (2+ Hours)',
      description: 'Uninterrupted flow state session with zero notifications',
      category: 'intellect',
      frequency: 'daily',
      targetDaysPerWeek: 6,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 4,
      title: 'Calisthenics or Cardio',
      description: 'Minimum 30 minutes physical exertion',
      category: 'health',
      frequency: 'daily',
      targetDaysPerWeek: 5,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 5,
      title: 'Night Reflection & Witr',
      description: 'Accountability check before sleep',
      category: 'spiritual',
      frequency: 'daily',
      targetDaysPerWeek: 7,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Habit Logs
  const habitLogsSeed = [
    { habitId: 1, date: today, completed: true, value: 1, notes: 'Surah Yasin read', createdAt: new Date().toISOString() },
    { habitId: 2, date: today, completed: true, value: 3, notes: '3.2L drank', createdAt: new Date().toISOString() },
    { habitId: 3, date: today, completed: true, value: 1, notes: 'Built Mizan Storage Context', createdAt: new Date().toISOString() },
    { habitId: 4, date: today, completed: false, value: 0, notes: '', createdAt: new Date().toISOString() },
    { habitId: 5, date: today, completed: false, value: 0, notes: '', createdAt: new Date().toISOString() },
    
    { habitId: 1, date: dMinus1, completed: true, value: 1, notes: '', createdAt: new Date().toISOString() },
    { habitId: 2, date: dMinus1, completed: true, value: 1, notes: '', createdAt: new Date().toISOString() },
    { habitId: 3, date: dMinus1, completed: true, value: 1, notes: '', createdAt: new Date().toISOString() },
    { habitId: 4, date: dMinus1, completed: true, value: 1, notes: '', createdAt: new Date().toISOString() },
    { habitId: 5, date: dMinus1, completed: true, value: 1, notes: '', createdAt: new Date().toISOString() }
  ];

  // 3. Workouts
  const workoutsSeed = [
    {
      date: today,
      exerciseName: 'Diamond Push-ups & Pull-ups',
      category: 'Strength',
      sets: [
        { setNumber: 1, reps: 20, weightKg: 0, rpe: 7 },
        { setNumber: 2, reps: 18, weightKg: 0, rpe: 8 },
        { setNumber: 3, reps: 15, weightKg: 0, rpe: 8.5 },
        { setNumber: 4, reps: 12, weightKg: 0, rpe: 9 }
      ],
      distanceKm: null,
      durationMinutes: 35,
      notes: 'Focused on explosive concentric tempo and solid mind-muscle connection.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      date: dMinus1,
      exerciseName: '5K Morning Tempo Run',
      category: 'Cardio',
      sets: [],
      distanceKm: 5.2,
      durationMinutes: 26,
      notes: 'Pace: 5:00 min/km. Felt smooth throughout, heart rate stayed in Zone 3.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      date: dMinus3,
      exerciseName: 'Kettlebell Complex (Swings & Cleans)',
      category: 'Strength',
      sets: [
        { setNumber: 1, reps: 15, weightKg: 24, rpe: 7 },
        { setNumber: 2, reps: 15, weightKg: 24, rpe: 7.5 },
        { setNumber: 3, reps: 15, weightKg: 24, rpe: 8 },
        { setNumber: 4, reps: 15, weightKg: 24, rpe: 8.5 }
      ],
      distanceKm: null,
      durationMinutes: 30,
      notes: '24kg kettlebell. Excellent posterior chain drive.',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 259200000).toISOString()
    }
  ];

  // 4. Books & Reading Logs
  const booksSeed = [
    {
      id: 1,
      title: 'Atomic Habits',
      author: 'James Clear',
      totalPages: 320,
      currentPage: 215,
      category: 'Self-Improvement',
      coverUrl: '',
      status: 'reading',
      startedDate: dMinus6,
      finishedDate: null,
      rating: 5,
      notes: 'Identity-based habits and systems over goals.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      title: 'The Sealed Nectar (Ar-Raheeq Al-Makhtum)',
      author: 'Safiur Rahman Mubarakpuri',
      totalPages: 588,
      currentPage: 340,
      category: 'Spiritual / Seerah',
      coverUrl: '',
      status: 'reading',
      startedDate: dMinus6,
      finishedDate: null,
      rating: 5,
      notes: 'Profound historical narrative of the life of the Prophet ﷺ.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 3,
      title: 'Deep Work: Rules for Focused Success',
      author: 'Cal Newport',
      totalPages: 304,
      currentPage: 304,
      category: 'Productivity',
      coverUrl: '',
      status: 'finished',
      startedDate: dMinus6,
      finishedDate: dMinus1,
      rating: 5,
      notes: 'Mastering the skill of deep cognitive focus.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const readingLogsSeed = [
    {
      bookId: 1,
      date: today,
      startPage: 190,
      endPage: 215,
      pagesRead: 25,
      durationMinutes: 30,
      notes: 'Read chapter on habit stacking and environmental cues.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      bookId: 2,
      date: today,
      startPage: 320,
      endPage: 340,
      pagesRead: 20,
      durationMinutes: 25,
      notes: 'Treaty of Hudaybiyyah insights and political wisdom.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      bookId: 1,
      date: dMinus1,
      startPage: 165,
      endPage: 190,
      pagesRead: 25,
      durationMinutes: 30,
      notes: 'The law of least effort and friction reduction.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  // 5. Planning Hierarchy (5 Tiers: Yearly -> Semester -> Monthly -> Weekly -> Daily)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const goalsSeed = [
    // Tier 1: Yearly Goal
    {
      id: 1,
      title: `${currentYear} Mastery & Spiritual Balance`,
      description: 'Architect top-tier software systems while upholding spiritual, physical, and intellectual excellence.',
      level: 'yearly',
      parentId: null,
      year: currentYear,
      semester: null,
      month: null,
      weekNumber: null,
      targetDate: `${currentYear}-12-31`,
      status: 'in_progress',
      progress: 65,
      priority: 'high',
      tags: ['LifeOS', 'Mastery', 'Discipline'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // Tier 2: Semester Goal
    {
      id: 2,
      title: 'H2: Ship 3 High-Impact Web Apps & Memorize Key Surahs',
      description: 'Focus on full-stack architecture, offline-first systems, and memorization of Surah Al-Mulk & As-Sajdah.',
      level: 'semester',
      parentId: 1,
      year: currentYear,
      semester: 2,
      month: null,
      weekNumber: null,
      targetDate: `${currentYear}-12-31`,
      status: 'in_progress',
      progress: 50,
      priority: 'high',
      tags: ['Engineering', 'Quran'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // Tier 3: Monthly Goal
    {
      id: 3,
      title: 'Launch Mizan Life OS & Complete Strength Hypertrophy Block',
      description: 'Ship Mizan with reactive IndexedDB, complete 15 quality workouts, and read 2 books.',
      level: 'monthly',
      parentId: 2,
      year: currentYear,
      semester: 2,
      month: currentMonth,
      weekNumber: null,
      targetDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-30`,
      status: 'in_progress',
      progress: 60,
      priority: 'high',
      tags: ['Mizan', 'Fitness'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // Tier 4: Weekly Target
    {
      id: 4,
      title: 'Week 37: Implement Dexie Storage, Complete Shell, & Test CRUD',
      description: 'Finalize client-side models, seed sample records, and build intuitive sidebar navigation.',
      level: 'weekly',
      parentId: 3,
      year: currentYear,
      semester: 2,
      month: currentMonth,
      weekNumber: 37,
      targetDate: today,
      status: 'in_progress',
      progress: 75,
      priority: 'high',
      tags: ['Sprint', 'CoreDev'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // Tier 5: Daily Tasks (To-Do List items)
    {
      id: 5,
      title: 'Design and test Dexie IndexedDB schemas for all 5 domains',
      description: 'Salah, habits, workouts, reading, planning hierarchy, and journal.',
      level: 'daily',
      parentId: 4,
      year: currentYear,
      semester: 2,
      month: currentMonth,
      weekNumber: 37,
      targetDate: today,
      status: 'completed',
      progress: 100,
      priority: 'high',
      tags: ['Database', 'Architecture'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 6,
      title: 'Build StorageContext with reactive hooks & seed helper',
      description: 'Provide synchronous and reactive state management with live queries.',
      level: 'daily',
      parentId: 4,
      year: currentYear,
      semester: 2,
      month: currentMonth,
      weekNumber: 37,
      targetDate: today,
      status: 'in_progress',
      progress: 50,
      priority: 'high',
      tags: ['React', 'Context'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 7,
      title: 'Construct high-aesthetic Dark UI Shell with Sidebar Navigation',
      description: 'Slate-900 palette, warm charcoal cards, emerald accents, and responsive layout.',
      level: 'daily',
      parentId: 4,
      year: currentYear,
      semester: 2,
      month: currentMonth,
      weekNumber: 37,
      targetDate: today,
      status: 'pending',
      progress: 0,
      priority: 'medium',
      tags: ['UI', 'Tailwind'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // 6. Daily Journal
  const journalSeed = [
    {
      date: today,
      mood: 'great',
      gratitude: [
        'Waking up early with clarity and health',
        'Opportunity to build meaningful tools that cultivate balance (Mizan)',
        'Peaceful environment for deep engineering focus'
      ],
      wins: [
        'Wrote clean IndexedDB schema in Dexie',
        'Maintained all 5 daily prayers on time'
      ],
      promptAnswers: {
        dailyFocus: 'Architect the foundation of Mizan with zero compromises on quality and aesthetics.',
        challengeOvercome: 'Structured complex 5-tier hierarchical relationships cleanly for easy client querying.'
      },
      content: 'Today marked a powerful shift into purposeful execution. The concept of Mizan (balance) is not about perfection in every second, but about consistent calibration of body, intellect, spirit, and action.\n\nEverything built today is designed to last and run offline without latency.',
      tags: ['Clarity', 'Execution', 'Spiritual'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      date: dMinus1,
      mood: 'good',
      gratitude: [
        'Completed 5K run in the cool morning air',
        'Insightful takeaways from "The Sealed Nectar"',
        'Good quality family time'
      ],
      wins: [
        'Finished reading Deep Work by Cal Newport',
        'Hit all daily hydration targets'
      ],
      promptAnswers: {
        dailyFocus: 'Focus on stamina and deep concentration blocks.',
        challengeOvercome: 'Resisted digital distractions during afternoon slump.'
      },
      content: 'Reflected on how crucial environment design is for sustaining high output. Deep work is a muscle that must be trained daily.',
      tags: ['Reflection', 'Habits'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  // Clear existing only if forceReset is true, then seed in transaction
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
    if (forceReset) {
      await db.salahLogs.clear();
      await db.habits.clear();
      await db.habitLogs.clear();
      await db.workouts.clear();
      await db.books.clear();
      await db.readingLogs.clear();
      await db.goals.clear();
      await db.journalEntries.clear();
    }

    await db.salahLogs.bulkAdd(salahSeed);
    await db.habits.bulkAdd(habitSeed);
    await db.habitLogs.bulkAdd(habitLogsSeed);
    await db.workouts.bulkAdd(workoutsSeed);
    await db.books.bulkAdd(booksSeed);
    await db.readingLogs.bulkAdd(readingLogsSeed);
    await db.goals.bulkAdd(goalsSeed);
    await db.journalEntries.bulkAdd(journalSeed);

    await db.settings.put({
      key: 'app_initialized',
      value: true,
      updatedAt: new Date().toISOString()
    });
    await db.settings.put({
      key: 'theme',
      value: 'dark',
      updatedAt: new Date().toISOString()
    });
  });

  try {
    localStorage.setItem('mizan_initialized', 'true');
  } catch (e) {
    // ignore
  }

  return { success: true, count: salahSeed.length + habitSeed.length + workoutsSeed.length + booksSeed.length + goalsSeed.length + journalSeed.length };
}
