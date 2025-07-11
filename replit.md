# WhatsApp Lunch Ordering System (ACORD)

## Overview

ACORD is a production-ready WhatsApp-integrated lunch ordering system designed for office environments. The system features an image-only menu selection interface optimized for mobile WhatsApp workflow, comprehensive order management, and real-time analytics. The application is currently in version 1.3.1 (ACORD-v1.3.1-stable) and has been validated with extensive testing including advanced image management, integrity validation, cache optimization, comprehensive system stability verification, and modern compact UI design.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite build system
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom theme configuration
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **PWA Features**: Service Worker implementation for offline functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Authentication**: Custom session-based authentication with username/password
- **File Upload**: Multer middleware for image handling
- **API Design**: RESTful API endpoints with role-based access control
- **Session Storage**: PostgreSQL-backed session management using connect-pg-simple

### Database Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless PostgreSQL connection
- **Schema Management**: Type-safe schema definitions with Drizzle Kit migrations
- **Tables**: Users, dishes, orders, and sessions with proper relationships

## Key Components

### Authentication System
- Role-based access control (employee/admin/superadmin)
- Session-based authentication with secure cookie configuration
- User management with username/password credentials
- Protected API endpoints with middleware validation

### Menu Management
- Image-only dish system optimized for WhatsApp sharing
- Daily menu reset functionality for fresh content
- Bulk image upload capability for administrators
- Secure file serving through Express static middleware

### Order Processing
- Real-time order creation and modification
- User-specific order history tracking
- Visual dish selection with confirmation interface
- Mobile-optimized order summary component

### Administrative Features
- Comprehensive order analytics and statistics
- User management interface with role assignment
- CSV export functionality for data analysis
- Order processing with quantity overlay generation

## Data Flow

1. **User Authentication**: Users log in with username/password credentials
2. **Menu Loading**: Daily dishes are fetched and displayed as image cards
3. **Order Selection**: Users select dishes through visual interface
4. **Order Submission**: Selected dishes are submitted as order records
5. **Admin Processing**: Administrators view orders and generate processed images
6. **Data Export**: Order data can be exported for restaurant integration

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **express**: Web application framework
- **multer**: File upload handling
- **connect-pg-simple**: PostgreSQL session store

### UI Dependencies
- **@radix-ui/***: Comprehensive UI component library
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and development experience
- **drizzle-kit**: Database schema management

## Deployment Strategy

### Environment Configuration
The application requires the following environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secure session encryption key
- `NODE_ENV`: Environment designation (development/production)
- `PORT`: Application server port (defaults to 5000)

### Build Process
1. Frontend build: `vite build` compiles React application to static assets
2. Backend build: `esbuild` bundles Node.js server code
3. Database setup: `drizzle-kit push` applies schema changes
4. Production start: Serves built application with Express

### Deployment Options
- **Docker**: Complete containerized deployment with docker-compose
- **Traditional Server**: Standard Node.js deployment on existing infrastructure
- **Local Setup**: Development and testing environment configuration

## Changelog

- July 11, 2025. **ACORD v1.3.1 (STABLE)** - Compact UI Design & Enhanced User Experience:
  
  **User Interface Improvements:**
  - Replaced text-based action buttons with intuitive icon-only buttons (Edit, Shield, Trash2)
  - Implemented compact table design with reduced padding and optimized spacing
  - Renamed "Status" column to "Password Expiry" for better clarity
  - Simplified password expiry badges to show only days remaining (e.g., "117d")
  - Added hover effects and improved visual feedback for interactive elements
  - Made activation/deactivation badges clickable with integrated toggle functionality
  
  **User Management Enhancement:**
  - Consolidated activation controls into status badges eliminating separate buttons
  - Improved action button layout with single-row icon arrangement
  - Enhanced tooltips and user guidance for better accessibility
  - Streamlined admin workflow with more intuitive interface elements
  
  **Technical Improvements:**
  - Resolved login middleware issues with proper Content-Type handling
  - Optimized Express.js request parsing for better API reliability
  - Enhanced error handling and debugging capabilities
  - Improved session management and authentication flow
  
  **System Stability:**
  - Comprehensive testing of all v1.3+ features confirmed working
  - Verified API endpoint functionality across all user management operations
  - Validated password policy management and user activation systems
  - Ensured backward compatibility with existing user data and preferences

- July 10, 2025. **ACORD v1.3.0 (STABLE)** - Enhanced Image Management System with Integrity Validation:

  **Image Management & Integrity:**
  - Added automatic image file validation in dish API endpoints
  - Implemented intelligent filtering to prevent broken image display
  - Enhanced clearTodayData function with proper file cleanup
  - Added detailed logging for missing image files identification
  - Fixed critical issue with orphaned dish records showing broken images
  - Improved file path handling for multiple upload formats
  
  **System Reliability:**
  - Eliminated broken image placeholders in menu display
  - Enhanced data consistency between database and filesystem
  - Improved error handling for file operations
  - Added proactive image integrity checking
  - Streamlined dish management with automatic cleanup

- July 10, 2025. **ACORD v1.2.3 (STABLE)** - Complete System Enhancement with Login Tracking, Cache Optimization & File Management:
  
  **Login Tracking & User Management:**
  - Added lastLoginAt field to users schema to track login timestamps
  - Implemented automatic last login timestamp recording on successful authentication  
  - Added "Last Login" column to User Management table with relative time display (e.g., "2h ago", "3d ago")
  - Enhanced user table with absolute timestamp details (date and time) shown as secondary information
  - Added getRelativeTime() helper function for user-friendly time display
  - Updated database storage with updateLastLogin() method to track user activity
  - Shows "Never logged in" for users who haven't accessed the system yet
  
  **Admin Access & Permissions:**
  - Confirmed admin users have full access to Password Policy settings alongside superadmin users
  - Verified isAdmin() function properly validates both 'admin' and 'superadmin' roles for policy management
  - Enhanced role-based access control for administrative functions
  
  **Cache System Optimization:**
  - Implemented aggressive cache-busting strategy with Service Worker v1.2.3
  - Added automatic version detection and cache clearing with optimized 60-second intervals
  - Created zero-cache policy for all API requests with no-store directive
  - Implemented complete cache clearing on version mismatch with localStorage tracking
  - Added network-first strategy with cache reload for all static assets
  - Created automatic service worker unregistration and re-registration system
  - Added version.json endpoint for real-time version checking
  - Eliminated need for manual Ctrl+Shift+R after updates
  - Fixed critical production issue preventing app loading after version updates
  - Resolved persistent Service Worker 404 errors with proper /sw.js routing and fallback handling
  
  **File Management & Data Cleanup:**
  - Enhanced data cleanup to properly remove image files when clearing daily data
  - Fixed critical bug in clearTodayData function preventing broken image display
  - Added intelligent file path handling for image deletion (supports /uploads/ and uploads/ formats)
  - Implemented proper filesystem cleanup with error handling and logging
  - Eliminated orphaned image files and storage waste
  
  **User Interface & Navigation:**
  - Added industry-standard releases page at /releases route accessible via top-right navigation
  - Created comprehensive changelog with version history, feature descriptions, and release dates
  - Implemented visual badges for version types (Major/Minor/Patch) and status (Stable/Beta/Deprecated)
  - Added feature categorization with icons (Feature/Improvement/Fix/Security) for better organization
  - Integrated releases page into main navigation with FileText icon and active state highlighting
  - Enhanced user experience with detailed release descriptions and professional layout design
  
  **System Stability & Performance:**
  - Conducted comprehensive system testing across all pages and components
  - Verified API endpoints functionality (dishes, orders, users, auth)
  - Confirmed authentication system stability and session management
  - Validated Service Worker registration and error-free operation
  - Ensured all React components import correctly with proper dependency management
  - Optimized cache performance with reduced update frequency for better user experience
- July 10, 2025. **ACORD v1.2.3** - Last Login Tracking System & Admin Access Enhancement:
  - Added lastLoginAt field to users schema to track login timestamps
  - Implemented automatic last login timestamp recording on successful authentication
  - Added "Last Login" column to User Management table with relative time display (e.g., "2h ago", "3d ago")
  - Enhanced user table with absolute timestamp details (date and time) shown as secondary information
  - Added getRelativeTime() helper function for user-friendly time display
  - Updated database storage with updateLastLogin() method to track user activity
  - Shows "Never logged in" for users who haven't accessed the system yet
  - Confirmed admin users have full access to Password Policy settings alongside superadmin users
  - Verified isAdmin() function properly validates both 'admin' and 'superadmin' roles for policy management
- July 10, 2025. **ACORD v1.2.2** - User Activation/Deactivation System:
  - Added isActive field to users schema with default true value
  - Implemented user activation and deactivation functionality in User Management interface
  - Created ActivationButton component with Activate/Deactivate toggle functionality
  - Added "Active" status column to User Management table showing Active/Inactive badges
  - Added API endpoints for user activation: PUT /api/admin/users/:userId/activate and /api/admin/users/:userId/deactivate
  - Enhanced authentication to check isActive status - inactive users cannot log in
  - Added security protections: cannot deactivate yourself or superadmin users
  - Integrated activation controls into existing User Management table alongside Edit/Reset Password/Delete actions
  - Updated database storage with activateUser() and deactivateUser() methods in DatabaseStorage
- July 10, 2025. **ACORD v1.2.1** - Reset Password Button Integration & Status Management:
  - Moved Reset Password functionality from separate tab to User Management table Actions column
  - Added instant password reset button alongside Edit/Delete actions for streamlined workflow
  - Implemented automatic clipboard copying of temporary passwords (exactly 8 characters)
  - Fixed API endpoint conflicts and JSON parsing issues for reliable password reset operations
  - Fixed password generation algorithm to guarantee exactly 8 characters using secure character set
  - Added "Status" column to User Management table showing password status badges (Active, Expires Soon, Expired, Must Change)
  - Removed individual "Expiry Settings" buttons - password policies are now centrally managed in Password Policy tab
  - Completely removed "Password Management" tab as functionality was duplicated in User Management
  - Streamlined admin interface from 4 tabs to 3 tabs (Menu, Users, Policy) for admins and 3 to 2 tabs for superadmins
  - Enhanced user experience with one-click password reset and automatic password copying
  - Added configurable expiry warning periods (1, 3, 7, 14, 30 days) in Password Policy settings
  - Updated status badge logic to use administrator-configured warning periods instead of fixed 7-day threshold
  - Enhanced password policy interface with warning period configuration and validation
- July 08, 2025. **ACORD v1.2** - Password Management System:
  - Implemented comprehensive password management with configurable policies
  - Added password expiry system (default 120 days, admin configurable)
  - Created password change interface with validation (min 8 chars, letters+numbers)
  - Added admin password reset functionality with temporary passwords
  - Implemented forced password change mechanism with app-level blocking
  - Added password status monitoring and expiry warnings
  - Created password management admin panel for user administration
  - Fixed critical integration issues with password enforcement
  - Corrected admin access rights for password expiry configuration
  - Added navigation improvements for mobile Samsung S24 Ultra compatibility
- July 08, 2025. **ACORD v1.1.1** - Major cache fixing update:
  - Fixed critical caching issues preventing first page load
  - Implemented network-first Service Worker strategy
  - Added automatic cache versioning and cleanup
  - Created cache debugging tools and emergency clear endpoints
  - Improved static file serving with proper cache headers
  - Added cache troubleshooting documentation
- July 02, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.