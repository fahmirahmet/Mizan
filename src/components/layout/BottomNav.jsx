import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Dumbbell,
  Layers,
  Calendar,
  BarChart3,
  Sliders,
  Plus
} from 'lucide-react';

export function BottomNav({ activeTab, setActiveTab, onOpenQuickAdd }) {
  const items = [
    { id: 'dashboard', label: 'Today', icon: LayoutDashboard },
    { id: 'salah-habits', label: 'Salah', icon: Sparkles },
    { id: 'planner', label: 'Planner', icon: Layers },
    { id: 'history', label: 'History', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-2 py-2 flex items-center justify-around shadow-2xl safe-area-pb">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              isActive
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* Quick Add Floating Button on Mobile */}
      <button
        onClick={onOpenQuickAdd}
        className="flex flex-col items-center justify-center w-10 h-10 -mt-5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
        title="Quick Log"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
