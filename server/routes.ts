import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage, db } from "./storage";
import * as schema from "@shared/schema";
import { eq, desc, sql, asc, and, or } from "drizzle-orm";
import { emailService } from "./email-service";
import webpush from "web-push";
import { fileURLToPath } from 'url';
import { getPakistanTime, parseDateInPakistanTime, convertToPakistanTime } from "./utils/pakistan-time.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session configuration - Extended for PWA usage
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-secret-key-here",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to false for development to ensure cookies work
    maxAge: 21 * 24 * 60 * 60 * 1000, // 3 weeks for PWA experience
    httpOnly: true,
    sameSite: "lax" as const, // More permissive for development
  },
  name: 'connect.sid', // Explicit session name
};

// Configure web-push for notifications
webpush.setVapidDetails(
  'mailto:admin@calmkaaj.com',
  process.env.VAPID_PUBLIC_KEY || 'BHPhxDf_FuRSXw0Kzm_mJ5TDcBWe2Bmv8HtFQ_xyd2u0_wtgnb6XaykVM5oOQTnSbWW6mRI-NpdfEYtEuUgo-wM',
  process.env.VAPID_PRIVATE_KEY || 'ox0Lm9vjWcxrhNk04JXf6k8Sr16SSfircZs6qzSxQkw'
);

// Store push subscriptions in memory with size limit to prevent memory leaks
const pushSubscriptions = new Map<number, any>();
const MAX_PUSH_SUBSCRIPTIONS = 1000; // Prevent unbounded growth

// Cleanup function to remove expired subscriptions
const cleanupPushSubscriptions = () => {
  if (pushSubscriptions.size > MAX_PUSH_SUBSCRIPTIONS * 0.8) {
    // DISABLED: Excessive logging - console.warn(`Push subscriptions approaching limit (${pushSubscriptions.size}/${MAX_PUSH_SUBSCRIPTIONS})`);
    // Remove oldest 20% of subscriptions if near limit
    const toRemove = Math.floor(pushSubscriptions.size * 0.2);
    const entries = Array.from(pushSubscriptions.entries());
    for (let i = 0; i < toRemove; i++) {
      pushSubscriptions.delete(entries[i][0]);
    }
    // DISABLED: Excessive logging - console.log(`Cleaned up ${toRemove} push subscriptions`);
  }
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
const requireAuth = async (req: any, res: any, next: any) => {
  // Removed excessive logging to reduce console output
  
  if (req.isAuthenticated()) {
    // Check if we're in impersonation mode
    if ((req.session as any).impersonating && (req.session as any).userId) {
      // Override the user object with the impersonated user
      const impersonatedUser = await storage.getUserById((req.session as any).userId);
      if (impersonatedUser) {
        req.user = impersonatedUser;
      }
    }
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

// Multer configuration for profile image uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS middleware to handle cross-origin requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Session and passport setup
  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // DISABLED: Metrics tracking was consuming excessive compute units
  // Only enable for debugging purposes, not in production
  // app.use((req, res, next) => {
  //   // Only log failed authentication attempts, not every API call
  //   if (req.path.startsWith('/api/')) {
  //     METRICS.apiCalls++;
  //     if (req.path !== '/api/auth/login' && !req.isAuthenticated()) {
  //       METRICS.authFailures++;
  //       console.log('Auth failed for:', req.path);
  //     }
  //   }
  //   next();
  // });

  // Serve uploaded images
  app.use('/uploads', express.static(uploadsDir));

  // WebSocket setup
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // WebSocket connection handling with size limit
  const clients = new Map<number, WebSocket>();
  const MAX_CLIENTS = 500; // Prevent unbounded growth
  
  // Real-time metrics tracking
  // DISABLED: Metrics tracking was consuming excessive compute units
  // Only enable for debugging purposes, not in production
  // const METRICS = {
  //   startTime: new Date(),
  //   wsConnections: 0,
  //   pushSubs: pushSubscriptions.size,
  //   memory: 0,
  //   reconnects: 0,
  //   apiCalls: 0,
  //   authFailures: 0,
  //   cpu: 0
  // };
  
  wss.on('connection', (ws: WebSocket, req) => {
    // DISABLED: METRICS.wsConnections++;
    // DISABLED: Excessive logging - console.log('WebSocket connection established');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'authenticate' && data.userId) {
          // Enforce client limit to prevent memory leaks
          if (clients.size >= MAX_CLIENTS) {
            console.warn(`WebSocket client limit reached (${MAX_CLIENTS}), rejecting new connection`);
            ws.close(1000, 'Server at capacity');
            return;
          }
          clients.set(data.userId, ws);
          // DISABLED: Excessive logging - console.log(`User ${data.userId} connected via WebSocket`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // DISABLED: METRICS.wsConnections--;
      // Efficient cleanup - find and remove without creating new arrays
      for (const [userId, client] of clients) {
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

  // File upload endpoint
  app.post("/api/upload/profile-image", requireAuth, upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded" });
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Profile image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

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
        
        // Log session info for testing 3-week duration
        const sessionExpiry = new Date(Date.now() + (21 * 24 * 60 * 60 * 1000));
        console.log(`✅ User ${user.email} logged in successfully`);
        console.log(`📅 Session will expire on: ${sessionExpiry.toLocaleString('en-PK', {timeZone: 'Asia/Karachi'})}`);
        console.log(`⏰ Session duration: 21 days (3 weeks)`);
        
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
    
    // Add session info for testing
    const session = req.session as any;
    const sessionExpiry = session.cookie.expires;
    const remainingTime = sessionExpiry ? new Date(sessionExpiry).getTime() - Date.now() : null;
    const remainingDays = remainingTime ? Math.floor(remainingTime / (1000 * 60 * 60 * 24)) : null;
    
    res.json({ 
      user: userWithoutPassword,
      sessionInfo: {
        expiresOn: sessionExpiry ? new Date(sessionExpiry).toLocaleString('en-PK', {timeZone: 'Asia/Karachi'}) : null,
        remainingDays: remainingDays,
        remainingHours: remainingTime ? Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : null
      }
    });
  });

  // Menu routes
  app.get("/api/menu/categories", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const categories = await storage.getMenuCategories(user?.site);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching menu categories:", error);
      res.status(500).json({ message: "Failed to fetch menu categories" });
    }
  });

  app.get("/api/menu/items", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const items = await storage.getMenuItems(user?.site);
      res.json(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  // Admin endpoint to get all menu items (including inactive ones)
  app.get("/api/admin/menu/items", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team", "cafe_manager"]), async (req, res) => {
    try {
      const user = req.user as any;
      const items = await storage.getAllMenuItems(user?.site);
      res.json(items);
    } catch (error) {
      console.error("Error fetching all menu items:", error);
      res.status(500).json({ message: "Failed to fetch all menu items" });
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

  app.post("/api/menu/items", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team", "cafe_manager"]), async (req, res) => {
    try {
      // Debug logging removed to reduce compute costs
      
      const result = schema.insertMenuItemSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Menu item validation failed:", result.error.issues);
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const item = await storage.createMenuItem(result.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  app.patch("/api/menu/items/:id", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team", "cafe_manager"]), async (req, res) => {
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

  app.delete("/api/menu/items/:id", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team", "cafe_manager"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMenuItem(id);
      res.json({ message: "Menu item deleted successfully" });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ message: "Failed to delete menu item" });
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

  // Cafe manager endpoint to fetch all orders
  app.get("/api/cafe/orders/all", requireAuth, requireRole(["cafe_manager", "calmkaaj_admin"]), async (req, res) => {
    try {
      const user = req.user as schema.User;
      const { site } = req.query;
      
      // For cafe managers, use their site. For admins, use the site query parameter
      const filterSite = user.role === 'calmkaaj_admin' ? (site as string) : user.site;
      
      const orders = await storage.getCafeOrders(undefined, undefined, filterSite);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching all cafe orders:", error);
      res.status(500).json({ message: "Failed to fetch cafe orders" });
    }
  });

  // PDF Generation endpoint - Must come before :id route
  app.get("/api/cafe/orders/pdf", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;
      
      // Get orders for the user only - remove invalid parameters
      const orders = await storage.getCafeOrders(userId);
      
      let filteredOrders = orders;
      if (startDate || endDate) {
        filteredOrders = orders.filter((order: any) => {
          const orderDate = new Date(order.created_at);
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;
          
          if (start && orderDate < start) return false;
          if (end && orderDate > end) return false;
          return true;
        });
      }
      
      // Generate simple PDF content
      const pdfContent = generateCafePDFContent(filteredOrders, req.user as any, startDate, endDate);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="cafe-orders-${startDate || 'all'}-${endDate || 'all'}.pdf"`);
      res.send(Buffer.from(pdfContent));
    } catch (error) {
      console.error("Error generating café PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
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

  app.patch("/api/cafe/orders/:id/status", requireAuth, requireRole(["cafe_manager", "calmkaaj_admin"]), async (req, res) => {
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

  // Update payment status
  app.patch("/api/cafe/orders/:id/payment", requireAuth, requireRole(["cafe_manager", "calmkaaj_admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { payment_status } = req.body;
      const user = req.user as schema.User;
      
      const order = await storage.updateCafeOrderPaymentStatus(id, payment_status, user.id);
      
      // Broadcast update to user
      const orderWithDetails = await storage.getCafeOrderById(id);
      if (orderWithDetails) {
        broadcast(orderWithDetails.user.id, {
          type: "order_payment_update",
          order: orderWithDetails,
        });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error updating cafe order payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Create order on behalf of user
  app.post("/api/cafe/orders/create-on-behalf", requireAuth, requireRole(["cafe_manager", "calmkaaj_admin"]), async (req, res) => {
    try {
      const { user_id, items, billed_to, notes, delivery_location } = req.body;
      const cafeManager = req.user as schema.User;

      if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "User ID and items are required" });
      }

      // Get the user for whom the order is being created
      const targetUser = await storage.getUserById(user_id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Calculate total and prepare order items
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
      const orderData = {
        user_id: user_id,
        total_amount: total.toString(),
        status: "pending" as const,
        billed_to: billed_to || "personal",
        org_id: billed_to === "organization" ? targetUser.organization_id : undefined,
        notes,
        delivery_location,
        site: cafeManager.site,
      };

      const order = await storage.createCafeOrderOnBehalf(orderData, orderItems, cafeManager.id);
      
      // Broadcast to user that order was created for them
      broadcast(user_id, {
        type: "order_created_on_behalf",
        order: order,
        created_by: cafeManager.first_name + " " + cafeManager.last_name,
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating cafe order on behalf:", error);
      res.status(500).json({ message: "Failed to create order on behalf" });
    }
  });

  // Get users for cafe manager to select when creating orders on behalf
  app.get("/api/cafe/users", requireAuth, requireRole(["cafe_manager", "calmkaaj_admin"]), async (req, res) => {
    try {
      const user = req.user as schema.User;
      const { site } = req.query;
      
      // For cafe managers, filter by their site. For admins, use the site query parameter
      const filterSite = user.role === 'calmkaaj_admin' ? (site as string) : user.site;
      
      // Get all users that can place orders (individual members and org admins)
      const users = await db.select({
        id: schema.users.id,
        first_name: schema.users.first_name,
        last_name: schema.users.last_name,
        email: schema.users.email,
        role: schema.users.role,
        organization_id: schema.users.organization_id,
        site: schema.users.site,
      })
      .from(schema.users)
      .where(
        and(
          or(
            eq(schema.users.role, "member_individual"),
            eq(schema.users.role, "member_organization"),
            eq(schema.users.role, "member_organization_admin")
          ),
          eq(schema.users.site, filterSite as any)
        )
      )
      .orderBy(schema.users.first_name, schema.users.last_name);
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users for cafe manager:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Meeting room routes
  app.get("/api/rooms/:id/bookings", requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const date = req.query.date as string;
      
      if (!date) {
        return res.status(400).json({ message: "Date parameter required" });
      }
      
      // Get bookings for this room on the specified date
      const startOfDay = new Date(`${date}T00:00:00`);
      const endOfDay = new Date(`${date}T23:59:59`);
      
      const bookings = await db.select()
        .from(schema.meeting_bookings)
        .where(
          sql`${schema.meeting_bookings.room_id} = ${roomId} AND ${schema.meeting_bookings.status} = 'confirmed' AND DATE(${schema.meeting_bookings.start_time}) = ${date}`
        )
        .orderBy(asc(schema.meeting_bookings.start_time));
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching room bookings:", error);
      res.status(500).json({ message: "Failed to fetch room bookings" });
    }
  });

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

  app.post("/api/rooms", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team"]), async (req, res) => {
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

  app.patch("/api/rooms/:id", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team"]), async (req, res) => {
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
      
      // Check if booking is in the past - Use Pakistan time
      const nowPakistan = getPakistanTime();
      if (startTime < nowPakistan) {
        console.log(`Booking rejected - Start time: ${startTime.toISOString()}, Pakistan time now: ${nowPakistan.toISOString()}`);
        return res.status(400).json({ message: "Cannot book a room for a time in the past" });
      }
      
      // Check room availability
      const isAvailable = await storage.checkRoomAvailability(room_id, startTime, endTime);
      if (!isAvailable) {
        return res.status(400).json({ 
          message: "Room is not available for the selected time",
          details: "There is a scheduling conflict with an existing booking. Please select a different time slot."
        });
      }

      // Get room details to calculate credits
      const room = await storage.getMeetingRoomById(room_id);
      if (!room) {
        return res.status(400).json({ message: "Room not found" });
      }

      // Calculate credits needed - STRICT RULE: 1 hour = 1 credit
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const creditsNeeded = Math.round(durationHours * 100) / 100; // Round to 2 decimal places

      // Allow bookings even with insufficient credits (track negative balance for manual billing)
      const availableCredits = (user.credits || 0) - (user.used_credits || 0);
      console.log(`User ${user.id} booking: needs ${creditsNeeded}, has ${availableCredits} available`);

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

  app.patch("/api/bookings/:id/cancel", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get the booking details first
      const booking = await storage.getMeetingBookingById(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user owns this booking
      if (booking.user_id !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }

      // Check if booking is already cancelled
      if (booking.status === 'cancelled') {
        return res.status(400).json({ message: "Booking is already cancelled" });
      }

      // Check 5-minute rule - allow cancellation only up to 5 minutes before start time (Pakistan time)
      const nowPakistan = getPakistanTime();
      const startTime = convertToPakistanTime(new Date(booking.start_time));
      const fiveMinutesBeforeStart = new Date(startTime.getTime() - 5 * 60 * 1000); // 5 minutes before start
      
      console.log(`Cancellation check - Now: ${nowPakistan.toISOString()}, Start: ${startTime.toISOString()}, 5min before: ${fiveMinutesBeforeStart.toISOString()}`);
      
      if (nowPakistan > fiveMinutesBeforeStart) {
        return res.status(400).json({ 
          message: "Cannot cancel booking within 5 minutes of start time" 
        });
      }

      // Cancel the booking
      const cancelledBooking = await storage.updateMeetingBookingStatus(id, 'cancelled');

      // Refund the credits to the user
      const user = await storage.getUserById(userId);
      if (user) {
        const newUsedCredits = Math.max(0, (user.used_credits || 0) - booking.credits_used);
        await storage.updateUser(userId, { used_credits: newUsedCredits });
      }

      res.json({ 
        booking: cancelledBooking, 
        refundedCredits: booking.credits_used,
        message: "Booking cancelled and credits refunded"
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
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

  app.post("/api/announcements", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team"]), async (req, res) => {
    try {
      // Debug logging removed to reduce compute costs
      
      // Handle multi-site data
      const { sites, ...otherData } = req.body;
      
      // Convert sites array to proper format
      let processedSites = sites;
      if (sites && sites.includes('all')) {
        processedSites = ['blue_area', 'i_10']; // Include all available sites
      }
      
      // Store everything as Pakistan time - no UTC conversion
      const announcementData = {
        ...otherData,
        sites: processedSites || [otherData.site || 'blue_area'], // Fallback to single site
        show_until: otherData.show_until ? new Date(otherData.show_until) : null // Store as Pakistan time directly
      };
      
      // DISABLED: Excessive logging - console.log("Processed announcement data:", announcementData);
      
      const result = schema.insertAnnouncementSchema.safeParse(announcementData);
      if (!result.success) {
        console.error("Validation errors:", result.error.issues);
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const announcement = await storage.createAnnouncement(result.data);
      res.status(201).json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  app.patch("/api/announcements/:id", requireAuth, requireRole(["calmkaaj_admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { sites, ...otherUpdates } = req.body;
      
      // Convert sites array to proper format
      let processedSites = sites;
      if (sites && sites.includes('all')) {
        processedSites = ['blue_area', 'i_10']; // Include all available sites
      }
      
      // Store everything as Pakistan time - no UTC conversion
      const updates = {
        ...otherUpdates,
        sites: processedSites || [otherUpdates.site || 'blue_area'], // Fallback to single site
        show_until: otherUpdates.show_until ? new Date(otherUpdates.show_until) : null // Store as Pakistan time directly
      };
      
      const announcement = await storage.updateAnnouncement(id, updates);
      res.json(announcement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  app.delete("/api/announcements/:id", requireAuth, requireRole(["calmkaaj_admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await storage.deleteAnnouncement(id);
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // Organization routes
  app.get("/api/organizations", requireAuth, requireRole(["calmkaaj_admin"]), async (req, res) => {
    try {
      const { site } = req.query;
      const organizations = await storage.getOrganizations(site as string);
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post("/api/organizations", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team"]), async (req, res) => {
    try {
      const { name, email, site, admin_first_name, admin_last_name, admin_email, team_members = [], start_date } = req.body;
      
      // Validate organization data
      const orgData: any = { name, email, site };
      if (start_date) {
        orgData.start_date = new Date(start_date);
      }
      
      const orgResult = schema.insertOrganizationSchema.safeParse(orgData);
      if (!orgResult.success) {
        return res.status(400).json({ message: "Invalid organization data", errors: orgResult.error.issues });
      }

      // Create the organization first
      const organization = await storage.createOrganization(orgResult.data);

      // Create admin user account
      if (admin_first_name && admin_last_name && admin_email) {
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        const adminUser = await storage.createUser({
          email: admin_email,
          password: hashedPassword,
          first_name: admin_first_name,
          last_name: admin_last_name,
          role: 'member_organization_admin',
          organization_id: organization.id,
          site: site,
          credits: 30,
          can_charge_cafe_to_org: true,
          can_charge_room_to_org: true,
          start_date: start_date ? new Date(start_date) : new Date()
        });

        // Try to send welcome email to admin
        try {
          await emailService.sendWelcomeEmail(admin_email, admin_first_name, tempPassword);
        } catch (emailError) {
          console.error("Failed to send admin welcome email:", emailError);
        }
      }

      // Create team member user accounts
      for (const memberEmail of team_members) {
        if (memberEmail && memberEmail.trim()) {
          const tempPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          
          const memberName = memberEmail.split('@')[0]; // Use email prefix as name
          
          await storage.createUser({
            email: memberEmail.trim(),
            password: hashedPassword,
            first_name: memberName,
            last_name: '',
            role: 'member_organization',
            organization_id: organization.id,
            site: site,
            credits: 30,
            can_charge_cafe_to_org: false,
            can_charge_room_to_org: true,
            start_date: start_date ? new Date(start_date) : new Date()
          });

          // Try to send welcome email to team member
          try {
            await emailService.sendWelcomeEmail(memberEmail.trim(), memberName, tempPassword);
          } catch (emailError) {
            console.error("Failed to send team member welcome email:", emailError);
          }
        }
      }

      res.status(201).json({ 
        organization,
        message: `Organization created with admin and ${team_members.length} team members`
      });
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

  app.patch("/api/organizations/employees/:id/permissions", requireAuth, requireRole(["member_organization_admin", "calmkaaj_admin"]), async (req, res) => {
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

  // Community API - Get all members for networking
  app.get("/api/community/members", requireAuth, async (req, res) => {
    try {
      const users = await db
        .select({
          id: schema.users.id,
          first_name: schema.users.first_name,
          last_name: schema.users.last_name,
          email: schema.users.email,
          role: schema.users.role,
          site: schema.users.site,
          bio: schema.users.bio,
          linkedin_url: schema.users.linkedin_url,
          profile_image: schema.users.profile_image,
          job_title: schema.users.job_title,
          company: schema.users.company,
          organization_id: schema.users.organization_id,
          community_visible: schema.users.community_visible,
          email_visible: schema.users.email_visible,
        })
        .from(schema.users)
        .where(and(
          eq(schema.users.is_active, true),
          eq(schema.users.community_visible, true)
        ))
        .orderBy(schema.users.first_name);

      res.json(users);
    } catch (error) {
      console.error("Failed to fetch community members:", error);
      res.status(500).json({ error: "Failed to fetch community members" });
    }
  });

  // Admin-only routes for CalmKaaj administrators
  app.get("/api/admin/users", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team"]), async (req, res) => {
    try {
      const { site } = req.query;
      // Debug logging removed to reduce compute costs
      
      // Build query with optional site filtering
      let query = db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          first_name: schema.users.first_name,
          last_name: schema.users.last_name,
          role: schema.users.role,
          organization_id: schema.users.organization_id,
          site: schema.users.site,
          credits: schema.users.credits,
          used_credits: schema.users.used_credits,
          is_active: schema.users.is_active,
          can_charge_cafe_to_org: schema.users.can_charge_cafe_to_org,
          can_charge_room_to_org: schema.users.can_charge_room_to_org,
          created_at: schema.users.created_at,
          // Community profile fields
          bio: schema.users.bio,
          linkedin_url: schema.users.linkedin_url,
          profile_image: schema.users.profile_image,
          job_title: schema.users.job_title,
          company: schema.users.company,
          organization: {
            id: schema.organizations.id,
            name: schema.organizations.name,
          },
        })
        .from(schema.users)
        .leftJoin(schema.organizations, eq(schema.users.organization_id, schema.organizations.id));

      // Apply site filter if provided
      if (site && site !== 'all') {
        query = query.where(eq(schema.users.site, site as string));
      }

      const users = await query.orderBy(desc(schema.users.created_at));
      // Debug logging removed to reduce compute costs

      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team"]), async (req, res) => {
    try {
      // Debug logging removed to reduce compute costs
      
      const { start_date, ...bodyData } = req.body;
      
      // Handle start_date conversion
      const userData: any = bodyData;
      if (start_date) {
        userData.start_date = new Date(start_date);
      }
      
      const result = schema.insertUserSchema.safeParse(userData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      // Generate a temporary password if not provided
      const tempPassword = result.data.password || Math.random().toString(36).slice(-8);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const finalUserData = {
        ...result.data,
        password: hashedPassword,
      };

      const user = await storage.createUser(finalUserData);
      
      // Send welcome email with credentials (optional - only if email service is configured)
      if (process.env.EMAIL_USER && (process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD)) {
        try {
          const { emailService } = await import("./email-service");
          await emailService.sendWelcomeEmail(user.email, user.first_name, tempPassword);
          // DISABLED: Excessive logging - console.log(`Welcome email sent to ${user.email}`);
        } catch (emailError) {
          console.warn("Failed to send welcome email:", emailError);
          // Don't fail user creation if email fails
        }
      }
      
      res.status(201).json({ 
        ...user, 
        tempPassword: tempPassword, // Return temp password for admin to share manually if needed
        emailSent: !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD)
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Regular user can update their own profile
  app.patch("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // Check if user is updating their own profile
      if (req.user.id !== userId) {
        return res.status(403).json({ message: "Not authorized to update this profile" });
      }
      
      // Allow users to update their own profile information
      const allowedFields = ['first_name', 'last_name', 'phone', 'bio', 'linkedin_url', 'profile_image', 'job_title', 'company', 'community_visible', 'email_visible'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});
      
      const user = await storage.updateUser(userId, filteredUpdates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Complete onboarding for the authenticated user
  app.post("/api/user/complete-onboarding", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Update user's onboarding status
      const updatedUser = await storage.updateUser(userId, { 
        onboarding_completed: true 
      });
      
      res.json({ 
        message: "Onboarding completed successfully",
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });



  app.patch("/api/admin/users/:id", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      const user = await storage.updateUser(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.patch("/api/admin/organizations/:id", requireAuth, requireRole(["calmkaaj_admin"]), async (req, res) => {
    try {
      const orgId = req.params.id;
      const updates = req.body;
      
      const organization = await storage.updateOrganization(orgId, updates);
      res.json(organization);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.delete("/api/admin/organizations/:id", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team"]), async (req, res) => {
    try {
      const orgId = req.params.id;
      
      await storage.deleteOrganization(orgId);
      res.json({ message: "Organization deleted successfully" });
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });

  app.get("/api/admin/bookings", requireAuth, requireRole(["calmkaaj_admin", "calmkaaj_team"]), async (req, res) => {
    try {
      const { site } = req.query;
      // Get all bookings for admin dashboard with optional site filtering
      const bookings = await storage.getMeetingBookings(undefined, undefined, site as string);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/admin/stats", requireAuth, requireRole(["calmkaaj_admin"]), async (req, res) => {
    try {
      // Calculate comprehensive system statistics
      const users = await db.select().from(schema.users);
      const orders = await db.select().from(schema.cafe_orders);
      const bookings = await db.select().from(schema.meeting_bookings);
      const organizations = await db.select().from(schema.organizations);

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const monthlyOrders = orders.filter(order => new Date(order.created_at) >= startOfMonth);
      const monthlyBookings = bookings.filter(booking => new Date(booking.created_at) >= startOfMonth);

      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
      const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.is_active).length,
        totalRevenue,
        monthlyRevenue,
        totalOrders: orders.length,
        monthlyOrders: monthlyOrders.length,
        totalBookings: bookings.length,
        monthlyBookings: monthlyBookings.length,
        organizationCount: organizations.length,
        roomUtilization: 0 // TODO: Calculate based on booking hours vs available hours
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Organization invoice generation
  app.post("/api/organizations/:id/invoice", requireAuth, requireRole(["member_organization_admin", "calmkaaj_admin"]), async (req, res) => {
    try {
      const user = req.user as schema.User;
      const orgId = req.params.id;
      const { month, year } = req.body;
      
      // Check if user has access to this organization
      if (user.role !== "calmkaaj_admin" && user.organization_id !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get organization data
      const organization = await storage.getOrganizationById(orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Get orders and bookings for the specified month/year
      const orders = await storage.getCafeOrders(undefined, orgId);
      const bookings = await storage.getMeetingBookings(undefined, orgId);

      // Filter by month/year
      const filteredOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === month && orderDate.getFullYear() === year;
      });

      const filteredBookings = bookings.filter((booking: any) => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate.getMonth() === month && bookingDate.getFullYear() === year;
      });

      // Generate PDF invoice (simplified for now)
      const invoiceData = {
        organization: organization.name,
        month: month + 1,
        year,
        orders: filteredOrders,
        bookings: filteredBookings,
        totalAmount: filteredOrders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount), 0),
        totalCredits: filteredBookings.reduce((sum: number, booking: any) => sum + booking.credits_used, 0),
      };

      res.json(invoiceData);
    } catch (error) {
      console.error("Error generating invoice:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  // Get organization details
  app.get("/api/organizations/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as schema.User;
      const orgId = req.params.id;
      
      // Check if user has access to this organization
      if (user.role !== "calmkaaj_admin" && user.organization_id !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const organization = await storage.getOrganizationById(orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Admin impersonation endpoint
  app.post("/api/admin/impersonate/:userId", requireAuth, requireRole(["calmkaaj_admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userToImpersonate = await storage.getUserById(userId);
      
      if (!userToImpersonate) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log the impersonation for audit purposes
      // DISABLED: Excessive logging - console.log(`Admin ${(req.user as any).id} (${(req.user as any).email}) is impersonating user ${userId} (${userToImpersonate.email})`);

      // Store original admin info and update session
      (req.session as any).originalAdminId = (req.user as any).id;
      (req.session as any).originalUserObject = req.user;
      (req.session as any).userId = userId;
      (req.session as any).impersonating = true;
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }
        res.json({ 
          message: "Impersonation successful",
          impersonatedUser: {
            id: userToImpersonate.id,
            email: userToImpersonate.email,
            first_name: userToImpersonate.first_name,
            last_name: userToImpersonate.last_name,
            role: userToImpersonate.role
          }
        });
      });
    } catch (error) {
      console.error("Error during impersonation:", error);
      res.status(500).json({ message: "Failed to impersonate user" });
    }
  });

  // Check impersonation status endpoint
  app.get("/api/admin/impersonation-status", requireAuth, async (req, res) => {
    try {
      const isImpersonating = !!(req.session as any).impersonating;
      const originalAdminId = (req.session as any).originalAdminId;
      
      if (isImpersonating && originalAdminId) {
        const originalAdmin = await storage.getUserById(originalAdminId);
        res.json({
          isImpersonating: true,
          originalAdmin: originalAdmin,
          impersonatedUser: req.user
        });
      } else {
        res.json({ isImpersonating: false });
      }
    } catch (error) {
      console.error("Error checking impersonation status:", error);
      res.status(500).json({ message: "Failed to check impersonation status" });
    }
  });

  // Revert impersonation endpoint
  app.post("/api/admin/revert-impersonation", requireAuth, async (req, res) => {
    try {
      const originalAdminId = (req.session as any).originalAdminId;
      
      if (!originalAdminId) {
        return res.status(400).json({ message: "No active impersonation session" });
      }

      // Revert back to original admin
      (req.session as any).userId = originalAdminId;
      delete (req.session as any).originalAdminId;
      delete (req.session as any).originalUserObject;
      delete (req.session as any).impersonating;
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }
        res.json({ message: "Impersonation reverted successfully" });
      });
    } catch (error) {
      console.error("Error reverting impersonation:", error);
      res.status(500).json({ message: "Failed to revert impersonation" });
    }
  });



  app.get("/api/bookings/pdf", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;
      
      // Get bookings for the user only - remove invalid parameters
      const bookings = await storage.getMeetingBookings(userId);
      
      let filteredBookings = bookings;
      if (startDate || endDate) {
        filteredBookings = bookings.filter((booking: any) => {
          const bookingDate = new Date(booking.created_at);
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;
          
          if (start && bookingDate < start) return false;
          if (end && bookingDate > end) return false;
          return true;
        });
      }
      
      // Generate simple PDF content
      const pdfContent = generateRoomPDFContent(filteredBookings, req.user as any, startDate, endDate);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="room-bookings-${startDate || 'all'}-${endDate || 'all'}.pdf"`);
      res.send(Buffer.from(pdfContent));
    } catch (error) {
      console.error("Error generating room PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // DISABLED: Metrics collection was consuming excessive compute units
  // Only enable for debugging purposes, not in production
  // setInterval(() => {
  //   METRICS.memory = process.memoryUsage().rss / 1024 / 1024;
  //   METRICS.cpu = process.cpuUsage().system / 1000;
  //   METRICS.pushSubs = pushSubscriptions.size;
  //   
  //   const metricsData = {
  //     timestamp: new Date().toISOString(),
  //     wsConnections: METRICS.wsConnections,
  //     pushSubs: METRICS.pushSubs,
  //     memory: Math.round(METRICS.memory * 100) / 100,
  //     cpu: Math.round(METRICS.cpu * 100) / 100,
  //     apiCalls: METRICS.apiCalls,
  //     authFailures: METRICS.authFailures,
  //     reconnects: METRICS.reconnects,
  //     uptime: Math.round((Date.now() - METRICS.startTime.getTime()) / 1000)
  //   };
  //   
  //   // Log to file for analysis
  //   fs.appendFileSync(path.join(__dirname, '..', 'verification', 'metrics.log'), 
  //     JSON.stringify(metricsData) + '\n');
  //   
  //   // Log to console in production
  //   console.log('📊 Metrics:', JSON.stringify(metricsData));
  //   
  //   // Alert if thresholds exceeded
  //   if (METRICS.wsConnections > 500) {
  //     console.error('🚨 ALERT: WebSocket connections exceed 500!', METRICS.wsConnections);
  //   }
  //   if (METRICS.memory > 1000) {
  //     console.error('🚨 ALERT: Memory usage exceeds 1GB!', METRICS.memory, 'MB');
  //   }
  // }, 30000);

  return httpServer;
}

// Helper functions for PDF generation
function generateCafePDFContent(orders: any[], user: any, startDate?: string, endDate?: string): string {
  const currentDate = new Date().toLocaleDateString('en-GB');
  const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
  
  // Enhanced PDF generation with better formatting and table structure
  const header = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length 1000 >>
stream
BT
/F2 18 Tf
50 750 Td
(CalmKaaj) Tj
0 -30 Td
/F1 14 Tf
(Cafe Orders Report) Tj
0 -40 Td
/F1 10 Tf
(Generated on: ${currentDate}) Tj
0 -15 Td
(Customer: ${user.first_name} ${user.last_name}) Tj
0 -15 Td
(Email: ${user.email}) Tj
0 -15 Td
(Date Range: ${startDate || 'All Time'} - ${endDate || 'All Time'}) Tj
0 -30 Td
(Summary:) Tj
0 -15 Td
(Total Orders: ${orders.length}) Tj
0 -15 Td
(Total Amount: Rs. ${totalAmount.toFixed(2)}) Tj
0 -30 Td
(Order Details:) Tj
0 -20 Td
(Order ID    Date        Status      Amount) Tj
0 -15 Td
(________________________________________________) Tj
`;

  let orderDetails = '';
  
  orders.forEach((order, index) => {
    const orderDate = new Date(order.created_at).toLocaleDateString('en-GB');
    const paddedId = order.id.toString().padEnd(8, ' ');
    const paddedDate = orderDate.padEnd(12, ' ');
    const paddedStatus = order.status.padEnd(10, ' ');
    const amount = `Rs. ${parseFloat(order.total_amount).toFixed(2)}`;
    
    orderDetails += `0 -15 Td
(${paddedId} ${paddedDate} ${paddedStatus} ${amount}) Tj
`;
  });

  const footer = `${orderDetails}
0 -20 Td
(________________________________________________) Tj
0 -15 Td
(Total: Rs. ${totalAmount.toFixed(2)}) Tj
0 -30 Td
/F1 8 Tf
(This is a computer generated document from CalmKaaj) Tj
0 -12 Td
(Coworking Space Management System) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000245 00000 n 
0000001400 00000 n 
0000001460 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
1525
%%EOF`;

  return header + footer;
}

function generateRoomPDFContent(bookings: any[], user: any, startDate?: string, endDate?: string): string {
  const currentDate = new Date().toLocaleDateString('en-GB');
  const totalCredits = bookings.reduce((sum, booking) => sum + booking.credits_used, 0);
  
  // Enhanced PDF generation with better formatting and table structure
  const header = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length 1000 >>
stream
BT
/F2 18 Tf
50 750 Td
(CalmKaaj) Tj
0 -30 Td
/F1 14 Tf
(Meeting Room Bookings Report) Tj
0 -40 Td
/F1 10 Tf
(Generated on: ${currentDate}) Tj
0 -15 Td
(Customer: ${user.first_name} ${user.last_name}) Tj
0 -15 Td
(Email: ${user.email}) Tj
0 -15 Td
(Date Range: ${startDate || 'All Time'} - ${endDate || 'All Time'}) Tj
0 -30 Td
(Summary:) Tj
0 -15 Td
(Total Bookings: ${bookings.length}) Tj
0 -15 Td
(Total Credits Used: ${totalCredits}) Tj
0 -30 Td
(Booking Details:) Tj
0 -20 Td
(Room Name        Date        Time        Credits) Tj
0 -15 Td
(________________________________________________) Tj
`;

  let bookingDetails = '';
  
  bookings.forEach((booking, index) => {
    const bookingDate = new Date(booking.start_time).toLocaleDateString('en-GB');
    const bookingTime = new Date(booking.start_time).toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const paddedRoom = (booking.room?.name || 'Unknown').padEnd(15, ' ');
    const paddedDate = bookingDate.padEnd(12, ' ');
    const paddedTime = bookingTime.padEnd(10, ' ');
    const credits = `${booking.credits_used} credits`;
    
    bookingDetails += `0 -15 Td
(${paddedRoom} ${paddedDate} ${paddedTime} ${credits}) Tj
`;
  });

  const footer = `${bookingDetails}
0 -20 Td
(________________________________________________) Tj
0 -15 Td
(Total Credits Used: ${totalCredits}) Tj
0 -30 Td
/F1 8 Tf
(This is a computer generated document from CalmKaaj) Tj
0 -12 Td
(Coworking Space Management System) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000245 00000 n 
0000001400 00000 n 
0000001460 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
1525
%%EOF`;

  return header + footer;
}
