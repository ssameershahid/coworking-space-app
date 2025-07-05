# CalmKaaj - Coworking Space Management System

## Overview

CalmKaaj is a full-stack web application with PWA capabilities designed to manage coworking space operations. The system provides role-based access for different user types including individual members, organization admins, café managers, and enterprise administrators. Members can order food from the café, book meeting rooms, and manage organizational billing, while staff can manage inventory, fulfill orders, and access analytics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Context API with TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **PWA Features**: Service worker, manifest, and offline capabilities
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and express-session
- **Password Security**: bcrypt for hashing
- **Real-time Communication**: WebSocket server for live updates
- **API Design**: RESTful endpoints with role-based access control

### Database Architecture
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Database**: PostgreSQL (configured for Neon serverless)
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Neon serverless driver for edge compatibility

## Key Components

### Authentication & Authorization
- Multi-role system (member_individual, member_organization, cafe_manager, enterprise_administrator)
- Session-based authentication with secure cookie handling
- Role-based route protection and UI rendering
- Organization-level permission controls for café and room billing

### Café Management
- Menu category and item management
- Shopping cart functionality with localStorage persistence
- Order placement with billing type selection (personal/organization)
- Real-time order status updates via WebSocket
- Daily specials and availability tracking

### Meeting Room System
- Room booking with date/time selection
- Credit-based pricing system
- Availability checking and conflict prevention
- Amenity tracking and display
- Organization billing integration

### Organization Management
- Employee permission management
- Billing controls for café and room charges
- Invoice generation and download functionality
- Multi-site support (Blue Area, I-10 locations)

### Admin Dashboard
- User management and role assignment
- Menu item CRUD operations
- Room management and configuration
- System-wide analytics and reporting

## Data Flow

### User Authentication Flow
1. User submits credentials via login form
2. Passport.js validates against database
3. Session established with role-based permissions
4. Frontend receives user data and redirects based on role
5. Subsequent requests include session cookie for authentication

### Order Processing Flow
1. User browses menu and adds items to cart
2. Cart data persisted in localStorage
3. Checkout process allows billing type selection
4. Order submitted to backend with user/organization details
5. WebSocket notification sent to café managers
6. Status updates broadcast to user in real-time

### Room Booking Flow
1. User selects date, time, and duration
2. System checks room availability
3. Credit cost calculated based on duration
4. Booking confirmed with organization billing if applicable
5. Calendar integration and reminder system activated

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connectivity
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI components
- **drizzle-orm**: Database ORM and query builder
- **express-session**: Session management
- **passport**: Authentication middleware
- **bcrypt**: Password hashing
- **ws**: WebSocket server implementation

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migration tool

## Deployment Strategy

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: esbuild bundles Node.js application
- Database: Migrations applied via Drizzle Kit
- PWA: Service worker and manifest for offline functionality

### Environment Configuration
- Database URL required for PostgreSQL connection
- Session secret for secure cookie signing
- Node environment detection for development features
- Replit-specific plugins for development environment

### Scalability Considerations
- Session store can be configured for Redis in production
- WebSocket connections can be scaled with adapter pattern
- Database queries optimized with proper indexing
- Static assets served via CDN in production

## Changelog

```
Changelog:
- July 05, 2025. Initial setup and database configuration
- July 05, 2025. Fixed authentication system - updated password hashes for test accounts
- July 05, 2025. COMPLETED Member Individual role with ALL PRD features:
  * Comprehensive dashboard with credits widget, announcements, daily deals carousel
  * Full café ordering system with real-time updates, billing toggle, PDF downloads
  * Complete meeting room booking with credit management, amenity display, WebSocket updates
  * Profile management with organization info and PDF bill generation
  * Real-time notifications via WebSocket for order and booking status updates
- July 06, 2025. Fixed user role assignment - added proper 'member_organization' role:
  * Added new role to database schema for regular organization employees
  * Fixed form to assign correct role (member_organization vs member_organization_admin)
  * Organization employees now have limited permissions, not admin privileges
- July 06, 2025. Consolidated admin roles - unified 'enterprise_administrator' and 'calmkaaj_admin':
  * Standardized on 'calmkaaj_admin' role throughout the system
  * Updated all API endpoints and frontend checks to use single admin role
  * Fixed organization creation permissions and role display components
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```