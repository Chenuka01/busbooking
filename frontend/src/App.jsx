import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useToast, ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import HomePage from './components/HomePage';
import SeatSelection from './components/SeatSelection';
import BookingSuccess from './components/BookingSuccess';
import AdminDashboard from './components/AdminDashboard';
import ScheduleManagement from './components/ScheduleManagement';
import UserManagement from './components/UserManagement';
import AnimatedBackground from './components/AnimatedBackground';
import Profile from './components/Profile';
import ContactSupport from './components/ContactSupport';
import MyBookings from './components/MyBookings';
import Login from './components/Login';
import Register from './components/Register';
import { motion } from 'framer-motion';
import './index.css';

function AppContent() {
  const [currentView, setCurrentView] = useState('home'); // home, seats, success, admin, mybookings, schedules, users, profile, contact
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  
  const { user, logout, isAdmin } = useAuth();

  const handleSelectSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setCurrentView('seats');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedSchedule(null);
  };

  const handleBookingComplete = (data) => {
    setBookingData(data);
    setCurrentView('success');
  };

  const handleNewBooking = () => {
    setCurrentView('home');
    setSelectedSchedule(null);
    setBookingData(null);
  };

  const { showToast } = useToast();

  const handleAdminToggle = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    
    if (!isAdmin) {
      showToast('error', 'Admin access required');
      return;
    }
    
    setCurrentView(currentView === 'admin' ? 'home' : 'admin');
  };

  const handleMyBookings = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setCurrentView('mybookings');
  };

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      {/* Navigation Bar */}
      <motion.nav
        className="bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-xl shadow-2xl sticky top-0 z-40 border-b-2 border-white/30"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Decorative gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-blue via-coral to-signal-green opacity-80"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              onClick={handleNewBooking}
              className="flex items-center gap-3 group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="relative"
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut"
                }}
              >
                <span className="text-4xl drop-shadow-lg">🚌</span>
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-signal-green rounded-full"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
              </motion.div>
              <div className="flex flex-col items-start">
                <span className="text-2xl font-bold bg-gradient-to-r from-slate-blue to-indigo-600 bg-clip-text text-transparent group-hover:from-coral group-hover:to-orange-600 transition-all duration-300">
                  Bus Booking
                </span>
                <span className="text-xs text-gray-500 font-medium">Professional System</span>
              </div>
            </motion.button>

            <div className="flex items-center gap-2">
              {user && (
                <>
                  <motion.button
                    onClick={handleMyBookings}
                    className="px-5 py-2.5 text-slate-blue hover:bg-gradient-to-r hover:from-slate-blue hover:to-indigo-600 hover:text-white rounded-full transition-all duration-300 font-semibold text-sm shadow-md hover:shadow-lg backdrop-blur-sm bg-white/80"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flex items-center gap-2">
                      <span>📋</span>
                      <span>My Bookings</span>
                    </span>
                  </motion.button>
                  <motion.button
                    onClick={() => setCurrentView('contact')}
                    className="px-5 py-2.5 text-slate-blue hover:bg-gradient-to-r hover:from-slate-blue hover:to-indigo-600 hover:text-white rounded-full transition-all duration-300 font-semibold text-sm shadow-md hover:shadow-lg backdrop-blur-sm bg-white/80"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flex items-center gap-2">
                      <span>📞</span>
                      <span>Support</span>
                    </span>
                  </motion.button>
                  {isAdmin && (
                    <>
                      <motion.button
                        onClick={handleAdminToggle}
                        className="px-5 py-2.5 bg-gradient-to-r from-slate-blue to-indigo-600 text-white rounded-full hover:from-slate-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {currentView === 'admin' ? '← Back' : '👤 Admin'}
                      </motion.button>
                      <motion.button
                        onClick={() => setCurrentView(currentView === 'schedules' ? 'home' : 'schedules')}
                        className="px-5 py-2.5 bg-gradient-to-r from-coral to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {currentView === 'schedules' ? '← Back' : '🗓️ Schedules'}
                      </motion.button>
                      <motion.button
                        onClick={() => setCurrentView(currentView === 'users' ? 'home' : 'users')}
                        className="px-5 py-2.5 bg-gradient-to-r from-signal-green to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {currentView === 'users' ? '← Back' : '👥 Users'}
                      </motion.button>
                    </>
                  )}
                </>
              )}
              
              {user ? (
                <div className="flex items-center gap-2 ml-3 pl-3 border-l-2 border-gray-200">
                  <motion.button
                    onClick={() => setCurrentView('profile')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-blue to-indigo-600 text-white rounded-full hover:from-slate-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-base">👤</span>
                    <span className="max-w-[120px] truncate">{user.fullName}</span>
                  </motion.button>
                  <motion.button
                    onClick={logout}
                    className="px-4 py-2.5 bg-gradient-to-r from-signal-red to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flex items-center gap-2">
                      <span>🚪</span>
                      <span>Logout</span>
                    </span>
                  </motion.button>
                </div>
              ) : (
                <div className="flex gap-2 ml-3 pl-3 border-l-2 border-gray-200">
                  <motion.button
                    onClick={() => setShowLogin(true)}
                    className="px-5 py-2.5 text-slate-blue border-2 border-slate-blue rounded-full hover:bg-slate-blue hover:text-white transition-all duration-300 font-semibold text-sm shadow-md hover:shadow-lg backdrop-blur-sm bg-white/80"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flex items-center gap-2">
                      <span>🔐</span>
                      <span>Login</span>
                    </span>
                  </motion.button>
                  <motion.button
                    onClick={() => setShowRegister(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-coral to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flex items-center gap-2">
                      <span>📝</span>
                      <span>Register</span>
                    </span>
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Content */}
      {currentView === 'home' && (
        <HomePage onSelectSchedule={handleSelectSchedule} />
      )}

      {currentView === 'seats' && selectedSchedule && (
        <SeatSelection
          schedule={selectedSchedule}
          onBack={handleBackToHome}
          onBookingComplete={handleBookingComplete}
        />
      )}

      {currentView === 'success' && bookingData && (
        <BookingSuccess
          bookingData={bookingData}
          onNewBooking={handleNewBooking}
        />
      )}

      {currentView === 'admin' && <AdminDashboard />}
      
      {currentView === 'mybookings' && <MyBookings onBack={() => setCurrentView('home')} />}

      {currentView === 'schedules' && <ScheduleManagement />}

      {currentView === 'users' && <UserManagement />}

      {currentView === 'profile' && <Profile onBack={() => setCurrentView('home')} />}

      {currentView === 'contact' && <ContactSupport onBack={() => setCurrentView('home')} />}

      {/* Login Modal */}
      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
          onLoginSuccess={() => {
            console.log('Login successful');
          }}
        />
      )}

      {showRegister && (
        <Register
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
          onRegisterSuccess={() => {
            console.log('Registration successful');
          }}
        />
      )}

      {/* Footer */}
      <motion.footer
        className="relative bg-gradient-to-br from-slate-blue via-indigo-700 to-slate-900 text-white py-12 mt-20 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-10 right-20 w-40 h-40 bg-coral rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -40, 0],
              y: [0, 20, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            className="grid md:grid-cols-2 gap-12 mb-8"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            {/* Company Info */}
            <div className="text-center md:text-left">
              <motion.div
                className="flex items-center justify-center md:justify-start gap-3 mb-4"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-4xl">🚌</span>
                <h3 className="text-xl font-bold">Bus Booking</h3>
              </motion.div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Your trusted partner for comfortable and reliable bus travel. 
                Book your journey with confidence.
              </p>
            </div>

            {/* Features */}
            <div className="text-center md:text-right">
              <h4 className="text-lg font-semibold mb-4 text-signal-green">Why Choose Us</h4>
              <div className="flex flex-col gap-2 items-center md:items-end">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-lg">✨</span>
                  <span>Advanced Design</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-lg">🔒</span>
                  <span>Secure Booking</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-lg">⚡</span>
                  <span>Real-time Updates</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Divider */}
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 1 }}
          />

          {/* Copyright */}
          <motion.div
            className="text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <p className="text-gray-400 text-sm mb-3">
              © 2025 Professional Bus Booking Management System. All rights reserved.
            </p>
            <div className="flex justify-center gap-6">
              <motion.a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-xl">📱</span>
              </motion.a>
              <motion.a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.2, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-xl">📧</span>
              </motion.a>
              <motion.a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-xl">🌐</span>
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-blue via-coral to-signal-green"></div>
      </motion.footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
