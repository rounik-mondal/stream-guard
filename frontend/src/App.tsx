import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage';
import { StreamPage } from './pages/StreamPage';
import { CreateStreamPage } from './pages/CreateStreamPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminDashboard } from './pages/AdminDashboard';
import { StreamerAnalyticsDashboard } from './pages/StreamerAnalyticsDashboard';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes with layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage filter="all" />} />
            <Route path="discover" element={<HomePage filter="discover" />} />
            <Route path="trending" element={<HomePage filter="trending" />} />
            <Route path="following" element={<HomePage filter="following" />} />
            <Route path="stream/:id" element={<StreamPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="profile/:username" element={<ProfilePage />} />
            <Route path="admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="streamer/analytics" element={
              <ProtectedRoute>
                <StreamerAnalyticsDashboard />
              </ProtectedRoute>
            } />
            
            {/* Protected routes */}
            <Route path="create-stream" element={
              <ProtectedRoute>
                <CreateStreamPage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
