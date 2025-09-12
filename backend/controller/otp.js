import OTP from "../schema/otp.js";
import PersonMaster from "../schema/PersonMaster.js";
import otpService from "../services/otpService.js";
import { generateToken } from "../middlewares/token.js";
import bcrypt from "bcryptjs";

export default class OTPController {
    // Send OTP for login
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
                    message: "Invalid email format"
                });
            }

            // Check if user exists
            const user = await PersonMaster.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found with this email address"
                });
            }

            // Check if user is active
            if (user.status !== 1) {
                return res.status(403).json({
                    status: false,
                    message: "Account is inactive. Please contact support."
                });
            }

            // Generate OTP
            const otpCode = otpService.generateOTP();
            const expiresAt = otpService.getExpirationTime('login');

            // Invalidate any existing pending OTPs for this email
            await OTP.updateMany(
                {
                    email,
                    purpose: 'login',
                    status: 'pending'
                },
                { status: 'expired' }
            );

            // Create new OTP record
            const otpRecord = new OTP({
                email,
                otp_code: otpCode,
                purpose: 'login',
                user_id: user._id,
                expires_at: expiresAt,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('User-Agent')
            });

            await otpRecord.save();

            // Send OTP via email
            const sendResult = await otpService.sendOTPEmail(
                email,
                otpCode,
                'login',
                { first_name: user.first_name }
            );

            if (!sendResult.success) {
                await OTP.findByIdAndDelete(otpRecord._id);
                return res.status(500).json({
                    status: false,
                    message: "Failed to send OTP. Please try again.",
                    error: sendResult.error
                });
            }

            return res.status(200).json({
                status: true,
                message: "OTP sent successfully to your email",
                expires_in: 10 * 60 // 10 minutes in seconds
            });

        } catch (error) {
            console.error("Error sending login OTP:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to send OTP",
                error: error.message
            });
        }
    }

    // Verify OTP and login
    async verifyLoginOTP(req, res) {
        try {
            const { email, otp_code } = req.body;

            if (!email || !otp_code) {
                return res.status(400).json({
                    status: false,
                    message: "Email and otp_code are required"
                });
            }

            // Find the OTP record
            const otpRecord = await OTP.findOne({
                email,
                otp_code,
                purpose: 'login',
                status: 'pending'
            });

            if (!otpRecord) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid or expired OTP"
                });
            }

            // Check if OTP is valid
            if (!otpRecord.isValid()) {
                await otpRecord.incrementAttempts();
                return res.status(400).json({
                    status: false,
                    message: "Invalid or expired OTP"
                });
            }

            // Get user information
            const user = await PersonMaster.findById(otpRecord.user_id);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found"
                });
            }

            // Mark OTP as verified
            otpRecord.markAsVerified();
            await otpRecord.save();

            // Update user's last login
            await PersonMaster.updateOne(
                { _id: user._id },
                { $set: { last_login: new Date().toISOString() } }
            );

            // Generate JWT token
            const token = generateToken({
                id: String(user._id),
                username: user.personName || `${user.first_name} ${user.last_name}`,
                role: user.user_type,
                email: user.email
            });

            return res.status(200).json({
                status: true,
                message: "Login successful",
                token,
                user: {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    personName: user.personName,
                    email: user.email,
                    contact_number: user.contact_number,
                    country: user.country,
                    user_type: user.user_type,
                    status: user.status,
                    createdAt: user.createdAt,
                    last_login: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error("Error verifying login OTP:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to verify OTP",
                error: error.message
            });
        }
    }


    // Send OTP for password reset
    async sendPasswordResetOTP(req, res) {
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
                    message: "Invalid email format"
                });
            }

            // Check if user exists
            const user = await PersonMaster.findOne({ email });

            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found with this email address"
                });
            }

            // Generate OTP
            const otpCode = otpService.generateOTP();
            const expiresAt = otpService.getExpirationTime('password_reset');

            // Invalidate any existing pending OTPs for this email
            await OTP.updateMany(
                {
                    email,
                    purpose: 'password_reset',
                    status: 'pending'
                },
                { status: 'expired' }
            );

            // Create new OTP record
            const otpRecord = new OTP({
                email,
                otp_code: otpCode,
                purpose: 'password_reset',
                user_id: user._id,
                expires_at: expiresAt,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('User-Agent')
            });

            await otpRecord.save();

            // Send OTP via email
            const sendResult = await otpService.sendOTPEmail(
                email,
                otpCode,
                'password_reset',
                { first_name: user.first_name }
            );

            if (!sendResult.success) {
                await OTP.findByIdAndDelete(otpRecord._id);
                return res.status(500).json({
                    status: false,
                    message: "Failed to send OTP. Please try again.",
                    error: sendResult.error
                });
            }

            return res.status(200).json({
                status: true,
                message: "OTP sent successfully to your email",
                expires_in: 10 * 60 // 10 minutes in seconds
            });

        } catch (error) {
            console.error("Error sending password reset OTP:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to send OTP",
                error: error.message
            });
        }
    }

    // Verify OTP and reset password
    async verifyPasswordResetOTP(req, res) {
        try {
            const { email, otp_code, new_password } = req.body;

            if (!email || !otp_code || !new_password) {
                return res.status(400).json({
                    status: false,
                    message: "Email, otp_code, and new_password are required"
                });
            }

            // Find the OTP record
            const otpRecord = await OTP.findOne({
                email,
                otp_code,
                purpose: 'password_reset',
                status: 'pending'
            });

            if (!otpRecord) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid or expired OTP"
                });
            }

            // Check if OTP is valid
            if (!otpRecord.isValid()) {
                await otpRecord.incrementAttempts();
                return res.status(400).json({
                    status: false,
                    message: "Invalid or expired OTP"
                });
            }

            // Get user information
            const user = await PersonMaster.findById(otpRecord.user_id);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: "User not found"
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(new_password, 10);

            // Update user password
            await PersonMaster.updateOne(
                { _id: user._id },
                { $set: { password: hashedPassword } }
            );

            // Mark OTP as verified
            otpRecord.markAsVerified();
            await otpRecord.save();

            return res.status(200).json({
                status: true,
                message: "Password reset successfully"
            });

        } catch (error) {
            console.error("Error verifying password reset OTP:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to reset password",
                error: error.message
            });
        }
    }

    // Resend OTP
    async resendOTP(req, res) {
        try {
            const { email, purpose } = req.body;

            if (!email || !purpose) {
                return res.status(400).json({
                    status: false,
                    message: "Email and purpose are required"
                });
            }

            // Validate purpose
            if (!['login', 'password_reset'].includes(purpose)) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid purpose"
                });
            }

            // Check if there's a recent OTP request (prevent spam)
            const recentOTP = await OTP.findOne({
                email,
                purpose,
                createdAt: { $gte: new Date(Date.now() - 60 * 1000) } // 1 minute ago
            });

            if (recentOTP) {
                return res.status(429).json({
                    status: false,
                    message: "Please wait before requesting another OTP"
                });
            }

            // Call appropriate method based on purpose
            if (purpose === 'login') {
                return await this.sendLoginOTP(req, res);
            } else if (purpose === 'password_reset') {
                return await this.sendPasswordResetOTP(req, res);
            } else {
                return res.status(400).json({
                    status: false,
                    message: "Invalid purpose for resend"
                });
            }

        } catch (error) {
            console.error("Error resending OTP:", error);
            return res.status(500).json({
                status: false,
                message: "Failed to resend OTP",
                error: error.message
            });
        }
    }
}
