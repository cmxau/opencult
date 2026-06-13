import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion }      from 'framer-motion';
import { SettingsProvider } from '@/features/settings/SettingsContext';
import { ThemeProvider }    from '@/features/settings/ThemeContext';
import { UserProvider }     from '@/features/users/UserContext';
import { useSettings }      from '@/features/settings/SettingsContext';
import { useAutoExport }    from '@/features/history/useAutoExport';
import { BottomNav }        from '@/shared/ui/BottomNav';
import { pageVariants }     from '@/shared/motion';
import HomePage             from '@/pages/HomePage';
import MeasurePage          from '@/pages/MeasurePage';
import HistoryPage          from '@/pages/HistoryPage';
import ChatPage             from '@/pages/ChatPage';
import SettingsPage         from '@/pages/SettingsPage';

function AutoExportWatcher() {
  const { settings } = useSettings();
  useAutoExport(settings);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ minHeight: '100%' }}
      >
        <Routes location={location}>
          <Route path="/"         element={<HomePage />}     />
          <Route path="/measure"  element={<MeasurePage />}  />
          <Route path="/history"  element={<HistoryPage />}  />
          <Route path="/chat"     element={<ChatPage />}     />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <UserProvider>
          <BrowserRouter>
            {/* Honour prefers-reduced-motion globally */}
            <MotionConfig reducedMotion="user">
              <AutoExportWatcher />
              <div className="min-h-dvh flex flex-col">
                <main className="flex-1">
                  <div className="w-full max-w-[430px] mx-auto">
                    <AnimatedRoutes />
                  </div>
                </main>
                <BottomNav />
              </div>
            </MotionConfig>
          </BrowserRouter>
        </UserProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
