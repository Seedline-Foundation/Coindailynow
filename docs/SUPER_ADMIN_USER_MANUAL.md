# 👑 Super Admin User Manual
## CoinDaily Platform - Administrator Guide

**Version**: 1.0.0  
**Last Updated**: October 6, 2025  
**Target Audience**: Platform Administrators

---

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Security Management](#security-management)
5. [User Management](#user-management)
6. [Content Management](#content-management)
7. [System Configuration](#system-configuration)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## 📖 Introduction

### What is the Super Admin Panel?

The CoinDaily Super Admin Panel is a comprehensive management interface that gives you complete control over the platform. As a Super Admin, you have the highest level of access and can:

- Monitor platform security in real-time
- Manage users, roles, and permissions
- Configure system settings and features
- Review audit logs and analytics
- Handle content moderation
- Configure rate limiting rules
- Manage API access and webhooks

### Who Should Use This Manual?

This manual is designed for:
- Platform Super Administrators
- System administrators
- Security personnel
- Technical staff with admin access

### Prerequisites

Before using the Super Admin Panel, ensure you have:
- Super Admin account credentials
- Two-factor authentication (2FA) enabled
- Secure network connection
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

## 🚀 Getting Started

### Accessing the Admin Panel

1. **Navigate to Admin URL**
   ```
   https://coindaily.com/admin
   ```

2. **Login with Super Admin Credentials**
   - Enter your admin email address
   - Enter your password
   - Complete 2FA verification (if enabled)

3. **Dashboard Access**
   - Upon successful login, you'll see the main dashboard
   - Navigation menu on the left
   - Quick stats at the top

### First-Time Setup

#### 1. Enable Two-Factor Authentication (Mandatory)

**Why it's important**: 2FA adds an extra layer of security to your admin account.

**Steps**:
1. Click your profile icon (top right)
2. Select "Security Settings"
3. Click "Enable 2FA"
4. Scan the QR code with your authenticator app (Google Authenticator, Authy)
5. Enter the 6-digit code to verify
6. Save your backup codes securely

#### 2. Configure Security Alerts

**Steps**:
1. Navigate to **Settings** → **Notifications**
2. Enable email alerts for:
   - Critical security events
   - Failed admin login attempts
   - System errors
   - High-severity threats
3. Add your notification email
4. Test notification delivery

#### 3. Review Existing Settings

Check the following configurations:
- Rate limiting rules
- User roles and permissions
- Content moderation settings
- API access controls

---

## 📊 Dashboard Overview

### Main Dashboard Components

#### 1. **Overview Stats** (Top Section)

![Dashboard Overview](./images/admin-dashboard-overview.png)

Key metrics displayed:
- Total Users
- Active Sessions
- Security Events (24h)
- System Health Status

#### 2. **Security Metrics** (Left Panel)

Real-time security monitoring:
- **Threat Level Indicator**: Visual indicator of current threat level
  - 🟢 Green: Normal (0-10 events/hour)
  - 🟡 Yellow: Elevated (11-50 events/hour)
  - 🔴 Red: High (51+ events/hour)

- **Recent Security Events**: Last 10 security incidents
- **Active Threats**: Current ongoing security issues
- **Blocked IPs**: Number of IPs on blacklist

#### 3. **Quick Actions** (Right Panel)

One-click access to common tasks:
- Block IP Address
- Review Security Event
- Export Audit Logs
- Create System Backup

#### 4. **System Performance** (Bottom Section)

- CPU Usage
- Memory Usage
- Database Performance
- API Response Times

### Navigation Menu

**Left sidebar navigation**:

```
📊 Dashboard
🔒 Security
   ├─ Security Dashboard
   ├─ Security Events
   ├─ Blacklisted IPs
   └─ Rate Limits
📋 Audit Logs
👥 User Management
📝 Content Management
⚙️ Settings
   ├─ System Config
   ├─ Marquee Settings
   └─ Accessibility
📈 Analytics
🔔 Notifications
❓ Help & Support
```

---

## 🔒 Security Management

### Security Dashboard

#### Overview

The Security Dashboard provides real-time monitoring of platform security with comprehensive metrics and threat detection.

#### Accessing Security Dashboard

**Path**: Dashboard → Security → Security Dashboard

#### Key Features

##### 1. Real-Time Security Metrics

**Metrics Displayed**:
- Total security events (24h, 7d, 30d)
- Events by severity (Critical, High, Medium, Low)
- Failed login attempts
- Rate limit violations
- Suspicious activities detected
- Active blocked IPs

**How to interpret**:
- **Green indicators**: Normal activity
- **Yellow indicators**: Elevated activity (monitor closely)
- **Red indicators**: Critical issues (immediate action required)

##### 2. Security Event Timeline

**Visual timeline showing**:
- Event frequency over time
- Event type distribution
- Peak activity periods
- Threat patterns

**Using the timeline**:
1. Select time range (1h, 24h, 7d, 30d)
2. Click on data points to see event details
3. Use filters to show specific event types
4. Export data for external analysis

##### 3. Top Threats Panel

**Shows**:
- Most common threat types
- Attack frequency
- Target endpoints
- Source IP ranges

**Example threats**:
- Brute force login attempts
- SQL injection attempts
- XSS attack attempts
- DDoS patterns
- API abuse

#### Managing Security Events

##### Viewing Event Details

1. Navigate to **Security** → **Security Events**
2. Click on any event to view full details
3. Review event information:
   - Event type and severity
   - Timestamp
   - Source IP address
   - Target endpoint
   - User agent
   - Request details
   - Detection method

##### Filtering Events

**Available filters**:
- **Severity**: Critical, High, Medium, Low
- **Event Type**: Login attempts, injection attempts, etc.
- **Status**: Pending, Reviewed, Resolved, False Positive
- **Date Range**: Custom date selection
- **IP Address**: Filter by specific IP
- **User**: Filter by user ID

**Filter example**:
```
Severity: Critical + High
Date Range: Last 7 days
Status: Pending
→ Shows all unreviewed critical/high events from the past week
```

##### Responding to Security Events

**For each event, you can**:

1. **Mark as Reviewed**
   - Indicates you've examined the event
   - Add notes about your findings
   - Assign to team member for follow-up

2. **Mark as False Positive**
   - If the detection was incorrect
   - Improves future detection accuracy
   - Document reason for classification

3. **Block IP Address**
   - Immediately block the source IP
   - Set duration (temporary/permanent)
   - Add reason for blocking

4. **Escalate**
   - Flag for immediate attention
   - Notify other admins
   - Create incident report

**Best practices**:
- Review critical events within 1 hour
- Investigate high-severity events within 24 hours
- Document all actions taken
- Look for patterns across multiple events

### IP Blacklist Management

#### Viewing Blacklisted IPs

**Path**: Security → Blacklisted IPs

**Information shown**:
- IP address
- Reason for blocking
- Block duration/expiry
- Date blocked
- Blocked by (admin user)
- Associated user (if any)

#### Blocking an IP Address

**Method 1: From Security Event**
1. View security event details
2. Click "Block IP" button
3. Set block parameters:
   - Duration (hours/days/permanent)
   - Reason (required)
   - Notes (optional)
4. Confirm blocking

**Method 2: Manual Block**
1. Navigate to **Security** → **Blacklisted IPs**
2. Click "Add IP to Blacklist"
3. Enter IP address (supports CIDR notation)
4. Fill in required fields:
   ```
   IP Address: 192.168.1.100
   Reason: Multiple brute force attempts
   Duration: 24 hours
   Notes: Detected 50+ failed login attempts in 10 minutes
   ```
5. Click "Block IP"

#### Unblocking an IP Address

1. Find IP in blacklist
2. Click "Unblock" or "Edit"
3. Confirm unblock action
4. Add notes explaining why (recommended)

#### IP Whitelist

**Adding to whitelist** (allows bypassing rate limits):
1. Navigate to **Security** → **Rate Limits** → **Whitelist**
2. Click "Add to Whitelist"
3. Enter IP address
4. Add reason (e.g., "Internal monitoring system")
5. Set expiry (optional)

**Use cases for whitelisting**:
- Internal monitoring systems
- API partners with special access
- Load balancers
- CI/CD systems

### Rate Limit Management

#### Understanding Rate Limits

Rate limits control how many requests a user or IP can make in a given time period.

**Default limits**:
```
Anonymous users:    10 requests/minute
Registered users:   60 requests/minute
Premium users:     300 requests/minute
Admins:          1,000 requests/minute
Super Admins:   10,000 requests/minute
```

#### Viewing Rate Limit Rules

**Path**: Security → Rate Limits → Rules

**Table shows**:
- Endpoint path
- Max requests allowed
- Time window
- Status (Active/Inactive)
- Created date
- Last modified

#### Creating Custom Rate Limit Rule

1. Navigate to **Security** → **Rate Limits**
2. Click "Create New Rule"
3. Fill in rule details:
   ```
   Endpoint: /api/custom-endpoint
   Method: POST (or All)
   Max Requests: 100
   Time Window: 60000 (milliseconds = 1 minute)
   Status: Active
   Description: Custom rate limit for API endpoint
   ```
4. Save rule

#### Modifying Existing Rules

1. Find rule in list
2. Click "Edit"
3. Modify parameters
4. Click "Update Rule"

**Important**: Changes take effect immediately

#### Monitoring Rate Limit Violations

**Path**: Security → Rate Limits → Violations

**Shows**:
- IP/User who exceeded limit
- Endpoint accessed
- Number of requests
- Time of violation
- Action taken (blocked/warned)

**Bulk actions**:
- Block multiple IPs at once
- Export violation data
- Send warning emails

---

## 👥 User Management

### User Overview

#### Viewing All Users

**Path**: Dashboard → User Management

**User list includes**:
- User ID
- Email address
- Username
- Role
- Status (Active/Suspended/Banned)
- Registration date
- Last login
- Premium status

#### Filtering Users

**Filter options**:
- Role (User, Author, Admin, Super Admin)
- Status (Active, Suspended, Banned)
- Premium status
- Registration date range
- Last login date range

**Search**:
- By email
- By username
- By user ID

### Managing Individual Users

#### Viewing User Profile

1. Click on any user in the list
2. View comprehensive profile:
   - Personal information
   - Account status
   - Activity history
   - Content created
   - Comments posted
   - Login history
   - Security events

#### Editing User Details

**Editable fields**:
- Email address (requires email verification)
- Username
- First name / Last name
- Role
- Status
- Premium status
- Profile bio
- Avatar

**Steps**:
1. Open user profile
2. Click "Edit User"
3. Modify fields
4. Click "Save Changes"
5. Action is logged in audit trail

#### Changing User Role

**Available roles**:
- **USER**: Regular user (read, comment)
- **AUTHOR**: Can create articles
- **ADMIN**: Platform administration
- **SUPER_ADMIN**: Full access (you!)

**Steps**:
1. Open user profile
2. Find "Role" section
3. Click "Change Role"
4. Select new role from dropdown
5. Confirm change
6. User is notified via email

**⚠️ Warning**: Be careful when assigning ADMIN or SUPER_ADMIN roles!

#### Suspending/Banning Users

**Suspend** (temporary):
1. Open user profile
2. Click "Suspend Account"
3. Set suspension duration
4. Add reason (required)
5. Confirm suspension
6. User cannot login until unsuspended

**Ban** (permanent):
1. Open user profile
2. Click "Ban Account"
3. Add reason (required)
4. Select options:
   - ☑️ Delete all content
   - ☑️ Ban IP address
   - ☑️ Ban email domain
5. Confirm ban
6. Action cannot be easily undone

**Unsuspend/Unban**:
1. Open user profile
2. Click "Unsuspend" or "Unban"
3. Add notes
4. Confirm action

### Bulk Actions

**Select multiple users** and apply actions:
- Send email notification
- Change status
- Export user data
- Delete accounts (requires confirmation)

**Steps**:
1. Check boxes next to users
2. Select action from dropdown
3. Confirm bulk action
4. All actions are logged

---

## 📝 Content Management

### Articles Management

#### Viewing All Articles

**Path**: Dashboard → Content Management → Articles

**Filters**:
- Status: Draft, Published, Archived
- Category
- Author
- Premium status
- Date range

#### Moderating Articles

**Review pending articles**:
1. Navigate to **Content** → **Pending Review**
2. Click on article to review
3. Read content
4. Check for:
   - Policy violations
   - Spam content
   - Inappropriate material
   - Copyright issues
5. Take action:
   - **Approve**: Publish article
   - **Request Changes**: Send back to author
   - **Reject**: Remove article

#### Editing Articles

**As Super Admin, you can**:
- Edit any article content
- Change article status
- Update categories/tags
- Set premium status
- Feature articles on homepage

**Steps**:
1. Open article
2. Click "Edit Article"
3. Make changes
4. Click "Save Changes"
5. Original author is notified

#### Deleting Articles

**Soft delete**:
- Article is archived but not removed
- Can be restored later
- Preserves URL (returns 404)

**Hard delete**:
- Permanently removes article
- Cannot be restored
- URL is freed for reuse
- ⚠️ Use with extreme caution

### Comments Moderation

#### Viewing Comments

**Path**: Content → Comments

**Filters**:
- Status (Pending, Approved, Rejected, Flagged)
- Article
- User
- Date range

#### Moderating Comments

**For each comment**:
1. Read comment content
2. Check context (article, parent comment)
3. Review user history
4. Take action:
   - **Approve**: Make visible
   - **Reject**: Hide comment
   - **Delete**: Permanently remove
   - **Flag User**: Mark for review

**Bulk moderation**:
- Select multiple comments
- Apply action to all
- Saves time on spam comments

### Media Library

**Path**: Content → Media

**Features**:
- Upload images
- Organize in folders
- Set usage permissions
- Delete unused media
- View media usage stats

---

## ⚙️ System Configuration

### General Settings

**Path**: Dashboard → Settings → System Config

#### Platform Settings

**Configurable options**:
- Site name
- Site URL
- Timezone
- Default language
- Currency (for premium subscriptions)
- Contact email
- Support URL

#### Feature Flags

Enable/disable platform features:
- ☑️ User registration
- ☑️ Comments
- ☑️ Social sharing
- ☑️ Premium content
- ☑️ API access
- ☑️ Webhooks

#### Email Configuration

**SMTP settings**:
```
Host: smtp.example.com
Port: 587
Encryption: TLS
Username: notifications@coindaily.com
Password: ********
From Email: noreply@coindaily.com
From Name: CoinDaily Platform
```

**Test email**:
1. Configure SMTP
2. Click "Send Test Email"
3. Check inbox
4. Verify delivery

### Marquee Management

**Path**: Settings → Marquee Settings

#### Creating Marquee Messages

1. Click "Create New Message"
2. Enter message text
3. Set priority (1-10, higher = more important)
4. Set duration (seconds to display)
5. Choose background color
6. Set visibility:
   - All users
   - Premium users only
   - Specific user groups
7. Schedule:
   - Start date/time
   - End date/time
   - Repeat pattern
8. Save message

#### Managing Active Messages

**List shows**:
- Message text (preview)
- Priority
- Status (Active/Scheduled/Expired)
- Views count
- Created date

**Actions**:
- Edit message
- Pause/Resume
- Delete
- View analytics

### Accessibility Settings

**Path**: Settings → Accessibility

#### Configuring Accessibility Features

**Options**:
- ☑️ High contrast mode
- ☑️ Large text option
- ☑️ Screen reader optimization
- ☑️ Keyboard navigation
- ☑️ Reduced motion
- ☑️ Color blind modes

#### Running Accessibility Audits

1. Navigate to **Settings** → **Accessibility** → **Audit**
2. Click "Run Audit"
3. Wait for scan to complete (1-2 minutes)
4. Review results:
   - WCAG AA compliance score
   - Issues found
   - Recommendations
5. Export report (PDF/JSON)
6. Fix issues as needed

---

## 📈 Monitoring & Analytics

### Analytics Dashboard

**Path**: Dashboard → Analytics

#### Key Metrics

**User Metrics**:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- New registrations
- User retention rate

**Content Metrics**:
- Articles published
- Total views
- Average read time
- Top articles

**Engagement Metrics**:
- Comments per article
- Social shares
- User interactions
- Bounce rate

#### Custom Reports

**Create custom report**:
1. Select metrics to include
2. Choose date range
3. Add filters
4. Select visualization type (chart/table)
5. Save report
6. Schedule email delivery (optional)

### System Monitoring

**Path**: Dashboard → System

#### Server Health

**Monitors**:
- CPU usage
- Memory usage
- Disk space
- Network I/O
- Database connections
- Cache hit rate

**Alerts**:
- Set threshold alerts
- Email notifications
- SMS notifications (critical only)

#### Performance Metrics

**API Performance**:
- Average response time
- P95 response time
- P99 response time
- Error rate
- Throughput (requests/second)

**Database Performance**:
- Query execution time
- Slow queries log
- Connection pool status
- Index usage

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: Users Can't Login

**Symptoms**:
- Login fails with "Invalid credentials"
- Users report password reset not working

**Diagnosis**:
1. Check if user account is suspended/banned
2. Review security events for IP block
3. Check rate limiting (too many failed attempts)
4. Verify email service is working

**Solution**:
1. Unblock IP if necessary
2. Unsuspend account
3. Reset rate limit counter
4. Send password reset email manually

#### Issue 2: Slow API Response

**Symptoms**:
- API response time > 500ms
- Timeout errors

**Diagnosis**:
1. Check **Analytics** → **Performance**
2. Review slow queries log
3. Check database connection pool
4. Review cache hit rate

**Solution**:
1. Run database optimizer: `npm run perf:db-optimize`
2. Clear cache if stale
3. Restart services if needed
4. Scale resources if consistently slow

#### Issue 3: High Security Events

**Symptoms**:
- Spike in security events
- Multiple blocked IPs

**Diagnosis**:
1. Review **Security Dashboard**
2. Check event types and patterns
3. Identify attack source
4. Review rate limit effectiveness

**Solution**:
1. Adjust rate limits if legitimate traffic
2. Block attacking IP ranges
3. Enable additional security measures
4. Contact security team if DDoS

### Accessing Logs

#### Application Logs

**Location**:
- Backend: `backend/logs/`
- Frontend: Browser console

**Files**:
- `all.log` - All log messages
- `error.log` - Errors only
- `security.log` - Security events

#### Downloading Logs

1. Navigate to **System** → **Logs**
2. Select log type
3. Choose date range
4. Click "Download"
5. ZIP file is generated

### Getting Help

**Internal resources**:
- This user manual
- API documentation
- Technical documentation

**External support**:
- Email: admin-support@coindaily.com
- Emergency hotline: +1-XXX-XXX-XXXX
- Slack channel: #admin-support

---

## ✅ Best Practices

### Security Best Practices

1. **Enable 2FA on all admin accounts** - Non-negotiable
2. **Review security events daily** - Check dashboard every morning
3. **Keep blacklist updated** - Remove expired entries monthly
4. **Rotate credentials quarterly** - Change passwords every 3 months
5. **Use strong passwords** - 16+ characters, mixed case, numbers, symbols
6. **Never share admin credentials** - Each admin has own account
7. **Review audit logs weekly** - Look for suspicious patterns
8. **Test backup restoration monthly** - Ensure backups work

### User Management Best Practices

1. **Document role changes** - Always add notes when changing roles
2. **Investigate before banning** - Gather evidence first
3. **Communicate with users** - Explain suspensions/bans
4. **Regular permission audits** - Review admin list quarterly
5. **Prompt account deactivation** - Disable accounts of departed staff immediately

### Content Management Best Practices

1. **Consistent moderation** - Apply rules fairly
2. **Quick response time** - Review content within 24 hours
3. **Clear guidelines** - Document content policies
4. **User education** - Help users understand violations
5. **Appeal process** - Allow users to contest decisions

### System Administration Best Practices

1. **Schedule maintenance windows** - Notify users in advance
2. **Test changes in staging** - Never edit production directly
3. **Monitor system health** - Set up alerts
4. **Keep documentation updated** - Record all config changes
5. **Regular backups** - Daily automated backups minimum

---

## 📞 Contact & Support

### Support Channels

**Technical Support**:
- Email: admin-support@coindaily.com
- Response time: 4 hours (business hours)

**Emergency Support**:
- Phone: +1-XXX-XXX-XXXX
- Available: 24/7 for critical issues

**Documentation**:
- User manual (this document)
- API documentation
- Video tutorials
- FAQ

---

## 📚 Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + /` | Open command palette |
| `Ctrl + S` | Save changes |
| `Ctrl + K` | Quick search |
| `Esc` | Close modal |

### Glossary

**Terms**:
- **2FA**: Two-Factor Authentication
- **CSRF**: Cross-Site Request Forgery
- **IP**: Internet Protocol address
- **JWT**: JSON Web Token
- **Rate Limit**: Request throttling mechanism
- **WCAG**: Web Content Accessibility Guidelines

---

**End of Super Admin User Manual**

**Version**: 1.0.0  
**Last Updated**: October 6, 2025  
**Next Review**: January 6, 2026
