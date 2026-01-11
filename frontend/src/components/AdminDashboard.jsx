import React, { useState, useEffect } from 'react';
import { busAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GlassCard from './GlassCard';
import { motion } from 'framer-motion';

const AdminDashboard = ({ userView = false }) => {
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [popularRoutes, setPopularRoutes] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const { user, isAdmin } = useAuth();

    useEffect(() => {
        fetchBookings();
        if (isAdmin && !userView) {
            fetchStats();
            fetchPopularRoutes();
        }
    }, [userView]);

    useEffect(() => {
        filterBookings();
        setSelectedIds([]);
    }, [searchTerm, bookings]);

    const { showToast } = useToast();

    // support legacy global events (used in components without context access)
    React.useEffect(() => {
        const handler = (e) => {
            const { type, message } = e.detail || {};
            if (type && message) showToast(type, message);
        };
        window.addEventListener('app:toast', handler);
        return () => window.removeEventListener('app:toast', handler);
    }, [showToast]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await busAPI.getAllBookings();
            setBookings(data.data || []);
            setError(null);
        } catch (err) {
            const msg = err.response?.status === 401 
                ? 'Please login to view bookings' 
                : 'Failed to load bookings. Please try again.';
            setError(msg);
            showToast('error', msg);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await adminAPI.getStats();
            setStats(data.data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const fetchPopularRoutes = async () => {
        try {
            const data = await adminAPI.getPopularRoutes();
            setPopularRoutes(data.data || []);
        } catch (err) {
            console.error('Failed to fetch popular routes:', err);
        }
    };



    const handleCancelBooking = async (bookingUuid) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            await busAPI.cancelBooking(bookingUuid);
            showToast('success', 'Booking cancelled successfully');
            fetchBookings();
            if (isAdmin && !userView) fetchStats();
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const handleBulkCancel = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Cancel ${selectedIds.length} booking(s)?`)) return;
        try {
            await adminAPI.bulkCancelBookings(selectedIds);
            fetchBookings();
            showToast('success', `Cancelled ${selectedIds.length} booking(s)`);
            if (isAdmin && !userView) fetchStats();
            setSelectedIds([]);
        } catch (err) {
                const msg = err.response?.data?.message || 'Failed to cancel bookings';
                showToast('error', msg);
                console.error(err);
            }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Delete ${selectedIds.length} booking(s)? This cannot be undone.`)) return;
        try {
            await adminAPI.bulkDeleteBookings(selectedIds);
            fetchBookings();
            showToast('success', `Deleted ${selectedIds.length} booking(s)`);
            if (isAdmin && !userView) fetchStats();
            setSelectedIds([]);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to delete bookings';
            showToast('error', msg);
            console.error(err);
        }
    };
       
    const handleReactivate = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Reactivate ${selectedIds.length} cancelled booking(s)?`)) return;
        try {
            await adminAPI.reactivateBookings(selectedIds);
            fetchBookings();
            showToast('success', `Reactivated ${selectedIds.length} booking(s)`);
            if (isAdmin && !userView) fetchStats();
            setSelectedIds([]);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to reactivate bookings';
            showToast('error', msg);
            console.error(err);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredBookings.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredBookings.map((b) => b.booking_uuid));
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const filterBookings = () => {
        if (!searchTerm) {
            setFilteredBookings(bookings);
            return;
        }

        const filtered = bookings.filter((booking) =>
            booking.booking_uuid.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.passenger_phone.includes(searchTerm) ||
            booking.seat_number.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredBookings(filtered);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        return `${hours}:${minutes}`;
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            Confirmed: 'bg-green-100 text-green-800',
            Cancelled: 'bg-red-100 text-red-800',
            Completed: 'bg-blue-100 text-blue-800',
        };

        return (
            <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    statusStyles[status] || 'bg-gray-100 text-gray-800'
                }`}
            >
                {status}
            </span>
        );
    };

    const dashboardTitle = userView ? 'My Bookings' : 'Admin Dashboard';
    const showStats = isAdmin && !userView && stats;

    return (
        <div className="min-h-screen py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-6 sm:mb-8"
                >
                    <GlassCard className="p-4 sm:p-6 md:p-8">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-blue mb-2">
                            {userView ? '📋 My Bookings' : '📊 Admin Dashboard'}
                        </h1>
                        <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                            {userView ? 'View and manage your bookings' : 'Manage and monitor all bookings'}
                        </p>
                    </GlassCard>
                </motion.div>

                {/* Stats Cards - Admin Only */}
                {showStats && (
                    <motion.div
                        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <motion.div
                            whileHover={{ y: -5 }}
                            transition={{ duration: 0.3 }}
                        >
                            <GlassCard className="p-3 sm:p-4 md:p-6">
                                <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Total Bookings</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-blue">{stats.totalBookings}</p>
                                <div className="mt-2 sm:mt-3 text-xs text-gray-500">📊 All time</div>
                            </GlassCard>
                        </motion.div>
                        <motion.div
                            whileHover={{ y: -5 }}
                            transition={{ duration: 0.3 }}
                        >
                            <GlassCard className="p-3 sm:p-4 md:p-6">
                                <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Total Revenue</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-signal-green">
                                    <span className="hidden sm:inline">Rs. </span>
                                    <span className="sm:hidden text-base">Rs.</span>
                                    {stats.totalRevenue.toFixed(0)}
                                </p>
                                <div className="mt-2 sm:mt-3 text-xs text-gray-500">💰 Earnings</div>
                            </GlassCard>
                        </motion.div>
                        <motion.div
                            whileHover={{ y: -5 }}
                            transition={{ duration: 0.3 }}
                        >
                            <GlassCard className="p-3 sm:p-4 md:p-6">
                                <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Today's Bookings</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-coral">{stats.todayBookings}</p>
                                <div className="mt-2 sm:mt-3 text-xs text-gray-500">📅 Today</div>
                            </GlassCard>
                        </motion.div>
                        <motion.div
                            whileHover={{ y: -5 }}
                            transition={{ duration: 0.3 }}
                        >
                            <GlassCard className="p-3 sm:p-4 md:p-6">
                                <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Active Users</p>
                                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-indigo-600">{stats.activeUsers}</p>
                                <div className="mt-2 sm:mt-3 text-xs text-gray-500">👥 Users</div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}

                {/* Popular Routes - Admin Only */}
                {isAdmin && !userView && popularRoutes.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mb-6 sm:mb-8"
                    >
                        <GlassCard className="p-4 sm:p-5 md:p-6">
                            <h2 className="text-xl sm:text-2xl font-semibold text-slate-blue mb-4 sm:mb-6">🔥 Popular Routes</h2>
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Route</th>
                                            <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700">Bookings</th>
                                            <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {popularRoutes.slice(0, 5).map((route, idx) => (
                                            <motion.tr
                                                key={idx}
                                                className="border-b border-gray-100 hover:bg-white/50 transition-colors"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                            >
                                                <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-800 text-xs sm:text-base">
                                                    {route.origin} → {route.destination}
                                                </td>
                                                <td className="text-right py-2 sm:py-3 px-2 sm:px-4 text-slate-blue font-semibold text-xs sm:text-base">
                                                    {route.total_bookings || 0}
                                                </td>
                                                <td className="text-right py-2 sm:py-3 px-2 sm:px-4 text-signal-green font-semibold text-xs sm:text-base hidden sm:table-cell">
                                                    Rs. {parseFloat(route.total_revenue || 0).toFixed(2)}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <GlassCard className="p-4 mb-6 bg-red-50/80 border-red-200">
                            <p className="text-red-700 font-medium">⚠️ {error}</p>
                        </GlassCard>
                    </motion.div>
                )}

                {/* Bookings Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <GlassCard className="p-4 sm:p-5 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                            <h2 className="text-xl sm:text-2xl font-semibold text-slate-blue">
                                {userView ? '📋 Your Bookings' : '📊 All Bookings'}
                            </h2>

                            {/* Search Bar */}
                            <div className="relative w-full sm:w-auto">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search bookings..."
                                    className="w-full sm:w-60 md:w-80 px-3 sm:px-4 py-2 pl-9 sm:pl-10 text-sm bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent transition-all"
                                />
                                <svg
                                    className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div>

                    {!userView && isAdmin && (
                        <motion.div
                            className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                        >
                            <motion.button
                                onClick={handleBulkCancel}
                                disabled={selectedIds.length === 0}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-semibold text-white ${selectedIds.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-coral hover:bg-orange-600'} transition-all`}
                                whileHover={selectedIds.length > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedIds.length > 0 ? { scale: 0.95 } : {}}
                            >
                                🚫 Cancel Selected
                            </motion.button>
                            <motion.button
                                onClick={handleReactivate}
                                disabled={selectedIds.length === 0}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-semibold text-white ${selectedIds.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-signal-green hover:bg-green-700'} transition-all`}
                                whileHover={selectedIds.length > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedIds.length > 0 ? { scale: 0.95 } : {}}
                            >
                                ✅ Reactivate Selected
                            </motion.button>
                            <motion.button
                                onClick={handleBulkDelete}
                                disabled={selectedIds.length === 0}
                                className={`px-4 py-2 rounded-lg font-semibold text-white ${selectedIds.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-signal-red hover:bg-red-700'} transition-all`}
                                whileHover={selectedIds.length > 0 ? { scale: 1.05 } : {}}
                                whileTap={selectedIds.length > 0 ? { scale: 0.95 } : {}}
                            >
                                🗑️ Delete Selected
                            </motion.button>
                            <span className="text-sm text-gray-600 self-center px-3 py-2 bg-white/50 rounded-lg">
                                {selectedIds.length} selected
                            </span>
                        </motion.div>
                    )}

                    {loading ? (
                        <div className="text-center py-16">
                            <motion.div
                                className="inline-block"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <div className="w-16 h-16 border-4 border-slate-blue border-t-transparent rounded-full"></div>
                            </motion.div>
                            <p className="text-gray-600 mt-6 text-lg">Loading bookings...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <motion.div
                            className="text-center py-16"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-gray-600 text-xl">
                                {searchTerm ? 'No bookings found matching your search.' : 'No bookings yet.'}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/50 backdrop-blur-sm border-b-2 border-gray-200">
                                    <tr>
                                        {!userView && isAdmin && (
                                            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.length === filteredBookings.length && filteredBookings.length > 0}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                        )}
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Booking ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Passenger
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Route
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Seat
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Travel Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white/30 backdrop-blur-sm divide-y divide-gray-200">
                                    {filteredBookings.map((booking, index) => (
                                        <motion.tr
                                            key={booking.id}
                                            className="hover:bg-white/60 transition-all"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 1) }}
                                        >
                                            {!userView && isAdmin && (
                                                <td className="px-3 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(booking.booking_uuid)}
                                                        onChange={() => toggleSelectOne(booking.booking_uuid)}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="text-xs font-mono text-blue-600">
                                                    {booking.booking_uuid.substring(0, 8)}...
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {booking.passenger_name}
                                                    </p>
                                                    {booking.passenger_email && (
                                                        <p className="text-xs text-gray-500">
                                                            {booking.passenger_email}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {booking.passenger_phone}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {booking.origin} → {booking.destination}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Bus: {booking.bus_number}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-gray-800">
                                                    {booking.seat_number}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className="text-sm text-gray-800">
                                                        {formatDate(booking.travel_date)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatTime(booking.departure_time)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-green-600">
                                                    Rs. {booking.amount_paid}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {getStatusBadge(booking.booking_status)}
                                                {booking.booking_status === 'Cancelled' && booking.cancellation_reason && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        {booking.cancellation_reason}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {booking.booking_status === 'Confirmed' && (
                                                    <motion.button
                                                        onClick={() => handleCancelBooking(booking.booking_uuid)}
                                                        className="text-signal-red hover:text-red-800 text-sm font-semibold px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        Cancel
                                                    </motion.button>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassCard>
            </motion.div>
        </div>
    </div>
    );
};
  
export default AdminDashboard;
