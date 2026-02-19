const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendCancellationEmail } = require('../utils/emailService');
const PDFDocument = require('pdfkit');

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
 * GET /api/admin/reports/bookings
 * Get bookings within a travel date range (admin-only). Query: startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/reports/bookings', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let query = `
            SELECT 
                b.id,
                b.booking_uuid,
                b.seat_number,
                b.passenger_name,
                b.passenger_phone,
                b.booking_status,
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
            WHERE 1=1
        `;

        const params = [];
        if (startDate && endDate) {
            query += ' AND DATE(s.travel_date) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY s.travel_date DESC, s.departure_time DESC';

        const [bookings] = await db.query(query, params);

        const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.amount_paid) || 0), 0);

        res.json({
            success: true,
            count: bookings.length,
            totalRevenue,
            data: bookings
        });

    } catch (error) {
        console.error('Error fetching booking report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking report',
            error: error.message
        });
    }
});

/**
 * POST /api/admin/reports/bookings/pdf
 * Generate a PDF booking report for the date range and stream it as attachment
 */
router.post('/reports/bookings/pdf', async (req, res) => {
    try {
        const { startDate, endDate, title } = req.body;

        let query = `
            SELECT 
                b.booking_uuid,
                b.seat_number,
                b.passenger_name,
                b.passenger_phone,
                b.booking_status,
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
            WHERE 1=1
        `;

        const params = [];
        if (startDate && endDate) {
            query += ' AND DATE(s.travel_date) BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY s.travel_date DESC, s.departure_time DESC';

        const [bookings] = await db.query(query, params);

        // Generate PDF using PDFKit with professional design
        const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 50,
            bufferPages: true,
            info: {
                Title: 'Bus Booking Report',
                Author: 'Bus Booking System',
                Subject: 'Booking Report'
            }
        });

        // Set response headers for download
        const fileName = `booking-report-${startDate || 'all'}-to-${endDate || 'all'}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        // Pipe PDF to response
        doc.pipe(res);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 50;

        // Helper function to draw header on each page
        const drawHeader = (pageNum) => {
            // Company header with gradient effect (simulated with rectangles)
            doc.rect(0, 0, pageWidth, 80).fill('#1e40af');
            doc.rect(0, 0, pageWidth, 60).fill('#3b82f6');
            
            // Company name
            doc.fontSize(24).fillColor('#ffffff').font('Helvetica-Bold')
               .text('BUS BOOKING SYSTEM', margin, 20, { align: 'left' });
            
            doc.fontSize(10).fillColor('#e0e7ff')
               .text('Professional Transport Management', margin, 48);
            
            // Report title on right
            doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold')
               .text(title || 'BOOKING REPORT', pageWidth - 250, 25, { width: 200, align: 'right' });
            
            // Page number
            doc.fontSize(8).fillColor('#cbd5e1')
               .text(`Page ${pageNum}`, pageWidth - 100, pageHeight - 30, { width: 50, align: 'right' });
        };

        // Draw first page header
        drawHeader(1);
        doc.moveDown(6);

        // Date range banner
        const rangeText = (startDate && endDate) ? `${startDate} to ${endDate}` : 'All Dates';
        const bannerY = doc.y;
        doc.roundedRect(margin, bannerY, pageWidth - 2 * margin, 35, 5)
           .fill('#f1f5f9');
        
        doc.fontSize(11).fillColor('#475569').font('Helvetica-Bold')
           .text('Report Period:', margin + 15, bannerY + 10)
           .fontSize(12).fillColor('#0f172a').font('Helvetica')
           .text(rangeText, margin + 110, bannerY + 10);
        
        doc.moveDown(3);

        // Summary cards
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((sum, b) => sum + (parseFloat(b.amount_paid) || 0), 0);
        const confirmedBookings = bookings.filter(b => b.booking_status === 'Confirmed').length;
        const cancelledBookings = bookings.filter(b => b.booking_status === 'Cancelled').length;

        const cardY = doc.y;
        const cardWidth = (pageWidth - 2 * margin - 30) / 3;

        // Card 1: Total Bookings
        doc.roundedRect(margin, cardY, cardWidth, 60, 5).fill('#dbeafe');
        doc.fontSize(10).fillColor('#1e40af').font('Helvetica')
           .text('Total Bookings', margin + 10, cardY + 10);
        doc.fontSize(24).fillColor('#1e3a8a').font('Helvetica-Bold')
           .text(totalBookings.toString(), margin + 10, cardY + 28);

        // Card 2: Total Revenue
        doc.roundedRect(margin + cardWidth + 15, cardY, cardWidth, 60, 5).fill('#d1fae5');
        doc.fontSize(10).fillColor('#047857').font('Helvetica')
           .text('Total Revenue', margin + cardWidth + 25, cardY + 10);
        doc.fontSize(20).fillColor('#065f46').font('Helvetica-Bold')
           .text(`Rs. ${totalRevenue.toFixed(2)}`, margin + cardWidth + 25, cardY + 28);

        // Card 3: Confirmed vs Cancelled
        doc.roundedRect(margin + 2 * cardWidth + 30, cardY, cardWidth, 60, 5).fill('#fef3c7');
        doc.fontSize(10).fillColor('#92400e').font('Helvetica')
           .text('Status Breakdown', margin + 2 * cardWidth + 40, cardY + 10);
        doc.fontSize(11).fillColor('#78350f').font('Helvetica')
           .text(`✓ ${confirmedBookings} | ✗ ${cancelledBookings}`, margin + 2 * cardWidth + 40, cardY + 33);

        doc.moveDown(5);

        // Table header with background - A4 optimized layout with Time column
        const tableTop = doc.y;
        const tableWidth = pageWidth - 2 * margin;
        
        doc.roundedRect(margin, tableTop, tableWidth, 32, 3).fill('#334155');

        // Optimized column widths for A4 page (595.28 x 841.89 points, usable: ~495px)
        const colWidths = {
            no: 18,           // #
            uuid: 80,         // Booking ID
            passenger: 70,    // Passenger
            route: 75,        // Route
            date: 50,         // Date
            time: 38,         // Time
            seat: 28,         // Seat
            status: 55,       // Status
            amount: 55        // Amount
        };

        // Calculate column X positions with 2px spacing
        let currentX = margin + 2;
        const colX = {};
        ['no', 'uuid', 'passenger', 'route', 'date', 'time', 'seat', 'status', 'amount'].forEach(col => {
            colX[col] = currentX;
            currentX += colWidths[col] + 2;
        });

        // Draw table header text - set styles once, then draw each column
        doc.fontSize(8);
        doc.fillColor('#ffffff');
        doc.font('Helvetica-Bold');
        
        doc.text('#', colX.no, tableTop + 11, { width: colWidths.no, align: 'left', lineBreak: false });
        doc.text('Booking ID', colX.uuid, tableTop + 11, { width: colWidths.uuid, align: 'left', lineBreak: false });
        doc.text('Passenger', colX.passenger, tableTop + 11, { width: colWidths.passenger, align: 'left', lineBreak: false });
        doc.text('Route', colX.route, tableTop + 11, { width: colWidths.route, align: 'left', lineBreak: false });
        doc.text('Date', colX.date, tableTop + 11, { width: colWidths.date, align: 'left', lineBreak: false });
        doc.text('Time', colX.time, tableTop + 11, { width: colWidths.time, align: 'center', lineBreak: false });
        doc.text('Seat', colX.seat, tableTop + 11, { width: colWidths.seat, align: 'center', lineBreak: false });
        doc.text('Status', colX.status, tableTop + 11, { width: colWidths.status, align: 'center', lineBreak: false });
        doc.text('Amount', colX.amount, tableTop + 11, { width: colWidths.amount, align: 'right', lineBreak: false });

        doc.moveDown(3);

        // Table rows with alternating colors
        let y = doc.y;
        const rowHeight = 28;
        let pageNum = 1;

        bookings.forEach((b, i) => {
            if (y + rowHeight > pageHeight - 80) {
                doc.addPage();
                pageNum++;
                drawHeader(pageNum);
                y = 140;
                
                // Redraw table header on new page
                doc.roundedRect(margin, y - 32, tableWidth, 32, 3);
                doc.fill('#334155');
                doc.fontSize(8);
                doc.fillColor('#ffffff');
                doc.font('Helvetica-Bold');
                
                doc.text('#', colX.no, y - 21, { width: colWidths.no, align: 'left', lineBreak: false });
                doc.text('Booking ID', colX.uuid, y - 21, { width: colWidths.uuid, align: 'left', lineBreak: false });
                doc.text('Passenger', colX.passenger, y - 21, { width: colWidths.passenger, align: 'left', lineBreak: false });
                doc.text('Route', colX.route, y - 21, { width: colWidths.route, align: 'left', lineBreak: false });
                doc.text('Date', colX.date, y - 21, { width: colWidths.date, align: 'left', lineBreak: false });
                doc.text('Time', colX.time, y - 21, { width: colWidths.time, align: 'center', lineBreak: false });
                doc.text('Seat', colX.seat, y - 21, { width: colWidths.seat, align: 'center', lineBreak: false });
                doc.text('Status', colX.status, y - 21, { width: colWidths.status, align: 'center', lineBreak: false });
                doc.text('Amount', colX.amount, y - 21, { width: colWidths.amount, align: 'right', lineBreak: false });
            }

            // Alternating row background
            if (i % 2 === 0) {
                doc.rect(margin, y - 3, tableWidth, rowHeight).fill('#f8fafc');
            } else {
                doc.rect(margin, y - 3, tableWidth, rowHeight).fill('#ffffff');
            }
            
            // Draw row border
            doc.strokeColor('#e2e8f0').lineWidth(0.5)
               .moveTo(margin, y + rowHeight - 3)
               .lineTo(pageWidth - margin, y + rowHeight - 3)
               .stroke();

            // Prepare data with smart truncation
            const routeText = `${b.origin.substring(0, 7)}→${b.destination.substring(0, 7)}`;
            const travelDate = b.travel_date ? new Date(b.travel_date).toLocaleDateString('en-GB').substring(0, 10) : '';
            const departureTime = b.departure_time ? b.departure_time.substring(0, 5) : '';
            const bookingId = b.booking_uuid.length > 14 ? b.booking_uuid.substring(0, 11) + '...' : b.booking_uuid;
            const passengerName = b.passenger_name.length > 14 ? b.passenger_name.substring(0, 11) + '...' : b.passenger_name;
            
            // Status color
            let statusColor, statusBg;
            if (b.booking_status === 'Confirmed') {
                statusColor = '#059669';
                statusBg = '#d1fae5';
            } else if (b.booking_status === 'Cancelled') {
                statusColor = '#dc2626';
                statusBg = '#fee2e2';
            } else {
                statusColor = '#6b7280';
                statusBg = '#f3f4f6';
            }

            const yPos = y + 8;

            // Row number
            doc.fontSize(7);
            doc.fillColor('#475569');
            doc.font('Helvetica');
            doc.text((i + 1).toString(), colX.no, yPos, { width: colWidths.no, align: 'left', lineBreak: false });

            // Booking ID
            doc.fontSize(7);
            doc.fillColor('#0f172a');
            doc.text(bookingId, colX.uuid, yPos, { width: colWidths.uuid, align: 'left', lineBreak: false });

            // Passenger Name
            doc.text(passengerName, colX.passenger, yPos, { width: colWidths.passenger, align: 'left', lineBreak: false });

            // Route
            doc.text(routeText, colX.route, yPos, { width: colWidths.route, align: 'left', lineBreak: false });

            // Date
            doc.text(travelDate, colX.date, yPos, { width: colWidths.date, align: 'left', lineBreak: false });

            // Time
            doc.fillColor('#1e40af');
            doc.font('Helvetica-Bold');
            doc.text(departureTime, colX.time, yPos, { width: colWidths.time, align: 'center', lineBreak: false });

            // Seat
            doc.fontSize(8);
            doc.text(b.seat_number, colX.seat, yPos, { width: colWidths.seat, align: 'center', lineBreak: false });
            
            // Status badge
            const statusBadgeWidth = colWidths.status - 2;
            doc.roundedRect(colX.status, y + 5, statusBadgeWidth, 16, 3);
            doc.fill(statusBg);
            doc.fontSize(7);
            doc.fillColor(statusColor);
            doc.text(b.booking_status, colX.status + 1, y + 9, { width: statusBadgeWidth - 2, align: 'center', lineBreak: false });
            
            // Amount
            doc.fillColor('#0f172a');
            doc.text(`Rs ${(parseFloat(b.amount_paid) || 0).toFixed(2)}`, colX.amount, yPos, { width: colWidths.amount, align: 'right', lineBreak: false });

            y += rowHeight;
        });

        // Footer section
        doc.moveDown(2);
        const footerY = doc.y;
        doc.rect(margin, footerY, pageWidth - 2 * margin, 40).fill('#f1f5f9');
        
        doc.fontSize(9).fillColor('#475569').font('Helvetica')
           .text(`Generated on: ${new Date().toLocaleString('en-GB', { 
               year: 'numeric', month: 'long', day: 'numeric', 
               hour: '2-digit', minute: '2-digit' 
           })}`, margin + 10, footerY + 8);
        
        doc.fontSize(8).fillColor('#64748b')
           .text('This is a computer-generated report. No signature required.', margin + 10, footerY + 24);

        doc.end();

    } catch (error) {
        console.error('Error generating booking report PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF report',
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

/**
 * POST /api/admin/users/bulk-delete
 * Delete multiple users by id (skips admin users to prevent accidental removal)
 */
router.post('/users/bulk-delete', async (req, res) => {
    try {
        const { userIds } = req.body;
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No user IDs provided' });
        }

        // Build placeholders and execute delete while skipping admin role users
        const placeholders = userIds.map(() => '?').join(',');
        const sql = `DELETE FROM Users WHERE id IN (${placeholders}) AND role != 'admin'`;
        const [result] = await db.query(sql, userIds);

        res.json({
            success: true,
            deletedCount: result.affectedRows
        });

    } catch (error) {
        console.error('Error bulk deleting users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete users',
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
            // Get schedule breakdown for better information
            const [activeSchedules] = await db.query(
                'SELECT COUNT(*) as count FROM Schedules WHERE route_id = ? AND status = "Scheduled"',
                [routeId]
            );

            return res.status(400).json({
                success: false,
                message: 'Cannot delete route with existing schedules. Please delete or cancel all schedules first.',
                scheduleCount: schedules[0].count,
                activeScheduleCount: activeSchedules[0].count,
                suggestion: activeSchedules[0].count > 0 
                    ? 'Cancel active schedules before deleting this route'
                    : 'Delete completed/cancelled schedules before deleting this route'
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

/**
 * POST /api/admin/routes/bulk-delete
 * Bulk delete routes (only those without schedules)
 */
router.post('/routes/bulk-delete', async (req, res) => {
    try {
        const { routeIds } = req.body;

        if (!routeIds || !Array.isArray(routeIds) || routeIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'routeIds array is required and must not be empty'
            });
        }

        // Check each route for schedules
        const results = {
            deleted: [],
            skipped: [],
            errors: []
        };

        for (const routeId of routeIds) {
            try {
                // Check if route has schedules
                const [schedules] = await db.query(
                    'SELECT COUNT(*) as count FROM Schedules WHERE route_id = ?',
                    [routeId]
                );

                if (schedules[0].count > 0) {
                    // Get active schedule count
                    const [activeSchedules] = await db.query(
                        'SELECT COUNT(*) as count FROM Schedules WHERE route_id = ? AND status = "Scheduled"',
                        [routeId]
                    );

                    results.skipped.push({
                        id: routeId,
                        reason: 'Has existing schedules',
                        scheduleCount: schedules[0].count,
                        activeScheduleCount: activeSchedules[0].count
                    });
                } else {
                    // Safe to delete
                    await db.query('DELETE FROM Routes WHERE id = ?', [routeId]);
                    results.deleted.push(routeId);
                }
            } catch (error) {
                results.errors.push({
                    id: routeId,
                    error: error.message
                });
            }
        }

        const summary = {
            total: routeIds.length,
            deleted: results.deleted.length,
            skipped: results.skipped.length,
            errors: results.errors.length
        };

        res.json({
            success: true,
            message: `Bulk delete completed: ${summary.deleted} deleted, ${summary.skipped} skipped, ${summary.errors} errors`,
            summary,
            results
        });

    } catch (error) {
        console.error('Error in bulk delete routes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform bulk delete',
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
            SELECT 
                b.*,
                (SELECT COUNT(*) FROM Schedules WHERE bus_id = b.id) as schedule_count,
                (SELECT COUNT(*) FROM Schedules WHERE bus_id = b.id AND status = 'Scheduled') as active_schedule_count
            FROM Buses b 
            ORDER BY bus_number
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
            // Get schedule breakdown for better information
            const [activeSchedules] = await db.query(
                'SELECT COUNT(*) as count FROM Schedules WHERE bus_id = ? AND status = "Scheduled"',
                [busId]
            );

            return res.status(400).json({
                success: false,
                message: 'Cannot delete bus with existing schedules. Please delete or cancel all schedules first.',
                scheduleCount: schedules[0].count,
                activeScheduleCount: activeSchedules[0].count,
                suggestion: activeSchedules[0].count > 0 
                    ? 'Cancel active schedules before deleting this bus'
                    : 'Delete completed/cancelled schedules before deleting this bus'
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

/**
 * POST /api/admin/buses/bulk-delete
 * Bulk delete buses (only those without schedules)
 */
router.post('/buses/bulk-delete', async (req, res) => {
    try {
        const { busIds } = req.body;

        if (!busIds || !Array.isArray(busIds) || busIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'busIds array is required and must not be empty'
            });
        }

        // Check each bus for schedules
        const results = {
            deleted: [],
            skipped: [],
            errors: []
        };

        for (const busId of busIds) {
            try {
                // Check if bus has schedules
                const [schedules] = await db.query(
                    'SELECT COUNT(*) as count FROM Schedules WHERE bus_id = ?',
                    [busId]
                );

                if (schedules[0].count > 0) {
                    // Get active schedule count
                    const [activeSchedules] = await db.query(
                        'SELECT COUNT(*) as count FROM Schedules WHERE bus_id = ? AND status = "Scheduled"',
                        [busId]
                    );

                    results.skipped.push({
                        id: busId,
                        reason: 'Has existing schedules',
                        scheduleCount: schedules[0].count,
                        activeScheduleCount: activeSchedules[0].count
                    });
                } else {
                    // Safe to delete
                    await db.query('DELETE FROM Buses WHERE id = ?', [busId]);
                    results.deleted.push(busId);
                }
            } catch (error) {
                results.errors.push({
                    id: busId,
                    error: error.message
                });
            }
        }

        const summary = {
            total: busIds.length,
            deleted: results.deleted.length,
            skipped: results.skipped.length,
            errors: results.errors.length
        };

        res.json({
            success: true,
            message: `Bulk delete completed: ${summary.deleted} deleted, ${summary.skipped} skipped, ${summary.errors} errors`,
            summary,
            results
        });

    } catch (error) {
        console.error('Error in bulk delete buses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform bulk delete',
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
 * POST /api/admin/schedules/:scheduleId/duplicate
 * Duplicate an existing schedule with a new date
 */
router.post('/schedules/:scheduleId/duplicate', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { travel_date, departure_time, arrival_time } = req.body;

        if (!travel_date) {
            return res.status(400).json({
                success: false,
                message: 'New travel_date is required to duplicate schedule'
            });
        }

        // Get the original schedule details
        const [originalSchedule] = await db.query(`
            SELECT route_id, bus_id, departure_time, arrival_time 
            FROM Schedules 
            WHERE id = ?
        `, [scheduleId]);

        if (originalSchedule.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Original schedule not found'
            });
        }

        const schedule = originalSchedule[0];
        const newDepartureTime = departure_time || schedule.departure_time;
        const newArrivalTime = arrival_time || schedule.arrival_time;

        // Check if schedule already exists for this bus/date/time
        const [existing] = await db.query(`
            SELECT id FROM Schedules 
            WHERE bus_id = ? AND travel_date = ? AND departure_time = ?
        `, [schedule.bus_id, travel_date, newDepartureTime]);

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'A schedule already exists for this bus at this date and time'
            });
        }

        // Get bus total seats
        const [bus] = await db.query('SELECT total_seats FROM Buses WHERE id = ?', [schedule.bus_id]);
        const available_seats = bus[0].total_seats;

        // Create the duplicate schedule
        const [result] = await db.query(`
            INSERT INTO Schedules 
            (route_id, bus_id, travel_date, departure_time, arrival_time, available_seats, status)
            VALUES (?, ?, ?, ?, ?, ?, 'Scheduled')
        `, [schedule.route_id, schedule.bus_id, travel_date, newDepartureTime, newArrivalTime, available_seats]);

        res.status(201).json({
            success: true,
            message: 'Schedule duplicated successfully',
            data: {
                id: result.insertId,
                route_id: schedule.route_id,
                bus_id: schedule.bus_id,
                travel_date,
                departure_time: newDepartureTime,
                arrival_time: newArrivalTime,
                available_seats,
                status: 'Scheduled'
            }
        });

    } catch (error) {
        console.error('Error duplicating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to duplicate schedule',
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
            'SELECT COUNT(*) as count FROM Bookings WHERE schedule_id = ? AND booking_status = "Confirmed"',
            [scheduleId]
        );

        if (bookings[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete schedule with existing bookings. Consider cancelling it instead.',
                bookingCount: bookings[0].count,
                canCancel: true
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
 * POST /api/admin/schedules/bulk-delete
 * Bulk delete schedules (only those without confirmed bookings)
 */
router.post('/schedules/bulk-delete', async (req, res) => {
    try {
        const { scheduleIds } = req.body;

        if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'scheduleIds array is required and must not be empty'
            });
        }

        // Check each schedule for bookings
        const results = {
            deleted: [],
            skipped: [],
            errors: []
        };

        for (const scheduleId of scheduleIds) {
            try {
                // Check if schedule has confirmed bookings
                const [bookings] = await db.query(
                    'SELECT COUNT(*) as count FROM Bookings WHERE schedule_id = ? AND booking_status = "Confirmed"',
                    [scheduleId]
                );

                if (bookings[0].count > 0) {
                    results.skipped.push({
                        id: scheduleId,
                        reason: 'Has confirmed bookings',
                        bookingCount: bookings[0].count
                    });
                } else {
                    // Safe to delete
                    await db.query('DELETE FROM Schedules WHERE id = ?', [scheduleId]);
                    results.deleted.push(scheduleId);
                }
            } catch (error) {
                results.errors.push({
                    id: scheduleId,
                    error: error.message
                });
            }
        }

        const summary = {
            total: scheduleIds.length,
            deleted: results.deleted.length,
            skipped: results.skipped.length,
            errors: results.errors.length
        };

        res.json({
            success: true,
            message: `Bulk delete completed: ${summary.deleted} deleted, ${summary.skipped} skipped, ${summary.errors} errors`,
            summary,
            results
        });

    } catch (error) {
        console.error('Error in bulk delete:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform bulk delete',
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

        // If cancelling, update all confirmed bookings for this schedule
        if (status === 'Cancelled') {
            await db.query(
                'UPDATE Bookings SET booking_status = "Cancelled", cancelled_at = NOW(), cancellation_reason = "Schedule cancelled by admin" WHERE schedule_id = ? AND booking_status = "Confirmed"',
                [scheduleId]
            );
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
