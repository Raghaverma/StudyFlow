
import React, { useEffect, useState } from 'react';
import { useStudyApp } from '../contexts/StudyAppContext';
import { Task, TaskStatus } from '../types';
import { Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../constants';
import { Button, EmptyState } from '../components/Common';
import { CalendarIcon, CheckCircleIcon, ClipboardListIcon, PlusIcon, SparklesIcon } from '../components/Icons';
import { getSchedulingSuggestions, generateInspirationalImage } from '../services/GeminiService';

const DashboardPage: React.FC = () => {
  const { tasks, courses } = useStudyApp();
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
  const [motivationalImage, setMotivationalImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);


  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of today for comparison
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const filteredTasks = tasks
      .filter(task => task.status !== TaskStatus.DONE && task.dueDate)
      .filter(task => {
        const dueDate = new Date(task.dueDate!); // Assuming dueDate is ISO string
        return dueDate >= today && dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5); 
    setUpcomingTasks(filteredTasks);
  }, [tasks]);

  const fetchSuggestion = async () => {
    setIsLoadingSuggestion(true);
    const relevantTasks = tasks.filter(t => t.status !== TaskStatus.DONE).slice(0, 10);
    try {
      const result = await getSchedulingSuggestions(relevantTasks);
      setSuggestion(result);
    } catch (error) {
      console.error("Failed to get suggestion:", error);
      setSuggestion("Could not load suggestions at this moment.");
    } finally {
      setIsLoadingSuggestion(false);
    }
  };
  
  const fetchImage = async () => {
    setIsLoadingImage(true);
    try {
      const imageUrl = await generateInspirationalImage("A focused student achieving their goals, vibrant and modern illustration style.");
      setMotivationalImage(imageUrl);
    } catch (error) {
      console.error("Failed to generate image:", error);
      // Use a more relevant placeholder if API fails
      setMotivationalImage(`https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80`);
    } finally {
      setIsLoadingImage(false);
    }
  };


  useEffect(() => {
    fetchSuggestion();
    fetchImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  const tasksToDo = tasks.filter(t => t.status === TaskStatus.TODO).length;
  const tasksInProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const tasksDone = tasks.filter(t => t.status === TaskStatus.DONE).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Dashboard</h2>
        <Link to={ROUTE_PATHS.PLANNER}>
          <Button variant="primary">
            <PlusIcon className="w-4 h-4 mr-2" /> Add New Task
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Courses" value={courses.length.toString()} icon={<ClipboardListIcon className="w-8 h-8 text-primary" />} />
        <StatCard title="Tasks To Do" value={tasksToDo.toString()} icon={<CalendarIcon className="w-8 h-8 text-amber-500" />} />
        <StatCard title="Tasks In Progress" value={tasksInProgress.toString()} icon={<SparklesIcon className="w-8 h-8 text-indigo-500" />} />
        <StatCard title="Tasks Completed" value={tasksDone.toString()} icon={<CheckCircleIcon className="w-8 h-8 text-green-500" />} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md dark:shadow-slate-700">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Upcoming Tasks (Next 7 Days)</h3>
          {upcomingTasks.length > 0 ? (
            <ul className="space-y-3">
              {upcomingTasks.map(task => (
                <li key={task.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{task.title}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {task.courseId && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Course: {courses.find(c => c.id === task.courseId)?.name || 'General'}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No Upcoming Tasks" message="Enjoy your free time or add some tasks!" icon={<CalendarIcon className="w-12 h-12 text-slate-400 dark:text-slate-500"/>} />
          )}
        </div>

        {/* AI Suggestions & Image */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md dark:shadow-slate-700">
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center">
              <SparklesIcon className="w-6 h-6 mr-2 text-primary" /> Smart Suggestion
            </h3>
            {isLoadingSuggestion ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">Loading suggestion...</div>
            ) : suggestion ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{suggestion}</p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No suggestions available right now.</p>
            )}
             <Button size="sm" variant="ghost" onClick={fetchSuggestion} className="mt-3 text-xs" disabled={isLoadingSuggestion}>
                {isLoadingSuggestion ? 'Refreshing...' : 'Refresh Suggestion'}
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md dark:shadow-slate-700">
             <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center">
              <SparklesIcon className="w-6 h-6 mr-2 text-accent" /> Daily Motivation
            </h3>
            {isLoadingImage ? (
              <div className="h-48 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400">Loading image...</div>
            ) : motivationalImage ? (
              <img src={motivationalImage} alt="Motivational" className="rounded-md w-full h-48 object-cover" />
            ) : (
               <div className="h-48 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400">Could not load image.</div>
            )}
             <Button size="sm" variant="ghost" onClick={fetchImage} className="mt-3 text-xs" disabled={isLoadingImage}>
                {isLoadingImage ? 'Generating...' : 'New Image'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md dark:shadow-slate-700 flex items-center space-x-4">
    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  </div>
);

export default DashboardPage;
