import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlannerPage from './pages/PlannerPage';
import KanbanPage from './pages/KanbanPage';
import HabitsPage from './pages/HabitsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PrivateRoute from './components/common/PrivateRoute';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#ff9800' },
    background: { default: '#f4f6fa' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/" element={<Navigate to="/planner" />} />
          </Route>
          <Route path="*" element={<Navigate to="/planner" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
