# WhatsApp Lunch Ordering System (ACORD)

## Overview

ACORD is a production-ready WhatsApp-integrated lunch ordering system designed for office environments. The system features an image-only menu selection interface optimized for mobile WhatsApp workflow, comprehensive order management, and real-time analytics. The application is currently in version 1.1 (ACORD-v1.1-stable) and has been validated with 27 users, 5 dishes, and 11+ confirmed orders.

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