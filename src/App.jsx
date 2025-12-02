import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Onboarding from './components/Onboarding';
import { DEFAULT_CATEGORIES } from './data/defaults';
import { useState } from 'react';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('hb_has_onboarded');
  });

  useEffect(() => {
    // Seed default data if missing
    if (!localStorage.getItem('hb_categories')) {
      localStorage.setItem('hb_categories', JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem('hb_payees')) {
      localStorage.setItem('hb_payees', JSON.stringify([]));
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Theme Logic
  useEffect(() => {
    const applyTheme = () => {
      const theme = localStorage.getItem('hb_theme') || 'system';
      const root = window.document.documentElement;

      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };

    // Apply on mount
    applyTheme();

    // Listen for system changes if system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
       if (localStorage.getItem('hb_theme') === 'system') {
           applyTheme();
       }
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    // Listen for manual changes via custom event
    const handleManualChange = () => {
        applyTheme();
    };
    window.addEventListener('hb_theme_changed', handleManualChange);

    return () => {
        mediaQuery.removeEventListener('change', handleSystemChange);
        window.removeEventListener('hb_theme_changed', handleManualChange);
    };
  }, []);

  return (
    <Layout>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Layout>
  );
}

export default App;
