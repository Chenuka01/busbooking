import React, { useState, useEffect } from 'react';
import { busAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const SeatSelection = ({ schedule, onBack, onBookingComplete }) => {
    const [seats, setSeats] = useState([]);
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSeats();
    }, [schedule.id]);

    const fetchSeats = async () => {
        try {
            setLoading(true);
            const data = await busAPI.getSeats(schedule.id);
            setSeats(data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load seat layout. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSeatClick = (seat) => {
        if (seat.status === 'booked') return;
        
        setSelectedSeat(seat);
        setShowBookingForm(true);
    };

    const renderSeatLayout = () => {
        if (loading) {
            return (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading seat layout...</p>
                </div>
            );
        }

        if (seats.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">No seats available</p>
                </div>
            );
        }

        // Group seats by row
        const seatsByRow = {};
        seats.forEach((seat) => {
            if (!seatsByRow[seat.row]) {
                seatsByRow[seat.row] = [];
            }
            seatsByRow[seat.row].push(seat);
        });

        return (
            <div className="space-y-3">
                {/* Driver Section */}
                <div className="flex justify-center mb-6">
                    <div className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold">
                        🚗 Driver
                    </div>
                </div>

                {/* Seat Grid */}
                {Object.keys(seatsByRow).sort((a, b) => a - b).map((row) => (
                    <div key={row} className="flex justify-center items-center gap-2">
                        <span className="text-gray-500 font-semibold w-8 text-center">{row}</span>
                        
                        <div className="flex gap-2">
                            {/* Left side seats (A, B) */}
                            {seatsByRow[row]
                                .filter((s) => s.column === 'A' || s.column === 'B')
                                .map((seat) => (
                                    <SeatButton
                                        key={seat.seatNumber}
                                        seat={seat}
                                        isSelected={selectedSeat?.seatNumber === seat.seatNumber}
                                        onClick={() => handleSeatClick(seat)}
                                    />
                                ))}
                        </div>

                        {/* Aisle */}
                        <div className="w-8 text-center text-gray-400 text-xs">| |</div>

                        <div className="flex gap-2">
                            {/* Right side seats (C, D) */}
                            {seatsByRow[row]
                                .filter((s) => s.column === 'C' || s.column === 'D')
                                .map((seat) => (
                                    <SeatButton
                                        key={seat.seatNumber}
                                        seat={seat}
                                        isSelected={selectedSeat?.seatNumber === seat.seatNumber}
                                        onClick={() => handleSeatClick(seat)}
                                    />
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 fade-in">
                    <button
                        onClick={onBack}
                        className="mb-4 text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
                    >
                        ← Back to Schedules
                    </button>

                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Select Your Seat
                            </h1>
                            <p className="text-gray-600">
                                {schedule.origin} → {schedule.destination}
                            </p>
                            <p className="text-sm text-gray-500">
                                {new Date(schedule.travel_date).toLocaleDateString()} • 
                                {schedule.departure_time.substring(0, 5)} • 
                                Bus: {schedule.bus_number}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Price</p>
                            <p className="text-2xl font-bold text-blue-600">
                                Rs. {schedule.base_price}
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 fade-in">
                        <p>{error}</p>
                    </div>
                )}

                {/* Seat Layout */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6 fade-in">
                    {renderSeatLayout()}
                </div>

                {/* Legend */}
                <div className="bg-white rounded-lg shadow-lg p-6 fade-in">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Legend</h3>
                    <div className="flex flex-wrap gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-green-500 rounded-lg"></div>
                            <span className="text-gray-700">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-red-500 rounded-lg"></div>
                            <span className="text-gray-700">Booked</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg border-2 border-blue-700"></div>
                            <span className="text-gray-700">Selected</span>
                        </div>
                    </div>
                </div>

                {/* Booking Form Modal */}
                {showBookingForm && selectedSeat && (
                    <BookingForm
                        seat={selectedSeat}
                        schedule={schedule}
                        onClose={() => {
                            setShowBookingForm(false);
                            setSelectedSeat(null);
                        }}
                        onSuccess={(bookingData) => {
                            setShowBookingForm(false);
                            onBookingComplete(bookingData);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

// Seat Button Component
const SeatButton = ({ seat, isSelected, onClick }) => {
    const getButtonClass = () => {
        if (seat.status === 'booked') {
            return 'bg-red-500 text-white cursor-not-allowed opacity-70';
        }
        if (isSelected) {
            return 'bg-blue-500 text-white border-2 border-blue-700 shadow-lg';
        }
        return 'bg-green-500 text-white hover:bg-green-600 cursor-pointer shadow-md hover:shadow-lg';
    };

    return (
        <button
            onClick={onClick}
            disabled={seat.status === 'booked'}
            className={`w-12 h-12 rounded-lg font-semibold text-sm transition-all duration-200 ${getButtonClass()}`}
        >
            {seat.seatNumber}
        </button>
    );
};

// Booking Form Component
const BookingForm = ({ seat, schedule, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
    });
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.phone) {
            setError('Name and phone number are required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const bookingData = {
                scheduleId: schedule.id,
                seatNumber: seat.seatNumber,
                name: formData.name,
                phone: formData.phone,
                email: formData.email || undefined,
            };

            const result = await busAPI.createBooking(bookingData);
            
            if (result.success) {
                onSuccess(result.data);
                // toast
                showToast('success', 'Booking confirmed successfully!');
                // Notify other parts of the app to refresh booking counts/lists
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('bookings:updated'));
                }
            } else {
                const msg = result.message || 'Booking failed. Please try again.';
                setError(msg);
                showToast('error', msg);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create booking. Please try again.';
            setError(errorMessage);
            console.error(err);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', message: errorMessage } }));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 fade-in">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Confirm Booking
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">Selected Seat</p>
                    <p className="text-2xl font-bold text-blue-600">{seat.seatNumber}</p>
                    <p className="text-sm text-gray-600 mt-2">
                        {schedule.origin} → {schedule.destination}
                    </p>
                    <p className="text-lg font-semibold text-gray-800 mt-1">
                        Rs. {schedule.base_price}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                            Phone Number *
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+94771234567"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                            Email (Optional)
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="your@email.com"
                        />
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all ${
                                loading
                                    ? 'bg-blue-400 cursor-not-allowed btn-loading'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                            }`}
                        >
                            {loading ? 'Processing...' : 'Confirm Booking'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SeatSelection;
