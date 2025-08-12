# CalmKaaj - Coworking Space Management System

[![Docker Build](https://img.shields.io/docker/automated/calmkaaj/calmkaaj.svg)](https://hub.docker.com/r/calmkaaj/calmkaaj)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.8-blue.svg)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)

A comprehensive Progressive Web Application (PWA) for managing coworking space operations with advanced real-time capabilities.

## Features

- **Multi-Role System**: Individual members, organization admins, café managers, and enterprise administrators
- **Café Management**: Menu management, order placement, real-time order tracking
- **Meeting Room Booking**: Room reservation with credit-based pricing
- **Real-time Updates**: Server-Sent Events (SSE) for instant notifications
- **Multi-Location Support**: Blue Area and I-10 locations with isolated management
- **PWA Capabilities**: Offline support, push notifications, installable
- **Organization Billing**: Invoice generation and credit management

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL 16.8 (Railway hosted)
- **Real-time**: Server-Sent Events (SSE)
- **Authentication**: Passport.js with session-based auth
- **ORM**: Drizzle ORM with TypeScript
- **Build Tool**: Vite

## Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/ssameershahid/Co-working-Space.git
cd Co-working-Space

# Run with Docker Compose
docker-compose up -d

# Or run the Docker image directly
docker run -p 5000:5000 \
  -e DATABASE_URL="your_postgresql_connection_string" \
  -e RESEND_API_KEY="your_resend_key" \
  calmkaaj/calmkaaj:latest
```

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `RESEND_API_KEY` | Email service API key | ✅ |
| `SESSION_SECRET` | Session encryption secret | ✅ |
| `VAPID_PUBLIC_KEY` | Push notification public key | ❌ |
| `VAPID_PRIVATE_KEY` | Push notification private key | ❌ |

## Docker Deployment

The application is containerized and available as a Docker image:

```bash
# Build the image locally
docker build -t calmkaaj/calmkaaj .

# Run the container
docker run -p 5000:5000 calmkaaj/calmkaaj
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/auth/login` - User authentication
- `GET /api/cafe/menu` - Get menu items
- `POST /api/cafe/orders` - Place an order
- `GET /api/rooms` - Get available rooms
- `POST /api/bookings` - Create room booking

## Database Migration History

- **August 12, 2025**: Migrated from Replit/Neon to Railway PostgreSQL 16.8
- Complete data preservation: 16 users, 125 orders, 21 bookings, 49 menu items

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email admin@calmkaaj.com or create an issue on GitHub.