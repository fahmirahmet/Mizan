import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Feather,
  Smile,
  Meh,
  Frown,
  Sparkles,
  Heart,
  Award,
  Calendar,
  CheckCircle2,
  Loader2,
  Trash2,
  Save
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { format, parseISO } from 'date-fns';

export function JournalView() {
  const {
    selectedDate,
    journalEntry,
    recentJournalEntries,
    saveJournalEntry,
    deleteJournalEntry,
    setSelectedDate
  } = useStorage();

  const [mood, setMood] = useState('good');
  const [gratitude, setGratitude] = useState(['', '', '']);
  const [wins, setWins] = useState(['', '']);
  const [dailyFocus, setDailyFocus] = useState('');
  const [challengeOvercome, setChallengeOvercome] = useState('');
  const [content, setContent] = useState('');

  // Auto-save status indicator
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving' | 'saved'
  const isInitialMount = useRef(true);
  const debounceTimerRef = useRef(null);

  // Sync state when selected date or journal entry updates from DB
  useEffect(() => {
    if (journalEntry) {
      setMood(journalEntry.mood || 'good');
      setGratitude(
        Array.isArray(journalEntry.gratitude) && journalEntry.gratitude.length >= 3
          ? journalEntry.gratitude
          : [
              journalEntry.gratitude?.[0] || '',
              journalEntry.gratitude?.[1] || '',
              journalEntry.gratitude?.[2] || ''
            ]
      );
      setWins(
        Array.isArray(journalEntry.wins) && journalEntry.wins.length >= 2
          ? journalEntry.wins
          : [journalEntry.wins?.[0] || '', journalEntry.wins?.[1] || '']
      );
      setDailyFocus(journalEntry.promptAnswers?.dailyFocus || '');
      setChallengeOvercome(journalEntry.promptAnswers?.challengeOvercome || '');
      setContent(journalEntry.content || '');
      setSaveStatus('saved');
    }
    isInitialMount.current = true;
  }, [selectedDate, journalEntry?.id]);

  // Debounced auto-save on state change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('saving');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      await saveJournalEntry({
        date: selectedDate,
        mood,
        gratitude: gratitude.filter(g => g.trim().length > 0),
        wins: wins.filter(w => w.trim().length > 0),
        promptAnswers: { dailyFocus, challengeOvercome },
        content,
        tags: ['DailyReflection']
      }, false); // don't spam toasts on auto-save
      setSaveStatus('saved');
    }, 600);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [mood, gratitude, wins, dailyFocus, challengeOvercome, content, selectedDate]);

  const handleManualSave = async () => {
    await saveJournalEntry({
      date: selectedDate,
      mood,
      gratitude: gratitude.filter(g => g.trim().length > 0),
      wins: wins.filter(w => w.trim().length > 0),
      promptAnswers: { dailyFocus, challengeOvercome },
      content,
      tags: ['DailyReflection']
    }, true);
    setSaveStatus('saved');
  };

  const handleGratitudeChange = (index, value) => {
    const updated = [...gratitude];
    updated[index] = value;
    setGratitude(updated);
  };

  const handleWinChange = (index, value) => {
    const updated = [...wins];
    updated[index] = value;
    setWins(updated);
  };

  const moods = [
    { id: 'great', label: 'Energized / Great', emoji: '🌟', color: 'text-amber-400 bg-amber-950/40 border-amber-500/40' },
    { id: 'good', label: 'Balanced / Good', emoji: '🌿', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40' },
    { id: 'neutral', label: 'Neutral', emoji: '⚖️', color: 'text-slate-300 bg-slate-800 border-slate-700' },
    { id: 'low', label: 'Tired / Low', emoji: '🌧️', color: 'text-sky-400 bg-sky-950/40 border-sky-800/40' },
    { id: 'challenging', label: 'Tested / Challenging', emoji: '🔥', color: 'text-rose-400 bg-rose-950/40 border-rose-800/40' }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Feather className="w-6 h-6 text-rose-400" />
            Mindful Journal & Reflection
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cultivate gratitude (شكر), record daily wins, and maintain mental clarity with auto-saving notes.
          </p>
        </div>

        {/* Auto-Save Status Pill */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span className="text-amber-300">Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Auto-Saved</span>
              </>
            )}
          </div>

          <button
            onClick={handleManualSave}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <Save className="w-3.5 h-3.5" /> Save Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Journal Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mood Selector */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Today's Energy & State of Mind
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {moods.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    mood === m.id
                      ? m.color + ' ring-1'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/70'
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[11px] font-semibold">{m.label.split('/')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3 Gratitudes (Alhamdulillah) */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-slate-100">3 Things I'm Grateful For (الحمد لله)</h2>
            </div>
            <div className="space-y-2">
              {gratitude.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-500 w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    placeholder={`Gratitude #${idx + 1}...`}
                    value={item}
                    onChange={(e) => handleGratitudeChange(idx, e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/70 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Daily Wins */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100">Daily Wins & Meaningful Milestones</h2>
            </div>
            <div className="space-y-2">
              {wins.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-500 w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    placeholder={`Key victory #${idx + 1}...`}
                    value={item}
                    onChange={(e) => handleWinChange(idx, e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/70 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Freeform Writing & Prompts */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <Feather className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-100">Freeform Reflection & Stream of Consciousness</h2>
            </div>

            <textarea
              rows={8}
              placeholder="What thoughts, lessons, or epiphanies emerged today? Changes automatically auto-save as you type..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* History / Recent Reflections Sidebar (1 col) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Recent Entries
          </h2>

          <div className="space-y-3">
            {recentJournalEntries && recentJournalEntries.length > 0 ? (
              recentJournalEntries.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedDate(entry.date)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    entry.date === selectedDate
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-200">
                      {format(parseISO(entry.date), 'MMM do, yyyy')}
                    </span>
                    <span className="capitalize text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                      {entry.mood}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {entry.content || entry.gratitude?.join(', ') || 'No written reflection.'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No previous journal entries.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
