import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import * as schema from "@shared/schema";

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-secret-key-here",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Passport configuration
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Auth middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session and passport setup
  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  // WebSocket setup
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connection handling
  const clients = new Map<number, WebSocket>();
  
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'authenticate' && data.userId) {
          clients.set(data.userId, ws);
          console.log(`User ${data.userId} connected via WebSocket`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from map
      for (const [userId, client] of Array.from(clients.entries())) {
        if (client === ws) {
          clients.delete(userId);
          break;
        }
      }
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (userId: number, message: any) => {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  };

  // Authentication routes
  app.post("/api/auth/login", (req, res, next) => {
    const result = schema.loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }

      req.logIn(user, (err: any) => {
        if (err) {
          return next(err);
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = schema.insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const { email, password, ...userData } = result.data;
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        email,
        password: hashedPassword,
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const { password, ...userWithoutPassword } = req.user as any;
    res.json({ user: userWithoutPassword });
  });

  // Menu routes
  app.get("/api/menu/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching menu categories:", error);
      res.status(500).json({ message: "Failed to fetch menu categories" });
    }
  });

  app.get("/api/menu/items", requireAuth, async (req, res) => {
    try {
      const { site } = req.query;
      const items = await storage.getMenuItems(site as string);
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  // Daily specials endpoint
  app.get("/api/menu/daily-specials", requireAuth, async (req, res) => {
    try {
      const { site } = req.query;
      const items = await storage.getMenuItems(site as string);
      const dailySpecials = items.filter(item => item.is_daily_special && item.is_available);
      res.json(dailySpecials);
    } catch (error) {
      console.error("Error fetching daily specials:", error);
      res.status(500).json({ message: "Failed to fetch daily specials" });
    }
  });

  // Available rooms endpoint
  app.get("/api/rooms/available", requireAuth, async (req, res) => {
    try {
      const { site } = req.query;
      const rooms = await storage.getMeetingRooms(site as string);
      const availableRooms = rooms.filter(room => room.is_available);
      res.json(availableRooms);
    } catch (error) {
      console.error("Error fetching available rooms:", error);
      res.status(500).json({ message: "Failed to fetch available rooms" });
    }
  });

  app.post("/api/menu/items", requireAuth, requireRole(["cafe_manager", "enterprise_administrator"]), async (req, res) => {
    try {
      const result = schema.insertMenuItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const item = await storage.createMenuItem(result.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  app.patch("/api/menu/items/:id", requireAuth, requireRole(["cafe_manager", "enterprise_administrator"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const item = await storage.updateMenuItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });

  // Cafe order routes
  app.post("/api/cafe/orders", requireAuth, async (req, res) => {
    try {
      const user = req.user as schema.User;
      const { items, billed_to, notes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order must contain at least one item" });
      }

      // Calculate total
      let total = 0;
      const orderItems = [];
      
      for (const item of items) {
        const menuItem = await storage.getMenuItemById(item.menu_item_id);
        if (!menuItem) {
          return res.status(400).json({ message: `Menu item ${item.menu_item_id} not found` });
        }
        
        const itemTotal = parseFloat(menuItem.price) * item.quantity;
        total += itemTotal;
        orderItems.push({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: menuItem.price,
        });
      }

      // Create order
      const order = await storage.createCafeOrder({
        user_id: user.id,
        total_amount: total.toString(),
        status: "pending",
        billed_to: billed_to || "personal",
        org_id: billed_to === "organization" ? user.organization_id : undefined,
        notes,
        site: user.site,
      });

      // Create order items
      for (const item of orderItems) {
        await storage.createCafeOrderItem({
          order_id: order.id,
          ...item,
        });
      }

      // Broadcast to cafe managers
      const orderWithDetails = await storage.getCafeOrderById(order.id);
      // Here you would broadcast to cafe managers via WebSocket
      
      res.status(201).json(orderWithDetails);
    } catch (error) {
      console.error("Error creating cafe order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/cafe/orders", requireAuth, async (req, res) => {
    try {
      const user = req.user as schema.User;
      const { org_id } = req.query;
      
      let orders;
      if (user.role === "member_organization_admin" && org_id) {
        orders = await storage.getCafeOrders(undefined, org_id as string);
      } else if (user.role === "cafe_manager" || user.role === "calmkaaj_admin") {
        orders = await storage.getCafeOrders();
      } else {
        orders = await storage.getCafeOrders(user.id);
      }
      
      res.json(orders);
    } catch (error) {
      console.error("Error fetching cafe orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/cafe/orders/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getCafeOrderById(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching cafe order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.patch("/api/cafe/orders/:id/status", requireAuth, requireRole(["cafe_manager", "enterprise_administrator"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const user = req.user as schema.User;
      
      const order = await storage.updateCafeOrderStatus(id, status, user.id);
      
      // Broadcast update to user
      const orderWithDetails = await storage.getCafeOrderById(id);
      if (orderWithDetails) {
        broadcast(orderWithDetails.user.id, {
          type: "order_status_update",
          order: orderWithDetails,
        });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating cafe order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Meeting room routes
  app.get("/api/rooms", requireAuth, async (req, res) => {
    try {
      const { site } = req.query;
      const rooms = await storage.getMeetingRooms(site as string);
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching meeting rooms:", error);
      res.status(500).json({ message: "Failed to fetch meeting rooms" });
    }
  });

  app.post("/api/rooms", requireAuth, requireRole(["enterprise_administrator"]), async (req, res) => {
    try {
      const result = schema.insertMeetingRoomSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const room = await storage.createMeetingRoom(result.data);
      res.status(201).json(room);
    } catch (error) {
      console.error("Error creating meeting room:", error);
      res.status(500).json({ message: "Failed to create meeting room" });
    }
  });

  app.patch("/api/rooms/:id", requireAuth, requireRole(["enterprise_administrator"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const room = await storage.updateMeetingRoom(id, updates);
      res.json(room);
    } catch (error) {
      console.error("Error updating meeting room:", error);
      res.status(500).json({ message: "Failed to update meeting room" });
    }
  });

  // Meeting booking routes
  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const user = req.user as schema.User;
      const { room_id, start_time, end_time, billed_to, notes } = req.body;

      const startTime = new Date(start_time);
      const endTime = new Date(end_time);
      
      // Check room availability
      const isAvailable = await storage.checkRoomAvailability(room_id, startTime, endTime);
      if (!isAvailable) {
        return res.status(400).json({ message: "Room is not available for the selected time" });
      }

      // Get room details to calculate credits
      const room = await storage.getMeetingRoomById(room_id);
      if (!room) {
        return res.status(400).json({ message: "Room not found" });
      }

      // Calculate credits needed
      const durationHours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
      const creditsNeeded = durationHours * room.credit_cost_per_hour;

      // Check user credits
      if ((user.credits || 0) < creditsNeeded) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      // Create booking
      const booking = await storage.createMeetingBooking({
        user_id: user.id,
        room_id,
        start_time: startTime,
        end_time: endTime,
        credits_used: creditsNeeded,
        status: "confirmed",
        billed_to: billed_to || "personal",
        org_id: billed_to === "organization" ? user.organization_id : undefined,
        notes,
        site: user.site,
      });

      // Deduct credits
      await storage.updateUser(user.id, {
        used_credits: (user.used_credits || 0) + creditsNeeded,
      });

      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const user = req.user as schema.User;
      const { org_id } = req.query;
      
      let bookings;
      if (user.role === "member_organization_admin" && org_id) {
        bookings = await storage.getMeetingBookings(undefined, org_id as string);
      } else if (user.role === "calmkaaj_admin") {
        bookings = await storage.getMeetingBookings();
      } else {
        bookings = await storage.getMeetingBookings(user.id);
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.patch("/api/bookings/:id/status", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const booking = await storage.updateMeetingBookingStatus(id, status);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Announcements routes
  app.get("/api/announcements", requireAuth, async (req, res) => {
    try {
      const { site } = req.query;
      const announcements = await storage.getAnnouncements(site as string);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", requireAuth, requireRole(["enterprise_administrator"]), async (req, res) => {
    try {
      const result = schema.insertAnnouncementSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const announcement = await storage.createAnnouncement(result.data);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  // Organization routes
  app.get("/api/organizations", requireAuth, requireRole(["enterprise_administrator"]), async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post("/api/organizations", requireAuth, requireRole(["enterprise_administrator"]), async (req, res) => {
    try {
      const result = schema.insertOrganizationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const organization = await storage.createOrganization(result.data);
      res.status(201).json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get("/api/organizations/:id/employees", requireAuth, async (req, res) => {
    try {
      const user = req.user as schema.User;
      const orgId = req.params.id;
      
      // Check if user has access to this organization
      if (user.role !== "calmkaaj_admin" && user.organization_id !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const employees = await storage.getOrganizationEmployees(orgId);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching organization employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.patch("/api/users/:id/permissions", requireAuth, requireRole(["member_organization", "enterprise_administrator"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { can_charge_cafe_to_org, can_charge_room_to_org } = req.body;
      
      const user = await storage.updateEmployeePermissions(userId, {
        can_charge_cafe_to_org,
        can_charge_room_to_org,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error updating employee permissions:", error);
      res.status(500).json({ message: "Failed to update permissions" });
    }
  });

  return httpServer;
}
