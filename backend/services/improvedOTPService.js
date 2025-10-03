import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getEmailConfig, ALTERNATIVE_CONFIGS } from './emailConfig.js';

dotenv.config();

class ImprovedOTPService {
    constructor() {
        this.emailTransporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (!emailUser || !emailPass) {
            throw new Error('Email credentials missing: set EMAIL_USER and EMAIL_PASS in environment');
        }

        try {
            // Try primary configuration first
            const config = getEmailConfig();
            this.emailTransporter = nodemailer.createTransport(config);
            console.log('Primary email transporter initialized');
        } catch (error) {
            console.error('Primary email config failed:', error);
            throw new Error('Failed to initialize email service');
        }
    }

    // Method to switch to alternative email service
    async switchToAlternative(service = 'sendgrid') {
        try {
            const alternativeConfig = ALTERNATIVE_CONFIGS[service];
            if (!alternativeConfig) {
                throw new Error(`Unknown alternative service: ${service}`);
            }

            // Check if required credentials are available
            const requiredKeys = this.getRequiredKeysForService(service);
            const missingKeys = requiredKeys.filter(key => !process.env[key]);
            
            if (missingKeys.length > 0) {
                throw new Error(`Missing credentials for ${service}: ${missingKeys.join(', ')}`);
            }

            // Create new transporter
            this.emailTransporter = nodemailer.createTransport(alternativeConfig);
            console.log(`Switched to alternative email service: ${service}`);
            return true;
        } catch (error) {
            console.error(`Failed to switch to ${service}:`, error);
            return false;
        }
    }

    getRequiredKeysForService(service) {
        const keyMap = {
            sendgrid: ['SENDGRID_API_KEY'],
            mailgun: ['MAILGUN_USERNAME', 'MAILGUN_PASSWORD'],
            smtp2go: ['SMTP2GO_USERNAME', 'SMTP2GO_PASSWORD']
        };
        return keyMap[service] || [];
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

    // Send OTP via email with retry logic and fallback services
    async sendOTPEmail(email, otp, purpose, userData = {}) {
        const maxRetries = 2; // Reduced retries per service
        const retryDelay = 1500;
        
        // List of services to try in order
        const servicesToTry = ['primary'];
        
        // Add alternative services if they have credentials
        if (process.env.SENDGRID_API_KEY) servicesToTry.push('sendgrid');
        if (process.env.MAILGUN_USERNAME && process.env.MAILGUN_PASSWORD) servicesToTry.push('mailgun');
        if (process.env.SMTP2GO_USERNAME && process.env.SMTP2GO_PASSWORD) servicesToTry.push('smtp2go');
        
        // Try each service
        for (const service of servicesToTry) {
            console.log(`Trying email service: ${service}`);
            
            // Switch to alternative service if needed
            if (service !== 'primary') {
                const switched = await this.switchToAlternative(service);
                if (!switched) {
                    console.log(`Skipping ${service} - switch failed`);
                    continue;
                }
            } else if (service === 'primary') {
                // Reinitialize primary service
                this.initializeTransporter();
            }
            
            // Try sending with current service
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`Email attempt ${attempt}/${maxRetries} via ${service} to: ${email}`);
                    
                    // Verify connection on first attempt per service
                    if (attempt === 1) {
                        await this.emailTransporter.verify();
                    }
                    
                    const subject = this.getEmailSubject(purpose);
                    const htmlContent = this.getEmailTemplate(otp, purpose, userData);
                    const mailOptions = {
                        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                        to: email,
                        subject: subject,
                        html: htmlContent,
                        headers: {
                            'X-Mailer': `Maayo OTP Service (${service})`,
                            'X-Attempt': attempt.toString(),
                            'X-Service': service
                        }
                    };

                    // Shorter timeout for cloud environments
                    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
                    const timeoutDuration = isProduction ? 10000 : 20000; // 10s for prod, 20s for dev
                    
                    const result = await Promise.race([
                        this.emailTransporter.sendMail(mailOptions),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error(`Email timeout after ${timeoutDuration}ms`)), timeoutDuration)
                        )
                    ]);
                    
                    console.log(`Email sent successfully via ${service} on attempt ${attempt}: ${result.messageId}`);
                    return { 
                        success: true, 
                        messageId: result.messageId,
                        service: service 
                    };
                    
                } catch (error) {
                    console.error(`Email attempt ${attempt} via ${service} failed:`, error.message);
                    
                    // Don't retry for certain errors
                    if (error.code === 'EAUTH' || error.message.includes('Invalid login')) {
                        console.log(`Authentication failed with ${service}, trying next service...`);
                        break; // Try next service
                    }
                    
                    if (error.code === 'EMESSAGE' || error.message.includes('invalid email')) {
                        return { success: false, error: 'Invalid email address provided.' };
                    }
                    
                    // If this was the last attempt for this service, try next service
                    if (attempt === maxRetries) {
                        console.log(`All attempts failed for ${service}, trying next service...`);
                        break;
                    }
                    
                    // Wait before retrying with same service
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }
        
        // All services failed
        return { 
            success: false, 
            error: 'All email services failed. Please check your email configuration or try again later.',
            services_tried: servicesToTry.length 
        };
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
                    <p style="color: #666, font-size: 12px;">This is an automated message from Maayo.</p>
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

export default new ImprovedOTPService();
