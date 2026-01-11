import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GlassCard from './GlassCard';
import { motion } from 'framer-motion';
import api from '../services/api';

const MyBookings = ({ onBack }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      setBookings(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      const message = err.response?.data?.message || 'Failed to load bookings';
      setError(message);
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingUuid) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await api.patch(`/bookings/${bookingUuid}/cancel`);
      showToast('success', 'Booking cancelled successfully');
      // Refresh bookings
      fetchBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      const message = err.response?.data?.message || 'Failed to cancel booking';
      showToast('error', message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'text-green-600 bg-green-50';
      case 'Cancelled': return 'text-red-600 bg-red-50';
      case 'Pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Confirmed': return '✅';
      case 'Cancelled': return '❌';
      case 'Pending': return '⏳';
      default: return '📋';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <GlassCard className="p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-blue mb-4">Please Login</h2>
          <p className="text-gray-600">You need to be logged in to view your bookings.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.button
              onClick={onBack || (() => window.history.back())}
              className="px-6 py-3 bg-white/80 backdrop-blur-md border border-white/20 text-slate-blue rounded-xl hover:bg-white/90 transition-all font-semibold shadow-lg"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back to Home
            </motion.button>
          </div>

          <motion.div
            className="flex items-center justify-center gap-4 mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.span
              className="text-6xl"
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
              📋
            </motion.span>
            <h1 className="text-5xl font-bold text-slate-blue">
              My Bookings
            </h1>
          </motion.div>

          <motion.p
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            View and manage all your bus seat reservations
          </motion.p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            className="flex justify-center items-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <GlassCard className="p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-4xl mb-4"
              >
                🚌
              </motion.div>
              <p className="text-lg text-gray-600">Loading your bookings...</p>
            </GlassCard>
          </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
          <motion.div
            className="flex justify-center items-center py-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="p-8 text-center max-w-md">
              <motion.div
                className="text-6xl mb-4"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                ⚠️
              </motion.div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Error Loading Bookings</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <motion.button
                onClick={fetchBookings}
                className="px-6 py-3 bg-slate-blue text-white rounded-xl hover:bg-slate-700 transition-colors font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
            </GlassCard>
          </motion.div>
        )}

        {/* Bookings List */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {bookings.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <motion.div
                  className="text-8xl mb-6"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  🚌
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">No Bookings Found</h3>
                <p className="text-gray-600 mb-6">You haven't made any bookings yet.</p>
                <motion.button
                  onClick={onBack || (() => window.history.back())}
                  className="px-8 py-4 bg-coral text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold text-lg"
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  Book Your First Trip
                </motion.button>
              </GlassCard>
            ) : (
              <div className="space-y-6">
                {/* Summary Stats */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <GlassCard className="p-6 text-center">
                    <div className="text-3xl font-bold text-slate-blue mb-2">{bookings.length}</div>
                    <div className="text-gray-600">Total Bookings</div>
                  </GlassCard>
                  <GlassCard className="p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {bookings.filter(b => b.booking_status === 'Confirmed').length}
                    </div>
                    <div className="text-gray-600">Confirmed</div>
                  </GlassCard>
                  <GlassCard className="p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      Rs. {(bookings.filter(b => b.booking_status === 'Confirmed').reduce((sum, b) => sum + (parseFloat(b.amount_paid) || 0), 0) || 0).toFixed(2)}
                    </div>
                    <div className="text-gray-600">Total Spent</div>
                  </GlassCard>
                </motion.div>

                {/* Bookings Grid */}
                <div className="grid gap-6">
                  {bookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <GlassCard className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          {/* Booking Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="text-2xl">🚌</span>
                              <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                  {booking.origin} → {booking.destination}
                                </h3>
                                <p className="text-gray-600">
                                  {new Date(booking.travel_date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-semibold text-gray-700">Booking ID:</span>
                                <p className="text-slate-blue font-mono">{booking.booking_uuid}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">Seat:</span>
                                <p className="text-gray-800">{booking.seat_number}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">Passenger:</span>
                                <p className="text-gray-800">{booking.passenger_name}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">Amount:</span>
                                <p className="text-green-600 font-semibold">Rs. {booking.amount_paid}</p>
                              </div>
                            </div>
                          </div>

                          {/* Status and Actions */}
                          <div className="flex flex-col items-end gap-4">
                            <motion.div
                              className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${getStatusColor(booking.booking_status)}`}
                              whileHover={{ scale: 1.05 }}
                            >
                              <span>{getStatusIcon(booking.booking_status)}</span>
                              {booking.booking_status}
                            </motion.div>

                            {booking.booking_status === 'Confirmed' && (
                              <motion.button
                                onClick={() => handleCancelBooking(booking.booking_uuid)}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Cancel Booking
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;