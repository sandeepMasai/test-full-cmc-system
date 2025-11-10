# Environment Setup Guide

## Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=postgres

# For Cloud Databases (Aiven, AWS RDS, etc.) - set DB_SSL=true
# DB_SSL=true

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=kumar9772sandeep@gmail.com
EMAIL_PASS=aqka nhhf qwtd bwua

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Setting up Email Notifications

The CRM system sends email notifications for the following events:
- **User Registration**: Welcome email when a new user registers
- **User Login**: Login notification email when a user logs in
- **Lead Assignment**: Email when a new lead is assigned to a user
- **Lead Status Update**: Email when a lead status is changed
- **Activity Creation**: Email notifications for important activities

### Gmail Setup
1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASS`

### Other Email Providers
Update `EMAIL_HOST` and `EMAIL_PORT` according to your email provider:
- **SendGrid**: `smtp.sendgrid.net:587`
- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`

**Note**: If email credentials are not configured, the system will continue to work but email notifications will be skipped (logged to console).

## Database Setup

1. Install PostgreSQL if not already installed
2. Create the database:
```bash
createdb crm_db
```

Or using psql:
```sql
CREATE DATABASE crm_db;
```

3. The application will automatically create tables on first run (using Sequelize sync)

## Initial Admin User

To create the first admin user, you can:

1. Use the register endpoint (requires an existing admin token)
2. Or manually insert into the database:
```sql
INSERT INTO users (id, name, email, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@example.com',
  '$2a$10$...', -- bcrypt hash of your password
  'Admin',
  true,
  NOW(),
  NOW()
);
```

To generate a bcrypt hash, you can use Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your_password', 10);
console.log(hash);
```

