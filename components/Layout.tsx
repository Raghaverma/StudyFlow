
import React, { ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { APP_NAME, ROUTE_PATHS } from '../constants';
import { CalendarIcon, ClipboardListIcon, CheckBadgeIcon, CogIcon, HomeIcon, SparklesIcon, ChevronRightIcon, ChevronDownIcon, SunIcon, MoonIcon } from './Icons';
import { useStudyApp } from '../contexts/StudyAppContext';


interface NavItemProps {
  to: string;
  icon: ReactNode;
  label: string;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isCollapsed }) => {
  const location = useLocation();
  // Ensure ROUTE_PATHS.DASHBOARD matching is exact or handles nested routes if any start with it.
  // For this app, exact matching for dashboard should be fine.
  const isActive = location.pathname === to;


  return (
    <NavLink
      to={to}
      className={`flex items-center px-3 py-3 text-sm font-medium rounded-md hover:bg-primary-dark hover:text-white transition-colors duration-150 ease-in-out
        ${isActive ? 'bg-primary-dark text-white' : 'text-slate-200 hover:text-white'}
        ${isCollapsed ? 'justify-center' : ''}
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="w-6 h-6">{icon}</span>
      {!isCollapsed && <span className="ml-3">{label}</span>}
    </NavLink>
  );
};


const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const navItems = [
    { to: ROUTE_PATHS.DASHBOARD, icon: <HomeIcon />, label: "Dashboard" },
    { to: ROUTE_PATHS.PLANNER, icon: <CalendarIcon />, label: "Planner" },
    { to: ROUTE_PATHS.KANBAN, icon: <ClipboardListIcon />, label: "Kanban Board" },
    { to: ROUTE_PATHS.HABITS, icon: <CheckBadgeIcon />, label: "Habit Tracker" },
    { to: ROUTE_PATHS.SETTINGS, icon: <CogIcon />, label: "Settings" },
  ];

  return (
    <div className={`bg-primary text-white flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-16 px-4 border-b border-primary-light`}>
        {!isCollapsed && <h1 className="text-xl font-semibold">{APP_NAME}</h1>}
        <button 
            onClick={toggleSidebar} 
            className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRightIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6 transform rotate-90" />}
        </button>
      </div>
      <nav className="flex-grow p-3 space-y-1">
        {navItems.map(item => (
          <NavItem key={item.to} {...item} isCollapsed={isCollapsed} />
        ))}
      </nav>
      <div className={`p-4 border-t border-primary-light ${isCollapsed ? 'hidden' : 'block'}`}>
        <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} {APP_NAME}</p>
      </div>
    </div>
  );
};

const Header: React.FC = () => {
  const { theme, toggleTheme } = useStudyApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-slate-700 h-16 flex items-center justify-between px-6">
      <div>
        {/* Future: Breadcrumbs or Dynamic Page Title */}
        {/* <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Page Title</h2> */}
      </div>
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
        <button className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors" title="AI Assistant (Placeholder)">
          <SparklesIcon className="w-5 h-5" />
        </button>
        
        <div className="relative">
            <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 focus:ring-secondary"
                aria-label="User menu"
                aria-haspopup="true"
                aria-expanded={showUserMenu}
            >
            U
            </button>
            {showUserMenu && (
                <div 
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 dark:ring-slate-600 z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                >
                    <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">Profile (Soon)</a>
                    <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">Logout (Soon)</a>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 p-6 transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};
