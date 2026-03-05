# OpenCrisis Demo Script

This script walks through the key user flows in OpenCrisis.

## Prerequisites

1. Start the application:
   ```bash
   # Option 1: Docker Compose
   docker-compose up

   # Option 2: Local development
   # Terminal 1: Start MongoDB
   mongod

   # Terminal 2: Start server
   cd server && cp .env.example .env && npm run dev

   # Terminal 3: Start client
   cd client && npm run dev
   ```

2. Seed the database:
   ```bash
   npm run seed
   ```

   This creates:
   - Admin: `admin@example.com` / `password123`
   - Staff: `staff@example.com` / `password123`
   - Delegate: `delegate@example.com` / `password123`
   - Conference: "OpenMUN 2024"
   - Committees: "Global Crisis Committee" and "UN General Assembly"

## Demo Flow

### 1. Admin Flow: Create Conference Structure

1. Open `http://localhost:3000`
2. Log in as **admin@example.com** / **password123**
3. You'll see the Admin Dashboard with Conferences tab
4. Note the existing "OpenMUN 2024" conference
5. Click "New Conference" to create another one
6. Switch to Committees tab to view/create committees
7. Click on a committee to see members and staff

### 2. Delegate Flow: Submit Directives

1. Log out from admin (user menu → Logout)
2. Log in as **delegate@example.com** / **password123**
3. You'll see the Delegate Dashboard with:
   - Directive submission form on the left
   - "My Submissions" list on the right
   - Updates feed at the bottom
4. Select "Global Crisis Committee" from the dropdown
5. Fill in directive:
   - Title: "Emergency Medical Response"
   - Body: "Deploy medical teams to the affected region with supplies..."
   - Type: Public
6. Click "Submit Directive"
7. See the directive appear in "My Submissions" with "submitted" status

### 3. Staff Flow: Process Directives

1. Open a **new browser window** (or incognito)
2. Go to `http://localhost:3000`
3. Log in as **staff@example.com** / **password123**
4. You'll see the Staff Dashboard with:
   - Directive Queue tab
   - Post Update tab
   - Notes tab
5. See the directive submitted by the delegate
6. Click on it to open the detail dialog
7. Change status to "In Review"
8. Add feedback: "Good directive, but needs more specific location details"
9. Click "Update Status" and "Send Feedback"

### 4. Real-Time Updates (Two Windows)

1. Keep both browser windows visible
2. In the **staff window**: 
   - Go to "Post Update" tab
   - Select "Global Crisis Committee"
   - Title: "Breaking: Situation Escalation"
   - Body: "Reports indicate the situation has escalated..."
   - Click "Post Update"
3. The **delegate window** should receive the update in real-time in the updates feed

### 5. Directive Status Workflow

In the **staff window**:
1. Go back to Directive Queue
2. Click on the directive
3. Change status to "Approved"
4. Add outcome: "Medical teams deployed to coordinates X, Y"
5. Click "Update Status"

In the **delegate window**:
1. Click "Refresh" on My Submissions
2. See the directive now shows "approved" status with the outcome

### 6. New Delegate Setup

1. Click "Logout" in the delegate window
2. Click "Register here" to create a new account
3. Fill in details and register
4. After login, an admin must assign you to a committee to see the dashboard.

## API Testing with cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"delegate@example.com","password":"password123"}'

# Get conferences (with token from login)
curl http://localhost:5000/api/conferences \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create directive
curl -X POST http://localhost:5000/api/directives \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DELEGATE_TOKEN" \
  -d '{"title":"Test Directive","body":"This is a test directive body with details...","type":"public","committee":"COMMITTEE_ID"}'
```

## Key Features Demonstrated

- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control (admin/staff/delegate)
- ✅ Real-time updates via Socket.IO
- ✅ Directive submission and status workflow
- ✅ Crisis updates with public/private visibility
- ✅ Responsive dark-mode UI
- ✅ Conference and committee management
