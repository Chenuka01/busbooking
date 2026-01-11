import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GlassCard from './GlassCard';
import { motion } from 'framer-motion';
import api from '../services/api';

const Profile = ({ onBack }) => {
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [totalBookings, setTotalBookings] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  // Fetch total bookings for this user (admins will get all bookings)
  useEffect(() => {
    const fetchTotalBookings = async () => {
      setStatsLoading(true);
      try {
        const response = await api.get('/bookings');
        // Backend returns `count` and `data`
        const count = response.data?.count ?? (response.data?.data?.length ?? 0);
        setTotalBookings(count);
      } catch (err) {
        console.error('Error fetching bookings count:', err);
        showToast('error', 'Failed to load booking statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) fetchTotalBookings();

    // Listen for booking updates (created/cancelled) to refresh count
    const onBookingsUpdated = () => {
      fetchTotalBookings();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('bookings:updated', onBookingsUpdated);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('bookings:updated', onBookingsUpdated);
      }
    };
  }, [user, showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/auth/profile', {
        fullName: formData.fullName,
        phone: formData.phone
      });

      if (response.data.success) {
        // Update the user context with new data
        await refreshUser();
        showToast('success', 'Profile updated successfully');
        setIsEditing(false);
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to update profile';
      showToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-blue mb-4">Please Login</h2>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.button
              onClick={onBack || (() => window.history.back())}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Back
            </motion.button>
            <motion.h1
              className="text-5xl font-bold text-slate-blue"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              👤 My Profile
            </motion.h1>
          </div>
          <motion.p
            className="text-xl text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Manage your account information and preferences
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-slate-blue">Personal Information</h2>
                {!isEditing && (
                  <motion.button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-coral text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✏️ Edit Profile
                  </motion.button>
                )}
              </div>

              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-blue mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800 font-medium">
                      {user.fullName || 'Not provided'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-blue mb-2">
                    Email Address
                  </label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800 font-medium">
                    {user.email}
                    <span className="ml-2 text-green-500 text-sm">✓ Verified</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-blue mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent transition-all"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800 font-medium">
                      {user.phone || 'Not provided'}
                    </div>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-slate-blue mb-2">
                    Account Type
                  </label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? '👑 Administrator' : '👤 Regular User'}
                    </span>
                  </div>
                </div>

                {/* Edit Actions */}
                {isEditing && (
                  <motion.div
                    className="flex gap-4 pt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-signal-green text-white rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? '💾 Saving...' : '💾 Save Changes'}
                    </motion.button>
                    <motion.button
                      onClick={handleCancel}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      ❌ Cancel
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Account Actions */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-slate-blue mb-4">Account Actions</h3>
              <div className="space-y-3">
                <motion.button
                  onClick={logout}
                  className="w-full px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-left"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🚪 Logout
                </motion.button>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-slate-blue mb-4">Account Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold text-slate-blue">
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Bookings</span>
                  <span className="font-semibold text-signal-green">
                    {statsLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        <span className="text-sm text-gray-600">Loading...</span>
                      </span>
                    ) : (
                      totalBookings
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    Active
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;