import React from 'react';

const BookingSuccess = ({ bookingData, onNewBooking }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-8 px-4">
            <div className="max-w-2xl w-full fade-in">
                {/* Success Card */}
                <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                    {/* Success Icon */}
                    <div className="mb-6">
                        <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                            <svg
                                className="w-16 h-16 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Booking Confirmed! 🎉
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Your seat has been successfully booked.
                    </p>

                    {/* Booking Details */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Booking Details
                        </h2>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                <span className="text-gray-600">Booking Reference</span>
                                <span className="font-mono font-semibold text-blue-600">
                                    {bookingData.bookingReference}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                <span className="text-gray-600">Passenger Name</span>
                                <span className="font-semibold text-gray-800">
                                    {bookingData.passengerName}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                <span className="text-gray-600">Seat Number</span>
                                <span className="font-semibold text-gray-800">
                                    {bookingData.seatNumber}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Amount Paid</span>
                                <span className="font-bold text-green-600 text-lg">
                                    Rs. {bookingData.amountPaid}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Important Note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                        <p className="text-sm text-blue-800">
                            <strong>Important:</strong> Please save your booking reference number. 
                            You'll need it to check-in or modify your booking.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => window.print()}
                            className="flex-1 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                        >
                            Print Ticket
                        </button>
                        <button
                            onClick={onNewBooking}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                        >
                            Book Another Ticket
                        </button>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center text-gray-600 text-sm">
                    <p>
                        Need help? Contact us at{' '}
                        <a href="tel:+94112345678" className="text-blue-600 hover:underline">
                            +94 11 234 5678
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BookingSuccess;
