import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Index from './pages/Index';
import JobSeeker from './pages/JobSeeker';
import Recruiter from './pages/Recruiter';
import MassApplier from './pages/MassApplier';
import Auth from './pages/Auth';
import About from './pages/About';

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to='/auth' />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnimatePresence mode='wait'>
          <Routes>
            <Route
              path='/auth'
              element={<Auth />}
            />
            <Route
              path='/'
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path='/about'
              element={<About />}
            />
            <Route
              path='/job-seeker'
              element={
                <ProtectedRoute>
                  <JobSeeker />
                </ProtectedRoute>
              }
            />
            <Route
              path='/recruiter'
              element={
                <ProtectedRoute>
                  <Recruiter />
                </ProtectedRoute>
              }
            />
            <Route
              path='/mass-applier'
              element={
                <ProtectedRoute>
                  <MassApplier />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
