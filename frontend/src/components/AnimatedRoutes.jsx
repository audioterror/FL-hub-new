import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ProtectedRoute from './ProtectedRoute';
import HomePage from '../pages/HomePage';
import PresetsPage from '../pages/PresetsPage';
import PluginsPage from '../pages/PluginsPage';
import FontsPage from '../pages/FontsPage';
import SoundsPage from '../pages/SoundsPage';
import FootagePage from '../pages/FootagePage';
import ScriptsPage from '../pages/ScriptsPage';
import GraphicsPage from '../pages/GraphicsPage';
import PacksPage from '../pages/PacksPage';
import CommunityPage from '../pages/CommunityPage';
import NewsPage from '../pages/NewsPage';
import AdminPanelPage from '../pages/AdminPanelPage';
import CEOPanelPage from '../pages/CEOPanelPage';
import SettingsPage from '../pages/SettingsPage';

// Анимации для страниц
const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    x: -20,
    scale: 0.98
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

// Компонент для анимированной страницы
const AnimatedPage = ({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="animated-page"
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = ({ user }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <AnimatedPage>
              <HomePage />
            </AnimatedPage>
          }
        />
        <Route
          path="/presets"
          element={
            <AnimatedPage>
              <PresetsPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/plugins"
          element={
            <AnimatedPage>
              <PluginsPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/fonts"
          element={
            <AnimatedPage>
              <FontsPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/sounds"
          element={
            <AnimatedPage>
              <SoundsPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/footage"
          element={
            <AnimatedPage>
              <FootagePage />
            </AnimatedPage>
          }
        />
        <Route
          path="/scripts"
          element={
            <AnimatedPage>
              <ScriptsPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/graphics"
          element={
            <AnimatedPage>
              <GraphicsPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/packs"
          element={
            <AnimatedPage>
              <PacksPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/community"
          element={
            <AnimatedPage>
              <CommunityPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/news"
          element={
            <AnimatedPage>
              <NewsPage />
            </AnimatedPage>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} allowedRoles={['ADMIN', 'CEO']} redirectTo="/">
              <AnimatedPage>
                <AdminPanelPage />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ceo"
          element={
            <ProtectedRoute user={user} allowedRoles={['CEO']} redirectTo="/">
              <AnimatedPage>
                <CEOPanelPage />
              </AnimatedPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AnimatedPage>
              <SettingsPage />
            </AnimatedPage>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
