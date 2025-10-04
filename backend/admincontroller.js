// Placeholder imports
const db = require('../db'); 
const bcrypt = require('bcrypt'); // Required for securing passwords

/**
 * Creates a new user (Employee, Manager, or Admin) and assigns their role.
 * POST /api/admin/users
 */
async function createUser(req, res) {
    const { email, password, firstName, lastName, role, managerId } = req.body;
    // In a real system, the companyId is derived from the authenticated Admin's session.
    const companyId = req.user.company_id; 

    if (!['Employee', 'Manager', 'Admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role specified." });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        
        const result = await db.query(
            `INSERT INTO Users (company_id, email, password_hash, first_name, last_name, role, manager_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id`,
            [companyId, email, passwordHash, firstName, lastName, role, role === 'Employee' ? managerId : null]
        );

        res.status(201).json({ 
            message: `${role} created and assigned.`, 
            userId: result.rows[0].user_id 
        });

    } catch (error) {
        console.error('User creation failed:', error);
        res.status(500).json({ error: "Failed to create user." });
    }
}

/**
 * Assigns or changes a user's role and manager relationship.
 * PUT /api/admin/users/:userId
 */
async function updateUserRoleAndManager(req, res) {
    const { userId } = req.params;
    const { role, managerId } = req.body;
    
    if (!['Employee', 'Manager', 'Admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role specified." });
    }

    try {
        const result = await db.query(
            `UPDATE Users SET role = $1, manager_id = $2 WHERE user_id = $3 RETURNING user_id`,
            [role, role === 'Employee' ? managerId : null, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        res.status(200).json({ message: "User role and manager updated successfully." });

    } catch (error) {
        console.error('Update failed:', error);
        res.status(500).json({ error: "Failed to update user details." });
    }
}

/**
 * Configures a new approval rule (Conditional or Sequential).
 * POST /api/admin/rules
 */
async function configureApprovalRule(req, res) {
    const { name, ruleType, conditions, orderPriority } = req.body;
    const companyId = req.user.company_id;

    try {
        const result = await db.query(
            `INSERT INTO ApprovalRules (company_id, name, rule_type, conditions, order_priority)
             VALUES ($1, $2, $3, $4, $5) RETURNING rule_id`,
            [companyId, name, ruleType, JSON.stringify(conditions), orderPriority]
        );

        res.status(201).json({ 
            message: "Approval rule configured successfully.", 
            ruleId: result.rows[0].rule_id 
        });

    } catch (error) {
        console.error('Rule configuration failed:', error);
        res.status(500).json({ error: "Failed to configure approval rule." });
    }
}

// Placeholder for Database abstraction and mock implementation
const db = {
    query: async (sql, params) => {
        // Mock DB for demonstration
        return { rows: [{ user_id: Math.floor(Math.random() * 100) }] };
    }
};

module.exports = {
    createUser,
    updateUserRoleAndManager,
    configureApprovalRule
};