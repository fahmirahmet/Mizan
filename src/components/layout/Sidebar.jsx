import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Dumbbell,
  BookOpen,
  Layers,
  Feather,
  Calendar,
  TrendingUp,
  Sliders,
  PlusCircle,
  Scale,
  CheckCircle2,
  Download,
  Smartphone
} from 'lucide-react';
import { useStorage } from '../../context/StorageContext';
import { usePWA } from '../../hooks/usePWA';

export function Sidebar({ activeTab, setActiveTab, onOpenQuickAdd, isMobileOpen, setIsMobileOpen }) {
  const { todaySalah, allHabits, selectedDateHabitLogs, showToast } = useStorage();
  const { canInstall, isStandalone, promptInstall } = usePWA();
  const [installing, setInstalling] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'salah-habits', label: 'Salah & Habits', icon: Sparkles, badge: 'Daily' },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell, badge: null },
    { id: 'reading', label: 'Reading & Books', icon: BookOpen, badge: null },
    { id: 'planner', label: 'Life Planner', icon: Layers, badge: '5-Tier' },
    { id: 'journal', label: 'Daily Journal', icon: Feather, badge: null },
    { id: 'history', label: 'History Calendar', icon: Calendar, badge: null },
    { id: 'analytics', label: 'Visual Analytics', icon: TrendingUp, badge: 'Insights' },
    { id: 'settings', label: 'Data & Settings', icon: Sliders, badge: null }
  ];

  // Calculate today's prayer completion
  const prayerCount = todaySalah
    ? [todaySalah.fajr, todaySalah.dhuhr, todaySalah.asr, todaySalah.maghrib, todaySalah.isha].filter(Boolean).length
    : 0;

  // Calculate today's habit completion
  const completedHabitsCount = selectedDateHabitLogs
    ? selectedDateHabitLogs.filter(l => l.completed).length
    : 0;
  const totalHabitsCount = allHabits ? allHabits.length : 0;

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const handleInstall = async () => {
    setInstalling(true);
    const success = await promptInstall();
    setInstalling(false);
    if (success && showToast) {
      showToast('Mizan installed successfully!', 'success');
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-glow-sm shadow-emerald-500/20 text-white font-bold">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg tracking-tight text-white font-sans">Mizan</h1>
              <span className="text-xs font-arabic text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50">
                ميزان
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Personal Life OS</p>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onOpenQuickAdd}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-semibold text-sm transition-all shadow-md shadow-emerald-500/20 group"
        >
          <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          <span>Quick Log</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Life Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Optional Install Prompt in Sidebar */}
      {canInstall && !isStandalone && (
        <div className="px-3 mb-2">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 hover:from-emerald-900 hover:to-teal-900 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs font-semibold transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
              <span>Install Mizan App</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              PWA
            </span>
          </button>
        </div>
      )}

      {/* Daily Snapshot Mini Widget */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Daily Focus</span>
          <span className="text-emerald-400 font-semibold">{prayerCount}/5 Prayers</span>
        </div>
        <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${(prayerCount / 5) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/40">
          <span className="text-slate-400 font-medium">Habits</span>
          <span className="text-teal-400 font-semibold">
            {completedHabitsCount}/{totalHabitsCount} done
          </span>
        </div>
      </div>

      {/* System Status */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Local-First PWA</span>
        </div>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
}
