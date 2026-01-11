const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/schedules/manage
 * Get all schedules with full details for management
 * ADMIN ONLY
 */
router.get('/manage', authenticateToken, requireAdmin, async (req, res) => {
    try {
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
                b.bus_type,
                r.origin,
                r.destination,
                r.duration,
                r.base_price,
                (SELECT COUNT(*) FROM Bookings WHERE schedule_id = s.id AND booking_status = 'Confirmed') as booked_count
            FROM Schedules s
            JOIN Buses b ON s.bus_id = b.id
            JOIN Routes r ON s.route_id = r.id
            ORDER BY s.travel_date DESC, s.departure_time
        `);
        
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
 * POST /api/schedules
 * Create new schedule
 * ADMIN ONLY
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { route_id, bus_id, travel_date, departure_time, arrival_time, status } = req.body;
        
        // Validation
        if (!route_id || !bus_id || !travel_date || !departure_time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: route_id, bus_id, travel_date, departure_time'
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
        
        // Check if schedule already exists
        const [existing] = await db.query(`
            SELECT id FROM Schedules 
            WHERE bus_id = ? AND travel_date = ? AND departure_time = ?
        `, [bus_id, travel_date, departure_time]);
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Schedule already exists for this bus at this time'
            });
        }
        
        const available_seats = bus[0].total_seats;
        
        const [result] = await db.query(`
            INSERT INTO Schedules 
            (route_id, bus_id, travel_date, departure_time, arrival_time, available_seats, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [route_id, bus_id, travel_date, departure_time, arrival_time || null, available_seats, status || 'Scheduled']);
        
        res.status(201).json({
            success: true,
            message: 'Schedule created successfully',
            data: {
                id: result.insertId,
                route_id,
                bus_id,
                travel_date,
                departure_time,
                available_seats
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
 * PUT /api/schedules/:id
 * Update existing schedule
 * ADMIN ONLY
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { route_id, bus_id, travel_date, departure_time, arrival_time, status } = req.body;
        
        // Check if schedule exists
        const [existing] = await db.query('SELECT id FROM Schedules WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }
        
        // Check if there are confirmed bookings
        const [bookings] = await db.query(`
            SELECT COUNT(*) as count FROM Bookings 
            WHERE schedule_id = ? AND booking_status = 'Confirmed'
        `, [id]);
        
        if (bookings[0].count > 0 && (bus_id || travel_date || departure_time)) {
            return res.status(400).json({
                success: false,
                message: `Cannot modify schedule with ${bookings[0].count} confirmed booking(s). Cancel bookings first or only update status.`
            });
        }
        
        // Build update query dynamically
        const updates = [];
        const values = [];
        
        if (route_id !== undefined) {
            updates.push('route_id = ?');
            values.push(route_id);
        }
        if (bus_id !== undefined) {
            updates.push('bus_id = ?');
            values.push(bus_id);
        }
        if (travel_date !== undefined) {
            updates.push('travel_date = ?');
            values.push(travel_date);
        }
        if (departure_time !== undefined) {
            updates.push('departure_time = ?');
            values.push(departure_time);
        }
        if (arrival_time !== undefined) {
            updates.push('arrival_time = ?');
            values.push(arrival_time);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }
        
        values.push(id);
        
        await db.query(`
            UPDATE Schedules 
            SET ${updates.join(', ')}
            WHERE id = ?
        `, values);
        
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
 * DELETE /api/schedules/:id
 * Delete schedule (only if no confirmed bookings)
 * ADMIN ONLY
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if schedule exists
        const [existing] = await db.query('SELECT id FROM Schedules WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }
        
        // Check if there are confirmed bookings
        const [bookings] = await db.query(`
            SELECT COUNT(*) as count FROM Bookings 
            WHERE schedule_id = ? AND booking_status = 'Confirmed'
        `, [id]);
        
        if (bookings[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete schedule with ${bookings[0].count} confirmed booking(s). Cancel all bookings first or set status to 'Cancelled'.`
            });
        }
        
        // Delete the schedule
        await db.query('DELETE FROM Schedules WHERE id = ?', [id]);
        
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
 * GET /api/schedules/routes
 * Get all routes for dropdown
 */
router.get('/routes', async (req, res) => {
    try {
        const [routes] = await db.query('SELECT * FROM Routes ORDER BY origin, destination');
        res.json({
            success: true,
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
 * POST /api/schedules/routes
 * Create new route
 * ADMIN ONLY
 */
router.post('/routes', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { origin, destination, duration, distance_km, base_price } = req.body;
        
        if (!origin || !destination || !base_price) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: origin, destination, base_price'
            });
        }
        
        const [result] = await db.query(`
            INSERT INTO Routes (origin, destination, duration, distance_km, base_price)
            VALUES (?, ?, ?, ?, ?)
        `, [origin, destination, duration || null, distance_km || null, base_price]);
        
        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            data: { id: result.insertId }
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
 * DELETE /api/schedules/routes/:id
 * Delete route (only if no schedules exist)
 * ADMIN ONLY
 */
router.delete('/routes/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [schedules] = await db.query('SELECT COUNT(*) as count FROM Schedules WHERE route_id = ?', [id]);
        
        if (schedules[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete route with ${schedules[0].count} schedule(s). Delete schedules first.`
            });
        }
        
        await db.query('DELETE FROM Routes WHERE id = ?', [id]);
        
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

/**
 * GET /api/schedules/buses
 * Get all buses for dropdown
 */
router.get('/buses', async (req, res) => {
    try {
        const [buses] = await db.query('SELECT * FROM Buses ORDER BY bus_number');
        res.json({
            success: true,
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
 * POST /api/schedules/buses
 * Create new bus
 * ADMIN ONLY
 */
router.post('/buses', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { bus_number, total_seats, layout_type, bus_type, is_active } = req.body;
        
        if (!bus_number || !total_seats) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: bus_number, total_seats'
            });
        }
        
        const [result] = await db.query(`
            INSERT INTO Buses (bus_number, total_seats, layout_type, bus_type, is_active)
            VALUES (?, ?, ?, ?, ?)
        `, [bus_number, total_seats, layout_type || '2x2', bus_type || 'Standard', is_active !== false ? 1 : 0]);
        
        res.status(201).json({
            success: true,
            message: 'Bus created successfully',
            data: { id: result.insertId }
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
 * DELETE /api/schedules/buses/:id
 * Delete bus (only if no schedules exist)
 * ADMIN ONLY
 */
router.delete('/buses/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [schedules] = await db.query('SELECT COUNT(*) as count FROM Schedules WHERE bus_id = ?', [id]);
        
        if (schedules[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete bus with ${schedules[0].count} schedule(s). Delete schedules first.`
            });
        }
        
        await db.query('DELETE FROM Buses WHERE id = ?', [id]);
        
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

module.exports = router;
