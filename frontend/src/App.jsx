import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import AnimatedRoutes from './components/AnimatedRoutes'
import LoginPage from './components/LoginPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import GoogleAuthSuccessPage from './pages/GoogleAuthSuccessPage'
import ProtectedRoute from './components/ProtectedRoute'
import { SearchProvider } from './contexts/SearchContext'
import { useAuth } from './context/AuthContext'
import './App.css'
import './components/AnimatedRoutes.css'

function App() {
  const { user, loading } = useAuth();

  // Если приложение загружается, показываем загрузочный экран
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка приложения...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/auth/google/success" element={<GoogleAuthSuccessPage />} />
      
      {/* Защищенные маршруты */}
      <Route path="/*" element={
        <ProtectedRoute>
          <SearchProvider>
            <div className="app-container">
              <Sidebar user={user} />
              <TopBar />
              <main className="main-content">
                <AnimatedRoutes user={user} />
              </main>
            </div>
          </SearchProvider>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App
