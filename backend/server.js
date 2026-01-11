const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import database connection
const db = require('./config/database');

// Import middleware
const { authenticateToken, optionalAuth } = require('./middleware/auth');

// Import email service
const { sendBookingConfirmation, sendCancellationEmail } = require('./utils/emailService');

// ========================================
// IMPORT ROUTES
// ========================================
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const scheduleRoutes = require('./routes/schedules');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schedules', scheduleRoutes);

// ========================================
// ROUTES / API ENDPOINTS
// ========================================

/**
 * GET /api/routes
 * Fetch all available bus routes
 */
app.get('/api/routes', async (req, res) => {
    try {
        const [routes] = await db.query(
            'SELECT id, origin, destination, duration, distance_km, base_price FROM Routes ORDER BY origin, destination'
        );
        
        res.json({
            success: true,
            count: routes.length,
            data: routes
        });
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch routes',
            error: error.message
        });
    }
});

/**
 * GET /api/schedules/:routeId
 * Get all schedules for a specific route
 */
app.get('/api/schedules/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;
        
        const [schedules] = await db.query(`
            SELECT 
                s.id,
                s.route_id,
                s.bus_id,
                s.travel_date,
                s.departure_time,
                s.arrival_time,
                s.available_seats,
                s.status,
                b.bus_number,
                b.total_seats,
                b.layout_type,
                b.bus_type,
                r.origin,
                r.destination,
                r.duration,
                r.base_price
            FROM Schedules s
            JOIN Buses b ON s.bus_id = b.id
            JOIN Routes r ON s.route_id = r.id
            WHERE s.route_id = ? 
            AND s.travel_date >= CURDATE()
            AND s.status = 'Scheduled'
            ORDER BY s.travel_date, s.departure_time
        `, [routeId]);
        
        res.json({
            success: true,
            count: schedules.length,
            data: schedules
        });
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch schedules',
            error: error.message
        });
    }
});

/**
 * GET /api/seats/:scheduleId
 * Get seat availability for a specific schedule
 * Returns array of seat objects with status (booked/available)
 */
app.get('/api/seats/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        
        // Get schedule and bus details
        const [scheduleData] = await db.query(`
            SELECT s.id, b.total_seats, b.layout_type
            FROM Schedules s
            JOIN Buses b ON s.bus_id = b.id
            WHERE s.id = ?
        `, [scheduleId]);
        
        if (scheduleData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }
        
        const { total_seats, layout_type } = scheduleData[0];
        
        // Get all booked seats for this schedule
        const [bookedSeats] = await db.query(`
            SELECT seat_number 
            FROM Bookings 
            WHERE schedule_id = ? 
            AND booking_status = 'Confirmed'
        `, [scheduleId]);
        
        const bookedSeatNumbers = bookedSeats.map(seat => seat.seat_number);
        
        // Generate seat layout based on bus configuration
        const seats = generateSeatLayout(total_seats, layout_type, bookedSeatNumbers);
        
        res.json({
            success: true,
            scheduleId: parseInt(scheduleId),
            totalSeats: total_seats,
            bookedCount: bookedSeatNumbers.length,
            availableCount: total_seats - bookedSeatNumbers.length,
            layout: layout_type,
            data: seats
        });
    } catch (error) {
        console.error('Error fetching seats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch seat availability',
            error: error.message
        });
    }
});

/**
 * POST /api/book
 * Create a new booking
 * Body: { scheduleId, seatNumber, name, phone, email? }
 * Optional: Authentication (if user is logged in, user_id will be attached)
 */
app.post('/api/book', optionalAuth, async (req, res) => {
    try {
        const { scheduleId, seatNumber, name, phone, email } = req.body;
        
        // Validation
        if (!scheduleId || !seatNumber || !name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: scheduleId, seatNumber, name, phone'
            });
        }
        
        // Check if seat is already booked (CRITICAL: Prevent double booking)
        const [existingBooking] = await db.query(`
            SELECT id FROM Bookings 
            WHERE schedule_id = ? 
            AND seat_number = ? 
            AND booking_status = 'Confirmed'
        `, [scheduleId, seatNumber]);
        
        if (existingBooking.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This seat is already booked. Please select another seat.'
            });
        }
        
        // Get schedule details for price and route info
        const [scheduleInfo] = await db.query(`
            SELECT 
                r.base_price,
                r.origin,
                r.destination,
                s.travel_date,
                s.departure_time
            FROM Schedules s
            JOIN Routes r ON s.route_id = r.id
            WHERE s.id = ?
        `, [scheduleId]);
        
        if (scheduleInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }
        
        const amount = Number(scheduleInfo[0].base_price) || 0;
        const routeInfo = scheduleInfo[0];
        
        // Generate unique booking UUID
        const { v4: uuidv4 } = require('uuid');
        const bookingUuid = uuidv4();
        
        // Get user ID if authenticated
        const userId = req.user ? req.user.userId : null;
        
        // Insert booking
        const [result] = await db.query(`
            INSERT INTO Bookings 
            (schedule_id, user_id, seat_number, passenger_name, passenger_phone, passenger_email, booking_uuid, amount_paid, payment_status, booking_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Paid', 'Confirmed')
        `, [scheduleId, userId, seatNumber, name, phone, email || null, bookingUuid, amount]);
        
        // Update available seats count
        await db.query(`
            UPDATE Schedules 
            SET available_seats = available_seats - 1 
            WHERE id = ?
        `, [scheduleId]);
        
        // Send confirmation email (non-blocking)
        if (email) {
            sendBookingConfirmation({
                email,
                name,
                bookingReference: bookingUuid,
                seatNumber,
                route: `${routeInfo.origin} to ${routeInfo.destination}`,
                date: new Date(routeInfo.travel_date).toLocaleDateString(),
                time: routeInfo.departure_time,
                amount: amount.toFixed(2)
            }).catch(err => console.error('Email error:', err));
        }
        
        res.status(201).json({
            success: true,
            message: 'Booking confirmed successfully!',
            data: {
                bookingId: result.insertId,
                bookingReference: bookingUuid,
                seatNumber: seatNumber,
                passengerName: name,
                amountPaid: amount
            }
        });
        
    } catch (error) {
        console.error('Error creating booking:', error);
        
        // Handle duplicate booking error
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'This seat is already booked. Please try another seat.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
});

/**
 * GET /api/bookings
 * Get all bookings (for Admin Dashboard) - PROTECTED
 */
app.get('/api/bookings', authenticateToken, async (req, res) => {
    try {
        // If user is not admin, only show their bookings
        let query = `
            SELECT 
                b.id,
                b.booking_uuid,
                b.seat_number,
                b.passenger_name,
                b.passenger_phone,
                b.passenger_email,
                b.booking_status,
                b.cancellation_reason,
                b.cancelled_at,
                b.amount_paid,
                b.booked_at,
                r.origin,
                r.destination,
                s.travel_date,
                s.departure_time,
                bus.bus_number
            FROM Bookings b
            JOIN Schedules s ON b.schedule_id = s.id
            JOIN Routes r ON s.route_id = r.id
            JOIN Buses bus ON s.bus_id = bus.id
        `;

        const params = [];

        if (req.user.role !== 'admin') {
            query += ' WHERE b.user_id = ?';
            params.push(req.user.userId);
        }

        query += ' ORDER BY b.booked_at DESC';

        const [bookings] = await db.query(query, params);
        
        res.json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message
        });
    }
});

/**
 * GET /api/booking/:bookingId
 * Get specific booking details by UUID
 */
app.get('/api/booking/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        const [booking] = await db.query(`
            SELECT 
                b.id,
                b.booking_uuid,
                b.seat_number,
                b.passenger_name,
                b.passenger_phone,
                b.passenger_email,
                b.booking_status,
                b.cancellation_reason,
                b.cancelled_at,
                b.amount_paid,
                b.booked_at,
                r.origin,
                r.destination,
                r.duration,
                s.travel_date,
                s.departure_time,
                s.arrival_time,
                bus.bus_number,
                bus.bus_type
            FROM Bookings b
            JOIN Schedules s ON b.schedule_id = s.id
            JOIN Routes r ON s.route_id = r.id
            JOIN Buses bus ON s.bus_id = bus.id
            WHERE b.booking_uuid = ?
        `, [bookingId]);
        
        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        res.json({
            success: true,
            data: booking[0]
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking details',
            error: error.message
        });
    }
});

/**
 * PUT /api/booking/:bookingId/seat
 * Admin-only seat change for confirmed bookings
 */
app.put('/api/booking/:bookingId/seat', authenticateToken, async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Seat changes are allowed for admins only after confirmation'
            });
        }

        const { bookingId } = req.params;
        const { seat_number } = req.body;

        if (!seat_number) {
            return res.status(400).json({
                success: false,
                message: 'Seat number is required'
            });
        }

        // Get booking and ensure it is confirmed
        const [bookingRows] = await db.query(`
            SELECT id, schedule_id, booking_status, seat_number
            FROM Bookings
            WHERE booking_uuid = ?
        `, [bookingId]);

        if (bookingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const booking = bookingRows[0];

        if (booking.booking_status !== 'Confirmed') {
            return res.status(400).json({
                success: false,
                message: 'Only confirmed bookings can be modified'
            });
        }

        // Check if desired seat is free
        const [seatCheck] = await db.query(`
            SELECT COUNT(*) AS count
            FROM Bookings
            WHERE schedule_id = ? AND seat_number = ? AND booking_status = 'Confirmed' AND booking_uuid != ?
        `, [booking.schedule_id, seat_number, bookingId]);

        if (seatCheck[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Seat already booked for this schedule'
            });
        }

        // Update seat number
        await db.query(`
            UPDATE Bookings
            SET seat_number = ?, updated_at = CURRENT_TIMESTAMP
            WHERE booking_uuid = ?
        `, [seat_number, bookingId]);

        res.json({
            success: true,
            message: 'Seat updated successfully'
        });
    } catch (error) {
        console.error('Error updating seat:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update seat',
            error: error.message
        });
    }
});

/**
 * DELETE /api/booking/:bookingId
 * Cancel a booking
 */
app.delete('/api/booking/:bookingId', optionalAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // Get booking details before cancellation
        const [booking] = await db.query(`
            SELECT 
                b.schedule_id, 
                b.user_id,
                b.passenger_email,
                b.passenger_name,
                b.seat_number,
                r.origin,
                r.destination,
                s.travel_date
            FROM Bookings b
            JOIN Schedules s ON b.schedule_id = s.id
            JOIN Routes r ON s.route_id = r.id
            WHERE b.booking_uuid = ? AND b.booking_status = 'Confirmed'
        `, [bookingId]);
        
        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or already cancelled'
            });
        }

        const bookingData = booking[0];

        // Check if user owns this booking (if authenticated)
        if (req.user && bookingData.user_id && req.user.userId !== bookingData.user_id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to cancel this booking'
            });
        }

        const isAdmin = req.user && req.user.role === 'admin';

        // Block past-date cancels for users; allow admins to override
        const travelDate = new Date(bookingData.travel_date);
        const now = new Date();
        if (!isAdmin && travelDate < now) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel past bookings'
            });
        }

        const cancellationReason = isAdmin ? 'Cancelled by admin' : 'Cancelled by passenger';

        // Update booking status to Cancelled
        await db.query(`
            UPDATE Bookings 
            SET booking_status = 'Cancelled', 
                payment_status = 'Refunded',
                cancelled_at = CURRENT_TIMESTAMP,
                cancellation_reason = ?
            WHERE booking_uuid = ?
        `, [cancellationReason, bookingId]);
        
        // Increase available seats
        await db.query(`
            UPDATE Schedules 
            SET available_seats = available_seats + 1 
            WHERE id = ?
        `, [bookingData.schedule_id]);

        // Send cancellation email (non-blocking)
        const cancelEmail = bookingData.passenger_email || process.env.CANCELLATION_FALLBACK_EMAIL;
        if (cancelEmail) {
            sendCancellationEmail({
                email: cancelEmail,
                name: bookingData.passenger_name,
                bookingReference: bookingId,
                seatNumber: bookingData.seat_number,
                route: `${bookingData.origin} to ${bookingData.destination}`
            }).catch(err => console.error('Email error:', err));
        }
        
        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking',
            error: error.message
        });
    }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Generate seat layout based on total seats and layout type
 * @param {number} totalSeats - Total number of seats in the bus
 * @param {string} layoutType - Layout type (e.g., '2x2', '2x3')
 * @param {Array} bookedSeats - Array of booked seat numbers
 * @returns {Array} Array of seat objects
 */
function generateSeatLayout(totalSeats, layoutType, bookedSeats = []) {
    const seats = [];
    const columns = layoutType === '2x2' ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E', 'F'];
    const seatsPerRow = columns.length;
    const rows = Math.ceil(totalSeats / seatsPerRow);
    
    let seatCount = 0;
    
    for (let row = 1; row <= rows; row++) {
        for (let col of columns) {
            if (seatCount >= totalSeats) break;
            
            const seatNumber = `${col}${row}`;
            const isBooked = bookedSeats.includes(seatNumber);
            
            seats.push({
                seatNumber: seatNumber,
                row: row,
                column: col,
                status: isBooked ? 'booked' : 'available',
                isAisle: (col === 'B' || col === 'C') && layoutType === '2x2'
            });
            
            seatCount++;
        }
    }
    
    return seats;
}

// ========================================
// Health Check Endpoint
// ========================================
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Bus Booking API is running!',
        timestamp: new Date().toISOString()
    });
});

// ========================================
// Error Handling Middleware
// ========================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// ========================================
// Start Server
// ========================================
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
