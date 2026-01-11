import React, { useState, useEffect } from 'react';
import { busAPI } from '../services/api';
import GlassCard from './GlassCard';
import { motion } from 'framer-motion';

const HomePage = ({ onSelectSchedule }) => {
    const [routes, setRoutes] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [filteredSchedules, setFilteredSchedules] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [busTypeFilter, setBusTypeFilter] = useState('all');

    // Fetch routes on component mount
    useEffect(() => {
        fetchRoutes();
    }, []);

    // Fetch schedules when route is selected
    useEffect(() => {
        if (selectedRoute) {
            fetchSchedules(selectedRoute);
        } else {
            setSchedules([]);
        }
    }, [selectedRoute]);

    // Filter schedules based on date, time, and bus type
    useEffect(() => {
        applyFilters();
    }, [schedules, selectedDate, selectedTime, busTypeFilter]);

    const applyFilters = () => {
        let filtered = [...schedules];

        // Filter by date
        if (selectedDate) {
            filtered = filtered.filter(schedule => {
                const scheduleDate = new Date(schedule.travel_date).toISOString().split('T')[0];
                return scheduleDate === selectedDate;
            });
        }

        // Filter by time
        if (selectedTime) {
            filtered = filtered.filter(schedule => {
                const scheduleTime = schedule.departure_time.substring(0, 5);
                return scheduleTime >= selectedTime;
            });
        }

        // Filter by bus type
        if (busTypeFilter !== 'all') {
            filtered = filtered.filter(schedule => 
                schedule.bus_type.toLowerCase() === busTypeFilter.toLowerCase()
            );
        }

        setFilteredSchedules(filtered);
    };

    const clearFilters = () => {
        setSelectedDate('');
        setSelectedTime('');
        setBusTypeFilter('all');
    };

    const fetchRoutes = async () => {
        try {
            setLoading(true);
            const data = await busAPI.getRoutes();
            setRoutes(data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load routes. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedules = async (routeId) => {
        try {
            setLoading(true);
            const data = await busAPI.getSchedules(routeId);
            setSchedules(data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load schedules. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <div className="min-h-screen pt-4 sm:pt-6 md:pt-8 pb-8 sm:pb-10 md:pb-12 px-3 sm:px-4 md:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <motion.div
                    className="text-center mb-6 sm:mb-8 md:mb-12"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <motion.h1
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-blue mb-3 sm:mb-4 px-2"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <span className="inline-block">🚌</span>
                        <span className="hidden sm:inline"> Bus Seat Booking System</span>
                        <span className="sm:hidden"> Bus Booking</span>
                    </motion.h1>
                    <motion.p
                        className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <span className="hidden md:inline">Professional bus ticket booking with real-time seat selection. Travel comfortably with our premium fleet.</span>
                        <span className="md:hidden">Book bus tickets with real-time seat selection.</span>
                    </motion.p>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-4 sm:mb-6 fade-in text-sm sm:text-base">
                        <p>{error}</p>
                    </div>
                )}

                {/* Route Selection */}
                <GlassCard className="p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-blue mb-4 sm:mb-6 text-center">
                        Select Your Route
                    </h2>
                    
                    {loading && routes.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading routes...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {routes.map((route) => (
                                <button
                                    key={route.id}
                                    onClick={() => setSelectedRoute(route.id)}
                                    className={`p-4 sm:p-5 md:p-6 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg ${
                                        selectedRoute === route.id
                                            ? 'border-coral bg-coral/10 shadow-lg sm:scale-105'
                                            : 'border-gray-200 hover:border-slate-blue/50 hover:bg-slate-blue/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                                        <span className="text-xs sm:text-sm font-medium text-slate-blue">Route #{route.id}</span>
                                        <span className="text-xs bg-slate-blue/10 text-slate-blue px-2 sm:px-3 py-1 rounded-full font-semibold">
                                            {route.duration}
                                        </span>
                                    </div>
                                    <div className="text-lg sm:text-xl font-bold text-slate-blue mb-2">
                                        {route.origin} → {route.destination}
                                    </div>
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <span className="text-gray-600">{route.distance_km} km</span>
                                        <span className="font-bold text-coral text-base sm:text-lg">
                                            Rs. {route.base_price}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* Schedule Selection */}
                {selectedRoute && (
                    <GlassCard className="p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-blue mb-4 sm:mb-6 text-center">
                            Available Schedules
                        </h2>

                        {/* Advanced Filters */}
                        <motion.div 
                            className="mb-6 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-slate-blue/5 to-indigo-50 border border-slate-blue/10"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-blue flex items-center gap-2">
                                    <span>🔍</span>
                                    <span>Filter Schedules</span>
                                </h3>
                                {(selectedDate || selectedTime || busTypeFilter !== 'all') && (
                                    <motion.button
                                        onClick={clearFilters}
                                        className="text-xs sm:text-sm text-coral hover:text-orange-600 font-semibold transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Clear All
                                    </motion.button>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                {/* Date Filter */}
                                <div className="relative">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        📅 Travel Date
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent transition-all text-sm sm:text-base"
                                    />
                                </div>

                                {/* Time Filter */}
                                <div className="relative">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        ⏰ Departure Time (After)
                                    </label>
                                    <input
                                        type="time"
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent transition-all text-sm sm:text-base"
                                    />
                                </div>

                                {/* Bus Type Filter */}
                                <div className="relative">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                        🚌 Bus Type
                                    </label>
                                    <select
                                        value={busTypeFilter}
                                        onChange={(e) => setBusTypeFilter(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent transition-all text-sm sm:text-base appearance-none cursor-pointer"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="AC">AC</option>
                                        <option value="Non-AC">Non-AC</option>
                                        <option value="Luxury">Luxury</option>
                                        <option value="Semi-Luxury">Semi-Luxury</option>
                                    </select>
                                </div>

                                {/* Results Count */}
                                <div className="flex items-end">
                                    <div className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-signal-green/10 to-green-50 border-2 border-signal-green/20 rounded-lg">
                                        <p className="text-xs text-gray-600 mb-1">Results Found</p>
                                        <p className="text-xl sm:text-2xl font-bold text-signal-green">{filteredSchedules.length}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {loading && schedules.length === 0 ? (
                            <div className="text-center py-6 sm:py-8">
                                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="text-gray-600 mt-3 sm:mt-4 text-sm sm:text-base">Loading schedules...</p>
                            </div>
                        ) : filteredSchedules.length === 0 ? (
                            <div className="text-center py-6 sm:py-8">
                                <p className="text-gray-600 text-base sm:text-lg mb-3">
                                    {schedules.length === 0 ? 'No schedules available for this route.' : 'No schedules match your filters.'}
                                </p>
                                {schedules.length > 0 && (
                                    <motion.button
                                        onClick={clearFilters}
                                        className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-orange-600 transition-all font-semibold text-sm"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Clear Filters
                                    </motion.button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {filteredSchedules.map((schedule) => (
                                    <div
                                        key={schedule.id}
                                        className="border border-slate-blue/20 rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/50 to-slate-blue/5"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className="bg-signal-green/20 text-signal-green text-xs font-bold px-2 sm:px-3 py-1 rounded-full border border-signal-green/30">
                                                        {schedule.bus_type}
                                                    </span>
                                                    <span className="text-xs sm:text-sm text-slate-blue font-medium">
                                                        Bus: {schedule.bus_number}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                                                    <div>
                                                        <p className="text-gray-500">Date</p>
                                                        <p className="font-semibold text-gray-800">
                                                            {formatDate(schedule.travel_date)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500">Departure</p>
                                                        <p className="font-semibold text-gray-800">
                                                            {formatTime(schedule.departure_time)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 sm:gap-4 justify-between md:justify-start">
                                                <div className="text-center">
                                                    <p className="text-xs sm:text-sm text-gray-500">Available Seats</p>
                                                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                                                        {schedule.available_seats}/{schedule.total_seats}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => onSelectSchedule(schedule)}
                                                    disabled={schedule.available_seats === 0}
                                                    className={`px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 transform hover:scale-105 ${
                                                        schedule.available_seats === 0
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-coral text-white hover:bg-coral/90 shadow-lg hover:shadow-xl'
                                                    }`}
                                                >
                                                    {schedule.available_seats === 0 ? 'Sold Out' : 'Select Seats'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                )}

                {/* Info Section */}
                {!selectedRoute && (
                    <GlassCard className="p-4 sm:p-6 md:p-8">
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-blue mb-6 sm:mb-8 text-center">
                            How to Book Your Journey
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                            <motion.div
                                className="text-center p-4 sm:p-5 md:p-6 rounded-xl bg-gradient-to-br from-coral/10 to-coral/5 border border-coral/20"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="bg-coral/20 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <span className="text-3xl sm:text-4xl">1️⃣</span>
                                </div>
                                <h4 className="font-bold text-slate-blue mb-2 text-base sm:text-lg">Select Route</h4>
                                <p className="text-gray-600 text-sm sm:text-base">Choose your origin and destination from our extensive network</p>
                            </motion.div>
                            <motion.div
                                className="text-center p-4 sm:p-5 md:p-6 rounded-xl bg-gradient-to-br from-signal-green/10 to-signal-green/5 border border-signal-green/20"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="bg-signal-green/20 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <span className="text-3xl sm:text-4xl">2️⃣</span>
                                </div>
                                <h4 className="font-bold text-slate-blue mb-2 text-base sm:text-lg">Pick Schedule</h4>
                                <p className="text-gray-600 text-sm sm:text-base">Select date and time that suits your travel preferences</p>
                            </motion.div>
                            <motion.div
                                className="text-center p-4 sm:p-5 md:p-6 rounded-xl bg-gradient-to-br from-slate-blue/10 to-slate-blue/5 border border-slate-blue/20 sm:col-span-2 md:col-span-1"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="bg-slate-blue/20 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                    <span className="text-3xl sm:text-4xl">3️⃣</span>
                                </div>
                                <h4 className="font-bold text-slate-blue mb-2 text-base sm:text-lg">Choose Seat</h4>
                                <p className="text-gray-600 text-sm sm:text-base">Pick your preferred seat and complete your booking instantly</p>
                            </motion.div>
                        </div>
                    </GlassCard>
                )}
            </div>
        </div>
    );
};

export default HomePage;
