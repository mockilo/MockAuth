# MockAuth Workflow Diagrams

This document contains text-based workflow diagrams that can be converted into visual diagrams for presentations, documentation, or internal reference.

## 1. High-Level Architecture Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Developer     │    │   MockAuth      │    │  Frontend App   │    │  Backend API    │
│                 │    │     Server      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. Define Users,      │                       │                       │
         │    Roles & Perms      │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │                       │ 2. Start Server       │                       │
         │                       │    (Port 3001)        │                       │
         │                       ├──────────────────────►│                       │
         │                       │                       │                       │
         │                       │                       │ 3. Login Request      │
         │                       │                       ├──────────────────────►│
         │                       │                       │                       │
         │                       │ 4. Return JWT Token   │                       │
         │                       │◄──────────────────────┤                       │
         │                       │                       │                       │
         │                       │                       │ 5. API Call with      │
         │                       │                       │    Authorization      │
         │                       │                       ├──────────────────────►│
         │                       │                       │                       │
         │                       │ 6. Verify Token &     │                       │
         │                       │    Return User Data   │                       │
         │                       │◄──────────────────────┤                       │
         │                       │                       │                       │
         │ 7. Logs & Metrics     │                       │                       │
         │◄──────────────────────┤                       │                       │
```

## 2. User Authentication Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   MockAuth      │    │   Database      │    │   Backend       │
│   Application   │    │   Server        │    │   (In-Memory)   │    │   API           │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. Login Form         │                       │                       │
         │    Submit             │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │                       │ 2. Validate Credentials│                       │
         │                       ├──────────────────────►│                       │
         │                       │                       │                       │
         │                       │ 3. User Found         │                       │
         │                       │◄──────────────────────┤                       │
         │                       │                       │                       │
         │                       │ 4. Generate JWT       │                       │
         │                       │    Token              │                       │
         │                       │                       │                       │
         │ 5. Return Token &     │                       │                       │
         │    User Data          │                       │                       │
         │◄──────────────────────┤                       │                       │
         │                       │                       │                       │
         │ 6. Store Token in     │                       │                       │
         │    Local Storage      │                       │                       │
         │                       │                       │                       │
         │ 7. API Request with   │                       │                       │
         │    Authorization      │                       │                       │
         │                       │                       │                       │
         │                       │                       │                       │ 8. Verify Token
         │                       │                       │                       ├─────────────┐
         │                       │                       │                       │             │
         │                       │                       │                       │ 9. Return   │
         │                       │                       │                       │    User Data│
         │ 10. Process Response  │                       │                       │◄────────────┘
         │◄──────────────────────┤                       │                       │
```

## 3. Role-Based Access Control (RBAC) Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Request  │    │   Frontend      │    │   MockAuth      │    │   Backend       │
│                 │    │   App           │    │   Server        │    │   API           │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. Click Admin Panel  │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │ 2. Check User Role    │                       │                       │
         │    Before Rendering   │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │ 3. Return User Roles  │                       │                       │
         │    & Permissions      │                       │                       │
         │◄──────────────────────┤                       │                       │
         │                       │                       │                       │
         │ 4. Render UI Based    │                       │                       │
         │    on Permissions     │                       │                       │
         │                       │                       │                       │
         │ 5. API Call to        │                       │                       │
         │    Protected Endpoint │                       │                       │
         │                       │                       │                       │
         │                       │                       │ 6. Verify Token &     │
         │                       │                       │    Check Permissions  │
         │                       │                       ├──────────────────────►│
         │                       │                       │                       │
         │                       │                       │ 7. Return Data or     │
         │                       │                       │    Access Denied      │
         │                       │                       │◄──────────────────────┤
         │                       │                       │                       │
         │ 8. Update UI Based    │                       │                       │
         │    on Response        │                       │                       │
         │◄──────────────────────┤                       │                       │
```

## 4. Multi-User Testing Scenario

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Test Suite    │    │   MockAuth      │    │   Frontend      │    │   Backend       │
│   (Jest/Cypress)│    │   Server        │    │   App           │    │   API           │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. Create Test Users  │                       │                       │
         │    (Admin, User,      │                       │                       │
         │     Guest)            │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │ 2. Users Created      │                       │                       │
         │◄──────────────────────┤                       │                       │
         │                       │                       │                       │
         │ 3. Test Admin Flow    │                       │                       │
         │    - Login as Admin   │                       │                       │
         │    - Access Admin UI  │                       │                       │
         │    - Call Admin APIs  │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │ 4. Test User Flow     │                       │                       │
         │    - Login as User    │                       │                       │
         │    - Access User UI   │                       │                       │
         │    - Call User APIs   │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │ 5. Test Guest Flow    │                       │                       │
         │    - No Login         │                       │                       │
         │    - Access Public UI │                       │                       │
         │    - Call Public APIs │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │ 6. Verify All Tests   │                       │                       │
         │    Pass               │                       │                       │
         │◄──────────────────────┤                       │                       │
```

## 5. Token Lifecycle Management

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   MockAuth      │    │   Token Store   │    │   Backend       │
│   Application   │    │   Server        │    │   (In-Memory)   │    │   API           │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. Login Request      │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │                       │ 2. Generate JWT       │                       │
         │                       │    + Refresh Token    │                       │
         │                       ├──────────────────────►│                       │
         │                       │                       │                       │
         │ 3. Return Tokens      │                       │                       │
         │◄──────────────────────┤                       │                       │
         │                       │                       │                       │
         │ 4. Store Tokens       │                       │                       │
         │    Locally            │                       │                       │
         │                       │                       │                       │
         │ 5. API Request with   │                       │                       │
         │    JWT Token          │                       │                       │
         │                       │                       │                       │
         │                       │                       │ 6. Verify Token       │
         │                       │                       ├──────────────────────►│
         │                       │                       │                       │
         │                       │                       │ 7. Token Valid        │
         │                       │                       │◄──────────────────────┤
         │                       │                       │                       │
         │ 8. Process Response   │                       │                       │
         │◄──────────────────────┤                       │                       │
         │                       │                       │                       │
         │ 9. Token Expires      │                       │                       │
         │    (After 24h)        │                       │                       │
         │                       │                       │                       │
         │ 10. Auto-Refresh      │                       │                       │
         │     with Refresh      │                       │                       │
         │     Token             │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │ 11. New JWT Token     │                       │                       │
         │◄──────────────────────┤                       │                       │
```

## 6. Error Handling and Edge Cases

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   MockAuth      │    │   Error Handler │    │   Backend       │
│   Application   │    │   Server        │    │                 │    │   API           │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. Invalid Login      │                       │                       │
         │    Attempt            │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │                       │ 2. Check Attempts     │                       │
         │                       │    Counter            │                       │
         │                       ├──────────────────────►│                       │
         │                       │                       │                       │
         │                       │ 3. Account Locked     │                       │
         │                       │    (5 failed attempts)│                       │
         │                       │◄──────────────────────┤                       │
         │                       │                       │                       │
         │ 4. Return Error       │                       │                       │
         │    (Account Locked)   │                       │                       │
         │◄──────────────────────┤                       │                       │
         │                       │                       │                       │
         │ 5. Show Lockout       │                       │                       │
         │    Message            │                       │                       │
         │                       │                       │                       │
         │ 6. Wait for Lockout   │                       │                       │
         │    Period (15 min)    │                       │                       │
         │                       │                       │                       │
         │ 7. Retry Login        │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │                       │ 8. Reset Attempts     │                       │
         │                       │    Counter            │                       │
         │                       ├──────────────────────►│                       │
         │                       │                       │                       │
         │ 9. Success            │                       │                       │
         │◄──────────────────────┤                       │                       │
```

## 7. CI/CD Integration Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CI/CD         │    │   MockAuth      │    │   Test Suite    │    │   Application   │
│   Pipeline      │    │   Server        │    │   (Automated)   │    │   Under Test    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. Start Pipeline     │                       │                       │
         │                       │                       │                       │
         │ 2. Start MockAuth     │                       │                       │
         │    Server             │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │ 3. Server Ready       │                       │                       │
         │◄──────────────────────┤                       │                       │
         │                       │                       │                       │
         │ 4. Run Test Suite     │                       │                       │
         │                       │                       │                       │
         │                       │ 5. Create Test Users  │                       │
         │                       ├──────────────────────►│                       │
         │                       │                       │                       │
         │                       │ 6. Execute Tests      │                       │
         │                       │    - Login Tests      │                       │
         │                       │    - RBAC Tests       │                       │
         │                       │    - API Tests        │                       │
         │                       │                       │                       │
         │                       │ 7. Test Results       │                       │
         │                       │◄──────────────────────┤                       │
         │                       │                       │                       │
         │ 8. All Tests Pass     │                       │                       │
         │◄──────────────────────┤                       │                       │
         │                       │                       │                       │
         │ 9. Deploy to Staging  │                       │                       │
         │                       │                       │                       │
         │ 10. Stop MockAuth     │                       │                       │
         │     Server            │                       │                       │
         ├──────────────────────►│                       │                       │
```

## 8. Multi-Tenant Simulation Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Tenant A      │    │   MockAuth      │    │   Tenant B      │    │   Backend       │
│   Users         │    │   Server        │    │   Users         │    │   API           │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. Login as Tenant A  │                       │                       │
         │    User               │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │ 2. Return Tenant A    │                       │                       │
         │    Context & Token    │                       │                       │
         │◄──────────────────────┤                       │                       │
         │                       │                       │                       │
         │ 3. API Call with      │                       │                       │
         │    Tenant Context     │                       │                       │
         │                       │                       │                       │
         │                       │                       │ 4. Login as Tenant B  │
         │                       │                       │    User               │
         │                       │                       ├──────────────────────►│
         │                       │                       │                       │
         │                       │ 5. Return Tenant B    │                       │
         │                       │    Context & Token    │                       │
         │                       │                       │◄──────────────────────┤
         │                       │                       │                       │
         │                       │                       │ 6. API Call with      │
         │                       │                       │    Tenant Context     │
         │                       │                       │                       │
         │                       │ 7. Verify Tenant      │                       │
         │                       │    Isolation          │                       │
         │                       │                       │                       │
         │ 8. Return Tenant-     │                       │                       │
         │    Specific Data      │                       │                       │
         │◄──────────────────────┤                       │                       │
```

## 9. Webhook Event Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MockAuth      │    │   Webhook       │    │   External      │    │   Audit         │
│   Server        │    │   Dispatcher    │    │   Application   │    │   System        │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. User Action        │                       │                       │
         │    (Login/Logout)     │                       │                       │
         │                       │                       │                       │
         │ 2. Generate Event     │                       │                       │
         │    Payload            │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │ 3. Send Webhook       │                       │                       │
         │    to Application     │                       │                       │
         │                       ├──────────────────────►│                       │
         │                       │                       │                       │
         │ 4. Send Webhook       │                       │                       │
         │    to Audit System    │                       │                       │
         │                       │                       │                       │
         │                       │                       │                       │ 5. Log Event
         │                       │                       │                       ├─────────────┐
         │                       │                       │                       │             │
         │ 6. Process Event      │                       │                       │             │
         │    in Application     │                       │                       │             │
         │                       │                       │◄──────────────────────┤             │
         │                       │                       │                       │             │
         │ 7. Return Success     │                       │                       │             │
         │    Response           │                       │                       │             │
         │◄──────────────────────┤                       │                       │             │
         │                       │                       │                       │             │
         │ 8. Event Processed    │                       │                       │             │
         │    Successfully       │                       │                       │             │
         │◄──────────────────────┤                       │                       │             │
```

## 10. Performance Monitoring Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MockAuth      │    │   Metrics       │    │   Monitoring    │    │   Alerting      │
│   Server        │    │   Collector     │    │   Dashboard     │    │   System        │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. Track Metrics      │                       │                       │
         │    - Request Count    │                       │                       │
         │    - Response Time    │                       │                       │
         │    - Error Rate       │                       │                       │
         │    - Active Users     │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │                       │                       │
         │ 2. Process Metrics    │                       │                       │
         │    & Generate         │                       │                       │
         │    Insights           │                       │                       │
         │                       ├──────────────────────►│                       │
         │                       │                       │                       │
         │ 3. Display Real-time  │                       │                       │
         │    Metrics            │                       │                       │
         │                       │                       │                       │
         │ 4. Check Thresholds   │                       │                       │
         │    & Generate         │                       │                       │
         │    Alerts             │                       │                       │
         │                       │                       │                       │
         │                       │                       │                       │ 5. Send Alert
         │                       │                       │                       ├─────────────┐
         │                       │                       │                       │             │
         │ 6. Handle Alert       │                       │                       │             │
         │    (Scale/Notify)     │                       │                       │             │
         │                       │                       │                       │             │
         │                       │                       │                       │             │
         │ 7. Update Metrics     │                       │                       │             │
         │    & Continue         │                       │                       │             │
         │    Monitoring         │                       │                       │             │
         │◄──────────────────────┤                       │                       │             │
```

These workflow diagrams provide a comprehensive view of MockAuth's functionality and can be easily converted into visual diagrams using tools like Mermaid, Draw.io, or Lucidchart for presentations and documentation.
