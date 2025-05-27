
export enum PriorityLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: PriorityLevel;
  estimatedTime?: number; // in hours
  courseId?: string;
  subTasks: SubTask[];
  status: TaskStatus;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly'; // Example, can be expanded
  trackingType: 'boolean' | 'quantity'; // Yes/No or numeric value
  goal?: number; // Optional goal for quantity type
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // ISO Date string YYYY-MM-DD
  completed?: boolean;
  quantity?: number;
  notes?: string;
}

// For Kanban
export enum KanbanColumnType {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  assigneeIds?: string[]; // User IDs
  column: KanbanColumnType;
  boardId: string;
  createdAt: string;
}

export interface KanbanBoard {
  id: string;
  name: string;
  userId: string; // Creator
  createdAt: string;
}

// Simplified User for context
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  // preferences, etc.
}
