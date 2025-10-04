Expense Reimbursement Management System
Project Overview
This is a comprehensive expense reimbursement management system designed to automate and streamline the expense approval process. The platform features multi-level approval workflows, flexible approval rules, role-based access control, and OCR-based receipt scanning to create a robust and efficient solution for businesses.

Features
Authentication & User Management: Secure login/signup with role-based access for Employees, Managers, and Admins. Admins can create and manage user accounts and assign roles.

Expense Submission: Employees can submit expense claims with details like amount, currency, category, and a description. Currency amounts are automatically converted to the company's base currency.

Multi-level Approval Workflow: Expenses follow a sequential approval chain that can be customized with multiple steps and designated approvers.

Conditional Approval Rules: The system supports advanced rules, including percentage-based approvals (e.g., 60% of approvers must approve) and specific approver rules (e.g., CFO approval auto-approves the expense).

Role-Based Access Control: Permissions are strictly enforced, ensuring Employees can only view their own expenses, Managers can view their team's expenses, and Admins have full oversight.

OCR Receipt Scanning: Employees can upload a receipt image, and the system automatically extracts key data (amount, date, merchant) to pre-populate the expense form.

Currency Management: Real-time currency conversion is performed for all expenses using an external API, with all financial reporting done in the company's default currency.

Technologies Used
Frontend: HTML, CSS, JavaScript (with a focus on modular, a-la-carte functionality)

Backend: Node.js, Express.js

Database: MySQL (or PostgreSQL, via Sequelize ORM)

Authentication: JSON Web Tokens (JWT)

External APIs: restcountries.com (for country/currency data), open.er-api.com (for exchange rates), tesseract.js (for OCR).

Getting Started
Follow these steps to set up and run the project.

1. Backend Setup
The backend handles all API logic and database interactions.

Navigate to the backend directory in your terminal:

Bash

cd backend
Install the required Node.js packages:

Bash

npm install
Set up your MySQL database and update the configuration.

Ensure your MySQL server is running locally.

Create a new database for the project (e.g., TEST).

Update the backend/config/config.json file with your MySQL credentials:

JSON

{
  "development": {
    "username": "your_mysql_username",
    "password": "your_mysql_password",
    "database": "TEST",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
Run the backend server:

Bash

npm run dev
This command will start the server and automatically create the necessary database tables (Companies, Users, etc.) if they don't already exist.

2. Frontend Setup
The frontend is a single-page application built with plain HTML, CSS, and JavaScript for simplicity and a minimal footprint.

Navigate to the frontend directory:

Bash

cd frontend
Run a local web server to serve the static files. You can use a simple tool like http-server or live-server if you have them installed globally.

Bash

live-server
# or
npx http-server
If you're using a full-stack development environment like the one we've been discussing, your frontend should already be running.

Using the Application
Signup: Open your browser and navigate to the local server address (e.g., http://localhost:3000). Use the login form to create your first user. The first user to sign up is automatically assigned the Admin role.

Login: Once signed up, enter your credentials to log in. The application will detect your role and automatically route you to the correct dashboard (Employee, Manager, or Admin).

Explore:

Employee Section: Submit an expense, and the system will perform currency conversion and add it to the history table.

Manager Section: View and approve/reject pending expenses from employees.

Admin Section: Use the Admin Panel to manage users (create, change roles) and configure new approval rules.







