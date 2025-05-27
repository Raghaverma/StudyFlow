
import React, { useState, useMemo, useCallback } from 'react';
import { useStudyApp } from '../contexts/StudyAppContext';
import { Course, Task, PriorityLevel, TaskStatus, SubTask } from '../types';
import { Button, Modal, Input, Select, Textarea, EmptyState, ConfirmationModal } from '../components/Common';
import { PlusIcon, EditIcon, TrashIcon, CheckCircleIcon, XCircleIcon, CalendarIcon, ChevronDownIcon, SparklesIcon } from '../components/Icons';
import { getSchedulingSuggestions } from '../services/GeminiService';

interface TaskFormState {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  priority: PriorityLevel;
  estimatedTime: string; 
  courseId: string;
  subTasks: SubTask[]; 
}

const initialFormState: TaskFormState = {
  title: '',
  description: '',
  dueDate: '',
  priority: PriorityLevel.MEDIUM,
  estimatedTime: '',
  courseId: '',
  subTasks: []
};

interface TaskItemProps {
  task: Task;
  course?: Course;
  onEdit: (task: Task) => void;
  onDeleteInitiate: (taskId: string, taskTitle: string) => void;
  onToggleStatus: (taskId: string, status: TaskStatus) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onAddSubTask: (taskId: string, subTaskTitle: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, course, onEdit, onDeleteInitiate, onToggleStatus, onToggleSubTask, onAddSubTask }) => {
  const [showSubTasks, setShowSubTasks] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');

  const priorityClasses: Record<PriorityLevel, string> = {
    [PriorityLevel.HIGH]: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700',
    [PriorityLevel.MEDIUM]: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700',
    [PriorityLevel.LOW]: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
  };

  const statusBorderColors: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: 'border-slate-400 dark:border-slate-500',
    [TaskStatus.IN_PROGRESS]: 'border-blue-500 dark:border-blue-400',
    [TaskStatus.DONE]: 'border-green-500 dark:border-green-400',
  };
  
  const handleAddSubTask = () => {
    if (newSubTaskTitle.trim()) {
      onAddSubTask(task.id, newSubTaskTitle.trim());
      setNewSubTaskTitle('');
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border-l-4 ${statusBorderColors[task.status]} transition-shadow hover:shadow-md dark:shadow-slate-700`}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{task.title}</h4>
          {course && <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Course: {course.name}</p>}
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{task.description || "No description."}</p>
        </div>
        <div className="flex space-x-1">
          <Button size="sm" variant="ghost" onClick={() => onEdit(task)} aria-label="Edit task"><EditIcon /></Button>
          <Button size="sm" variant="ghost" onClick={() => onDeleteInitiate(task.id, task.title)} aria-label="Delete task"><TrashIcon className="text-red-500 dark:text-red-400" /></Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 items-center text-xs">
        {task.dueDate && (
          <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full flex items-center">
            <CalendarIcon className="w-3 h-3 mr-1" /> Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        <span className={`px-2 py-1 rounded-full border ${priorityClasses[task.priority]}`}>
          Priority: {task.priority}
        </span>
        {task.estimatedTime && (
          <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
            Est: {task.estimatedTime} hr(s)
          </span>
        )}
      </div>
      
       <div className="mt-3">
        <button
          onClick={() => setShowSubTasks(!showSubTasks)}
          className="text-xs text-primary dark:text-primary-light hover:underline flex items-center"
          aria-expanded={showSubTasks}
        >
          Sub-tasks ({task.subTasks.length}) <ChevronDownIcon className={`w-4 h-4 ml-1 transform transition-transform ${showSubTasks ? 'rotate-180' : ''}`} />
        </button>
        {showSubTasks && (
          <div className="mt-2 space-y-1 pl-4">
            {task.subTasks.map(st => (
              <div key={st.id} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  id={`subtask-${task.id}-${st.id}`}
                  checked={st.isCompleted}
                  onChange={() => onToggleSubTask(task.id, st.id)}
                  className="mr-2 h-4 w-4 text-primary focus:ring-primary-light border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                />
                <label htmlFor={`subtask-${task.id}-${st.id}`} className={`${st.isCompleted ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {st.title}
                </label>
              </div>
            ))}
            <div className="flex items-center mt-1">
              <Input 
                type="text" 
                value={newSubTaskTitle} 
                onChange={(e) => setNewSubTaskTitle(e.target.value)} 
                placeholder="New sub-task..."
                className="text-xs py-1 mr-1"
                aria-label="New sub-task title"
              />
              <Button size="sm" variant="ghost" onClick={handleAddSubTask} className="text-xs px-2 py-1">Add</Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex space-x-2">
        <Button 
          size="sm" 
          variant={task.status === TaskStatus.TODO ? 'primary' : 'ghost'} 
          onClick={() => onToggleStatus(task.id, TaskStatus.TODO)}
        >To Do</Button>
        <Button 
          size="sm" 
          variant={task.status === TaskStatus.IN_PROGRESS ? 'secondary' : 'ghost'}
          onClick={() => onToggleStatus(task.id, TaskStatus.IN_PROGRESS)}
        >In Progress</Button>
        <Button 
          size="sm" 
          variant={task.status === TaskStatus.DONE ? 'success' : 'ghost'}
          onClick={() => onToggleStatus(task.id, TaskStatus.DONE)}
        >Done</Button>
      </div>
    </div>
  );
};


const PlannerPage: React.FC = () => {
  const { tasks, courses, addTask, updateTask, deleteTask, toggleSubTask, getCourseById } = useStudyApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskFormState>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [filterCourseId, setFilterCourseId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
  const [currentSubTaskTitle, setCurrentSubTaskTitle] = useState('');

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{id: string, title: string} | null>(null);


  const openModalForCreate = () => {
    setIsEditing(false);
    setCurrentTask(initialFormState);
    setIsModalOpen(true);
  };

  const openModalForEdit = (task: Task) => {
    setIsEditing(true);
    setCurrentTask({
      id: task.id,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      priority: task.priority,
      estimatedTime: task.estimatedTime?.toString() || '',
      courseId: task.courseId || '',
      subTasks: task.subTasks || []
    });
    setIsModalOpen(true);
  };
  
  const handleAddSubTaskToForm = () => {
    if (currentSubTaskTitle.trim() === '') return;
    const newSubTask: SubTask = {
      id: crypto.randomUUID(),
      title: currentSubTaskTitle.trim(),
      isCompleted: false,
    };
    setCurrentTask(prev => ({ ...prev, subTasks: [...prev.subTasks, newSubTask] }));
    setCurrentSubTaskTitle('');
  };

  const handleToggleSubTaskInForm = (subTaskId: string) => {
    setCurrentTask(prev => ({
      ...prev,
      subTasks: prev.subTasks.map(st => 
        st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st
      )
    }));
  };
  
  const handleRemoveSubTaskFromForm = (subTaskId: string) => {
     setCurrentTask(prev => ({
      ...prev,
      subTasks: prev.subTasks.filter(st => st.id !== subTaskId)
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const taskPayload = {
      title: currentTask.title,
      description: currentTask.description,
      dueDate: currentTask.dueDate ? new Date(currentTask.dueDate).toISOString() : undefined,
      priority: currentTask.priority,
      estimatedTime: currentTask.estimatedTime ? parseFloat(currentTask.estimatedTime) : undefined,
      courseId: currentTask.courseId || undefined,
    };

    if (isEditing && currentTask.id) {
      const existingTask = tasks.find(t=>t.id === currentTask.id);
      if (!existingTask) return;
      updateTask({ 
        ...taskPayload, 
        id: currentTask.id, 
        createdAt: existingTask.createdAt, 
        status: existingTask.status, 
        subTasks: currentTask.subTasks 
      });
    } else {
      addTask({ ...taskPayload, subTasks: currentTask.subTasks }); 
    }
    setIsModalOpen(false);
    setCurrentTask(initialFormState); // Reset form
    setCurrentSubTaskTitle('');
  };

  const handleDeleteInitiate = (taskId: string, taskTitle: string) => {
    setTaskToDelete({ id: taskId, title: taskTitle });
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id);
    }
    setIsConfirmDeleteModalOpen(false);
    setTaskToDelete(null);
  };
  
  const handleToggleStatus = (taskId: string, status: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask({ ...task, status });
    }
  };

  const handleToggleSubTaskItem = (taskId: string, subTaskId: string) => {
    toggleSubTask(taskId, subTaskId);
  };

  const handleAddSubTaskToExistingTask = (taskId: string, subTaskTitle: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newSubTask: SubTask = { id: crypto.randomUUID(), title: subTaskTitle, isCompleted: false };
      updateTask({ ...task, subTasks: [...task.subTasks, newSubTask] });
    }
  };


  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => filterCourseId ? task.courseId === filterCourseId : true)
      .filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase()) || (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [tasks, filterCourseId, searchTerm]);

  const fetchSuggestionForPlanner = useCallback(async () => {
    setIsLoadingSuggestion(true);
    const activeTasks = tasks.filter(t => t.status !== TaskStatus.DONE).slice(0, 10);
    try {
      const result = await getSchedulingSuggestions(activeTasks);
      setSuggestion(result);
    } catch (error) {
      console.error("Failed to get suggestion:", error);
      setSuggestion("Could not load suggestions.");
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [tasks]); 

  const taskColumns: Record<TaskStatus, Task[]> = {
    [TaskStatus.TODO]: filteredTasks.filter(t => t.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.DONE]: filteredTasks.filter(t => t.status === TaskStatus.DONE),
  };
  
  const columnOrder: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Study Planner</h2>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={fetchSuggestionForPlanner} variant="ghost" disabled={isLoadingSuggestion}>
            <SparklesIcon className="w-4 h-4 mr-2" /> {isLoadingSuggestion ? 'Getting Suggestion...' : 'Get Smart Suggestion'}
          </Button>
          <Button onClick={openModalForCreate} variant="primary">
            <PlusIcon className="w-4 h-4 mr-2" /> Add Task
          </Button>
        </div>
      </div>

      {suggestion && (
        <div className="p-4 bg-primary-light bg-opacity-20 dark:bg-primary-dark dark:bg-opacity-30 text-primary-dark dark:text-primary-light rounded-md border border-primary-light dark:border-primary-dark text-sm">
          <strong>Suggestion:</strong> {suggestion}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm dark:shadow-slate-700">
        <Input
          label="Search Tasks"
          placeholder="Enter task title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          label="Filter by Course"
          value={filterCourseId}
          onChange={(e) => setFilterCourseId(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </Select>
      </div>

      {filteredTasks.length === 0 && !searchTerm && !filterCourseId ? (
         <EmptyState 
            title="No tasks yet!" 
            message="Add your first task to get started with your study plan."
            icon={<CalendarIcon className="w-16 h-16 text-slate-400 dark:text-slate-500"/>}
            action={<Button onClick={openModalForCreate} variant="primary"><PlusIcon className="w-4 h-4 mr-2" /> Add Task</Button>}
          />
      ) : filteredTasks.length === 0 ? (
         <EmptyState 
            title="No tasks found" 
            message="Try adjusting your search or filter criteria."
            icon={<CalendarIcon className="w-16 h-16 text-slate-400 dark:text-slate-500"/>}
          />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columnOrder.map(statusKey => (
            <div key={statusKey} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow dark:shadow-slate-700/50">
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 border-b-2 pb-2 border-slate-300 dark:border-slate-600">{statusKey} ({taskColumns[statusKey].length})</h3>
              {taskColumns[statusKey].length > 0 ? (
                <div className="space-y-4">
                  {taskColumns[statusKey].map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      course={getCourseById(task.courseId || '')}
                      onEdit={openModalForEdit}
                      onDeleteInitiate={handleDeleteInitiate}
                      onToggleStatus={handleToggleStatus}
                      onToggleSubTask={handleToggleSubTaskItem}
                      onAddSubTask={handleAddSubTaskToExistingTask}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No tasks in this category.</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCurrentTask(initialFormState); setCurrentSubTaskTitle(''); }} title={isEditing ? 'Edit Task' : 'Add New Task'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            id="title"
            value={currentTask.title}
            onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            id="description"
            value={currentTask.description}
            onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Due Date"
              id="dueDate"
              type="date"
              value={currentTask.dueDate}
              onChange={(e) => setCurrentTask({ ...currentTask, dueDate: e.target.value })}
            />
            <Input
              label="Estimated Time (hours)"
              id="estimatedTime"
              type="number"
              min="0.1"
              step="0.1"
              value={currentTask.estimatedTime}
              onChange={(e) => setCurrentTask({ ...currentTask, estimatedTime: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Priority"
              id="priority"
              value={currentTask.priority}
              onChange={(e) => setCurrentTask({ ...currentTask, priority: e.target.value as PriorityLevel })}
            >
              {Object.values(PriorityLevel).map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </Select>
            <Select
              label="Course (Optional)"
              id="courseId"
              value={currentTask.courseId}
              onChange={(e) => setCurrentTask({ ...currentTask, courseId: e.target.value })}
            >
              <option value="">None</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sub-tasks</label>
            <div className="space-y-2 mb-2 max-h-40 overflow-y-auto p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700/50">
              {currentTask.subTasks.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400">No sub-tasks yet.</p>}
              {currentTask.subTasks.map(st => (
                <div key={st.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded shadow-sm">
                  <div className="flex items-center">
                    <input 
                      type="checkbox"
                      id={`form-subtask-${st.id}`}
                      checked={st.isCompleted}
                      onChange={() => handleToggleSubTaskInForm(st.id)}
                      className="mr-2 h-4 w-4 text-primary focus:ring-primary-light border-slate-300 dark:border-slate-500 rounded bg-white dark:bg-slate-700"
                    />
                    <label htmlFor={`form-subtask-${st.id}`} className={`text-sm ${st.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>{st.title}</label>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveSubTaskFromForm(st.id)} aria-label="Remove sub-task">
                    <TrashIcon className="w-4 h-4 text-red-400 hover:text-red-600"/>
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center mt-1">
              <Input 
                type="text" 
                value={currentSubTaskTitle} 
                onChange={(e) => setCurrentSubTaskTitle(e.target.value)} 
                placeholder="New sub-task title..."
                className="text-sm py-1 mr-2"
                aria-label="New sub-task title for form"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubTaskToForm();}}}
              />
              <Button type="button" size="sm" variant="primary" onClick={handleAddSubTaskToForm}>Add Sub-task</Button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); setCurrentTask(initialFormState); setCurrentSubTaskTitle(''); }}>Cancel</Button>
            <Button type="submit" variant="primary">{isEditing ? 'Save Changes' : 'Add Task'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        message={<p>Are you sure you want to delete the task "<strong>{taskToDelete?.title}</strong>"? This action cannot be undone.</p>}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
      />
    </div>
  );
};

export default PlannerPage;
