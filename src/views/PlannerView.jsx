import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ChevronRight,
  Calendar,
  CheckSquare,
  ArrowRight,
  Edit2,
  Check,
  X,
  Sparkles,
  Tag
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { CrossCheckWidget } from '../components/planner/CrossCheckWidget';

export function PlannerView() {
  const {
    allGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalStatus,
    selectedDate
  } = useStorage();

  const [activeSection, setActiveSection] = useState('todo'); // 'todo' | 'hierarchy'
  const [todoFilter, setTodoFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [activeTierFilter, setActiveTierFilter] = useState('all');
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [isAddingMacroGoal, setIsAddingMacroGoal] = useState(false);

  // Quick Daily To-Do Input State
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState('medium');
  const [quickTaskParentId, setQuickTaskParentId] = useState('');

  // Editing Task Inline State
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');

  // Macro Goal Form State
  const [macroTitle, setMacroTitle] = useState('');
  const [macroDescription, setMacroDescription] = useState('');
  const [macroLevel, setMacroLevel] = useState('weekly');
  const [macroParentId, setMacroParentId] = useState('');
  const [macroPriority, setMacroPriority] = useState('medium');
  const [macroTargetDate, setMacroTargetDate] = useState(selectedDate);

  // Filter lists
  const dailyTasks = allGoals ? allGoals.filter(g => g.level === 'daily') : [];
  const weeklyTargets = allGoals ? allGoals.filter(g => g.level === 'weekly') : [];

  const filteredDailyTasks = dailyTasks.filter(t => {
    if (todoFilter === 'pending') return t.status !== 'completed';
    if (todoFilter === 'completed') return t.status === 'completed';
    return true;
  });

  const filteredMacroGoals = allGoals ? allGoals.filter(goal => {
    if (goal.level === 'daily') return false; // Handled in To-Do view
    if (activeTierFilter !== 'all' && goal.level !== activeTierFilter) return false;
    if (selectedParentId !== null && goal.parentId !== selectedParentId) return false;
    return true;
  }) : [];

  // Quick Add To-Do Handler
  const handleQuickAddTodo = async (e) => {
    if (e) e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    await addGoal({
      title: quickTaskTitle.trim(),
      level: 'daily',
      parentId: quickTaskParentId ? parseInt(quickTaskParentId, 10) : null,
      priority: quickTaskPriority,
      targetDate: selectedDate,
      status: 'pending',
      progress: 0
    });

    setQuickTaskTitle('');
  };

  // Macro Goal Submit Handler
  const handleCreateMacroGoal = async (e) => {
    e.preventDefault();
    if (!macroTitle.trim()) return;

    await addGoal({
      title: macroTitle.trim(),
      description: macroDescription.trim(),
      level: macroLevel,
      parentId: macroParentId ? parseInt(macroParentId, 10) : null,
      priority: macroPriority,
      targetDate: macroTargetDate || selectedDate,
      status: 'pending',
      progress: 0
    });

    setMacroTitle('');
    setMacroDescription('');
    setIsAddingMacroGoal(false);
  };

  // Inline Edit Task Handler
  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
  };

  const handleSaveEdit = async (taskId) => {
    if (!editTaskTitle.trim()) return;
    await updateGoal(taskId, { title: editTaskTitle.trim() });
    setEditingTaskId(null);
  };

  // Cycle task priority on click
  const handleCyclePriority = async (task) => {
    const order = ['low', 'medium', 'high'];
    const currentIdx = order.indexOf(task.priority || 'medium');
    const nextPriority = order[(currentIdx + 1) % order.length];
    await updateGoal(task.id, { priority: nextPriority });
  };

  const getTierBadgeColor = (level) => {
    switch (level) {
      case 'yearly': return 'bg-amber-950/60 border-amber-800/40 text-amber-300';
      case 'semester': return 'bg-purple-950/60 border-purple-800/40 text-purple-300';
      case 'monthly': return 'bg-sky-950/60 border-sky-800/40 text-sky-300';
      case 'weekly': return 'bg-indigo-950/60 border-indigo-800/40 text-indigo-300';
      default: return 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-950/60 border-rose-800/50 text-rose-300';
      case 'low': return 'bg-slate-800/60 border-slate-700/50 text-slate-400';
      default: return 'bg-amber-950/60 border-amber-800/50 text-amber-300';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            Daily Tasks & Life Planning
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fast interactive daily to-do checklist connected with your 5-tier life architecture.
          </p>
        </div>

        {/* Section Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => setActiveSection('todo')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'todo'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Daily To-Do List ({dailyTasks.filter(t => t.status !== 'completed').length})
          </button>
          <button
            onClick={() => setActiveSection('hierarchy')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'hierarchy'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Macro Goals Tree
          </button>
        </div>
      </div>

      {/* SECTION 1: Clean Daily To-Do Checklist */}
      {activeSection === 'todo' && (
        <div className="space-y-6">
          {/* Fast Single-Line Quick Add Input */}
          <form
            onSubmit={handleQuickAddTodo}
            className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="What needs to get done today? (Type and press Enter...)"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-medium"
              />
              <button
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 whitespace-nowrap"
              >
                + Add Task
              </button>
            </div>

            {/* Optional Context Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 px-1 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-slate-400 text-[11px] font-semibold">Priority:</span>
                {['low', 'medium', 'high'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuickTaskPriority(p)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                      quickTaskPriority === p
                        ? p === 'high' ? 'bg-rose-500 text-white' : p === 'medium' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {weeklyTargets.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-slate-400 text-[11px]">Link Weekly Sprint:</span>
                    <select
                      value={quickTaskParentId}
                      onChange={(e) => setQuickTaskParentId(e.target.value)}
                      className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-400 max-w-[180px] truncate"
                    >
                      <option value="">-- Standalone --</option>
                      {weeklyTargets.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-slate-500">
                {dailyTasks.filter(t => t.status === 'completed').length} / {dailyTasks.length} tasks finished
              </span>
            </div>
          </form>

          {/* Filter Pills */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: `All (${dailyTasks.length})` },
                { id: 'pending', label: `Pending (${dailyTasks.filter(t => t.status !== 'completed').length})` },
                { id: 'completed', label: `Completed (${dailyTasks.filter(t => t.status === 'completed').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTodoFilter(f.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    todoFilter === f.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist Container */}
          <div className="space-y-2.5">
            {filteredDailyTasks.length > 0 ? (
              filteredDailyTasks.map(task => {
                const isCompleted = task.status === 'completed';
                const isEditing = editingTaskId === task.id;
                const parentTarget = allGoals?.find(g => g.id === task.parentId);

                if (isEditing) {
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-slate-900 border border-emerald-500/60 flex items-center gap-2 shadow-md"
                    >
                      <input
                        type="text"
                        value={editTaskTitle}
                        onChange={(e) => setEditTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(task.id);
                          if (e.key === 'Escape') setEditingTaskId(null);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(task.id)}
                        className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingTaskId(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 group ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    {/* Checkbox & Task Title */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => toggleGoalStatus(task.id, task.status)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-500 group-hover:text-slate-300" />
                        )}
                      </button>

                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span
                          onDoubleClick={() => handleStartEdit(task)}
                          className={`text-xs sm:text-sm font-medium ${
                            isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Linked Parent Weekly Target tag */}
                        {parentTarget && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 font-semibold flex items-center gap-1">
                            🎯 {parentTarget.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right-side Priority & Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Interactive Priority Badge (Click to cycle) */}
                      <button
                        onClick={() => handleCyclePriority(task)}
                        title="Click to change priority"
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase transition-transform active:scale-95 ${getPriorityBadge(task.priority)}`}
                      >
                        {task.priority || 'medium'}
                      </button>

                      <button
                        onClick={() => handleStartEdit(task)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-slate-200 transition-opacity"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => deleteGoal(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center">
                <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">All tasks completed or none added.</p>
                <p className="text-xs text-slate-500 mt-1">Use the input above to quickly log your next priority.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: Macro Goals Hierarchy (Tiers 1-4) */}
      {activeSection === 'hierarchy' && (
        <div className="space-y-6">
          {/* Cross-Check Alignment Widget */}
          <CrossCheckWidget compact={false} />

          {/* Tier Tabs & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Macro Tiers' },
                { id: 'yearly', label: '1. Yearly Goals' },
                { id: 'semester', label: '2. Semester Goals' },
                { id: 'monthly', label: '3. Monthly Goals' },
                { id: 'weekly', label: '4. Weekly Targets' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTierFilter(t.id);
                    setSelectedParentId(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTierFilter === t.id && selectedParentId === null
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsAddingMacroGoal(prev => !prev)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 self-start shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingMacroGoal ? 'Cancel' : 'New Strategic Goal'}
            </button>
          </div>

          {/* Parent Drilldown Notice */}
          {selectedParentId !== null && (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs">
              <span className="text-slate-200">
                Drill-down: Sub-goals of{' '}
                <strong className="text-emerald-400">
                  "{allGoals.find(g => g.id === selectedParentId)?.title || 'Goal'}"
                </strong>
              </span>
              <button
                onClick={() => setSelectedParentId(null)}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
              >
                Show All Goals
              </button>
            </div>
          )}

          {/* Add Strategic Goal Form */}
          {isAddingMacroGoal && (
            <form onSubmit={handleCreateMacroGoal} className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                Create Strategic Goal / Milestone
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master System Architecture, Ship Mizan v2"
                    value={macroTitle}
                    onChange={(e) => setMacroTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Hierarchy Level</label>
                  <select
                    value={macroLevel}
                    onChange={(e) => setMacroLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="weekly">Tier 4: Weekly Target (7-day sprint)</option>
                    <option value="monthly">Tier 3: Monthly Goal (30-day milestone)</option>
                    <option value="semester">Tier 2: Semester Goal (H1 / H2 block)</option>
                    <option value="yearly">Tier 1: Yearly Goal (Life pillar)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Link Parent Milestone</label>
                  <select
                    value={macroParentId}
                    onChange={(e) => setMacroParentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="">-- Standalone / Root Goal --</option>
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
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={macroPriority}
                    onChange={(e) => setMacroPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={macroTargetDate}
                    onChange={(e) => setMacroTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Key milestones, deliverables, success metrics..."
                  value={macroDescription}
                  onChange={(e) => setMacroDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMacroGoal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  Save Strategic Goal
                </button>
              </div>
            </form>
          )}

          {/* Macro Goals List Cards */}
          <div className="space-y-3">
            {filteredMacroGoals.length > 0 ? (
              filteredMacroGoals.map(goal => {
                const isCompleted = goal.status === 'completed';
                const childGoals = allGoals?.filter(g => g.parentId === goal.id) || [];
                const childCount = childGoals.length;

                return (
                  <div
                    key={goal.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={() => toggleGoalStatus(goal.id, goal.status)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500 shrink-0" />
                          )}
                        </button>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getTierBadgeColor(goal.level)}`}>
                              {goal.level}
                            </span>

                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                              goal.priority === 'high' ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {goal.priority}
                            </span>

                            {goal.targetDate && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {goal.targetDate}
                              </span>
                            )}
                          </div>

                          <h3 className={`text-sm sm:text-base font-bold mt-1.5 ${isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {goal.title}
                          </h3>

                          {goal.description && (
                            <p className="text-xs text-slate-400 mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {childCount > 0 && (
                          <button
                            onClick={() => setSelectedParentId(goal.id)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 border border-slate-700"
                          >
                            <span>{childCount} sub-tasks</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar with Auto-Cascade */}
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-3">
                      <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-emerald-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${goal.progress || (isCompleted ? 100 : 0)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {goal.progress || (isCompleted ? 100 : 0)}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center">
                <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-400">No macro goals in this filter.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
