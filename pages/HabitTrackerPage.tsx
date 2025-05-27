
import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Habit, HabitLog } from '../types';
import { Button, EmptyState, Input, Modal, Select, ConfirmationModal } from '../components/Common';
import { CheckBadgeIcon, PlusIcon, TrashIcon, EditIcon, SparklesIcon, CalendarIcon, CheckCircleIcon, XCircleIcon } from '../components/Icons';
import { getHabitFocusCorrelation } from '../services/GeminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'; // Added Cell for custom bar colors


interface HabitFormState extends Omit<Habit, 'id' | 'createdAt'> {
  id?: string;
}

const initialHabitFormState: HabitFormState = {
  name: '',
  frequency: 'daily',
  trackingType: 'boolean',
  goal: undefined,
};

const habitColors = ['#0F766E', '#4F46E5', '#F59E0B', '#10B981', '#EF4444', '#EC4899'];


const HabitTrackerPage: React.FC = () => {
  const [habits, setHabits] = useLocalStorage<Habit[]>('studyflow-habits', []);
  const [habitLogs, setHabitLogs] = useLocalStorage<HabitLog[]>('studyflow-habitLogs', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentHabitForm, setCurrentHabitForm] = useState<HabitFormState>(initialHabitFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [correlationInsight, setCorrelationInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState<boolean>(false);
  
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<{id: string, name: string} | null>(null);

  const todayStr = new Date().toISOString().split('T')[0]; 

  const openModalForCreate = () => {
    setIsEditing(false);
    setCurrentHabitForm(initialHabitFormState);
    setIsModalOpen(true);
  };

  const openModalForEdit = (habit: Habit) => {
    setIsEditing(true);
    setCurrentHabitForm(habit);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentHabitForm.id) {
      setHabits(prev => prev.map(h => h.id === currentHabitForm.id ? { ...h, ...currentHabitForm, goal: currentHabitForm.trackingType === 'quantity' ? Number(currentHabitForm.goal) || undefined : undefined } : h));
    } else {
      const newHabit: Habit = {
        ...currentHabitForm,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        goal: currentHabitForm.trackingType === 'quantity' ? Number(currentHabitForm.goal) || undefined : undefined,
      };
      setHabits(prev => [...prev, newHabit]);
    }
    setIsModalOpen(false);
  };
  
  const handleDeleteHabitInitiate = (habitId: string, habitName: string) => {
    setHabitToDelete({ id: habitId, name: habitName });
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteHabit = () => {
    if (habitToDelete) {
      setHabits(prev => prev.filter(h => h.id !== habitToDelete.id));
      setHabitLogs(prev => prev.filter(log => log.habitId !== habitToDelete.id));
    }
    setIsConfirmDeleteModalOpen(false);
    setHabitToDelete(null);
  };

  const logHabit = (habitId: string, value?: boolean | number, notes?: string) => {
    const existingLogIndex = habitLogs.findIndex(log => log.habitId === habitId && log.date === todayStr);
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    let newLogEntry: Partial<HabitLog> = { notes };

    if (habit.trackingType === 'boolean') {
      newLogEntry.completed = typeof value === 'boolean' ? value : false;
    } else if (habit.trackingType === 'quantity') {
      newLogEntry.quantity = typeof value === 'number' ? (isNaN(value) ? undefined : value) : undefined;
    }
    
    if (existingLogIndex > -1) {
      setHabitLogs(prev => prev.map((log, index) => index === existingLogIndex ? { ...log, ...newLogEntry } : log));
    } else {
      setHabitLogs(prev => [...prev, { 
        id: crypto.randomUUID(), 
        habitId, 
        date: todayStr, 
        ...newLogEntry 
      } as HabitLog]);
    }
  };
  
  const getTodaysLog = (habitId: string): HabitLog | undefined => {
    return habitLogs.find(log => log.habitId === habitId && log.date === todayStr);
  };

  const calculateStreak = (habitId: string): { current: number, best: number } => {
    const relevantLogs = habitLogs
      .filter(log => log.habitId === habitId && (log.completed === true || (typeof log.quantity === 'number' && log.quantity > 0)))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (relevantLogs.length === 0) return { current: 0, best: 0 };

    let currentStreak = 0;
    let bestStreak = 0;
    let tempCurrentStreak = 0;
    
    // Calculate current streak
    // Check if today is part of the streak
    let expectedDate = new Date(todayStr);
    const todayLog = relevantLogs.find(log => log.date === expectedDate.toISOString().split('T')[0]);

    if (todayLog) {
        currentStreak = 1;
        expectedDate.setDate(expectedDate.getDate() - 1);
        for (let i = relevantLogs.indexOf(todayLog) + 1; i < relevantLogs.length; i++) {
            const log = relevantLogs[i];
            if (log.date === expectedDate.toISOString().split('T')[0]) {
                currentStreak++;
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
                break; 
            }
        }
    }
    
    // Calculate best streak
    if(relevantLogs.length > 0) {
        tempCurrentStreak = 1;
        bestStreak = 1;
        for (let i = 0; i < relevantLogs.length - 1; i++) {
            const date1 = new Date(relevantLogs[i].date);
            const date2 = new Date(relevantLogs[i+1].date);
            
            // Check if date2 is exactly one day before date1
            const expectedPrevDate = new Date(date1);
            expectedPrevDate.setDate(date1.getDate() - 1);

            if (date2.toISOString().split('T')[0] === expectedPrevDate.toISOString().split('T')[0]) {
                tempCurrentStreak++;
            } else {
                bestStreak = Math.max(bestStreak, tempCurrentStreak);
                tempCurrentStreak = 1; // Reset for a new potential streak
            }
        }
        bestStreak = Math.max(bestStreak, tempCurrentStreak);
    }


    return { current: currentStreak, best: bestStreak };
  };

  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      const entry: { name: string, [key: string]: number | string } = { name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
      habits.forEach(habit => {
        const log = habitLogs.find(l => l.habitId === habit.id && l.date === date);
        if (habit.trackingType === 'boolean') {
          entry[habit.name] = log?.completed ? 1 : 0;
        } else if (habit.trackingType === 'quantity') {
          entry[habit.name] = log?.quantity || 0;
        }
      });
      return entry;
    });
  }, [habits, habitLogs]);
  
  const fetchCorrelationInsight = async () => {
    setIsLoadingInsight(true);
    try {
        const insight = await getHabitFocusCorrelation(habitLogs);
        setCorrelationInsight(insight);
    } catch (error) {
        console.error("Failed to fetch habit insight", error);
        setCorrelationInsight("Could not load insights at this time.");
    } finally {
        setIsLoadingInsight(false);
    }
  };

  useEffect(() => {
    if (habits.length > 0 && habitLogs.length > 5) { 
        fetchCorrelationInsight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, habitLogs]); // Re-fetch if data changes significantly


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Habit Tracker</h2>
        <Button onClick={openModalForCreate} variant="primary">
          <PlusIcon className="w-4 h-4 mr-2" /> Add New Habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <EmptyState 
          title="No Habits Defined" 
          message="Start building healthy habits by defining your first one!" 
          icon={<CheckBadgeIcon className="w-16 h-16 text-slate-400 dark:text-slate-500" />}
          action={<Button onClick={openModalForCreate} variant="primary"><PlusIcon className="w-4 h-4 mr-2" /> Add Habit</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map(habit => {
              const todaysLog = getTodaysLog(habit.id);
              const streak = calculateStreak(habit.id);
              return (
                <div key={habit.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm dark:shadow-slate-700">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{habit.name}</h3>
                    <div className="flex space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => openModalForEdit(habit)} aria-label="Edit habit"><EditIcon className="w-4 h-4"/></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteHabitInitiate(habit.id, habit.name)} aria-label="Delete habit"><TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400"/></Button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{habit.frequency} &bull; {habit.trackingType === 'boolean' ? 'Yes/No' : `Quantity (Goal: ${habit.goal || 'any'})`}</p>
                  
                  <div className="mt-3 space-y-2">
                    {habit.trackingType === 'boolean' && (
                      <Button 
                        onClick={() => logHabit(habit.id, !todaysLog?.completed)}
                        variant={todaysLog?.completed ? 'success' : 'ghost'}
                        className="w-full"
                      >
                        {todaysLog?.completed ? <CheckCircleIcon className="w-5 h-5 mr-2"/> : <XCircleIcon className="w-5 h-5 mr-2"/>}
                        {todaysLog?.completed ? 'Completed Today' : 'Mark as Done'}
                      </Button>
                    )}
                    {habit.trackingType === 'quantity' && (
                      <div className="flex items-center space-x-2">
                        <Input 
                          type="number"
                          id={`quantity-input-${habit.id}`}
                          min="0"
                          step={habit.goal && habit.goal < 5 ? "0.1" : "1"}
                          value={todaysLog?.quantity === undefined ? '' : todaysLog.quantity}
                          onChange={(e) => {
                             const val = parseFloat(e.target.value);
                             logHabit(habit.id, isNaN(val) ? undefined : val);
                          }}
                          placeholder={`Current: ${todaysLog?.quantity === undefined ? '-' : todaysLog.quantity}`}
                          className="flex-grow"
                          aria-label={`Log quantity for ${habit.name}`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                    <p>Current Streak: <span className="font-semibold">{streak.current} day(s)</span></p>
                    <p>Best Streak: <span className="font-semibold">{streak.best} day(s)</span></p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md dark:shadow-slate-700">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 flex items-center">
                    <CalendarIcon className="w-6 h-6 mr-2 text-primary"/>Habit Completion (Last 30 Days)
                </h3>
             </div>
            {chartData.length > 0 && habits.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: 'currentColor'}} className="text-slate-600 dark:text-slate-400" />
                  <YAxis allowDecimals={false} tick={{fontSize: 10, fill: 'currentColor'}} className="text-slate-600 dark:text-slate-400" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', darkBackgroundColor: 'rgba(50,50,50,0.9)', borderRadius: '0.5rem', borderColor: '#cbd5e1', darkBorderColor: '#4b5563' }} 
                    itemStyle={{ color: '#334155', darkColor: '#e2e8f0' }}
                    labelStyle={{ color: '#0F766E', fontWeight: 'bold' }}
                    />
                  <Legend wrapperStyle={{fontSize: "12px", color: 'currentColor'}} className="text-slate-700 dark:text-slate-200" />
                  {habits.slice(0, 6).map((habit, index) => ( 
                    <Bar key={habit.id} dataKey={habit.name} fill={habitColors[index % habitColors.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Not enough data for chart. Keep tracking your habits!</p>
            )}
          </div>
          
          <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md dark:shadow-slate-700">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center">
              <SparklesIcon className="w-6 h-6 mr-2 text-primary" /> Habit Insights
            </h3>
            {isLoadingInsight ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading insights...</p>
            ) : correlationInsight ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{correlationInsight}</p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No insights available right now. Keep tracking for a week or more!</p>
            )}
            <Button size="sm" variant="ghost" onClick={fetchCorrelationInsight} className="mt-3 text-xs" disabled={isLoadingInsight}>
                {isLoadingInsight ? 'Refreshing...' : 'Refresh Insights'}
            </Button>
          </div>

        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Habit' : 'Add New Habit'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Habit Name"
            value={currentHabitForm.name}
            onChange={(e) => setCurrentHabitForm({ ...currentHabitForm, name: e.target.value })}
            required
          />
          <Select
            label="Frequency"
            value={currentHabitForm.frequency}
            onChange={(e) => setCurrentHabitForm({ ...currentHabitForm, frequency: e.target.value as 'daily' | 'weekly' })}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </Select>
          <Select
            label="Tracking Type"
            value={currentHabitForm.trackingType}
            onChange={(e) => {
              const newType = e.target.value as 'boolean' | 'quantity';
              setCurrentHabitForm({ ...currentHabitForm, trackingType: newType, goal: newType === 'boolean' ? undefined : currentHabitForm.goal });
            }}
          >
            <option value="boolean">Yes/No (Completed or not)</option>
            <option value="quantity">Quantity (e.g., hours, pages)</option>
          </Select>
          {currentHabitForm.trackingType === 'quantity' && (
            <Input
              label="Goal (Optional)"
              type="number"
              min="0"
              value={currentHabitForm.goal === undefined ? '' : currentHabitForm.goal}
              onChange={(e) => setCurrentHabitForm({ ...currentHabitForm, goal: parseFloat(e.target.value) || undefined })}
              placeholder="e.g., 8 (hours sleep), 30 (pages read)"
            />
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{isEditing ? 'Save Changes' : 'Add Habit'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        onConfirm={confirmDeleteHabit}
        title="Delete Habit"
        message={<p>Are you sure you want to delete the habit "<strong>{habitToDelete?.name}</strong>" and all its associated logs? This action cannot be undone.</p>}
      />
    </div>
  );
};

export default HabitTrackerPage;
