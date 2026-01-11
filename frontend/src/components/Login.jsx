import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:5000/api';

const Login = ({ onClose, onSwitchToRegister, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();

    const [showForgot, setShowForgot] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            showToast('success', 'Logged in successfully');
            onLoginSuccess && onLoginSuccess();
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.';
            setError(msg);
            showToast('error', msg);
        } finally {
            setLoading(false);
        }
    };

    // Forgot password flow
    const ForgotForm = () => {
        const [stage, setStage] = useState('request'); // request, reset
        const [fEmail, setFEmail] = useState('');
        const [otp, setOtp] = useState('');
        const [newPassword, setNewPassword] = useState('');
        const [loading, setLoadingLocal] = useState(false);
        const [message, setMessage] = useState(null);

        const requestOtp = async () => {
            if (!fEmail) return showToast('error', 'Please enter your email');
            setLoadingLocal(true);
            try {
                const res = await fetch(`${API_URL}/auth/forgot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fEmail }) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
                setMessage('OTP sent to your email. Check your inbox.');
                setStage('reset');
            } catch (err) {
                showToast('error', err.message || 'Failed to send OTP');
            } finally { setLoadingLocal(false); }
        };

        const doReset = async () => {
            if (!otp || !newPassword) return showToast('error', 'OTP and new password required');
            setLoadingLocal(true);
            try {
                const res = await fetch(`${API_URL}/auth/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fEmail, otp, newPassword }) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to reset password');
                showToast('success', 'Password reset successful. Please login with new password.');
                setShowForgot(false);
            } catch (err) {
                showToast('error', err.message || 'Failed to reset password');
            } finally { setLoadingLocal(false); }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                    <button onClick={() => setShowForgot(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Forgot Password</h2>
                    {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
                    {stage === 'request' ? (
                        <>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4" />
                            <div className="flex gap-2">
                                <button onClick={requestOtp} className="bg-blue-600 text-white px-4 py-2 rounded">Send OTP</button>
                                <button onClick={() => setShowForgot(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <label className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
                            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4" />
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4" />
                            <div className="flex gap-2">
                                <button onClick={doReset} className="bg-green-600 text-white px-4 py-2 rounded">Reset Password</button>
                                <button onClick={() => setShowForgot(false)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                        Don't have an account?{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                            Register here
                        </button>
                    </p>
                    <p className="text-sm">
                        <button onClick={() => setShowForgot(true)} className="text-blue-600 hover:text-blue-800 font-semibold">Forgot password?</button>
                    </p>
                </div>
                {showForgot && <ForgotForm /> }
            </div>
        </div>
    );
};

export default Login;
