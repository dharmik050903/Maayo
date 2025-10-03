import OTP from "../schema/otp.js";
import PersonMaster from "../schema/PersonMaster.js";
import otpService from "../services/improvedOTPService.js";
import { generateToken } from "../middlewares/token.js";
import bcrypt from "bcryptjs";

export default class ImprovedOTPController {
    // Send OTP for login with better error handling
    async sendLoginOTP(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({
                    status: false,
                    message: "Email is required"
                });
            }

            // Validate email format
            if (!otpService.isValidEmail(email)) {
                return res.status(400).json({
                    status: false,
                    message: "Please provide a valid email address"
                });
            }

            // Check if user exists
            const user = await PersonMaster.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "No account found with this email address"
                });
            }

            // Check if user is active
            if (user.status !== 1) {
                return res.status(403).json({
                    status: false,
                    message: "Account is inactive. Please contact support."
                });
            }

            // Check for existing unexpired OTP
            const existingOTP = await OTP.findOne({
                email: email.toLowerCase(),
                purpose: 'login',
                expires_at: { $gt: new Date() },
                used: false
            });

            if (existingOTP) {
                const timeLeft = Math.ceil((existingOTP.expires_at - new Date()) / 1000 / 60);
                if (timeLeft > 7) { // Allow resend after 3 minutes (7 minutes left)
                    return res.status(429).json({
                        status: false,
                        message: `Please wait ${timeLeft} minutes before requesting a new OTP`
                    });
                }
            }

            // Generate new OTP
            const otp = otpService.generateOTP();
            const expirationTime = otpService.getExpirationTime('login');

            // Save OTP with comprehensive info
            await OTP.create({
                email: email.toLowerCase(),
                otp: otp,
                purpose: 'login',
                expires_at: expirationTime,
                used: false,
                user_id: user._id,
                user_type: user.user_type,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('User-Agent'),
                attempts: 0,
                success: false,
                error_message: null
            });

            console.log(`Generated login OTP for: ${email}`);

            // Send email with timeout-aware approach
            const emailResult = await this.sendOTPWithFallback(email, otp, 'login', {
                first_name: user.first_name,
                last_name: user.last_name,
                user_type: user.user_type
            });

            if (emailResult.success) {
                console.log(`OTP email sent successfully via ${emailResult.service} - ID: ${emailResult.messageId}`);
                
                return res.status(200).json({
                    status: true,
                    message: `OTP sent successfully! Check your email (service: ${emailResult.service})`,
                    data: {
                        email: email.toLowerCase(),
                        expires_at: expirationTime,
                        service_used: emailResult.service
                    }
                });
            } else {
                return res.status(503).json({
                    status: false,
                    message: emailResult.error || "Failed to send OTP email. Please try again.",
                    error: emailResult.error,
                    error_type: "email_service_failure",
                    services_tried: emailResult.services_tried || 1
                });
            }

        } catch (error) {
            console.error("Error in sendLoginOTP:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error while processing OTP request",
                error: error.message
            });
        }
    }

    // Send OTP for password reset with email validation
    async sendPasswordResetOTP(req, res) {
        try {
            const { email, purpose } = req.body;
            if (!email || !purpose) {
                return res.status(400).json({
                    status: false,
                    message: "Email and purpose are required"
                });
            }

            // Validate email format
            if (!otpService.isValidEmail(email)) {
                return res.status(400).json({
                    status: false,
                    message: "Please provide a valid email address"
                });
            }

            // Validate purpose
            const validPurposes = ['login']; // Only login for now
            if (!validPurposes.includes(purpose)) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid purpose"
                });
            }

            // Check if user exists
            const user = await PersonMaster.findOne({ email: email.toLowerCase() });
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "No account found with this email address"
                });
            }

            // Check if user is active
            if (user.status !== 1) {
                return res.status(403).json({
                    status: false,
                    message: "Account is inactive. Please contact support."
                });
            }

            // Check for existing unexpired OTP
            const existingOTP = await OTP.findOne({
                email: email.toLowerCase(),
                purpose: purpose,
                expires_at: { $gt: new Date() },
                used: false
            });

            if (existingOTP) {
                const timeLeft = Math.ceil((existingOTP.expires_at - new Date()) / 1000 / 60);
                return res.status(200).json({
                    status: true,
                    message: `OTP already sent! Please check your email. Time left: ${timeLeft} minute(s)`,
                    data: {
                        email: email.toLowerCase(),
                        expires_at: existingOTP.expires_at,
                        existing_otp: true
                    }
                });
            }

            // Generate new OTP
            const otp = otpService.generateOTP();
            const expirationTime = otpService.getExpirationTime(purpose);

            // Save OTP record
            await OTP.create({
                email: email.toLowerCase(),
                otp: otp,
                purpose: purpose,
                expires_at: expirationTime,
                used: false,
                user_id: user._id,
                user_type: user.user_type,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('User-Agent'),
                attempts: 0,
                success: false,
                error_message: null
            });

            console.log(`Generated ${purpose} OTP for: ${email}`);

            // Send email with fallback
            const emailResult = await this.sendOTPWithFallback(email, otp, purpose, {
                first_name: user.first_name,
                last_name: user.last_name,
                user_type: user.user_type
            });

            if (emailResult.success) {
                return res.status(200).json({
                    status: true,
                    message: `OTP sent successfully! Check your email (service: ${emailResult.service})`,
                    data: {
                        email: email.toLowerCase(),
                        expires_at: expirationTime,
                        service_used: emailResult.service
                    }
                });
            } else {
                return res.status(503).json({
                    status: false,
                    message: emailResult.error || "Failed to send OTP email. Please try again.",
                    error: emailResult.error,
                    error_type: "email_service_failure",
                    services_tried: emailResult.services_tried || 1
                });
            }

        } catch (error) {
            console.error("Error in sendPasswordResetOTP:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error while processing password reset request",
                error: error.message
            });
        }
    }

    // Helper method for sending OTP with fallback services
    async sendOTPWithFallback(email, otp, purpose, userData) {
        try {
            const result = await otpService.sendOTPEmail(email, otp, purpose, userData);
            return result;
        } catch (error) {
            console.error('OTP sending error:', error);
            return {
                success: false,
                error: 'Email service unavailable. Please try again later.',
                services_tried: 1
            };
        }
    }

    // Verify OTP with enhanced security
    async verifyOTP(req, res) {
        try {
            const { email, otp, purpose } = req.body;

            if (!email || !otp || !purpose) {
                return res.status(400).json({
                    status: false,
                    message: "Email, OTP, and purpose are required"
                });
            }

            // Find OTP record
            const otpRecord = await OTP.findOne({
                email: email.toLowerCase(),
                purpose: purpose,
                used: false
            }).sort({ created_at: -1 });

            if (!otpRecord) {
                return res.status(404).json({
                    status: false,
                    message: "OTP not found or already used"
                });
            }

            // Increment attempts counter
            await OTP.findByIdAndUpdate(otpRecord._id, {
                attempts: (otpRecord.attempts || 0) + 1
            });

            // Check if OTP has expired
            if (new Date() > otpRecord.expires_at) {
                return res.status(400).json({
                    status: false,
                    message: "OTP has expired",
                    error_type: "otp_expired"
                });
            }

            // Check number of attempts
            if ((otpRecord.attempts || 0) + 1 > 5) {
                // Mark OTP as used to prevent further attempts
                await OTP.findByIdAndUpdate(otpRecord._id, { used: true });
                return res.status(429).json({
                    status: false,
                    message: "Too many verification attempts. Please request a new OTP.",
                    error_type: "too_many_attempts",
                    attempts: (otpRecord.attempts || 0) + 1,
                    max_attempts: 5
                });
            }

            // Verify OTP
            if (otpRecord.otp !== otp) {
                return res.status(401).json({
                    status: false,
                    message: "Invalid OTP",
                    error_type: "invalid_otp",
                    attempts: (otpRecord.attempts || 0) + 1,
                    remaining_attempts: 5 - ((otpRecord.attempts || 0) + 1)
                });
            }

            // Mark OTP as used
            await OTP.findByIdAndUpdate(otpRecord._id, {
                used: true,
                success: true,
                verified_at: new Date()
            });

            console.log(`OTP verified successfully for: ${email}`);

            return res.status(200).json({
                status: true,
                message: "OTP verified successfully",
                data: {
                    email: email.toLowerCase(),
                    purpose: purpose,
                    verified_at: new Date()
                }
            });

        } catch (error) {
            console.error("Error in verifyOTP:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error during OTP verification",
                error: error.message
            });
        }
    }

    // Login with OTP and generate JWT token
    async loginWithOTP(req, res) {
        try {
            const { email, otp, purpose } = req.body;

            if (!email || !otp || !purpose) {
                return res.status(400).json({
                    status: false,
                    message: "Email, OTP, and purpose are required"
                });
            }

            // Verify OTP first
            const verificationResult = await this.verifyOTP(req, res);
            if (!verificationResult.success) {
                return verificationResult; // Return the verification error
            }

            // Find user
            const user = await PersonMaster.findOne({ email: email.toLowerCase() });
            if (!user || user.status !== 1) {
                return res.status(404).json({
                    status: false,
                    message: "Account not found or inactive"
                });
            }

            // Generate JWT token
            const token = generateToken(
                user._id,
                user.email,
                user.user_type
            );

            console.log(`OTP login successful for: ${email}`);

            return res.status(200).json({
                status: true,
                message: "Login successful",
                data: {
                    user: {
                        _id: user._id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        user_type: user.user_type,
                        country: user.country,
                        created_at: user.createdAt
                    },
                    token: token
                }
            });

        } catch (error) {
            console.error("Error in loginWithOTP:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error during OTP login",
                error: error.message
            });
        }
    }

    // Check OTP status
    async checkOTPStatus(req, res) {
        try {
            const { email, purpose } = req.body;

            if (!email || !purpose) {
            return res.status(400).json({
                status: false,
                message: "Email and purpose are required"
            });
            }

            // Find latest OTP record
            const otpRecord = await OTP.findOne({
                email: email.toLowerCase(),
                purpose: purpose
            }).sort({ created_at: -1 });

            if (!otpRecord) {
                return res.status(404).json({
                    status: false,
                    message: "No OTP found for this email and purpose"
                });
            }

            const timeLeft = otpRecord.expires_at > new Date() 
                ? Math.ceil((otpRecord.expires_at - new Date()) / 1000 / 60)
                : 0;

            return res.status(200).json({
                status: true,
                data: {
                    email: otpRecord.email,
                    purpose: otpRecord.purpose,
                    expires_at: otpRecord.expires_at,
                    used: otpRecord.used,
                    attempts: otpRecord.attempts || 0,
                    time_left_minutes: timeLeft,
                    can_resend: timeLeft < 3, // Can resend after 3 minutes
                    is_expired: timeLeft === 0
                }
            });

        } catch (error) {
            console.error("Error in checkOTPStatus:", error);
            return res.status(500).json({
                status: false,
                message: "Internal server error while checking OTP status",
                error: error.message
            });
        }
    }
}

export const otpController = new ImprovedOTPController();
