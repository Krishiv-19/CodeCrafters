// Placeholder imports for a Node.js/Express environment
const db = require('../db'); // Database client
const bcrypt = require('bcrypt'); // Password hashing library
const jwt = require('jsonwebtoken'); // JSON Web Token for session management

// Configuration (In a real app, these would be in environment variables)
const JWT_SECRET = 'YOUR_SUPER_SECURE_JWT_SECRET'; 
const HASH_SALT_ROUNDS = 10;

/**
 * Handles user sign-in and routes the user based on their role.
 * POST /api/auth/login
 */
async function loginUser(req, res) {
    const { email, password } = req.body;

    try {
        // 1. Find user by email
        const userResult = await db.query(
            'SELECT user_id, company_id, role, password_hash FROM Users WHERE email = $1',
            [email]
        );

        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Authentication failed. User not found.' });
        }

        // 2. Verify password hash
        // In a real system, the first user signup would need to CREATE the company.
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Authentication failed. Invalid password.' });
        }

        // 3. Generate JWT (JSON Web Token) for session management
        const token = jwt.sign(
            { id: user.user_id, role: user.role, companyId: user.company_id },
            JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // 4. Success: Return token and role for dynamic frontend routing
        res.status(200).json({
            message: 'Login successful.',
            token: token,
            user: {
                id: user.user_id,
                role: user.role, // Crucial for routing to Employee/Manager/Admin dashboard
                companyId: user.company_id
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during authentication.' });
    }
}

/**
 * Handles user sign-up (New user creation, includes logic for first Admin).
 * POST /api/auth/signup
 */
async function signupUser(req, res) {
    const { email, password, countryCode, companyName } = req.body;

    try {
        // 1. Determine if this is the first user (System Setup)
        const companyCountResult = await db.query('SELECT COUNT(*) FROM Companies');
        const isFirstUser = parseInt(companyCountResult.rows[0].count) === 0;

        // 2. Determine default currency (In a real system, you'd use restcountries API here)
        const defaultCurrency = 'USD'; // Simplified currency determination

        // 3. Set role and company ID
        let role = 'Employee';
        let companyId = null;

        if (isFirstUser) {
            // A. Create Company
            const companyResult = await db.query(
                `INSERT INTO Companies (name, default_currency) VALUES ($1, $2) RETURNING company_id`,
                [companyName || 'Default Company', defaultCurrency]
            );
            companyId = companyResult.rows[0].company_id;
            role = 'Admin'; // Assign Admin role to the very first user
        }
        
        // 4. Hash password and save user
        const passwordHash = await bcrypt.hash(password, HASH_SALT_ROUNDS);
        
        const userResult = await db.query(
            `INSERT INTO Users (company_id, email, password_hash, role) 
             VALUES ($1, $2, $3, $4) RETURNING user_id`,
            [companyId, email, passwordHash, role]
        );

        // 5. If Admin, update Company's admin_user_id (omitted for brevity)

        res.status(201).json({ 
            message: `Account created successfully. Role: ${role}. Please proceed to login.`,
        });

    } catch (error) {
        if (error.code === '23505') { // PostgreSQL unique violation code
            return res.status(409).json({ error: 'Email already registered.' });
        }
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create user account.' });
    }
}


module.exports = { loginUser, signupUser };

// --- Placeholder for Database Abstraction ---
const db = {
    // This mocks the database interface for the blueprint
    query: async (sql, params) => {
        // Mock implementation for demo purposes
        if (sql.includes('SELECT COUNT(*) FROM Companies')) {
            // Assume 1 company exists for subsequent logins
            return { rows: [{ count: '1' }] }; 
        }
        if (sql.includes('SELECT user_id, company_id, role, password_hash FROM Users')) {
            // Mock returning a user (assuming bcrypt hash for 'password' is calculated)
            // You should pre-calculate the hash of 'password' if testing this mock
            const mockedHashedPassword = await bcrypt.hash('password', HASH_SALT_ROUNDS);
            return { rows: [{ 
                user_id: 101, 
                company_id: 1, 
                role: 'Manager', // Change this to 'Admin' or 'Employee' for testing
                password_hash: mockedHashedPassword
            }]};
        }
        return { rows: [] };
    },
};