import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import GlassCard from './GlassCard';
import { motion } from 'framer-motion';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const { isAdmin } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        if (!isAdmin) {
            showToast('error', 'Admin access required');
            return;
        }
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminAPI.getUsers();
            setUsers(data.data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            showToast('error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        if (!searchTerm) {
            setFilteredUsers(users);
            return;
        }
        const filtered = users.filter((u) =>
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.phone && u.phone.includes(searchTerm))
        );
        setFilteredUsers(filtered);
    };

    const handleToggleUserStatus = async (userId, isActive) => {
        try {
            await adminAPI.toggleUserStatus(userId, isActive);
            showToast('success', 'User status updated');
            fetchUsers();
        } catch (err) {
            console.error('Failed to update user status:', err);
            showToast('error', err.response?.data?.message || 'Failed to update user status');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleBadge = (role) => {
        const color = role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{role}</span>;
    };

    const getStatusBadge = (isActive) => {
        const color = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{isActive ? 'Active' : 'Inactive'}</span>;
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
                        <h1 className="text-4xl font-bold text-slate-blue mb-2">👥 User Management</h1>
                        <p className="text-gray-600 text-lg">Manage system users and permissions</p>
                    </GlassCard>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <GlassCard className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-slate-blue mb-4 md:mb-0">👤 All Users</h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by email, name, phone..."
                                    className="w-full md:w-80 px-4 py-2 pl-10 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-blue focus:border-transparent transition-all"
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

                    {loading ? (
                        <div className="text-center py-16">
                            <motion.div
                                className="inline-block"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <div className="w-16 h-16 border-4 border-slate-blue border-t-transparent rounded-full"></div>
                            </motion.div>
                            <p className="text-gray-600 mt-6 text-lg">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <motion.div
                            className="text-center py-16"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="text-6xl mb-4">👤</div>
                            <p className="text-gray-600 text-xl">No users found.</p>
                        </motion.div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/50 backdrop-blur-sm border-b-2 border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Last Login
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white/30 backdrop-blur-sm divide-y divide-gray-200">
                                    {filteredUsers.map((u, index) => (
                                        <motion.tr
                                            key={u.id}
                                            className="hover:bg-white/60 transition-all"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 1) }}
                                        >
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-800">{u.email}</span>
                                                    {u.email_verified && (
                                                        <span className="ml-2 text-green-500" title="Verified">✓</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-800">{u.full_name}</span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600">{u.phone || '-'}</span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {getRoleBadge(u.role)}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {getStatusBadge(u.is_active)}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-600">{formatDate(u.last_login)}</span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <motion.button
                                                    onClick={() => handleToggleUserStatus(u.id, !u.is_active)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                                        u.is_active
                                                            ? 'bg-signal-red text-white hover:bg-red-700'
                                                            : 'bg-signal-green text-white hover:bg-green-700'
                                                    }`}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {u.is_active ? '🚫 Deactivate' : '✅ Activate'}
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                        <motion.div
                            className="mt-6 flex items-center justify-between p-4 bg-white/50 rounded-lg"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                        >
                            <p className="text-sm text-gray-700 font-medium">
                                📊 Showing {filteredUsers.length} of {users.length} users
                            </p>
                        </motion.div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
};

export default UserManagement;
