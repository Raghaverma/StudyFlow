
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import PlannerPage from './pages/PlannerPage';
import KanbanBoardPage from './pages/KanbanBoardPage';
import HabitTrackerPage from './pages/HabitTrackerPage';
import SettingsPage from './pages/SettingsPage';
import { ROUTE_PATHS } from './constants';
import { StudyAppProvider, useStudyApp } from './contexts/StudyAppContext';

// Component to handle theme application at a high level
const ThemeManager: React.FC<{children: React.ReactNode}> = ({children}) => {
  const { theme } = useStudyApp(); // Get theme from context

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Persist to localStorage for immediate effect on next load (handled by useLocalStorage in context too)
    localStorage.setItem('studyflow-theme', theme); 
  }, [theme]);

  return <>{children}</>;
}

const AppRoutes: React.FC = () => {
  return (
    <ThemeManager>
      <MainLayout>
        <Routes>
          <Route path={ROUTE_PATHS.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTE_PATHS.PLANNER} element={<PlannerPage />} />
          <Route path={ROUTE_PATHS.KANBAN} element={<KanbanBoardPage />} />
          <Route path={ROUTE_PATHS.HABITS} element={<HabitTrackerPage />} />
          <Route path={ROUTE_PATHS.SETTINGS} element={<SettingsPage />} />
          <Route path="*" element={<Navigate to={ROUTE_PATHS.DASHBOARD} replace />} />
        </Routes>
      </MainLayout>
    </ThemeManager>
  );
}


const App: React.FC = () => {
  return (
    <StudyAppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </StudyAppProvider>
  );
};

export default App;
