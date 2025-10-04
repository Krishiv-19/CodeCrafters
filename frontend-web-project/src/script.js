// Global state and constants (for demo purposes)
let expenses = [];
const companyCurrency = 'USD'; 

// Add global state for current user
let currentUser = null;
let currentUserRole = null;

// --- Static Fallback Data (For robust loading) ---
const staticCountryFallback = [
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
    { code: 'IN', name: 'India', currency: 'INR' },
    { code: 'FR', name: 'France', currency: 'EUR' }
];

// --- Role Access Control Helpers ---

/**
 * Shows ONLY the navigation button specific to the logged-in role.
 * @param {string} role - 'Employee', 'Manager', or 'Admin'.
 */
function setRoleSpecificAccess(role) {
    // Hide all dashboard buttons initially
    document.querySelectorAll('#dashboard-nav .role-btn').forEach(btn => {
        btn.style.display = 'none';
    });

    // Show only the button corresponding to the logged-in role
    if (role === 'Employee') {
        document.getElementById('nav-employee-btn').style.display = 'flex';
    } else if (role === 'Manager') {
        document.getElementById('nav-manager-btn').style.display = 'flex';
    } else if (role === 'Admin') {
        document.getElementById('nav-admin-btn').style.display = 'flex';
    }
}

/**
 * Manages the visibility of the main navigation containers.
 * @param {boolean} show - true to show dashboard/signout, false to show login.
 */
function setDashboardAccess(show) {
    const dashboardNav = document.getElementById('dashboard-nav');
    const signOutBtn = document.getElementById('signOutBtn');
    const loginBtn = document.getElementById('nav-login');

    if (show) {
        dashboardNav.style.display = 'flex';
        signOutBtn.style.display = 'flex';
        loginBtn.style.display = 'none'; // Hide Login button after successful auth
    } else {
        dashboardNav.style.display = 'none';
        signOutBtn.style.display = 'none';
        loginBtn.style.display = 'flex'; // Show Login button after sign out

        // Hide all specific role buttons when signing out
        document.querySelectorAll('#dashboard-nav .role-btn').forEach(btn => {
            btn.style.display = 'none';
        });
    }
}


// --- Core UI Management ---
function showSection(id) {
    document.querySelectorAll('main section').forEach(sec => sec.className = 'hidden card');
    document.getElementById(id).className = 'active card';
}

function handleSignOut() {
    // Do NOT clear expenses on sign out!
    // expenses = [];
    document.getElementById('loginMsg').textContent = `Signed out successfully.`;
    
    setDashboardAccess(false);
    
    showSection('loginSection'); 
    renderExpenseHistory();
    renderApprovalQueue();
    console.log("User signed out. Access restricted.");
}

// --- Data Population (RESILIENT API FIX) ---
async function populateCountries() {
    const countrySelect = document.getElementById('countrySelect');
    countrySelect.innerHTML = '<option value="">Loading...</option>'; 
    
    let countriesData = [];

    try {
        const res = await fetch('https://restcountries.com/v3.1/all');
        if (!res.ok) throw new Error('Network response was not ok');
        
        const apiData = await res.json();
        
        countriesData = apiData.map(c => ({
            code: c.cca2,
            name: c.name.common,
            currency: c.currencies ? Object.keys(c.currencies)[0] : 'N/A'
        }));
        
    } catch (err) {
        console.error('API Error: Falling back to static country list.', err);
        countriesData = staticCountryFallback;
    }

    if (countriesData.length > 0) {
        countrySelect.innerHTML = ''; 
        const sortedCountries = countriesData.sort((a, b) => a.name.localeCompare(b.name));
        
        sortedCountries.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.code;
            opt.textContent = c.name;
            opt.dataset.currency = c.currency; 
            countrySelect.appendChild(opt);
        });

        if (countrySelect.options.length > 0) {
             setCurrency(countrySelect.options[0].dataset.currency);
        }

    } else {
         countrySelect.innerHTML = '<option value="">No countries available</option>';
    }

    countrySelect.onchange = function() {
        const selected = countrySelect.options[countrySelect.selectedIndex];
        setCurrency(selected.dataset.currency);
    };
}

/**
 * Populates the currency select dropdown. (FIXED LOGIC)
 */
function setCurrency(baseCurrency) {
    const currencySelect = document.getElementById('currencySelect');
    currencySelect.innerHTML = ''; 
    
    const commonCurrencies = new Set();
    
    if (baseCurrency && baseCurrency !== 'N/A') {
        commonCurrencies.add(baseCurrency);
    }
    
    commonCurrencies.add(companyCurrency);
    commonCurrencies.add('EUR');
    commonCurrencies.add('INR');
    commonCurrencies.add('GBP');
    
    commonCurrencies.forEach(cur => {
        const opt = document.createElement('option');
        opt.value = cur;
        opt.textContent = cur;
        currencySelect.appendChild(opt);
    });
}

// --- Authentication & Expense Submission (FINAL, CORRECTED ROLE ROUTING) ---
function handleLoginSubmit(e) {
    // Note: e.preventDefault() is handled by the HTML form's onsubmit attribute (return false).
    
    const email = document.getElementById('email').value;
    const userRole = document.getElementById('userRoleSelect').value; 

    // Save current user info
    currentUser = email;
    currentUserRole = userRole;

    if (!userRole) {
        document.getElementById('loginMsg').textContent = 'Please select your role.';
        return; // Stop execution
    }

    document.getElementById('loginMsg').textContent = `Login successful as ${email}. Role: ${userRole}. Redirecting to ${userRole} Dashboard...`;
    
    // Execute final routing logic inside a small delay for stable execution
    setTimeout(() => {
        // 1. Enable full dashboard access and show only the correct button
        setDashboardAccess(true);
        setRoleSpecificAccess(userRole);
        
        let targetSectionId = '';

        if (userRole === 'Employee') {
            targetSectionId = 'employeeSection';
        } else if (userRole === 'Manager') {
            renderApprovalQueue(); // Render manager queue
            targetSectionId = 'managerSection';
        } else if (userRole === 'Admin') {
            targetSectionId = 'adminSection';
        }
        
        // 3. Execute redirection immediately
        if (targetSectionId) {
            showSection(targetSectionId);
        }

    }, 50); // 50ms delay for stable execution
}

document.getElementById('expenseForm').onsubmit = async function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const currency = document.getElementById('currencySelect').value;
    const category = document.getElementById('categorySelect').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;
    
    let convertedAmount = amount;
    
    try {
        if (currency !== companyCurrency) {
            const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
            const data = await res.json();
            
            if (!data.rates || !data.rates[companyCurrency]) {
                throw new Error(`Exchange rate for ${companyCurrency} not found.`);
            }
            convertedAmount = (amount * data.rates[companyCurrency]).toFixed(2);
        }
    } catch (err) {
        alert(`Currency conversion failed. Using original amount for history view. Error: ${err.message}`);
        convertedAmount = amount; 
    }

    // 1. ADD new 'Pending' expense to the global array, include submittedBy
    expenses.push({
        date, amount, currency, category, description, status: 'Pending', comments: '', convertedAmount, companyCurrency,
        submittedBy: currentUser
    });
    saveExpenses(); // <--- Add this line
    renderExpenseHistory();
    renderApprovalQueue(); 
    
    document.getElementById('expenseForm').reset();
    document.getElementById('ocrResult').textContent = '';
};

// --- Manager/Employee Functions ---
function renderExpenseHistory() { 
    const tbody = document.getElementById('expenseHistory').querySelector('tbody');
    tbody.innerHTML = '';
    // Show only expenses submitted by the current user (employee)
    expenses
        .filter(exp => exp.submittedBy === currentUser)
        .forEach(exp => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${exp.date}</td>
                <td>${exp.amount} ${exp.currency} (${exp.convertedAmount} ${exp.companyCurrency})</td>
                <td>${exp.currency}</td>
                <td>${exp.category}</td>
                <td>${exp.status}</td>
                <td>${exp.comments}</td>`;
            tbody.appendChild(tr);
        });
}

function renderApprovalQueue() {
    const tbody = document.getElementById('approvalQueue').querySelector('tbody');
    tbody.innerHTML = '';
    // Debug: Log pending expenses
    const pending = expenses.filter(e => e.status === 'Pending');
    console.log('Pending expenses for manager:', pending);
    pending.forEach((exp, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${exp.submittedBy || 'Employee'}</td>
            <td>${exp.date}</td>
            <td>${exp.convertedAmount} ${exp.companyCurrency}</td>
            <td>${exp.category}</td>
            <td>${exp.description}</td>
            <td><button class="secondary-btn" onclick="viewReceiptDetails(${idx})">View</button></td>
            <td>
                <button onclick="approveExpense(${idx})" class="primary-btn">Approve</button>
                <button onclick="rejectExpense(${idx})" class="secondary-btn">Reject</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function viewReceiptDetails(idx) {
    const exp = expenses[idx];
    
    const receiptContent = `
        --- Receipt Details ---
        Expense ID: ${idx + 1}
        Description: ${exp.description}
        Original Amount: ${exp.amount} ${exp.currency}
        
        [SIMULATION ONLY]
        In a full system, the receipt image would appear here in a modal.
        -----------------------
        Status: ${exp.status}
    `;
    
    alert(receiptContent);
}

// FIX: Manager Action Logic (Updates status and refreshes both tables)
function approveExpense(idx) {
    expenses[idx].status = 'Approved';
    expenses[idx].comments = 'Approved by Manager';
    saveExpenses(); // <--- Add this line
    renderExpenseHistory();
    renderApprovalQueue();
}

function rejectExpense(idx) {
    const comments = prompt("Please enter a reason for rejection:");
    expenses[idx].status = 'Rejected';
    expenses[idx].comments = `Rejected by Manager: ${comments || 'No reason provided.'}`;
    saveExpenses(); // <--- Add this line
    renderExpenseHistory();
    renderApprovalQueue();
}

// --- OCR and Admin Functions ---
function runOCR() { 
    const fileInput = document.getElementById('receipt');
    const ocrResultDiv = document.getElementById('ocrResult');
    ocrResultDiv.textContent = 'Scanning...';

    if (!fileInput.files || !fileInput.files[0]) {
        ocrResultDiv.textContent = 'Please select an image file first.';
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        Tesseract.recognize(
            e.target.result,
            'eng',
            { logger: m => { ocrResultDiv.textContent = `Scanning: ${Math.round(m.progress*100)}%`; } }
        ).then(({ data: { text } }) => {
            ocrResultDiv.textContent = 'Scan complete! Extracted text:';
            ocrResultDiv.innerHTML += `<pre style="white-space:pre-wrap;background:#f7f7f7;padding:0.5em;border-radius:6px;">${text}</pre>`;

            const amountMatch = text.match(/(?:TOTAL|BALANCE|DUE|SUBTOTAL)\s*[^\d\n]*\s*([$£€]?\s*[\d,]+\.\d{2})/i) || 
                              text.match(/([$£€]?\s*[\d,]+\.\d{2})\s*(?:total|paid|amount)/i) || 
                              text.match(/([$£€]?\s*[\d,]+\.\d{2})/); 

            const dateMatch = text.match(/(\d{1,4}[\/\-\. ]\d{1,2}[\/\-\. ]\d{2,4})/);

            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

            if (amountMatch) {
                const cleanedAmount = amountMatch[1].replace(/[$£€,\s]/g, '');
                document.getElementById('amount').value = cleanedAmount;
            }

            if (dateMatch) {
                 document.getElementById('date').value = formatDateForInput(dateMatch[1]);
            }

            if (lines.length > 0) {
                document.getElementById('description').value = lines[0];
            }
        });
    };
    reader.readAsDataURL(file);
}
function formatDateForInput(dateStr) {
    let d = dateStr.replace(/[\.\-]/g, '/');
    let parts = d.split('/');
    if (parts.length === 3) {
        let [a, b, c] = parts.map(x => x.padStart(2, '0'));
        if (a.length === 4) return `${a}-${b}-${c}`;
        if (c.length === 4) return `${c}-${b}-${a}`;
    }
    return '';
}

function showUserMgmt() {
    document.getElementById('adminContent').innerHTML = `
        <h3><i class="fa-solid fa-users"></i> User Management (Create & Assign Roles)</h3>
        
        <form id="createUserForm" onsubmit="handleUserCreation(event)">
            <h4>Create New User</h4>
            <div class="form-row">
                <div class="form-group"><label>First Name</label><input type="text" id="admin_firstName" required></div>
                <div class="form-group"><label>Last Name</label><input type="text" id="admin_lastName" required></div>
                <div class="form-group"><label>Email</label><input type="email" id="admin_email" required></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Password</label><input type="password" id="admin_password" required></div>
                <div class="form-group"><label>Role</label>
                    <select id="admin_role" required>
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                <div class="form-group"><label>Manager ID (For Employees)</label><input type="number" id="admin_managerId" placeholder="Optional User ID of Manager"></div>
            </div>
            <button type="submit" class="primary-btn"><i class="fa-solid fa-user-plus"></i> Create User (POST API)</button>
        </form>
        
        <hr style="margin: 2em 0;">

        <h4>Assign/Change Role & Manager</h4>
        <form onsubmit="handleRoleChange(event)">
            <div class="form-row">
                <div class="form-group"><label>User ID to Modify</label><input type="number" id="modify_userId" required></div>
                <div class="form-group"><label>New Role</label>
                    <select id="modify_role" required>
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                <div class="form-group"><label>New Manager ID</label><input type="number" id="modify_managerId" placeholder="New Manager ID (Optional)"></div>
            </div>
            <button type="submit" class="secondary-btn"><i class="fa-solid fa-arrows-rotate"></i> Change Role/Manager (PUT API)</button>
        </form>
    `;
}

// --- User Management Demo Storage ---
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}
function loadUsers() {
    const data = localStorage.getItem('users');
    return data ? JSON.parse(data) : [];
}

// --- Refined User Creation Handler ---
function handleUserCreation(e) {
    e.preventDefault();

    // Collect form data
    const firstName = document.getElementById('admin_firstName').value.trim();
    const lastName = document.getElementById('admin_lastName').value.trim();
    const email = document.getElementById('admin_email').value.trim().toLowerCase();
    const password = document.getElementById('admin_password').value;
    const role = document.getElementById('admin_role').value;
    const managerId = document.getElementById('admin_managerId').value || null;

    // Inline validation
    if (!firstName || !lastName || !email || !password || !role) {
        alert('All fields except Manager ID are required.');
        return;
    }
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
        alert('Please enter a valid email address.');
        return;
    }

    // Load existing users and check for duplicates
    const users = loadUsers();
    if (users.some(u => u.email === email)) {
        alert('A user with this email already exists.');
        return;
    }

    // Create user object
    const newUser = {
        id: users.length + 1,
        firstName,
        lastName,
        email,
        password, // In real apps, never store plain passwords!
        role,
        managerId
    };

    users.push(newUser);
    saveUsers(users);

    alert(`User created: ${firstName} ${lastName} (${role})`);
    document.getElementById('createUserForm').reset();
}

// --- Admin Functions ---
function showApprovalRules() {
    document.getElementById('adminContent').innerHTML = `
        <h3><i class="fa-solid fa-sitemap"></i> Set Approval Rule</h3>
        <form id="approvalRuleForm" onsubmit="handleRuleConfiguration(event)">
            <div class="form-group">
                <label>Approval Rule Type</label>
                <select id="rule_type" required>
                    <option value="">Select Rule Type</option>
                    <option value="Sequential">Sequential (Manager → Finance)</option>
                    <option value="Percentage">Percentage (e.g., 60% of Approvers)</option>
                    <option value="Specific">Specific Approver (e.g., CFO Auto-Approve)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Rule Details (JSON or Text)</label>
                <textarea id="rule_conditions" placeholder='e.g. {"threshold": 0.6, "role": "Finance"}' rows="3"></textarea>
            </div>
            <button type="submit" class="primary-btn"><i class="fa-solid fa-gear"></i> Save Rule</button>
        </form>
        <div id="ruleStatusMsg" style="margin-top:1em;color:#2d6a4f;"></div>
    `;
}

function handleRuleConfiguration(e) {
    e.preventDefault();
    const ruleType = document.getElementById('rule_type').value;
    const ruleConditions = document.getElementById('rule_conditions').value;

    if (!ruleType) {
        alert('Please select a rule type.');
        return;
    }

    // Save rule to localStorage for demo
    const rule = { ruleType, ruleConditions };
    localStorage.setItem('approvalRule', JSON.stringify(rule));

    document.getElementById('ruleStatusMsg').textContent = `Approval rule saved: ${ruleType}`;
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function loadExpenses() {
    const data = localStorage.getItem('expenses');
    expenses = data ? JSON.parse(data) : [];
}

window.onload = function() {
    loadExpenses(); // <--- Add this line
    populateCountries();
    renderExpenseHistory();
    renderApprovalQueue();
};