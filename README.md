# CRM System - Next-Gen Customer Relationship Management Platform

A modern, scalable CRM platform built with the MERN stack (MongoDB/PostgreSQL, Express, React, Node.js) featuring real-time updates, role-based access control, and comprehensive analytics.

## 🚀 Features

- **Authentication & Role Management** - JWT-based authentication with role-based access control (Admin, Manager, Sales Executive)
- **Lead Management** - Complete CRUD operations for leads with ownership tracking and history trail
- **Activity Timeline** - Detailed log of notes, calls, meetings, and status changes per lead
- **Real-time Notifications** - WebSocket-based real-time notifications for lead updates and activities
- **Email Notifications** - Automated email triggers for important updates
- **Dashboard & Analytics** - Visual performance metrics using Recharts
- **Integration Layer (Bonus)** - REST APIs and webhooks for HubSpot and Slack integration
- **Docker Support** - Fully containerized application for easy deployment

## 📋 Tech Stack

### Backend
- **Node.js** + **Express** - RESTful API server
- **PostgreSQL** - Relational database
- **Sequelize** - ORM for database operations
- **Socket.io** - Real-time WebSocket communication
- **JWT** + **Bcrypt** - Authentication and password hashing
- **Nodemailer** - Email notification service
- **Jest** - Testing framework

### Frontend
- **React 18** - UI library
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Socket.io Client** - Real-time updates

## 🗄️ Database Schema (ER Diagram)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    User     │         │    Lead     │         │  Activity   │
├─────────────┤         ├─────────────┤         ├─────────────┤
│ id (PK)     │◄────┐   │ id (PK)     │◄────┐   │ id (PK)     │
│ name        │     │   │ name        │     │   │ type        │
│ email       │     │   │ email       │     │   │ title       │
│ password    │     │   │ phone       │     │   │ description │
│ role        │     │   │ company     │     │   │ leadId(FK) │
│ isActive    │     │   │ status      │     │   │ userId (FK) │
│ createdAt   │     │   │ source      │     │   │ metadata    │
│ updatedAt   │     │   │ estimated   │     │   │ createdAt   │
└─────────────┘     │   │   Value     │     │   │ updatedAt   │
                    │   │ assignedToId│────┘   └─────────────┘
                    │   │   (FK)      │
                    │   │ createdById │
                    │   │   (FK)      │
                    │   │ notes       │
                    │   │ createdAt   │
                    │   │ updatedAt   │
                    │   └─────────────┘
                    │
                    └──────────────────┘
```

### Relationships
- **User** has many **Leads** (as assignedTo and createdBy)
- **User** has many **Activities**
- **Lead** belongs to **User** (assignedTo and createdBy)
- **Lead** has many **Activities**
- **Activity** belongs to **Lead** and **User**

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v15 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

FRONTEND_URL=http://localhost:3000
```

4. Create the PostgreSQL database:
```bash
createdb crm_db
```

5. Start the backend server:
```bash
npm run dev
```

The backend will be running on `http://localhost:5000`

6. (Optional) Create an initial admin user:
```bash
npm run seed:admin
```
This will create an admin user with:
- Email: `admin@crm.com`
- Password: `admin123`
**⚠️ Change the password after first login!**

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be running on `http://localhost:3000`

### Docker Setup (Optional)

1. From the root directory, start all services:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 5000
- Frontend on port 3000

2. To stop all services:
```bash
docker-compose down
```

## 🧪 Testing

The project includes comprehensive test coverage using Jest and Supertest.

### Running Tests

Run all tests:
```bash
cd backend
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage report:
```bash
npm test -- --coverage
```

### Test Coverage

The test suite includes:

1. **Authentication Tests** (`auth.test.js`)
   - User login with valid/invalid credentials
   - User registration (public endpoint)
   - Token validation
   - Role-based access control
   - Input validation

2. **Leads API Tests** (`leads.test.js`)
   - Lead CRUD operations
   - Lead filtering and pagination
   - Authorization checks
   - Validation tests

3. **User Model Tests** (`user.model.test.js`)
   - User creation and validation
   - Password hashing and comparison
   - Role management
   - Email uniqueness validation

### Test Structure

```
backend/
├── __tests__/
│   ├── setup.js              # Test configuration
│   ├── auth.test.js          # Authentication API tests
│   ├── leads.test.js         # Leads API tests
│   └── user.model.test.js   # User model tests
└── jest.config.js            # Jest configuration
```

### Test Environment

Tests run in a separate test environment with:
- Isolated database operations
- Automatic cleanup of test data
- 10-second timeout for async operations
- Mocked external services where appropriate

**Current Coverage**: ~49% overall, with 100% coverage on models and 70%+ on core routes.

## 📚 API Documentation

### Authentication Endpoints

#### Register User (Admin only)
```
POST /api/auth/register
Headers: Authorization: Bearer <admin_token>
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Sales Executive"
}
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}
Response: {
  "user": { ... },
  "token": "jwt_token"
}
```

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

#### Get All Users (Admin/Manager only)
```
GET /api/auth/users
Headers: Authorization: Bearer <token>
```

### Lead Endpoints

#### Get All Leads
```
GET /api/leads?status=New&page=1&limit=10
Headers: Authorization: Bearer <token>
Query Params:
  - status: Filter by status (New, Contacted, Qualified, Proposal, Negotiation, Won, Lost)
  - assignedToId: Filter by assigned user
  - page: Page number
  - limit: Items per page
```

#### Get Lead by ID
```
GET /api/leads/:id
Headers: Authorization: Bearer <token>
```

#### Create Lead
```
POST /api/leads
Headers: Authorization: Bearer <token>
Body: {
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "company": "Acme Corporation",
  "status": "New",
  "source": "Website",
  "estimatedValue": 50000,
  "notes": "Interested in enterprise plan",
  "assignedToId": "user-uuid" // optional
}
```

#### Update Lead
```
PUT /api/leads/:id
Headers: Authorization: Bearer <token>
Body: {
  "status": "Qualified",
  "estimatedValue": 75000,
  // ... other fields
}
```

#### Delete Lead (Admin/Manager only)
```
DELETE /api/leads/:id
Headers: Authorization: Bearer <token>
```

### Activity Endpoints

#### Get Activities for a Lead
```
GET /api/activities/lead/:leadId
Headers: Authorization: Bearer <token>
```

#### Create Activity
```
POST /api/activities
Headers: Authorization: Bearer <token>
Body: {
  "type": "Note", // Note, Call, Meeting, Email, Status Change
  "title": "Follow-up call",
  "description": "Discussed pricing and timeline",
  "leadId": "lead-uuid"
}
```

#### Update Activity
```
PUT /api/activities/:id
Headers: Authorization: Bearer <token>
Body: {
  "title": "Updated title",
  "description": "Updated description"
}
```

#### Delete Activity
```
DELETE /api/activities/:id
Headers: Authorization: Bearer <token>
```

### Dashboard Endpoints

#### Get Dashboard Statistics
```
GET /api/dashboard/stats
Headers: Authorization: Bearer <token>
Response: {
  "stats": {
    "totalLeads": 100,
    "totalValue": 5000000,
    "recentActivities": 25,
    "leadsLast30Days": 15,
    "leadsByStatus": [...],
    "leadsBySource": [...],
    "activitiesByType": [...]
  }
}
```

#### Get Performance Metrics (Admin/Manager only)
```
GET /api/dashboard/performance?startDate=2024-01-01&endDate=2024-12-31
Headers: Authorization: Bearer <token>
```

### Integration Endpoints (Bonus)

#### Configure HubSpot Webhook (Admin/Manager only)
```
POST /api/integrations/webhooks/hubspot
Headers: Authorization: Bearer <token>
Body: {
  "apiKey": "your_hubspot_api_key",
  "enabled": true
}
```

#### Configure Slack Webhook (Admin/Manager only)
```
POST /api/integrations/webhooks/slack
Headers: Authorization: Bearer <token>
Body: {
  "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "enabled": true
}
```

#### Get Webhook Configurations (Admin/Manager only)
```
GET /api/integrations/webhooks
Headers: Authorization: Bearer <token>
```

#### Test Webhook Connection (Admin/Manager only)
```
POST /api/integrations/webhooks/test
Headers: Authorization: Bearer <token>
Body: {
  "type": "hubspot" // or "slack"
}
```

## 🔐 Role-Based Access Control

### Admin
- Full access to all features
- Can create, read, update, and delete all leads
- Can manage users (create, view all users)
- Can view all leads and activities
- Access to performance metrics

### Manager
- Can view all leads and activities
- Can create, update leads
- Can delete leads
- Can view performance metrics
- Cannot manage users

### Sales Executive
- Can only view and manage assigned leads
- Can create activities for assigned leads
- Can update assigned leads
- Cannot delete leads
- Cannot view performance metrics

## 🔔 Real-time Notifications

The system uses Socket.io for real-time notifications. Events include:
- `lead_created` - When a new lead is created
- `lead_assigned` - When a lead is assigned to a user
- `activity_created` - When a new activity is added
- `user_registered` - When a new user registers (for Admins/Managers)

## 🔗 Integration Layer (Bonus)

The system includes integration support for third-party tools:

### HubSpot Integration
- Automatically syncs leads to HubSpot when created
- Requires HubSpot API key configuration
- Creates contacts in HubSpot CRM

### Slack Integration
- Sends notifications to Slack channels for important events
- Supports rich message formatting
- Configurable webhook URLs

**Setup:**
1. Configure HubSpot: `POST /api/integrations/webhooks/hubspot` with API key
2. Configure Slack: `POST /api/integrations/webhooks/slack` with webhook URL
3. Events are automatically sent to configured integrations

## 📧 Email Notifications

Email notifications are sent for:
- Important activities (Call, Meeting, Status Change)
- Lead assignments

Configure email settings in the `.env` file. The system uses Nodemailer with SMTP.

## 🏗️ Project Structure

```
CRM-System-Challenge-1/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Lead.js
│   │   ├── Activity.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── leads.js
│   │   ├── activities.js
│   │   ├── dashboard.js
│   │   ├── notifications.js
│   │   └── integrations.js
│   ├── middleware/
│   │   └── auth.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── utils/
│   │   └── emailService.js
│   ├── __tests__/
│   │   └── auth.test.js
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Leads.jsx
│   │   │   └── LeadDetail.jsx
│   │   ├── store/
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── leadSlice.js
│   │   │   │   └── notificationSlice.js
│   │   │   ├── api.js
│   │   │   └── store.js
│   │   ├── utils/
│   │   │   └── socket.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Update all sensitive values in production
2. **Database**: Use a managed PostgreSQL service (AWS RDS, Heroku Postgres, etc.)
3. **JWT Secret**: Use a strong, randomly generated secret
4. **HTTPS**: Enable HTTPS for production
5. **CORS**: Update CORS settings for production domain
6. **Email Service**: Configure production email service (SendGrid, AWS SES, etc.)

### Build for Production

**Backend:**
```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist folder with a static file server
```

## 🧪 Testing

Run tests:
```bash
cd backend
npm test
```

## 📝 License

This project is created for assessment purposes.

## 👤 Author

Built for Masters' Union Assessment - Next-Gen CRM System Challenge

---

**Note**: Make sure to update all environment variables and secrets before deploying to production!
