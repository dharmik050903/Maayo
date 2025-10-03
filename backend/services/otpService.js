import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

class OTPService {
    constructor() {
        // Email configuration
        const emailService = process.env.EMAIL_SERVICE;
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (!emailUser || !emailPass) {
            throw new Error('Email credentials missing: set EMAIL_USER and EMAIL_PASS in environment');
        }

        this.emailTransporter = nodemailer.createTransport({
            service: emailService,
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: emailUser,
                pass: emailPass
            },
            // Add timeout configurations
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateLimit: 14, // Limit to 14 messages per second
            connectionTimeout: 30000, // 30 seconds
            greetingTimeout: 30000, // 30 seconds
            socketTimeout: 30000, // 30 seconds
            // Add retry configuration
            retryDelay: 5000, // 5 seconds
            logger: false
        });
    }

    // Generate a random OTP code
    generateOTP(length = 6) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        return otp;
    }

    // Generate a secure random string for verification
    generateSecureCode(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Send OTP via email
    async sendOTPEmail(email, otp, purpose, userData = {}) {
        try {
            // Verify transporter is ready
            await this.emailTransporter.verify();
            
            const subject = this.getEmailSubject(purpose);
            const htmlContent = this.getEmailTemplate(otp, purpose, userData);
            const mailOptions = {
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: subject,
                html: htmlContent,
                // Add timeout and retry options
                headers: {
                    'X-Mailer': 'Maayo OTP Service'
                }
            };

            console.log(`Sending OTP email to: ${email}`);
            
            // Send with timeout
            const result = await Promise.race([
                this.emailTransporter.sendMail(mailOptions),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Email timeout')), 25000)
                )
            ]);
            
            console.log(`Email sent successfully: ${result.messageId}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending email:', error);
            
            // Provide more specific error messages
            let errorMessage = error.message;
            if (error.code === 'EAUTH') {
                errorMessage = 'Email authentication failed. Check your email credentials.';
            } else if (error.code === 'ETIMEDOUT') {
                errorMessage = 'Email service timeout. Please try again.';
            } else if (error.code === 'ECONNECTION') {
                errorMessage = 'Email connection failed. Check your network settings.';
            } else if (errorMessage.includes('timeout')) {
                errorMessage = 'Email service timeout. The service might be temporarily unavailable.';
            }
            
            return { success: false, error: errorMessage };
        }
    }

    // Get email subject based on purpose
    getEmailSubject(purpose) {
        const subjects = {
            login: 'Your Login OTP - Maayo',
            password_reset: 'Password Reset OTP - Maayo'
        };
        return subjects[purpose] || 'Your OTP - Maayo';
    }

    // Get email template
    getEmailTemplate(otp, purpose, userData = {}) {
        const templates = {
            login: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Login Verification</h2>
                    <p>Hello${userData.first_name ? ` ${userData.first_name}` : ''},</p>
                    <p>You requested to login to your Maayo account. Use the following OTP to complete your login:</p>
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
                    </div>
                    <p>This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
                    <p>If you didn't request this login, please ignore this email.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">This is an automated message from Maayo.</p>
                </div>
            `,
            password_reset: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hello${userData.first_name ? ` ${userData.first_name}` : ''},</p>
                    <p>You requested to reset your password. Use the following OTP to proceed:</p>
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
                    </div>
                    <p>This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
                    <p>If you didn't request a password reset, please ignore this email.</p>
                    <hr style="margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">This is an automated message from Maayo.</p>
                </div>
            `
        };
        return templates[purpose] || templates.login;
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Get expiration time based on purpose
    getExpirationTime(purpose) {
        const expirationTimes = {
            login: 10, // 10 minutes
            password_reset: 10 // 10 minutes
        };
        
        const minutes = expirationTimes[purpose] || 10;
        return new Date(Date.now() + minutes * 60 * 1000);
    }
}

export default new OTPService();
