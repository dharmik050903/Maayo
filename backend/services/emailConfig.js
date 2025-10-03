// Email Configuration for Different Environments
// This file provides optimized email configurations for local development and cloud hosting

export const getEmailConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
    const isCloudHost = process.env.RENDER || process.env.VERCEL || process.env.HEROKU;
    
    const baseConfig = {
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
    };

    if (isCloudHost) {
        // Optimized for cloud hosting (Render, Vercel, Heroku)
        return {
            ...baseConfig,
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false,
            // Cloud-specific optimizations
            pool: false,
            maxConnections: 1,
            maxMessages: 1,
            connectionTimeout: 10000,      // 10 seconds
            greetingTimeout: 8000,          // 8 seconds
            socketTimeout: 12000,           // 12 seconds
            retryDelay: 1000,              // 1 second
            logger: false,
            // TLS configuration for cloud
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3'
            },
            // Additional cloud settings
            requireTLS: true,
            debug: false
        };
    } else if (isProduction) {
        // Production server (non-cloud)
        return {
            ...baseConfig,
            service: process.env.EMAIL_SERVICE || 'gmail',
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 20000,
            pool: true,
            maxConnections: 5,
            logger: false
        };
    } else {
        // Development/Local
        return {
            ...baseConfig,
            service: process.env.EMAIL_SERVICE || 'gmail',
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000,
            logger: true, // Enable logging in development
            debug: true
        };
    }
};

// Alternative email service configurations
export const ALTERNATIVE_CONFIGS = {
    sendgrid: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
        },
        tls: {
            rejectUnauthorized: false
        }
    },
    
    mailgun: {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
            user: process.env.MAILGUN_USERNAME,
            pass: process.env.MAILGUN_PASSWORD
        }
    },
    
    smtp2go: {
        host: 'smtp.smtp2go.com',
        port: 2525,
        secure: false,
        auth: {
            user: process.env.SMTP2GO_USERNAME,
            pass: process.env.SMTP2GO_PASSWORD
        }
    }
};

export default getEmailConfig;
