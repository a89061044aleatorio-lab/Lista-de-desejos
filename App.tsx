import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './hooks/useAppContext';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import OldLists from './pages/OldLists';
import Account from './pages/Account';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  const { user, loading } = useAppContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* update-password deve ser acessível apenas se tiver sessão de recuperação, 
          mas o Supabase loga o usuário automaticamente ao clicar no link, então usamos ProtectedRoute */}
      <Route path="/update-password" element={<ProtectedRoute><UpdatePassword /></ProtectedRoute>} />
      
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/old-lists" element={<ProtectedRoute><OldLists /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;