# Absentra User Management System Specification

## Overview
This specification outlines the enhanced user management system for Absentra, focusing on streamlined user creation, editing, and employee integration.

## Core Features

### 1. Add New User
- Administrator-only functionality
- Employee-linked user account creation
- Automatic validation and duplicate prevention
- Role-based access assignment

### 2. Edit Existing User
- Update user profile information
- Change roles and permissions
- Password reset functionality
- Account status management

### 3. Employee Integration
- EmployeeID dropdown with search functionality
- Display format: "Employee Name (Employee ID)"
- Active employees only
- Duplicate user prevention

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);
```

### User Roles Enum
```sql
CREATE TYPE user_role AS ENUM (
  'employee',
  'line_manager', 
  'hr',
  'admin'
);
```

## API Endpoints

### User Management
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Deactivate user (admin only)
- `POST /api/users/:id/reset-password` - Reset user password

### Employee Integration
- `GET /api/employees/available` - Get employees without user accounts
- `GET /api/employees/search?q=:query` - Search employees for dropdown

## Validation Rules

### User Creation
1. Username must be unique and 3-50 characters
2. Email must be valid format (if provided)
3. Employee ID must exist and be active
4. Employee cannot already have a user account
5. Password must meet security requirements (8+ chars, mixed case, numbers)

### User Updates
1. Username uniqueness (excluding current user)
2. Email uniqueness (excluding current user)
3. Role changes require admin privileges
4. Cannot deactivate the last admin user

## Business Logic

### Employee Selection Process
1. Query active employees without existing user accounts
2. Format display as "Name (ID)" for dropdown
3. Enable search/filter functionality
4. Validate selection before user creation

### Role Management
- **Employee**: Basic leave management access
- **Line Manager**: Team approval capabilities
- **HR**: Department-wide management
- **Admin**: Full system administration

## User Interface Design

### Add User Form
```
┌─────────────────────────────────────┐
│ Add New User                        │
├─────────────────────────────────────┤
│ Employee *                          │
│ [Search Employee...        ▼]       │
│ └─ John Smith (EMP001)              │
│                                     │
│ Username *                          │
│ [________________________]          │
│                                     │
│ Email                               │
│ [________________________]          │
│                                     │
│ Password *                          │
│ [________________________]          │
│                                     │
│ Role *                              │
│ [Employee              ▼]           │
│                                     │
│ [Cancel]  [Create User]             │
└─────────────────────────────────────┘
```

### Edit User Form
```
┌─────────────────────────────────────┐
│ Edit User: john.smith               │
├─────────────────────────────────────┤
│ Employee: John Smith (EMP001)       │
│ (Read-only)                         │
│                                     │
│ Username *                          │
│ [john.smith_______________]          │
│                                     │
│ Email                               │
│ [john.smith@company.com___]          │
│                                     │
│ Role *                              │
│ [Line Manager          ▼]           │
│                                     │
│ Status                              │
│ ☑ Active Account                    │
│                                     │
│ [Reset Password] [Cancel] [Update]  │
└─────────────────────────────────────┘
```

## User Workflows

### User Creation Workflow
```
Start → Admin Access Check → Load Available Employees → 
Select Employee → Fill User Details → Validate Data → 
Create User Account → Send Notification → End
```

### User Edit Workflow  
```
Start → Admin Access Check → Load User Data → 
Update Fields → Validate Changes → Save Updates → 
Log Changes → End
```

## Error Handling

### Common Error Scenarios
1. **Duplicate Username**: "Username already exists"
2. **Employee Already Has Account**: "Selected employee already has a user account"
3. **Invalid Employee**: "Selected employee is not active or doesn't exist"
4. **Weak Password**: "Password must be at least 8 characters with mixed case and numbers"
5. **Last Admin Deactivation**: "Cannot deactivate the last administrator account"

## Security Considerations

### Access Control
- Only administrators can create/edit users
- Users can view their own profile
- Password changes require current password verification
- Account lockout after failed login attempts

### Data Protection
- Passwords stored as secure hashes
- Sensitive operations logged for audit
- Session management with timeout
- Input sanitization and validation

## Implementation Priority

### Phase 1: Core Functionality
1. Enhanced user creation form with employee dropdown
2. Employee search and selection
3. Basic validation and error handling

### Phase 2: Advanced Features
1. User editing capabilities
2. Password reset functionality
3. Audit logging

### Phase 3: Enhancements
1. Bulk user operations
2. Advanced search and filtering
3. User activity monitoring