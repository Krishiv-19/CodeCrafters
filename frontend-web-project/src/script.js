// Simple demo logic for UI switching and mock data

// Section switching
function showSection(id) {
    document.querySelectorAll('main section').forEach(sec => sec.className = 'hidden');
    document.getElementById(id).className = 'active';
}

// Populate country and currency selects using restcountries API
async function populateCountries() {
    console.log('populateCountries called');
    const countrySelect = document.getElementById('countrySelect');
    countrySelect.innerHTML = '<option value="">Loading...</option>';
    try {
        const res = await fetch('https://restcountries.com/v3.1/all');
        if (!res.ok) throw new Error('Network response was not ok');
        const countries = await res.json();
        countrySelect.innerHTML = '';
        countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
        countries.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.cca2;
            opt.textContent = c.name.common;
            opt.dataset.currency = c.currencies ? Object.keys(c.currencies)[0] : '';
            countrySelect.appendChild(opt);
        });
        countrySelect.onchange = function() {
            const selected = countrySelect.options[countrySelect.selectedIndex];
            setCurrency(selected.dataset.currency);
        };
        // Set default currency
        if (countrySelect.options.length > 0) {
            setCurrency(countrySelect.options[0].dataset.currency);
        }
    } catch (err) {
        countrySelect.innerHTML = '<option value="">Failed to load countries</option>';
        console.error('Error loading countries:', err);
    }
}
function setCurrency(currency) {
    const currencySelect = document.getElementById('currencySelect');
    currencySelect.innerHTML = '';
    if (currency) {
        const opt = document.createElement('option');
        opt.value = currency;
        opt.textContent = currency;
        currencySelect.appendChild(opt);
    }
    // Add some common currencies for demo
    ['USD','EUR','INR','GBP'].forEach(cur => {
        if (cur !== currency) {
            const opt = document.createElement('option');
            opt.value = cur;
            opt.textContent = cur;
            currencySelect.appendChild(opt);
        }
    });
}

// Mock login/signup
document.getElementById('loginForm').onsubmit = function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const country = document.getElementById('countrySelect').value;
    document.getElementById('loginMsg').textContent = `Logged in as ${email} (${country})`;
    showSection('employeeSection');
};

// Expense submission
let expenses = [];
document.getElementById('expenseForm').onsubmit = async function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const currency = document.getElementById('currencySelect').value;
    const category = document.getElementById('categorySelect').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;
    let convertedAmount = amount;
    let companyCurrency = document.getElementById('currencySelect').options[0].value;
    if (currency !== companyCurrency) {
        // Convert currency using exchangerate-api
        const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
        const data = await res.json();
        convertedAmount = (amount * data.rates[companyCurrency]).toFixed(2);
    }
    expenses.push({
        date, amount, currency, category, description, status: 'Pending', comments: '', convertedAmount, companyCurrency
    });
    renderExpenseHistory();
    document.getElementById('expenseForm').reset();
};

// Render expense history
function renderExpenseHistory() {
    const tbody = document.getElementById('expenseHistory').querySelector('tbody');
    tbody.innerHTML = '';
    expenses.forEach(exp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${exp.date}</td>
            <td>${exp.amount} (${exp.convertedAmount} ${exp.companyCurrency})</td>
            <td>${exp.currency}</td>
            <td>${exp.category}</td>
            <td>${exp.status}</td>
            <td>${exp.comments}</td>`;
        tbody.appendChild(tr);
    });
}

// OCR placeholder
function runOCR() {
    document.getElementById('ocrResult').textContent = 'OCR scan simulated: Amount: 123.45, Date: 2025-10-04, Vendor: Demo Restaurant';
    document.getElementById('amount').value = 123.45;
    document.getElementById('date').value = '2025-10-04';
    document.getElementById('description').value = 'Demo Restaurant';
}

// Manager approval queue (mock)
let approvalQueue = [];
function renderApprovalQueue() {
    const tbody = document.getElementById('approvalQueue').querySelector('tbody');
    tbody.innerHTML = '';
    expenses.filter(e => e.status === 'Pending').forEach((exp, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>Employee</td>
            <td>${exp.date}</td>
            <td>${exp.convertedAmount} ${exp.companyCurrency}</td>
            <td>${exp.category}</td>
            <td>${exp.description}</td>
            <td><button onclick="alert('Show receipt')">View</button></td>
            <td>
                <button onclick="approveExpense(${idx})">Approve</button>
                <button onclick="rejectExpense(${idx})">Reject</button>
            </td>`;
        tbody.appendChild(tr);
    });
}
function approveExpense(idx) {
    expenses[idx].status = 'Approved';
    expenses[idx].comments = 'Approved by Manager';
    renderExpenseHistory();
    renderApprovalQueue();
}
function rejectExpense(idx) {
    expenses[idx].status = 'Rejected';
    expenses[idx].comments = 'Rejected by Manager';
    renderExpenseHistory();
    renderApprovalQueue();
}

// Admin panel (mock)
function showUserMgmt() {
    document.getElementById('adminContent').innerHTML = `
        <h3>User Management</h3>
        <p>Create users, assign roles, and set manager relationships here (UI not implemented in demo).</p>
    `;
}
function showApprovalRules() {
    document.getElementById('adminContent').innerHTML = `
        <h3>Approval Rules</h3>
        <p>Configure multi-level and conditional approval rules here (UI not implemented in demo).</p>
    `;
}

// Initial setup
window.onload = function() {
    populateCountries();
    renderExpenseHistory();
    renderApprovalQueue();
};