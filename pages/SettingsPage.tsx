
import React, { useState } from 'react';
import { useStudyApp } from '../contexts/StudyAppContext';
import { Course } from '../types';
import { Button, Modal, Input, EmptyState, ConfirmationModal } from '../components/Common';
import { PlusIcon, EditIcon, TrashIcon, CogIcon, SunIcon, MoonIcon } from '../components/Icons';

interface CourseFormState {
  id?: string;
  name: string;
  color?: string;
}

const initialCourseFormState: CourseFormState = { name: '', color: '#0F766E' }; 

const SettingsPage: React.FC = () => {
  const { courses, addCourse, updateCourse, deleteCourse, theme, toggleTheme } = useStudyApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<CourseFormState>(initialCourseFormState);
  const [isEditing, setIsEditing] = useState(false);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{id: string, name: string} | null>(null);

  const openModalForCreate = () => {
    setIsEditing(false);
    setCurrentCourse(initialCourseFormState);
    setIsModalOpen(true);
  };

  const openModalForEdit = (course: Course) => {
    setIsEditing(true);
    setCurrentCourse({ id: course.id, name: course.name, color: course.color || '#0F766E' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentCourse.id) {
      const existingCourse = courses.find(c=>c.id === currentCourse.id);
      if (!existingCourse) return;
      updateCourse({ ...currentCourse, id: currentCourse.id, createdAt: existingCourse.createdAt });
    } else {
      addCourse({ name: currentCourse.name, color: currentCourse.color });
    }
    setIsModalOpen(false);
  };

  const handleDeleteCourseInitiate = (courseId: string, courseName: string) => {
    setCourseToDelete({ id: courseId, name: courseName });
    setIsConfirmDeleteModalOpen(true);
  };
  
  const confirmDeleteCourse = () => {
    if (courseToDelete) {
        deleteCourse(courseToDelete.id);
    }
    setIsConfirmDeleteModalOpen(false);
    setCourseToDelete(null);
  };
  
  const colorPalette = [
    '#EF4444', // red-500
    '#F59E0B', // amber-500
    '#10B981', // emerald-500
    '#0EA5E9', // sky-500
    '#6366F1', // indigo-500
    '#EC4899', // pink-500
    '#84CC16', // lime-500
    '#0F766E', // teal-700 (primary)
  ];


  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Settings</h2>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md dark:shadow-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Manage Courses</h3>
          <Button onClick={openModalForCreate} variant="primary">
            <PlusIcon className="w-4 h-4 mr-2" /> Add Course
          </Button>
        </div>
        {courses.length === 0 ? (
          <EmptyState 
            title="No Courses Yet" 
            message="Add courses to organize your tasks and track progress."
            icon={<CogIcon className="w-16 h-16 text-slate-400 dark:text-slate-500" />}
            action={<Button onClick={openModalForCreate} variant="primary"><PlusIcon className="w-4 h-4 mr-2"/>Add Course</Button>}
           />
        ) : (
          <ul className="space-y-3">
            {courses.map(course => (
              <li key={course.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600">
                <div className="flex items-center">
                  <span 
                    className="w-5 h-5 rounded-full mr-3 shadow-sm" 
                    style={{ backgroundColor: course.color || '#0F766E' }}
                    title={`Color: ${course.color}`}
                  ></span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{course.name}</span>
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => openModalForEdit(course)} aria-label="Edit course">
                    <EditIcon />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteCourseInitiate(course.id, course.name)} aria-label="Delete course">
                    <TrashIcon className="text-red-500 dark:text-red-400" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md dark:shadow-slate-700">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">App Preferences</h3>
         <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-200">Dark Mode</span>
                <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Toggle between light and dark themes for the application.</p>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md dark:shadow-slate-700">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">User Profile</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">Profile settings (name, email, password change) would go here. This feature is not yet implemented.</p>
         <div className="mt-4 space-y-3 max-w-md">
            <Input label="Name (Display Only)" value="Demo User" disabled />
            <Input label="Email (Display Only)" type="email" value="demo@studyflow.app" disabled />
            <Button variant="ghost" disabled>Change Password (Not Implemented)</Button>
         </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit Course' : 'Add New Course'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Course Name"
            value={currentCourse.name}
            onChange={(e) => setCurrentCourse({ ...currentCourse, name: e.target.value })}
            required
          />
          <div>
            <label htmlFor="courseColor" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Course Color</label>
            <div className="flex flex-wrap gap-2 mb-3">
                {colorPalette.map(color => (
                    <button
                        type="button"
                        key={color}
                        onClick={() => setCurrentCourse({...currentCourse, color: color})}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${currentCourse.color === color ? 'ring-2 ring-offset-1 ring-primary dark:ring-offset-slate-800' : 'border-transparent hover:border-slate-400 dark:hover:border-slate-500'}`}
                        style={{ backgroundColor: color}}
                        aria-label={`Select color ${color}`}
                        title={`Select color ${color}`}
                    />
                ))}
            </div>
            <Input
                type="color"
                id="courseColorCustom"
                value={currentCourse.color || '#000000'}
                onChange={(e) => setCurrentCourse({ ...currentCourse, color: e.target.value })}
                className="mt-1 w-full h-10 p-1"
                label="Or pick custom color"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{isEditing ? 'Save Changes' : 'Add Course'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => setIsConfirmDeleteModalOpen(false)}
        onConfirm={confirmDeleteCourse}
        title="Delete Course"
        message={<p>Are you sure you want to delete the course "<strong>{courseToDelete?.name}</strong>"? This will also unassign tasks currently associated with this course. This action cannot be undone.</p>}
      />
    </div>
  );
};

export default SettingsPage;
