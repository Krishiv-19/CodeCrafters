-- I. Core Setup
CREATE TABLE Companies (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    default_currency CHAR(3) NOT NULL, 
    admin_user_id INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- II. Users and Roles
CREATE TYPE user_role AS ENUM ('Admin', 'Manager', 'Employee');
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES Companies(company_id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,             -- Role assignment/change
    manager_id INTEGER REFERENCES Users(user_id), -- Manager relationship
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- III. Expense Submission
CREATE TYPE expense_status AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TABLE Expenses (
    expense_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(user_id),
    company_id INTEGER NOT NULL REFERENCES Companies(company_id),
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    original_amount NUMERIC(10, 2) NOT NULL,
    original_currency CHAR(3) NOT NULL,
    converted_amount NUMERIC(10, 2),    
    company_currency CHAR(3) NOT NULL,
    receipt_url TEXT,                   
    current_status expense_status NOT NULL DEFAULT 'Pending',
    current_approver_id INTEGER REFERENCES Users(user_id), 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- IV. Advanced Approval Workflow Logic (Rules)
CREATE TYPE rule_type AS ENUM ('Sequential', 'Percentage', 'Specific');
CREATE TABLE ApprovalRules (
    rule_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES Companies(company_id),
    name VARCHAR(255) NOT NULL,
    rule_type rule_type NOT NULL,
    conditions JSONB, -- Stores conditional data (e.g., {'percentage': 0.6, 'target_role': 'Finance'})
    order_priority INTEGER NOT NULL 
);

-- V. Approval History and Steps
CREATE TABLE ApprovalSteps (
    step_id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL REFERENCES Expenses(expense_id),
    approver_id INTEGER REFERENCES Users(user_id), 
    sequence_order INTEGER NOT NULL,
    status expense_status NOT NULL DEFAULT 'Pending',
    comments TEXT,
    approved_at TIMESTAMP WITHOUT TIME ZONE
);