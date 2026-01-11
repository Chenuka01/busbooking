const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendCancellationEmail } = require('../utils/emailService');

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
    try {
        // Total bookings
        const [totalBookings] = await db.query(
            'SELECT COUNT(*) as count FROM Bookings WHERE booking_status = "Confirmed"'
        );

        // Total revenue
        const [totalRevenue] = await db.query(
            'SELECT SUM(amount_paid) as revenue FROM Bookings WHERE payment_status = "Paid"'
        );

        // Today's bookings
        const [todayBookings] = await db.query(
            `SELECT COUNT(*) as count FROM Bookings 
             WHERE DATE(booked_at) = CURDATE() AND booking_status = "Confirmed"`
        );

        // Upcoming trips
        const [upcomingTrips] = await db.query(
            `SELECT COUNT(*) as count FROM Schedules 
             WHERE travel_date >= CURDATE() AND status = "Scheduled"`
        );

        // Active users
        const [activeUsers] = await db.query(
            'SELECT COUNT(*) as count FROM Users WHERE is_active = TRUE'
        );

        // Cancellation rate
        const [cancellations] = await db.query(
            'SELECT COUNT(*) as count FROM Bookings WHERE booking_status = "Cancelled"'
        );

        const totalCount = totalBookings[0].count + cancellations[0].count;
        const cancellationRate = totalCount > 0 
            ? ((cancellations[0].count / totalCount) * 100).toFixed(2) 
            : 0;

        res.json({
            success: true,
            data: {
                totalBookings: totalBookings[0].count,
                totalRevenue: parseFloat(totalRevenue[0].revenue || 0),
                todayBookings: todayBookings[0].count,
                upcomingTrips: upcomingTrips[0].count,
                activeUsers: activeUsers[0].count,
                cancellationRate: parseFloat(cancellationRate)
            }
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

/**
 * GET /api/admin/reports/revenue
 * Get revenue report by date range
 */
router.get('/reports/revenue', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = `
            SELECT 
                DATE(b.booked_at) as date,
                COUNT(b.id) as bookings,
                SUM(b.amount_paid) as revenue
            FROM Bookings b
            WHERE b.payment_status = 'Paid'
        `;

        const params = [];
        if (startDate && endDate) {
            query += ' AND DATE(b.booked_at) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        } else {
            query += ' AND DATE(b.booked_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        }

        query += ' GROUP BY DATE(b.booked_at) ORDER BY date DESC';

        const [revenue] = await db.query(query, params);

        res.json({
            success: true,
            data: revenue
        });

    } catch (error) {
        console.error('Error fetching revenue report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue report',
            error: error.message
        });
    }
});

/**
 * GET /api/admin/reports/popular-routes
 * Get most popular routes
 */
router.get('/reports/popular-routes', async (req, res) => {
    try {
        const [routes] = await db.query(`
            SELECT 
                r.origin,
                r.destination,
                COUNT(b.id) as total_bookings,
                SUM(b.amount_paid) as total_revenue,
                r.base_price
            FROM Routes r
            LEFT JOIN Schedules s ON r.id = s.route_id
            LEFT JOIN Bookings b ON s.id = b.schedule_id AND b.booking_status = 'Confirmed'
            GROUP BY r.id, r.origin, r.destination, r.base_price
            ORDER BY total_bookings DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: routes
        });

    } catch (error) {
        console.error('Error fetching popular routes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch popular routes',
            error: error.message
        });
    }
});

/**
 * GET /api/admin/reports/occupancy
 * Get bus occupancy rates
 */
router.get('/reports/occupancy', async (req, res) => {
    try {
        const [occupancy] = await db.query(`
            SELECT 
                s.id as schedule_id,
                r.origin,
                r.destination,
                s.travel_date,
                s.departure_time,
                b.total_seats,
                b.bus_number,
                (b.total_seats - s.available_seats) as booked_seats,
                s.available_seats,
                ROUND(((b.total_seats - s.available_seats) / b.total_seats) * 100, 2) as occupancy_rate
            FROM Schedules s
            JOIN Routes r ON s.route_id = r.id
            JOIN Buses b ON s.bus_id = b.id
            WHERE s.travel_date >= CURDATE()
            AND s.status = 'Scheduled'
            ORDER BY s.travel_date, s.departure_time
            LIMIT 20
        `);

        res.json({
            success: true,
            data: occupancy
        });

    } catch (error) {
        console.error('Error fetching occupancy report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch occupancy report',
            error: error.message
        });
    }
});

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT 
                id,
                email,
                full_name,
                phone,
                role,
                is_active,
                email_verified,
                last_login,
                created_at
            FROM Users
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

/**
 * PATCH /api/admin/users/:userId/status
 * Toggle user active status
 */
router.patch('/users/:userId/status', async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        await db.query(
            'UPDATE Users SET is_active = ? WHERE id = ?',
            [isActive, userId]
        );

        res.json({
            success: true,
            message: 'User status updated successfully'
        });

    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
});

// ========================================
// ROUTE MANAGEMENT
// ========================================

/**
 * POST /api/admin/routes
 * Create a new bus route
 */
router.post('/routes', async (req, res) => {
    try {
        const { origin, destination, duration, distance_km, base_price } = req.body;

        if (!origin || !destination || !duration || !base_price) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: origin, destination, duration, base_price'
            });
        }

        const [result] = await db.query(`
            INSERT INTO Routes (origin, destination, duration, distance_km, base_price)
            VALUES (?, ?, ?, ?, ?)
        `, [origin, destination, duration, distance_km || null, base_price]);

        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            data: {
                id: result.insertId,
                origin,
                destination,
                duration,
                distance_km,
                base_price
            }
        });

    } catch (error) {
        console.error('Error creating route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create route',
            error: error.message
        });
    }
});

/**
 * PUT /api/admin/routes/:routeId
 * Update an existing route
 */
router.put('/routes/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;
        const { origin, destination, duration, distance_km, base_price } = req.body;

        if (!origin || !destination || !duration || !base_price) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        await db.query(`
            UPDATE Routes 
            SET origin = ?, destination = ?, duration = ?, distance_km = ?, base_price = ?
            WHERE id = ?
        `, [origin, destination, duration, distance_km || null, base_price, routeId]);

        res.json({
            success: true,
            message: 'Route updated successfully'
        });

    } catch (error) {
        console.error('Error updating route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update route',
            error: error.message
        });
    }
});

/**
 * DELETE /api/admin/routes/:routeId
 * Delete a route (only if no schedules exist)
 */
router.delete('/routes/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;

        // Check if route has schedules
        const [schedules] = await db.query(
            'SELECT COUNT(*) as count FROM Schedules WHERE route_id = ?',
            [routeId]
        );

        if (schedules[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete route with existing schedules'
            });
        }

        await db.query('DELETE FROM Routes WHERE id = ?', [routeId]);

        res.json({
            success: true,
            message: 'Route deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete route',
            error: error.message
        });
    }
});

// ========================================
// BUS MANAGEMENT
// ========================================

/**
 * GET /api/admin/buses
 * Get all buses
 */
router.get('/buses', async (req, res) => {
    try {
        const [buses] = await db.query(`
            SELECT * FROM Buses ORDER BY bus_number
        `);

        res.json({
            success: true,
            count: buses.length,
            data: buses
        });

    } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch buses',
            error: error.message
        });
    }
});

/**
 * POST /api/admin/buses
 * Create a new bus
 */
router.post('/buses', async (req, res) => {
    try {
        const { bus_number, bus_type, total_seats, layout_type, is_active } = req.body;

        // Normalize bus_type to match ENUM in DB
        const allowedBusTypes = ['AC', 'Non-AC', 'Luxury', 'Semi-Luxury'];
        const normalizedBusType = allowedBusTypes.includes(bus_type) ? bus_type : 'Non-AC';

        if (!bus_number || !total_seats) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: bus_number, total_seats'
            });
        }

        const [result] = await db.query(`
            INSERT INTO Buses (bus_number, bus_type, total_seats, layout_type, is_active)
            VALUES (?, ?, ?, ?, ?)
        `, [
            bus_number, 
            normalizedBusType,
            total_seats, 
            layout_type || '2x2',
            is_active === undefined ? 1 : (is_active ? 1 : 0)
        ]);

        res.status(201).json({
            success: true,
            message: 'Bus created successfully',
            data: {
                id: result.insertId,
                bus_number,
                bus_type: normalizedBusType,
                total_seats,
                layout_type: layout_type || '2x2',
                is_active: is_active === undefined ? 1 : (is_active ? 1 : 0)
            }
        });

    } catch (error) {
        console.error('Error creating bus:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create bus',
            error: error.message
        });
    }
});

/**
 * PUT /api/admin/buses/:busId
 * Update an existing bus
 */
router.put('/buses/:busId', async (req, res) => {
    try {
        const { busId } = req.params;
        const { bus_number, bus_type, total_seats, layout_type, is_active } = req.body;

        const allowedBusTypes = ['AC', 'Non-AC', 'Luxury', 'Semi-Luxury'];
        const normalizedBusType = allowedBusTypes.includes(bus_type) ? bus_type : 'Non-AC';

        if (!bus_number || !total_seats) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        await db.query(`
            UPDATE Buses 
            SET bus_number = ?, bus_type = ?, total_seats = ?, layout_type = ?, is_active = ?
            WHERE id = ?
        `, [bus_number, normalizedBusType, total_seats, layout_type, is_active === undefined ? 1 : (is_active ? 1 : 0), busId]);

        res.json({
            success: true,
            message: 'Bus updated successfully'
        });

    } catch (error) {
        console.error('Error updating bus:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update bus',
            error: error.message
        });
    }
});

/**
 * DELETE /api/admin/buses/:busId
 * Delete a bus (only if no schedules exist)
 */
router.delete('/buses/:busId', async (req, res) => {
    try {
        const { busId } = req.params;

        // Check if bus has schedules
        const [schedules] = await db.query(
            'SELECT COUNT(*) as count FROM Schedules WHERE bus_id = ?',
            [busId]
        );

        if (schedules[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete bus with existing schedules'
            });
        }

        await db.query('DELETE FROM Buses WHERE id = ?', [busId]);

        res.json({
            success: true,
            message: 'Bus deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting bus:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete bus',
            error: error.message
        });
    }
});

// ========================================
// SCHEDULE MANAGEMENT
// ========================================

/**
 * GET /api/admin/schedules
 * Get all schedules (with filters)
 */
router.get('/schedules', async (req, res) => {
    try {
        const { routeId, status, startDate, endDate } = req.query;

        let query = `
            SELECT 
                s.id,
                s.route_id,
                s.bus_id,
                s.travel_date,
                s.departure_time,
                s.arrival_time,
                s.available_seats,
                s.status,
                r.origin,
                r.destination,
                r.base_price,
                b.bus_number,
                b.total_seats
            FROM Schedules s
            JOIN Routes r ON s.route_id = r.id
            JOIN Buses b ON s.bus_id = b.id
            WHERE 1=1
        `;

        const params = [];

        if (routeId) {
            query += ' AND s.route_id = ?';
            params.push(routeId);
        }

        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }

        if (startDate) {
            query += ' AND s.travel_date >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND s.travel_date <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY s.travel_date, s.departure_time';

        const [schedules] = await db.query(query, params);

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
 * POST /api/admin/schedules
 * Create a new schedule
 */
router.post('/schedules', async (req, res) => {
    try {
        const { 
            route_id, 
            bus_id, 
            travel_date, 
            departure_time, 
            arrival_time 
        } = req.body;

        if (!route_id || !bus_id || !travel_date || !departure_time || !arrival_time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: route_id, bus_id, travel_date, departure_time, arrival_time'
            });
        }

        // Get bus total seats
        const [bus] = await db.query('SELECT total_seats FROM Buses WHERE id = ?', [bus_id]);
        
        if (bus.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        const available_seats = bus[0].total_seats;

        const [result] = await db.query(`
            INSERT INTO Schedules 
            (route_id, bus_id, travel_date, departure_time, arrival_time, available_seats, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')
        `, [route_id, bus_id, travel_date, departure_time, arrival_time, available_seats]);

        res.status(201).json({
            success: true,
            message: 'Schedule created successfully',
            data: {
                id: result.insertId,
                route_id,
                bus_id,
                travel_date,
                departure_time,
                arrival_time,
                available_seats,
                status: 'Scheduled'
            }
        });

    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create schedule',
            error: error.message
        });
    }
});

/**
 * PUT /api/admin/schedules/:scheduleId
 * Update an existing schedule
 */
router.put('/schedules/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { 
            route_id, 
            bus_id, 
            travel_date, 
            departure_time, 
            arrival_time,
            status 
        } = req.body;

        // Check if schedule has bookings
        const [bookings] = await db.query(
            'SELECT COUNT(*) as count FROM Bookings WHERE schedule_id = ? AND booking_status = "Confirmed"',
            [scheduleId]
        );

        if (bookings[0].count > 0 && (route_id || bus_id)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change route or bus for schedule with existing bookings. Only time and status can be updated.'
            });
        }

        let query = 'UPDATE Schedules SET ';
        const updates = [];
        const params = [];

        if (route_id) {
            updates.push('route_id = ?');
            params.push(route_id);
        }
        if (bus_id) {
            updates.push('bus_id = ?');
            params.push(bus_id);
        }
        if (travel_date) {
            updates.push('travel_date = ?');
            params.push(travel_date);
        }
        if (departure_time) {
            updates.push('departure_time = ?');
            params.push(departure_time);
        }
        if (arrival_time) {
            updates.push('arrival_time = ?');
            params.push(arrival_time);
        }
        if (status) {
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        query += updates.join(', ') + ' WHERE id = ?';
        params.push(scheduleId);

        await db.query(query, params);

        res.json({
            success: true,
            message: 'Schedule updated successfully'
        });

    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update schedule',
            error: error.message
        });
    }
});

/**
 * DELETE /api/admin/schedules/:scheduleId
 * Delete a schedule (only if no bookings exist)
 */
router.delete('/schedules/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;

        // Check if schedule has bookings
        const [bookings] = await db.query(
            'SELECT COUNT(*) as count FROM Bookings WHERE schedule_id = ?',
            [scheduleId]
        );

        if (bookings[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete schedule with existing bookings. Consider cancelling it instead.'
            });
        }

        await db.query('DELETE FROM Schedules WHERE id = ?', [scheduleId]);

        res.json({
            success: true,
            message: 'Schedule deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete schedule',
            error: error.message
        });
    }
});

/**
 * PATCH /api/admin/schedules/:scheduleId/status
 * Update schedule status (Scheduled, Cancelled, Completed)
 */
router.patch('/schedules/:scheduleId/status', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { status } = req.body;

        if (!status || !['Scheduled', 'Cancelled', 'Completed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: Scheduled, Cancelled, or Completed'
            });
        }

        await db.query(
            'UPDATE Schedules SET status = ? WHERE id = ?',
            [status, scheduleId]
        );

        res.json({
            success: true,
            message: `Schedule ${status.toLowerCase()} successfully`
        });

    } catch (error) {
        console.error('Error updating schedule status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update schedule status',
            error: error.message
        });
    }
});

// ========================================
// BOOKING BULK ACTIONS
// ========================================

/**
 * POST /api/admin/bookings/bulk-cancel
 * Admin-only: cancel multiple bookings (confirmed or completed); restores seats only for confirmed
 */
router.post('/bookings/bulk-cancel', async (req, res) => {
    try {
        const { bookingIds = [] } = req.body;
        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).json({ success: false, message: 'bookingIds array is required' });
        }

        // Fetch bookings with passenger details and route info for emails
        const [bookings] = await db.query(
            `SELECT b.booking_uuid, b.schedule_id, b.seat_number, b.booking_status,
                    b.passenger_email, b.passenger_name,
                    r.origin, r.destination
             FROM Bookings b
             JOIN Schedules s ON b.schedule_id = s.id
             JOIN Routes r ON s.route_id = r.id
             WHERE b.booking_uuid IN (${bookingIds.map(() => '?').join(',')})`,
            bookingIds
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'No bookings found for provided ids' });
        }

        // Cancel bookings
        await db.query(
            `UPDATE Bookings SET booking_status = 'Cancelled', payment_status = 'Refunded',
             cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = 'Cancelled by admin'
             WHERE booking_uuid IN (${bookingIds.map(() => '?').join(',')})`,
            bookingIds
        );

        // Restore seats for confirmed bookings
        const confirmed = bookings.filter(b => b.booking_status === 'Confirmed');
        for (const b of confirmed) {
            await db.query(
                'UPDATE Schedules SET available_seats = available_seats + 1 WHERE id = ?',
                [b.schedule_id]
            );
        }

        // Send cancellation emails (non-blocking)
        for (const b of bookings) {
            const cancelEmail = b.passenger_email || process.env.CANCELLATION_FALLBACK_EMAIL;
            if (cancelEmail) {
                sendCancellationEmail({
                    email: cancelEmail,
                    name: b.passenger_name,
                    bookingReference: b.booking_uuid,
                    seatNumber: b.seat_number,
                    route: `${b.origin} to ${b.destination}`
                }).catch(err => console.error('Email error:', err));
            }
        }

        res.json({ success: true, message: `Cancelled ${bookings.length} booking(s)` });
    } catch (error) {
        console.error('Error bulk-cancelling bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to bulk cancel bookings', error: error.message });
    }
});

/**
 * POST /api/admin/bookings/bulk-delete
 * Admin-only: hard delete booking records (historical cleanup). Does not adjust seats.
 */
router.post('/bookings/bulk-delete', async (req, res) => {
    try {
        const { bookingIds = [] } = req.body;
        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).json({ success: false, message: 'bookingIds array is required' });
        }

        const [found] = await db.query(
            `SELECT booking_uuid FROM Bookings WHERE booking_uuid IN (${bookingIds.map(() => '?').join(',')})`,
            bookingIds
        );

        if (found.length === 0) {
            return res.status(404).json({ success: false, message: 'No bookings found for provided ids' });
        }

        await db.query(
            `DELETE FROM Bookings WHERE booking_uuid IN (${bookingIds.map(() => '?').join(',')})`,
            bookingIds
        );

        res.json({ success: true, message: `Deleted ${found.length} booking(s)` });
    } catch (error) {
        console.error('Error bulk-deleting bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to bulk delete bookings', error: error.message });
    }
});

/**
 * POST /api/admin/bookings/reactivate
 * Admin-only: reactivate cancelled bookings back to confirmed status
 */
router.post('/bookings/reactivate', async (req, res) => {
    try {
        const { bookingIds = [] } = req.body;
        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).json({ success: false, message: 'bookingIds array is required' });
        }

        // Fetch cancelled bookings with seat/schedule info
        const [bookings] = await db.query(
            `SELECT b.booking_uuid, b.schedule_id, b.seat_number, b.booking_status,
                    s.available_seats
             FROM Bookings b
             JOIN Schedules s ON b.schedule_id = s.id
             WHERE b.booking_uuid IN (${bookingIds.map(() => '?').join(',')})
               AND b.booking_status = 'Cancelled'`,
            bookingIds
        );

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: 'No cancelled bookings found for provided ids' });
        }

        // Check seat availability for each booking
        const conflicts = [];
        for (const b of bookings) {
            const [check] = await db.query(
                `SELECT COUNT(*) as count FROM Bookings
                 WHERE schedule_id = ? AND seat_number = ? AND booking_status = 'Confirmed' AND booking_uuid != ?`,
                [b.schedule_id, b.seat_number, b.booking_uuid]
            );
            if (check[0].count > 0) {
                conflicts.push(b.booking_uuid);
            }
        }

        if (conflicts.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot reactivate: seat already booked for ${conflicts.length} booking(s)`,
                conflicts 
            });
        }

        // Reactivate bookings
        await db.query(
            `UPDATE Bookings SET booking_status = 'Confirmed', payment_status = 'Paid',
             cancelled_at = NULL, cancellation_reason = NULL
             WHERE booking_uuid IN (${bookingIds.map(() => '?').join(',')})`,
            bookingIds
        );

        // Decrease available seats
        for (const b of bookings) {
            await db.query(
                'UPDATE Schedules SET available_seats = available_seats - 1 WHERE id = ?',
                [b.schedule_id]
            );
        }

        res.json({ success: true, message: `Reactivated ${bookings.length} booking(s)` });
    } catch (error) {
        console.error('Error reactivating bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to reactivate bookings', error: error.message });
    }
});

module.exports = router;
