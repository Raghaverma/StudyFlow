
import React, { createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Course, Task, PriorityLevel, TaskStatus, SubTask } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

type Theme = 'light' | 'dark';

interface StudyAppContextType {
  courses: Course[];
  tasks: Task[];
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  toggleTheme: () => void;
  addCourse: (courseData: Omit<Course, 'id' | 'createdAt'>) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (courseId: string) => void;
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'status'> & { subTasks?: SubTask[] }) => Task; // Return created task
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  getTasksByCourse: (courseId: string) => Task[];
  getCourseById: (courseId: string) => Course | undefined;
}

const StudyAppContext = createContext<StudyAppContextType | undefined>(undefined);

export const StudyAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useLocalStorage<Course[]>('studyflow-courses', []);
  const [tasks, setTasks] = useLocalStorage<Task[]>('studyflow-tasks', []);
  const [theme, setTheme] = useLocalStorage<Theme>('studyflow-theme', 
    // Read system preference for initial theme
    () => (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, [setTheme]);


  const addCourse = useCallback((courseData: Omit<Course, 'id' | 'createdAt'>) => {
    const newCourse: Course = {
      ...courseData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setCourses(prev => [...prev, newCourse]);
  }, [setCourses]);

  const updateCourse = useCallback((updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  }, [setCourses]);

  const deleteCourse = useCallback((courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    setTasks(prevTasks => prevTasks.map(t => t.courseId === courseId ? { ...t, courseId: undefined } : t));
  }, [setCourses, setTasks]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'status'> & { subTasks?: SubTask[] }) => {
    const newTask: Task = {
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      priority: taskData.priority,
      estimatedTime: taskData.estimatedTime,
      courseId: taskData.courseId,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: TaskStatus.TODO,
      subTasks: taskData.subTasks || [], // Use provided subTasks or default to empty
    };
    setTasks(prev => [...prev, newTask]);
    return newTask; // Return the created task
  }, [setTasks]);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  }, [setTasks]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, [setTasks]);

  const toggleSubTask = useCallback((taskId: string, subTaskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subTasks: task.subTasks.map(st =>
                st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st
              ),
            }
          : task
      )
    );
  }, [setTasks]);

  const getTasksByCourse = useCallback((courseId: string) => {
    return tasks.filter(task => task.courseId === courseId);
  }, [tasks]);
  
  const getCourseById = useCallback((courseId: string) => {
    return courses.find(course => course.id === courseId);
  }, [courses]);


  return (
    <StudyAppContext.Provider value={{ 
        courses, tasks, 
        theme, setTheme, toggleTheme,
        addCourse, updateCourse, deleteCourse, 
        addTask, updateTask, deleteTask, toggleSubTask,
        getTasksByCourse, getCourseById
    }}>
      {children}
    </StudyAppContext.Provider>
  );
};

export const useStudyApp = (): StudyAppContextType => {
  const context = useContext(StudyAppContext);
  if (!context) {
    throw new Error('useStudyApp must be used within a StudyAppProvider');
  }
  return context;
};
