import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home, Car as CarIcon, Wrench, Settings, Fuel } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Cars } from './pages/Cars';
import { CarDetails } from './pages/CarDetails';
import { Services } from './pages/Services';
import { Refuelings } from './pages/Refuelings';
import { Settings as SettingsPage } from './pages/Settings';
import { useNotifications } from './hooks/useNotifications';
import { useTheme } from './hooks/useTheme';
import { SecurityProvider, useSecurity } from './contexts/SecurityContext';
import { PinEntry } from './components/PinEntry';
import { PinSetup } from './components/PinSetup';

function Layout() {
  const location = useLocation();
  const { isAuthenticated, authenticate, isPinEnabled, hasPin, isFirstLaunch, updatePin } = useSecurity();
  
  useNotifications(); // Initialize notifications
  useTheme(); // Initialize theme

  if (isFirstLaunch) {
    return <PinSetup onSetupComplete={updatePin} />;
  }

  if (isPinEnabled && hasPin && !isAuthenticated) {
    return <PinEntry onAuthenticate={authenticate} />;
  }

  return (
    <div 
      className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          <Route path="/services" element={<Services />} />
          <Route path="/refuelings" element={<Refuelings />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      <nav 
        className="fixed bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center px-2 z-50 transition-colors"
        style={{ height: 'calc(4rem + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <NavItem 
          to="/" 
          icon={<Home size={24} />} 
          label="Prehľad" 
          isActive={location.pathname === '/'} 
        />
        <NavItem 
          to="/cars" 
          icon={<CarIcon size={24} />} 
          label="Autá" 
          isActive={location.pathname.startsWith('/cars')} 
        />
        <NavItem 
          to="/refuelings" 
          icon={<Fuel size={24} />} 
          label="Tankovanie" 
          isActive={location.pathname === '/refuelings'} 
        />
        <NavItem 
          to="/services" 
          icon={<Wrench size={24} />} 
          label="Servis" 
          isActive={location.pathname === '/services'} 
        />
        <NavItem 
          to="/settings" 
          icon={<Settings size={24} />} 
          label="Nastavenia" 
          isActive={location.pathname === '/settings'} 
        />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label, isActive }: { to: string, icon: React.ReactNode, label: string, isActive: boolean }) {
  return (
    <NavLink 
      to={to}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}

export default function App() {
  return (
    <SecurityProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </SecurityProvider>
  );
}
