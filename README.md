# Rental-Management-System
# Rental Management System

A comprehensive web application designed to streamline the rental management process for landlords, property managers, and tenants. This system simplifies tenant applications, secures rent payments, handles lease agreements, manages maintenance requests, and facilitates communication.

## Table of Contents

1.  [Project Goal](#project-goal)
2.  [Core Features](#core-features)
    *   [Backend](#backend)
    *   [Frontend (Basic)](#frontend-basic)
3.  [Tech Stack](#tech-stack)
4.  [Project Structure](#project-structure)
    *   [Backend Structure](#backend-structure)
    *   [Frontend Structure](#frontend-structure)
5.  [Setup and Installation](#setup-and-installation)
    *   [Prerequisites](#prerequisites)
    *   [Backend Setup](#backend-setup)
    *   [Frontend Setup](#frontend-setup)
6.  [Environment Variables](#environment-variables)
    *   [Backend (`.env`)](#backend-env)
    *   [Frontend (`.env`)](#frontend-env-1)
7.  [Running the Application](#running-the-application)
    *   [Backend](#backend-1)
    *   [Frontend](#frontend-1)
8.  [API Endpoints (Overview)](#api-endpoints-overview)
9.  [Key Frontend Functionalities](#key-frontend-functionalities)
10. [Scalability and Performance Features](#scalability-and-performance-features)
11. [Security and Compliance Features](#security-and-compliance-features)
12. [Future Enhancements](#future-enhancements)
13. [Contributing](#contributing)
14. [License](#license)

## Project Goal

To create a robust and user-friendly rental management platform that allows landlords and property managers to efficiently handle tenant applications, process rent payments, and manage lease agreements, while providing tenants with a convenient way to apply, pay rent, and request maintenance.

## Core Features

### Backend

*   **Tenant Application Management:**
    *   Online Application API for detailed submissions.
    *   (Planned/Mocked) Third-party background and credit check integration.
    *   Document upload functionality (ID, proof of income, references).
*   **Rent Payment Processing:**
    *   Secure payment gateway integration (Stripe).
    *   Automated payment reminders (conceptual, backend logic for identifying due payments exists).
    *   Transaction History API for tenants and landlords.
*   **Lease Management:**
    *   API for creating, managing, and renewing lease agreements.
    *   (Planned/Mocked) Digital signature integration for lease agreements.
    *   Lease expiry notifications (conceptual, backend logic exists).
*   **Maintenance Request System:**
    *   API for tenants to submit maintenance requests with details and photos.
    *   Real-time tracking and status updates.
    *   Ability for landlords to assign tasks and manage repairs.
*   **User Management & Authentication:**
    *   Role-based access control (Tenant, Landlord, Property Manager, Admin).
    *   Secure JWT-based authentication.

### Frontend (Basic)

*   User registration and login.
*   Profile management.
*   (Tenants) Ability to view properties and submit applications (form structure).
*   (Tenants) Ability to make rent payments via Stripe Elements.
*   (Tenants) Ability to submit maintenance requests.
*   Dashboard providing role-based navigation.
*   Lists and detail views for applications, leases, payments, maintenance requests (as per role).
*   (Landlord/PM) Basic views for managing applications and maintenance requests.

## Tech Stack

**Backend:**

*   **Framework:** Node.js, Express.js
*   **Database:** MongoDB (with Mongoose ODM)
*   **Authentication:** JSON Web Tokens (JWT), bcryptjs
*   **Payment Gateway:** Stripe
*   **Caching:** Redis (basic setup)
*   **File Uploads:** Multer
*   **Email Notifications:** Nodemailer (with SMTP)
*   **Logging:** Winston
*   **Environment Variables:** dotenv

**Frontend:**

*   **Framework/Library:** React.js (with Vite)
*   **Routing:** React Router DOM
*   **State Management:** React Context API, `useState`, `useEffect`
*   **API Calls:** Axios
*   **Payment Integration:** `@stripe/react-stripe-js`, `@stripe/stripe-js`
*   **Styling:** Basic CSS (can be expanded with frameworks like Tailwind CSS, Material-UI, etc.)

## Project Structure

*(A high-level overview of the directory structures provided earlier)*

### Backend Structure
backend/
```
├── config/
├── controllers/
├── middlewares/ (or middleware/)
├── models/
├── routes/
├── services/
├── utills/ (or utils/)
├── uploads/
├── logs/
├── .env
├── server.js
└── package.json
```

### Frontend Structure
```
frontend/ (e.g., vite-rentelo/)
├── public/
├── src/
│ ├── api/
│ ├── components/
│ │ ├── Auth/
│ │ ├── Common/
│ │ ├── Layout/
│ │ └── (feature-specific like Properties, Applications, etc.)
│ ├── contexts/
│ │ └── AuthContext.jsx
│ ├── hooks/
│ │ └── useAuth.js
│ ├── pages/
│ │ ├── Auth/
│ │ └── (feature-specific like Properties, Applications, etc.)
│ ├── App.jsx
│ ├── App.css
│ └── main.jsx (or index.js for CRA)
├── .env
├── index.html (for Vite)
├── vite.config.js (for Vite)
└── package.json
```