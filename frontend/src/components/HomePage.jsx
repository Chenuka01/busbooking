import React, { useState, useEffect } from 'react';
import { busAPI } from '../services/api';
import GlassCard from './GlassCard';
import { motion } from 'framer-motion';

const HomePage = ({ onSelectSchedule }) => {
    const [routes, setRoutes] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        <div className="min-h-screen pt-8 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <motion.h1
                        className="text-6xl font-bold text-slate-blue mb-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        🚌 Bus Seat Booking System
                    </motion.h1>
                    <motion.p
                        className="text-xl text-gray-600 max-w-2xl mx-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        Professional bus ticket booking with real-time seat selection.
                        Travel comfortably with our premium fleet.
                    </motion.p>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 fade-in">
                        <p>{error}</p>
                    </div>
                )}

                {/* Route Selection */}
                <GlassCard className="p-8 mb-8">
                    <h2 className="text-3xl font-bold text-slate-blue mb-6 text-center">
                        Select Your Route
                    </h2>
                    
                    {loading && routes.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading routes...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {routes.map((route) => (
                                <button
                                    key={route.id}
                                    onClick={() => setSelectedRoute(route.id)}
                                    className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg ${
                                        selectedRoute === route.id
                                            ? 'border-coral bg-coral/10 shadow-lg scale-105'
                                            : 'border-gray-200 hover:border-slate-blue/50 hover:bg-slate-blue/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-slate-blue">Route #{route.id}</span>
                                        <span className="text-xs bg-slate-blue/10 text-slate-blue px-3 py-1 rounded-full font-semibold">
                                            {route.duration}
                                        </span>
                                    </div>
                                    <div className="text-xl font-bold text-slate-blue mb-2">
                                        {route.origin} → {route.destination}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">{route.distance_km} km</span>
                                        <span className="font-bold text-coral text-lg">
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
                    <GlassCard className="p-8 mb-8">
                        <h2 className="text-3xl font-bold text-slate-blue mb-6 text-center">
                            Available Schedules
                        </h2>

                        {loading && schedules.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="text-gray-600 mt-4">Loading schedules...</p>
                            </div>
                        ) : schedules.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600 text-lg">
                                    No schedules available for this route.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {schedules.map((schedule) => (
                                    <div
                                        key={schedule.id}
                                        className="border border-slate-blue/20 rounded-xl p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white/50 to-slate-blue/5"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-signal-green/20 text-signal-green text-xs font-bold px-3 py-1 rounded-full border border-signal-green/30">
                                                        {schedule.bus_type}
                                                    </span>
                                                    <span className="text-sm text-slate-blue font-medium">
                                                        Bus: {schedule.bus_number}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-4 text-sm">
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

                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-500">Available Seats</p>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {schedule.available_seats}/{schedule.total_seats}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => onSelectSchedule(schedule)}
                                                    disabled={schedule.available_seats === 0}
                                                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
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
                    <GlassCard className="p-8">
                        <h3 className="text-3xl font-bold text-slate-blue mb-8 text-center">
                            How to Book Your Journey
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <motion.div
                                className="text-center p-6 rounded-xl bg-gradient-to-br from-coral/10 to-coral/5 border border-coral/20"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="bg-coral/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">1️⃣</span>
                                </div>
                                <h4 className="font-bold text-slate-blue mb-2 text-lg">Select Route</h4>
                                <p className="text-gray-600">Choose your origin and destination from our extensive network</p>
                            </motion.div>
                            <motion.div
                                className="text-center p-6 rounded-xl bg-gradient-to-br from-signal-green/10 to-signal-green/5 border border-signal-green/20"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="bg-signal-green/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">2️⃣</span>
                                </div>
                                <h4 className="font-bold text-slate-blue mb-2 text-lg">Pick Schedule</h4>
                                <p className="text-gray-600">Select date and time that suits your travel preferences</p>
                            </motion.div>
                            <motion.div
                                className="text-center p-6 rounded-xl bg-gradient-to-br from-slate-blue/10 to-slate-blue/5 border border-slate-blue/20"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="bg-slate-blue/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">3️⃣</span>
                                </div>
                                <h4 className="font-bold text-slate-blue mb-2 text-lg">Choose Seat</h4>
                                <p className="text-gray-600">Pick your preferred seat and complete your booking instantly</p>
                            </motion.div>
                        </div>
                    </GlassCard>
                )}
            </div>
        </div>
    );
};

export default HomePage;
