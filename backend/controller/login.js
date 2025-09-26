import PersonMaster from "../schema/PersonMaster.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../middlewares/token.js";
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export default class Login {
    async authenticate(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            const user = await PersonMaster.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Check if user is suspended
            if (user.status !== 1) {
                return res.status(403).json({ 
                    message: "Your account has been suspended. Please contact support.",
                    suspended: true,
                    status: user.status
                });
            }

            const token = generateToken({
                id: String(user._id),
                username: user.personName || `${user.first_name} ${user.last_name}`,
                role: user.user_type,
                email: user.email
            });

            await PersonMaster.updateOne(
                { _id: user._id },
                { $set: { last_login: new Date().toISOString() } }
            );

            return res.json({
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
            console.error("Error during login:", error);
            return res.status(500).json({ message: "Failed to login", error: error.message });
        }
    }
    async googleLogin(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ message: "Google token is required" });
            }

            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { sub: googleId, email, given_name, family_name, picture, name } = payload;

            let user = await PersonMaster.findOne({ googleId });

            if (!user) {
                // If no user with googleId, check if a user with that email exists
                user = await PersonMaster.findOne({ email });

                if (user) {
                    // Link Google account to existing local account
                    user.googleId = googleId;
                    user.profile_pic = user.profile_pic || picture;
                    await user.save();
                } else {
                    // Create a new user
                    const newUser = new PersonMaster({
                        googleId,
                        email,
                        first_name: given_name,
                        last_name: family_name || ' ',
                        personName: name,
                        profile_pic: picture,
                        user_type: req.headers.userRole, // Or determine this from frontend
                        email_verified: 1,
                        status: 1,
                    });
                    user = await newUser.save();
                }
            }

            // Check if user is suspended
            if (user.status !== 1) {
                return res.status(403).json({ 
                    message: "Your account has been suspended. Please contact support.",
                    suspended: true,
                    status: user.status
                });
            }

            // Generate JWT token
            const jwtToken = generateToken({
                id: String(user._id),
                username: user.personName || `${user.first_name} ${user.last_name}`,
                role: user.user_type,
                email: user.email
            });

            await PersonMaster.updateOne(
                { _id: user._id },
                { $set: { last_login: new Date().toISOString() } }
            );

            return res.status(200).json({
                message: "Google login successful",
                token: jwtToken,
                user: {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    personName: user.personName,
                    email: user.email,
                    user_type: user.user_type,
                    profile_pic: user.profile_pic,
                    status: user.status,
                    last_login: new Date().toISOString()
                }
            });

        } catch (error) {
            res.status(500).json({ message: "Google login failed", error: error.message });
            console.log(error);
        }
    }

    async googleOAuthFlow(req, res) {
        try {
            const { role } = req.body;
            
            if (!role || (role !== 'client' && role !== 'freelancer')) {
                return res.status(400).json({ message: "Valid role (client or freelancer) is required" });
            }

            console.log('🔍 Starting Google OAuth flow for role:', role);

            // Generate OAuth URL
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            // Use a simple redirect URI that doesn't require callback pages
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const redirectUri = `${frontendUrl}/login`;
            
            console.log('🔍 OAuth Configuration Debug:');
            console.log('  - Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET');
            console.log('  - Client Secret:', clientSecret ? 'SET' : 'NOT SET');
            console.log('  - Redirect URI:', redirectUri);
            
            const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
            authUrl.searchParams.set('client_id', clientId);
            authUrl.searchParams.set('redirect_uri', redirectUri);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('scope', 'email profile');
            authUrl.searchParams.set('access_type', 'offline');
            authUrl.searchParams.set('prompt', 'select_account');
            authUrl.searchParams.set('state', role);

            console.log('🔗 Generated OAuth URL:', authUrl.toString());
            console.log('🔗 Redirect URI being sent:', redirectUri);

            return res.json({
                message: "OAuth URL generated successfully",
                authUrl: authUrl.toString(),
                redirectUri: redirectUri
            });

        } catch (error) {
            console.error("Error generating OAuth URL:", error);
            return res.status(500).json({ 
                message: "Failed to generate OAuth URL", 
                error: error.message 
            });
        }
    }

    async googleOAuthCallback(req, res) {
        try {
            const { code, state } = req.query;
            
            if (!code) {
                return res.status(400).json({ message: "Authorization code is required" });
            }

            console.log('🔍 OAuth callback - Code received:', code);
            console.log('🔍 State (role):', state);

            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const redirectUri = `http://localhost:5173/auth/google/callback`;

            // Exchange code for access token
            const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            });

            const { access_token } = tokenResponse.data;
            console.log('🔍 Access token received');

            // Get user info from Google
            const userInfoResponse = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`);
            const userInfo = userInfoResponse.data;
            
            console.log('🔍 User info from Google:', userInfo);

            const { id: googleId, email, given_name, family_name, picture, name } = userInfo;

            // Find or create user
            let user = await PersonMaster.findOne({ googleId });

            if (!user) {
                // If no user with googleId, check if a user with that email exists
                user = await PersonMaster.findOne({ email });

                if (user) {
                    // Link Google account to existing local account
                    user.googleId = googleId;
                    user.profile_pic = user.profile_pic || picture;
                    await user.save();
                } else {
                    // Create a new user
                    const newUser = new PersonMaster({
                        googleId,
                        email,
                        first_name: given_name,
                        last_name: family_name || ' ',
                        personName: name,
                        profile_pic: picture,
                        user_type: state || 'freelancer', // Use state as role
                        email_verified: 1,
                        status: 1,
                    });
                    user = await newUser.save();
                }
            }

            // Check if user is suspended
            if (user.status !== 1) {
                return res.status(403).json({ 
                    message: "Your account has been suspended. Please contact support.",
                    suspended: true,
                    status: user.status
                });
            }

            // Generate JWT token
            const jwtToken = generateToken({
                id: String(user._id),
                username: user.personName || `${user.first_name} ${user.last_name}`,
                role: user.user_type,
                email: user.email
            });

            // Update last login
            await PersonMaster.updateOne(
                { _id: user._id },
                { $set: { last_login: new Date().toISOString() } }
            );

            // Redirect to frontend with success
            const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/success?token=${jwtToken}&role=${user.user_type}`;
            return res.redirect(frontendUrl);

        } catch (error) {
            console.error("Error during Google OAuth callback:", error);
            const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/error?error=${encodeURIComponent(error.message)}`;
            return res.redirect(frontendUrl);
        }
    }
}

