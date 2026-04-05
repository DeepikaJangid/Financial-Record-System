# Financial Record System

Hi! This is my Financial Record System project. I built this full-stack web application to manage personal or business financial records (income and expenses). This was a great learning experience for me to understand how React (Next.js), Node.js, Express, and MongoDB all connect together, as well as how to implement Role-Based Access Control.

## What This Project Does

The basic idea is that you can log in, add financial records (like an "Income" for salary, or an "Expense" for groceries), and see a dashboard that summarizes all your data. 

I've also built a user-role system with 4 different levels:
- **SuperAdmin (Role 100)**: Has access to everything. Can promote/demote other users' roles and activate/deactivate accounts.
- **Admin (Role 0)**: Can view, add, edit, and delete records. Cannot manage users (only SuperAdmin can do that now).
- **Analyst (Role 1)**: Can view records, create new ones, and see the analytics dashboard. Cannot edit or delete records.
- **Viewer (Role 2)**: Can only view the ledger and records, but cannot add, edit, delete, or see the analytics dashboard.
These roles are enforced on both the backend (using middleware to protect routes) and the frontend (by conditionally rendering UI based on the user's role).

## Tech Stack Used

- **Frontend**: Next.js (React), Tailwind CSS for styling, React-Toastify for notifications, React-Select for dropdowns.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (using Mongoose).
- **Authentication**: JWT token base auth and bcryptjs to safely store passwords.

## Features

- **User Authentication**: Secure login and signup pages.
- **Dashboard Summary**: Shows Total Income, Total Expenses, and Net Balance. 
- **Monthly Trends Diagram**: A custom pure-SVG donut pie chart that updates when you click on different months to show the split between income and expenses!
- **Interactive Ledger**: A table with pagination (shows max 10 records per page) to view all data.
- **Filtering**: You can search and filter the records by dynamically loaded categories (using `react-select`).
- **User Management**: A dedicated page for the SuperAdmin to handle user permissions.

---

## How to Run the Project Locally

I set it up using `concurrently` so that we only have to run one command to start both the frontend and the backend. It's super easy!

### 1. Prerequisites
Make sure you have Node.js and MongoDB installed on your computer.

### 2. Clone and Install
First, you need to install the NPM packages in three places:
1. The root folder
2. The `/client` folder (Next.js server)
3. The `/server` folder (Node/Express API)

```bash
# In the root folder
npm install

# In the server folder
cd server
npm install

# In the client folder
cd ../client
npm install
```

### 3. Setup Environment Variables
Go to the `server/` folder and make a `.env` file containing this:
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/financial_db
JWT_SECRET=put_something_random_and_secret_here
```

### 4. Run the app!
Go back to the root folder (where this README is) and type:
```bash
npm start
```
This will spin up the backend on `localhost:5000` and the frontend on `localhost:3000`. Open your browser and go to `http://localhost:3000`.

---

## How to Make a Super Admin 
By default, whenever someone creates a new account from the Register page, they are assigned the "Viewer" role, and nobody can register as a SuperAdmin directly for security reasons.

To assign the first SuperAdmin so you can test all the features:
1. Create a normal account on the website (e.g., `test@example.com`).
2. Open your MongoDB compass (or mongo shell) and find your database `financial_db`.
3. Open the `users` collection.
4. Edit the user document and change the `"role"` field from `2` to `100`.
5. Refresh the website, and you will see the User Management page popup in the sidebar! 

Now you can use that SuperAdmin account directly from the UI to create Admins and Analysts.

## Things I Learned & Challenges
- **Managing Role-Based Access Control (RBAC):** Creating a clean system where numerical roles (e.g., 100 for SuperAdmin, 0 for Admin) dictate what UI elements render dynamically on the Next.js frontend, while simultaneously verifying those permission tiers securely on the Express backend.
- **Centralizing API Logic with Axios:** Transitioning from scattered native `fetch` wrappers to a centralized `axiosApiInstance`. It taught me how to cleanly attach JWT authorization headers globally and standardly catch unauthorized (401) errors or token expirations across the whole application.
- **Dynamic Database Filtering:** Implementing the interactive ledger controls taught me how to construct conditional queries. Instead of fetching every record and filtering them locally on the client, I learned how to build a dynamic `filterQuery` object in Node.js so MongoDB only fetches the exactly requested dates, types, and categories.

Thanks for checking out my code.

---

## 📘 API Documentation

This section provides an overview of all available API endpoints.
Each endpoint represents a specific action the backend performs when requested by the frontend.

---

### 🔐 1. Authentication

Handles user registration and login. No authentication required.

#### ➤ Register
**POST** `/api/auth/register`
Creates a new user account.

**Request Body:**
  * name
  * email
  * password

---

#### ➤ Login
**POST** `/api/auth/login`
Authenticates user and returns a token.

**Request Body:**
  * email
  * password

---

### 💰 2. Records

Manage financial records (income & expenses).
⚠️ Requires authentication (JWT token in headers).

#### ➤ Get Records
**GET** `/api/records`
Fetch all records.

**Optional Query Params:**
  * `type=income`
  * `category=Salary`

---

#### ➤ Add Record
**POST** `/api/records`

**Request Body:**
  * title
  * amount
  * type (income / expense)
  * category
  * date

---

#### ➤ Update Record (Admin Only)
**PUT** `/api/records/:id`
Update an existing record.

---

#### ➤ Delete Record (Admin Only)
**DELETE** `/api/records/:id`
Delete a record permanently.

---

### 👥 3. Users

Manage users, roles, and account status.
⚠️ Accessible only by SuperAdmin.

#### ➤ Get All Users
**GET** `/api/users`

---

#### ➤ Update User Role
**PATCH** `/api/users/:id/role`

**Role Values:**
  * `0` → Admin
  * `1` → Analyst
  * `2` → Viewer

---

#### ➤ Update User Status
**PATCH** `/api/users/:id/status`

**Status Values:**
  * `active`
  * `inactive`

---

### 📊 4. Analytics

#### ➤ Get Summary
**GET** `/api/analytics/summary`

**Returns:**
  * Total income
  * Total expense
  * Net balance