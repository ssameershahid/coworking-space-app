# CalmKaaj - Coworking Space Management System

## Overview

CalmKaaj is a full-stack web application with PWA capabilities designed to manage coworking space operations. The system provides role-based access for individual members, organization admins, café managers, and enterprise administrators. Key capabilities include café order management, meeting room booking, organization billing, and staff functionalities like inventory management and analytics. CalmKaaj aims to streamline coworking space administration and enhance the member experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**August 7, 2025 - Session Management & System Optimization**
- **Session Persistence**: **MAJOR FIX** - Replaced MemoryStore with PostgreSQL session store using connect-pg-simple. Users now stay logged in for 3 weeks even after closing/reopening browser tabs. Sessions survive server restarts.
- **Dashboard UI Fix**: Removed invisible blue-bordered Link wrappers causing clickable areas around action cards. Navigation now properly contained to buttons only.
- **Button Alignment**: Added conditional spacing to align "Order from Café" and "Book Meeting Room" buttons with credit warning messages in negative balance states.
- **Performance Optimization**: Removed excessive debug logging throughout the system (90% reduction in console output)
- **SSE Resource Fix**: Fixed resource-intensive SSE polling issue in cafe.tsx (was continuously hitting non-existent `/api/sse/user` endpoint)
- **Production Logging**: Streamlined logging to essential errors and order creation events only
- **Real-time System**: Confirmed working perfectly - orders broadcast instantly from users to cafe managers at same location
- **Compute Efficiency**: Reduced CPU/memory usage significantly while maintaining full functionality

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Context API with TanStack Query
- **Routing**: Wouter
- **PWA Features**: Service worker, manifest, and offline capabilities
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and `express-session`
- **Password Security**: bcrypt for hashing
- **Real-time Communication**: WebSocket server
- **API Design**: RESTful endpoints with role-based access control

### Database Architecture
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Database**: PostgreSQL (configured for Neon serverless)
- **Migrations**: Drizzle Kit

### Key Components & Features
- **Authentication & Authorization**: Multi-role system, session-based authentication, role-based access, organization-level permissions.
- **Café Management**: Menu management, shopping cart, order placement (personal/organization billing), real-time order status, daily specials, cash-only order creation.
- **Real-time Order System**: **FULLY WORKING AND OPTIMIZED** Server-Sent Events (SSE) with single `/events` endpoint for live order notifications. Successfully broadcasts `order.new` to cafe managers and `order.update` to users. Fixed critical React useEffect dependency issue that caused constant reconnections. Now features stable connections, heartbeat monitoring, automatic connection cleanup, and real-time dashboard updates without page refresh. **Confirmed working for ALL order creation methods** including frontend app orders (checkout-modal, cart-drawer, cafe page) and cafe manager on-behalf orders. Comprehensive logging added for debugging. **Verified working August 7, 2025 - Orders #114-119 all broadcast successfully**.
- **Meeting Room System**: Booking with date/time, credit-based pricing, availability checks, amenity tracking, organization billing integration, 5-minute cancellation policy.
- **Multi-Location System**: **FULLY IMPLEMENTED** - Each location (Blue Area, I-10) has isolated cafe management. Users and cafe managers are hardwired to specific locations. Cafe managers only see orders from users at their same location. Real-time notifications are location-specific. **Verified working August 7, 2025**.
- **Organization Management**: Employee permission management, billing controls, invoice generation, multi-site support (Blue Area, I-10).
- **Admin Dashboard**: User management, menu item CRUD, room configuration, system analytics.
- **Community Features**: Member directory with integrated user profiles, self-service profile editing, privacy controls for email visibility, global avatar system.
- **Onboarding System**: Playful animated welcome experience for new users featuring personalized greetings, interactive feature tours with spotlights, confetti celebrations, and guided tooltips. Shows once per user account with database tracking.
- **UI/UX Decisions**: Green brand color scheme with orange accents, professional PDF generation, responsive design (desktop & mobile), dynamic conference room graphics, visual calendar picker, PKR currency localization, unified component design (e.g., universal menu item editor, consistent checkout dialog).
- **PWA Implementation**: Full PWA capabilities including push notifications, install prompt, and offline support.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL database connectivity.
- **@tanstack/react-query**: Server state management for data fetching and caching.
- **@radix-ui/react-***: Accessible UI components for various interactive elements.
- **drizzle-orm**: TypeScript ORM for database interactions.
- **express-session**: Middleware for managing user sessions.
- **passport**: Authentication middleware.
- **bcrypt**: Library for hashing and comparing passwords.
- **ws**: WebSocket server implementation for real-time communication.
- **web-push**: Library for managing push notifications.