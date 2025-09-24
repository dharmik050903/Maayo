// Environment validation utility
const validateEnvironment = () => {
    const requiredEnvVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'MASTER_ADMIN_EMAIL',
        'MASTER_ADMIN_PASSWORD',
        'CONTENT_ADMIN_EMAIL',
        'CONTENT_ADMIN_PASSWORD',
        'SUPPORT_ADMIN_EMAIL',
        'SUPPORT_ADMIN_PASSWORD'
    ]

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:', missingVars.join(', '))
        console.error('Please set these environment variables in your deployment platform (Render)')
        process.exit(1)
    }

    console.log('✅ All required environment variables are set')

    // Validate password strength
    const passwords = [
        process.env.MASTER_ADMIN_PASSWORD,
        process.env.CONTENT_ADMIN_PASSWORD,
        process.env.SUPPORT_ADMIN_PASSWORD
    ]

    passwords.forEach((password, index) => {
        const adminTypes = ['Master', 'Content', 'Support']
        if (password.length < 8) {
            console.warn(`⚠️  ${adminTypes[index]} admin password should be at least 8 characters`)
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
            console.warn(`⚠️  ${adminTypes[index]} admin password should contain uppercase, lowercase, number and special character`)
        }
    })
}

export default validateEnvironment