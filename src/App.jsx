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
