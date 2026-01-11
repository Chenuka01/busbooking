import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GlassCard from './GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'http://localhost:5000/api';

const ScheduleManagement = () => {
    const { user, isAdmin, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('schedules'); // schedules, routes, buses
    const [schedules, setSchedules] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    const { showToast } = useToast();

    useEffect(() => {
        // Check if user is admin before fetching
        if (!isAuthenticated) {
            showToast('error', 'Please login to access this page.');
            window.location.href = '/';
            return;
        }
        
        if (!isAdmin) {
            showToast('error', 'Access denied. Admin privileges required.');
            window.location.href = '/';
            return;
        }
        
        fetchData();
    }, [activeTab, isAuthenticated, isAdmin]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found. Please login again.');
            showToast('error', 'Session expired. Please login again.');
            window.location.href = '/';
            return null;
        }
        
        console.log('🔑 Token found:', token.substring(0, 20) + '...');
        console.log('👤 User:', user);
        console.log('🔐 Is Admin:', isAdmin);
        
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const authHeaders = getAuthHeaders();
            if (!authHeaders) return; // Token check failed
            
            console.log('📡 Fetching data for tab:', activeTab);
            console.log('📋 Auth headers:', authHeaders);
            
            if (activeTab === 'schedules') {
                console.log('➡️ GET', `${API_URL}/admin/schedules`);
                const res = await axios.get(`${API_URL}/admin/schedules`, authHeaders);
                console.log('✅ Schedules response:', res.data);
                setSchedules(res.data.data || []);
            } else if (activeTab === 'routes') {
                console.log('➡️ GET', `${API_URL}/routes`);
                const res = await axios.get(`${API_URL}/routes`); // Public endpoint
                console.log('✅ Routes response:', res.data);
                setRoutes(res.data.data || []);
            } else if (activeTab === 'buses') {
                console.log('➡️ GET', `${API_URL}/admin/buses`);
                const res = await axios.get(`${API_URL}/admin/buses`, authHeaders);
                console.log('✅ Buses response:', res.data);
                setBuses(res.data.data || []);
            }
        } catch (error) {
            console.error('❌ Error fetching data:', error);
            console.error('❌ Error response:', error.response);
            console.error('❌ Error status:', error.response?.status);
            console.error('❌ Error data:', error.response?.data);
            
            const errorMsg = error.response?.data?.message || 'Failed to fetch data';
            
            // Check for auth errors
            if (error.response?.status === 401 || error.response?.status === 403) {
                const message = error.response?.data?.message || 'Session expired';
                console.log('🔴 Auth error:', message);
                
                // Clear all auth data
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                
                // Show toast and redirect
                showToast('error', `${message} - please login again as admin.`);
                // Force reload to trigger logout
                window.location.href = '/';
            } else {
                showToast('error', errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

        try {
            const authHeaders = getAuthHeaders();
            if (!authHeaders) return;
            
            const endpoint = type === 'schedule' ? `/admin/schedules/${id}` 
                : type === 'route' ? `/admin/routes/${id}`
                : `/admin/buses/${id}`;
            
            await axios.delete(`${API_URL}${endpoint}`, authHeaders);
            showToast('success', `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
            fetchData();
        } catch (error) {
            showToast('error', error.response?.data?.message || `Failed to delete ${type}`);
        }
    };

    const openForm = (item = null) => {
        setCurrentItem(item);
        setEditMode(!!item);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setCurrentItem(null);
        setEditMode(false);
    };

    const tabLabel = {
        schedules: 'Schedule',
        routes: 'Route',
        buses: 'Bus'
    };

    const tabType = {
        schedules: 'schedule',
        routes: 'route',
        buses: 'bus'
    };

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-8"
                >
                    <GlassCard className="p-8">
                        <h1 className="text-4xl font-bold text-slate-blue mb-2">📅 Schedule Management</h1>
                        <p className="text-gray-600 text-lg">Manage schedules, routes, and buses</p>
                    </GlassCard>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-6"
                >
                    <GlassCard className="p-2">
                        <div className="flex gap-2">
                            <motion.button
                                onClick={() => setActiveTab('schedules')}
                                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                                    activeTab === 'schedules'
                                        ? 'bg-slate-blue text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-white/50'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                🗓️ Schedules
                            </motion.button>
                            <motion.button
                                onClick={() => setActiveTab('routes')}
                                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                                    activeTab === 'routes'
                                        ? 'bg-slate-blue text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-white/50'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                🛣️ Routes
                            </motion.button>
                            <motion.button
                                onClick={() => setActiveTab('buses')}
                                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                                    activeTab === 'buses'
                                        ? 'bg-slate-blue text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-white/50'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                🚌 Buses
                            </motion.button>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Add Button */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <motion.button
                        onClick={() => openForm()}
                        className="bg-coral hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        ➕ Add New {tabLabel[activeTab]}
                    </motion.button>
                </motion.div>

                {/* Content */}
                {loading ? (
                    <motion.div
                        className="text-center py-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="inline-block"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <div className="w-16 h-16 border-4 border-slate-blue border-t-transparent rounded-full"></div>
                        </motion.div>
                        <p className="text-gray-600 mt-6 text-lg">Loading...</p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        {activeTab === 'schedules' && (
                            <ScheduleTable 
                                schedules={schedules} 
                                onEdit={openForm} 
                                onDelete={(id) => handleDelete(id, 'schedule')}
                            />
                        )}
                        {activeTab === 'routes' && (
                            <RouteTable 
                                routes={routes} 
                                onEdit={openForm} 
                                onDelete={(id) => handleDelete(id, 'route')}
                            />
                        )}
                        {activeTab === 'buses' && (
                            <BusTable 
                                buses={buses} 
                                onEdit={openForm} 
                                onDelete={(id) => handleDelete(id, 'bus')}
                            />
                        )}
                    </motion.div>
                )}

                {/* Form Modal */}
                {showForm && (
                    <FormModal
                        type={tabType[activeTab]}
                        item={currentItem}
                        editMode={editMode}
                        onClose={closeForm}
                        onSuccess={() => {
                            closeForm();
                            fetchData();
                        }}
                        routes={routes}
                        buses={buses}
                    />
                )}
            </div>
        </div>
    );
};

// Schedule Table Component
const ScheduleTable = ({ schedules, onEdit, onDelete }) => (
    <GlassCard className="p-6 overflow-hidden">
        <h3 className="text-xl font-semibold text-slate-blue mb-4">📄 Schedule List</h3>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-white/50 backdrop-blur-sm border-b-2 border-gray-200">
                <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Route</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bus</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Seats</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white/30 backdrop-blur-sm divide-y divide-gray-200">
                    {schedules.map((schedule, index) => (
                        <motion.tr
                            key={schedule.id}
                            className="hover:bg-white/60 transition-all"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 1) }}
                        >
                        <td className="px-4 py-3">{new Date(schedule.travel_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{schedule.origin} → {schedule.destination}</td>
                        <td className="px-4 py-3">{schedule.bus_number}</td>
                        <td className="px-4 py-3">{schedule.departure_time.substring(0, 5)}</td>
                        <td className="px-4 py-3">
                            {schedule.available_seats}/{schedule.total_seats} 
                            <span className="text-sm text-gray-500 ml-2">
                                ({schedule.booked_count} booked)
                            </span>
                        </td>
                        <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                                schedule.status === 'Scheduled' ? 'bg-green-100 text-green-800' :
                                schedule.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {schedule.status}
                            </span>
                        </td>
                            <td className="px-4 py-3">
                                <motion.button
                                    onClick={() => onEdit(schedule)}
                                    className="text-slate-blue hover:text-slate-700 mr-4 font-semibold"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    ✏️ Edit
                                </motion.button>
                                <motion.button
                                    onClick={() => onDelete(schedule.id)}
                                    className="text-signal-red hover:text-red-800 font-semibold"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    🗑️ Delete
                                </motion.button>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    </GlassCard>
);

// Route Table Component
const RouteTable = ({ routes, onEdit, onDelete }) => (
    <GlassCard className="p-6 overflow-hidden">
        <h3 className="text-xl font-semibold text-slate-blue mb-4">🛣️ Route List</h3>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-white/50 backdrop-blur-sm border-b-2 border-gray-200">
                <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Origin</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Destination</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Distance</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white/30 backdrop-blur-sm divide-y divide-gray-200">
                    {routes.map((route, index) => (
                        <motion.tr
                            key={route.id}
                            className="hover:bg-white/60 transition-all"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 1) }}
                        >
                        <td className="px-4 py-3">{route.origin}</td>
                        <td className="px-4 py-3">{route.destination}</td>
                        <td className="px-4 py-3">{route.duration || 'N/A'}</td>
                        <td className="px-4 py-3">{route.distance_km ? `${route.distance_km} km` : 'N/A'}</td>
                        <td className="px-4 py-3">Rs. {route.base_price}</td>
                            <td className="px-4 py-3">
                                <motion.button
                                    onClick={() => onDelete(route.id)}
                                    className="text-signal-red hover:text-red-800 font-semibold"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    🗑️ Delete
                                </motion.button>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    </GlassCard>
);

// Bus Table Component
const BusTable = ({ buses, onEdit, onDelete }) => (
    <GlassCard className="p-6 overflow-hidden">
        <h3 className="text-xl font-semibold text-slate-blue mb-4">🚌 Bus List</h3>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-white/50 backdrop-blur-sm border-b-2 border-gray-200">
                <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bus Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Seats</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Layout</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white/30 backdrop-blur-sm divide-y divide-gray-200">
                    {buses.map((bus, index) => (
                        <motion.tr
                            key={bus.id}
                            className="hover:bg-white/60 transition-all"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 1) }}
                        >
                        <td className="px-4 py-3 font-semibold">{bus.bus_number}</td>
                        <td className="px-4 py-3">{bus.bus_type}</td>
                        <td className="px-4 py-3">{bus.total_seats}</td>
                        <td className="px-4 py-3">{bus.layout_type}</td>
                        <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                                bus.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                                {bus.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                            <td className="px-4 py-3">
                                <motion.button
                                    onClick={() => onDelete(bus.id)}
                                    className="text-signal-red hover:text-red-800 font-semibold"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    🗑️ Delete
                                </motion.button>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    </GlassCard>
);

// Form Modal Component
const FormModal = ({ type, item, editMode, onClose, onSuccess, routes: allRoutes, buses: allBuses }) => {
    const [formData, setFormData] = useState(
        item || (type === 'schedule' 
            ? { route_id: '', bus_id: '', travel_date: '', departure_time: '', arrival_time: '', status: 'Scheduled' }
            : type === 'route'
            ? { origin: '', destination: '', duration: '', distance_km: '', base_price: '' }
            : { bus_number: '', total_seats: '', layout_type: '2x2', bus_type: 'Non-AC', is_active: true })
    );

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('authToken');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            if (type === 'schedule') {
                if (editMode) {
                    await axios.put(`${API_URL}/admin/schedules/${item.id}`, formData, config);
                } else {
                    await axios.post(`${API_URL}/admin/schedules`, formData, config);
                }
            } else if (type === 'route') {
                if (editMode) {
                    await axios.put(`${API_URL}/admin/routes/${item.id}`, formData, config);
                } else {
                    await axios.post(`${API_URL}/admin/routes`, formData, config);
                }
            } else if (type === 'bus') {
                if (editMode) {
                    await axios.put(`${API_URL}/admin/buses/${item.id}`, formData, config);
                } else {
                    await axios.post(`${API_URL}/admin/buses`, formData, config);
                }
            }

            showToast('success', `${type.charAt(0).toUpperCase() + type.slice(1)} ${editMode ? 'updated' : 'created'} successfully`);
            onSuccess();
        } catch (error) {
            showToast('error', error.response?.data?.message || `Failed to ${editMode ? 'update' : 'create'} ${type}`);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 50 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GlassCard className="p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-3xl font-bold text-slate-blue mb-6">
                            {editMode ? '✏️ Edit' : '➕ Add New'} {type.charAt(0).toUpperCase() + type.slice(1)}
                        </h2>
                <form onSubmit={handleSubmit}>
                    {type === 'schedule' && (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Route</label>
                                <select
                                    name="route_id"
                                    value={formData.route_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="">Select Route</option>
                                    {allRoutes.map(route => (
                                        <option key={route.id} value={route.id}>
                                            {route.origin} → {route.destination}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Bus</label>
                                <select
                                    name="bus_id"
                                    value={formData.bus_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="">Select Bus</option>
                                    {allBuses.map(bus => (
                                        <option key={bus.id} value={bus.id}>
                                            {bus.bus_number} ({bus.total_seats} seats)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Travel Date</label>
                                <input
                                    type="date"
                                    name="travel_date"
                                    value={formData.travel_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Departure Time</label>
                                <input
                                    type="time"
                                    name="departure_time"
                                    value={formData.departure_time}
                                    onChange={handleChange}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Arrival Time</label>
                                <input
                                    type="time"
                                    name="arrival_time"
                                    value={formData.arrival_time}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                        </>
                    )}

                    {type === 'route' && (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Origin</label>
                                <input
                                    type="text"
                                    name="origin"
                                    value={formData.origin}
                                    onChange={handleChange}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Destination</label>
                                <input
                                    type="text"
                                    name="destination"
                                    value={formData.destination}
                                    onChange={handleChange}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Duration</label>
                                <input
                                    type="text"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    placeholder="e.g., 3 hours"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Distance (km)</label>
                                <input
                                    type="number"
                                    name="distance_km"
                                    value={formData.distance_km}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Base Price (Rs.)</label>
                                <input
                                    type="number"
                                    name="base_price"
                                    value={formData.base_price}
                                    onChange={handleChange}
                                    required
                                    step="0.01"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                        </>
                    )}

                    {type === 'bus' && (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Bus Number</label>
                                <input
                                    type="text"
                                    name="bus_number"
                                    value={formData.bus_number}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., NA-1234"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Total Seats</label>
                                <input
                                    type="number"
                                    name="total_seats"
                                    value={formData.total_seats}
                                    onChange={handleChange}
                                    required
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Layout Type</label>
                                <select
                                    name="layout_type"
                                    value={formData.layout_type}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="2x2">2x2</option>
                                    <option value="2x3">2x3</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Bus Type</label>
                                <select
                                    name="bus_type"
                                    value={formData.bus_type}
                                    onChange={handleChange}
                                    className="w-full border rounded px-3 py-2"
                                >
                                    <option value="AC">AC</option>
                                    <option value="Non-AC">Non-AC</option>
                                    <option value="Luxury">Luxury</option>
                                    <option value="Semi-Luxury">Semi-Luxury</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-semibold">Active</span>
                                </label>
                            </div>
                        </>
                    )}

                        <div className="flex gap-3 mt-6">
                            <motion.button
                                type="submit"
                                className="flex-1 bg-slate-blue hover:bg-slate-700 text-white py-3 rounded-lg font-semibold shadow-lg"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {editMode ? '✅ Update' : '✨ Create'}
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold shadow-lg"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                ❌ Cancel
                            </motion.button>
                        </div>
                    </form>
                </GlassCard>
            </motion.div>
        </motion.div>
        </AnimatePresence>
    );
};

export default ScheduleManagement;
