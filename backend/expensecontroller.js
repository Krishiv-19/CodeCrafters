// NOTE: This requires running Node.js with Express and a DB setup.

const db = require('../db'); // Placeholder for Database connection setup
const workflowService = require('../services/workflowService'); // Placeholder for complex rule logic

// Mock Currency Service implementation (Replicating logic from frontend)
async function getConversionRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;
    
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);
        const data = await response.json();
        const rate = data.rates[toCurrency];

        if (!rate) {
            throw new Error(`Rate not found for target currency: ${toCurrency}`);
        }
        return rate;

    } catch (error) {
        console.error("Currency Conversion Error:", error.message);
        throw new Error("External currency API failed."); 
    }
}

// Handles POST /api/expenses - Expense Submission
async function submitExpense(req, res) {
    // Assume req.user is populated by authentication middleware
    const { amount, currency, category, description, date, receipt_url } = req.body;
    const userId = req.user.user_id; // Example User ID
    const companyId = req.user.company_id; // Example Company ID
    
    // Look up company currency from the database
    const companyInfo = await db.query('SELECT default_currency FROM Companies WHERE company_id = $1', [companyId]);
    const companyCurrency = companyInfo.rows[0].default_currency; 

    let convertedAmount = parseFloat(amount);
    
    try {
        // --- Currency Conversion Logic ---
        if (currency !== companyCurrency) {
            const rate = await getConversionRate(currency, companyCurrency);
            convertedAmount = (parseFloat(amount) * rate).toFixed(2); 
        }

        // --- Database Insertion ---
        const expenseResult = await db.query(
            `INSERT INTO Expenses 
            (user_id, company_id, date, category, description, original_amount, original_currency, 
             converted_amount, company_currency, current_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending')
            RETURNING expense_id`,
            [userId, companyId, date, category, description, amount, currency, convertedAmount, companyCurrency]
        );
        const expenseId = expenseResult.rows[0].expense_id;

        // --- Initiate Approval Workflow (Placeholder) ---
        // await workflowService.initiate(expenseId, userId); 

        res.status(201).json({ 
            message: "Expense submitted successfully.", 
            expenseId: expenseId 
        });

    } catch (error) {
        console.error('Submission Error:', error.message);
        res.status(500).json({ error: "Failed to process expense submission." });
    }
}

// Placeholder for Database abstraction
const db = {
    query: async (sql, params) => {
        // Mock DB implementation for blueprint
        if (sql.includes('SELECT default_currency')) {
            return { rows: [{ default_currency: 'USD' }] };
        }
        if (sql.includes('INSERT INTO Expenses')) {
            return { rows: [{ expense_id: Math.floor(Math.random() * 1000) }] };
        }
        return { rows: [] };
    }
};

module.exports = { submitExpense };