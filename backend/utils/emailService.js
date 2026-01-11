const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

/**
 * Send booking confirmation email
 */
const sendBookingConfirmation = async (bookingData) => {
    const { email, name, bookingReference, seatNumber, route, date, time, amount } = bookingData;

    const mailOptions = {
        from: `"Bus Booking System" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Booking Confirmation - ${bookingReference}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Booking Confirmed! 🎉</h2>
                <p>Dear <strong>${name}</strong>,</p>
                <p>Your bus seat booking has been confirmed successfully.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Booking Details</h3>
                    <p><strong>Booking Reference:</strong> ${bookingReference}</p>
                    <p><strong>Route:</strong> ${route}</p>
                    <p><strong>Travel Date:</strong> ${date}</p>
                    <p><strong>Departure Time:</strong> ${time}</p>
                    <p><strong>Seat Number:</strong> ${seatNumber}</p>
                    <p><strong>Amount Paid:</strong> LKR ${amount}</p>
                </div>
                
                <p>Please arrive at the departure point at least 15 minutes before the scheduled time.</p>
                <p>Keep this booking reference for your records.</p>
                
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                    If you need to cancel your booking, please contact us with your booking reference.
                </p>
            </div>
        `
    };

    try {
        if (!process.env.SMTP_USER) {
            console.log('📧 Email not configured. Would send to:', email);
            console.log('Booking Reference:', bookingReference);
            return { success: true, message: 'Email service not configured' };
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send booking cancellation email
 */
const sendCancellationEmail = async (bookingData) => {
    const { email, name, bookingReference, seatNumber, route } = bookingData;
    const toEmail = email || process.env.CANCELLATION_FALLBACK_EMAIL;
    const bcc = process.env.CANCELLATION_BCC_EMAIL;

    const mailOptions = {
        from: `"Bus Booking System" <${process.env.SMTP_USER}>`,
        to: toEmail,
        ...(bcc ? { bcc } : {}),
        subject: `Booking Cancelled - ${bookingReference}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Booking Cancelled</h2>
                <p>Dear <strong>${name}</strong>,</p>
                <p>Your booking has been cancelled successfully.</p>
                
                <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Booking Reference:</strong> ${bookingReference}</p>
                    <p><strong>Route:</strong> ${route}</p>
                    <p><strong>Seat Number:</strong> ${seatNumber}</p>
                </div>
                
                <p>If you have any questions, please contact our support team.</p>
            </div>
        `
    };

    try {
        if (!process.env.SMTP_USER) {
            console.log('📧 Cancellation email not configured. Would send to:', toEmail || '[no recipient]');
            return { success: true, message: 'Email service not configured' };
        }

        if (!toEmail) {
            console.warn('📧 Cancellation email skipped: no recipient and no fallback configured');
            return { success: false, error: 'No recipient email provided' };
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Cancellation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send welcome email to new users
 */
const sendWelcomeEmail = async (userData) => {
    const { email, name } = userData;

    const mailOptions = {
        from: `"Bus Booking System" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Welcome to Bus Booking System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome Aboard! 🚌</h2>
                <p>Dear <strong>${name}</strong>,</p>
                <p>Thank you for registering with Bus Booking System.</p>
                <p>You can now book bus tickets online with ease!</p>
                
                <p>Features you can enjoy:</p>
                <ul>
                    <li>Easy seat selection</li>
                    <li>Instant booking confirmation</li>
                    <li>View your booking history</li>
                    <li>Manage your bookings</li>
                </ul>
                
                <p>Happy travels!</p>
            </div>
        `
    };

    try {
        if (!process.env.SMTP_USER) {
            console.log('📧 Welcome email not configured. Would send to:', email);
            return { success: true, message: 'Email service not configured' };
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send password reset OTP
 */
const sendPasswordResetEmail = async (data) => {
    const { email, name, otp } = data;

    const mailOptions = {
        from: `"Bus Booking System" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Password Reset Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Password Reset</h2>
                <p>Dear <strong>${name || 'user'}</strong>,</p>
                <p>Your password reset code is:</p>
                <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0;font-size:20px;text-align:center;font-weight:bold;">${otp}</div>
                <p>This code expires in 15 minutes. If you did not request a password reset, please ignore this email.</p>
            </div>
        `
    };

    try {
        if (!process.env.SMTP_USER) {
            console.log('📧 Password reset email not configured. Would send to:', email);
            console.log('OTP:', otp);
            return { success: true, message: 'Email service not configured' };
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendBookingConfirmation,
    sendCancellationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail
};
