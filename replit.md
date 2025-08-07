# CalmKaaj - Coworking Space Management System

## Overview

CalmKaaj is a full-stack web application with PWA capabilities designed to manage coworking space operations. The system provides role-based access for individual members, organization admins, café managers, and enterprise administrators. Key capabilities include café order management, meeting room booking, organization billing, and staff functionalities like inventory management and analytics. CalmKaaj aims to streamline coworking space administration and enhance the member experience.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Real-time Order System**: **FULLY WORKING** Server-Sent Events (SSE) with single `/events` endpoint for live order notifications. Successfully broadcasts `order.new` to cafe managers and `order.update` to users. Includes heartbeat monitoring, automatic connection cleanup, and real-time dashboard updates without page refresh. **Verified working August 7, 2025**.
- **Meeting Room System**: Booking with date/time, credit-based pricing, availability checks, amenity tracking, organization billing integration, 5-minute cancellation policy.
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