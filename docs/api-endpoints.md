# Absentra User Management API Endpoints

## Authentication
All endpoints require admin authentication unless otherwise specified.

## User Management Endpoints

### GET /api/users
**Description**: Retrieve all users with pagination and filtering
**Access**: Admin only
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `role` (optional): Filter by user role
- `active` (optional): Filter by active status (true/false)
- `search` (optional): Search by username or email

**Response**:
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "john.smith",
      "email": "john@company.com",
      "employee_id": "EMP001",
      "role": "employee",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "last_login": "2024-12-20T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### POST /api/users
**Description**: Create a new user account
**Access**: Admin only
**Request Body**:
```json
{
  "username": "john.smith",
  "email": "john@company.com",
  "password": "SecurePass123",
  "employee_id": "EMP001",
  "role": "employee"
}
```

**Response**:
```json
{
  "id": "uuid",
  "username": "john.smith",
  "email": "john@company.com",
  "employee_id": "EMP001",
  "role": "employee",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### GET /api/users/:id
**Description**: Get specific user details
**Access**: Admin or own profile
**Response**: Same as POST response

### PUT /api/users/:id
**Description**: Update user information
**Access**: Admin only
**Request Body**:
```json
{
  "username": "john.smith.updated",
  "email": "john.updated@company.com",
  "role": "line_manager",
  "is_active": true
}
```

### DELETE /api/users/:id
**Description**: Deactivate user account (soft delete)
**Access**: Admin only
**Response**: 204 No Content

### POST /api/users/:id/reset-password
**Description**: Reset user password
**Access**: Admin only
**Request Body**:
```json
{
  "send_email": true
}
```

**Response**:
```json
{
  "message": "Password reset successfully",
  "temporary_password": "TempPass123" // Only if send_email is false
}
```

## Employee Integration Endpoints

### GET /api/employees/available
**Description**: Get employees without user accounts
**Access**: Admin only
**Query Parameters**:
- `search` (optional): Search by name or employee ID
- `department` (optional): Filter by department ID

**Response**:
```json
{
  "employees": [
    {
      "id": "uuid",
      "name": "John Smith",
      "employee_id": "EMP001",
      "position": "Software Developer",
      "department_id": "dept-uuid",
      "department_name": "Engineering",
      "status": "active"
    }
  ]
}
```

### GET /api/employees/search
**Description**: Search employees for dropdown selection
**Access**: Admin only
**Query Parameters**:
- `q`: Search query (name or employee ID)
- `limit` (optional): Max results (default: 10)

**Response**:
```json
{
  "employees": [
    {
      "id": "uuid",
      "name": "John Smith",
      "employee_id": "EMP001",
      "position": "Software Developer",
      "department_name": "Engineering"
    }
  ]
}
```

## Validation Endpoints

### POST /api/users/validate
**Description**: Validate user data before creation/update
**Access**: Admin only
**Request Body**:
```json
{
  "username": "john.smith",
  "email": "john@company.com",
  "employee_id": "EMP001",
  "exclude_user_id": "uuid" // For updates
}
```

**Response**:
```json
{
  "valid": true,
  "errors": []
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "username",
      "message": "Username already exists"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "Employee already has a user account"
}
```