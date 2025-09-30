import { pgTable, text, serial, integer, boolean, timestamp, uuid, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["member_individual", "member_organization", "member_organization_admin", "cafe_manager", "calmkaaj_team", "calmkaaj_admin"]);
export const billingTypeEnum = pgEnum("billing_type", ["personal", "organization"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "accepted", "preparing", "ready", "delivered", "cancelled", "deleted"]);
export const bookingStatusEnum = pgEnum("booking_status", ["confirmed", "cancelled", "completed"]);
export const siteEnum = pgEnum("site", ["blue_area", "i_10", "both"]);

// Organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  site: siteEnum("site").notNull().default("blue_area"),
  office_type: text("office_type").default("private_office"),
  office_number: text("office_number"),
  monthly_credits: integer("monthly_credits").default(30),
  monthly_fee: integer("monthly_fee").default(0),
  description: text("description"),
  start_date: timestamp("start_date").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull(),
  organization_id: uuid("organization_id").references(() => organizations.id),
  site: siteEnum("site").notNull().default("blue_area"),
  credits: integer("credits").default(30),
  used_credits: decimal("used_credits", { precision: 10, scale: 2 }).default("0"),
  is_active: boolean("is_active").default(true),
  can_charge_cafe_to_org: boolean("can_charge_cafe_to_org").default(false),
  can_charge_room_to_org: boolean("can_charge_room_to_org").default(true),
  start_date: timestamp("start_date").defaultNow(),
  bio: text("bio"),
  linkedin_url: text("linkedin_url"),
  profile_image: text("profile_image"),
  job_title: text("job_title"),
  company: text("company"),
  community_visible: boolean("community_visible").default(true),
  email_visible: boolean("email_visible").default(false),
  onboarding_completed: boolean("onboarding_completed").default(false),
  rfid_number: text("rfid_number"),
  created_at: timestamp("created_at").defaultNow(),
});

// Menu Categories
export const menu_categories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  display_order: integer("display_order").default(0),
  is_active: boolean("is_active").default(true),
  site: siteEnum("site").notNull().default("blue_area"),
});

// Menu Items
export const menu_items = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category_id: integer("category_id").references(() => menu_categories.id),
  image_url: text("image_url"),
  is_available: boolean("is_available").default(true),
  is_daily_special: boolean("is_daily_special").default(false),
  site: siteEnum("site").notNull().default("blue_area"),
  created_at: timestamp("created_at").defaultNow(),
});

// Cafe Orders
export const cafe_orders = pgTable("cafe_orders", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("pending"),
  billed_to: billingTypeEnum("billed_to").default("personal"),
  org_id: uuid("org_id").references(() => organizations.id),
  handled_by: integer("handled_by").references(() => users.id),
  created_by: integer("created_by").references(() => users.id), // For cafe manager created orders
  payment_status: text("payment_status").default("unpaid"), // paid/unpaid
  payment_updated_by: integer("payment_updated_by").references(() => users.id),
  payment_updated_at: timestamp("payment_updated_at"),
  notes: text("notes"),
  delivery_location: text("delivery_location"),
  site: siteEnum("site").notNull().default("blue_area"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Cafe Order Items
export const cafe_order_items = pgTable("cafe_order_items", {
  id: serial("id").primaryKey(),
  order_id: integer("order_id").references(() => cafe_orders.id).notNull(),
  menu_item_id: integer("menu_item_id").references(() => menu_items.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// Meeting Rooms
export const meeting_rooms = pgTable("meeting_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  capacity: integer("capacity").notNull(),
  credit_cost_per_hour: integer("credit_cost_per_hour").notNull(),
  amenities: text("amenities").array(),
  image_url: text("image_url"),
  is_available: boolean("is_available").default(true),
  site: siteEnum("site").notNull().default("blue_area"),
  created_at: timestamp("created_at").defaultNow(),
});

// Meeting Room Bookings
export const meeting_bookings = pgTable("meeting_bookings", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  room_id: integer("room_id").references(() => meeting_rooms.id).notNull(),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  credits_used: decimal("credits_used", { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum("status").default("confirmed"),
  billed_to: billingTypeEnum("billed_to").default("personal"),
  org_id: uuid("org_id").references(() => organizations.id),
  notes: text("notes"),
  site: siteEnum("site").notNull().default("blue_area"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  image_url: text("image_url"),
  show_until: timestamp("show_until"),
  is_active: boolean("is_active").default(true),
  site: siteEnum("site").notNull().default("blue_area"), // Keep for backwards compatibility
  sites: text("sites").array().default(["blue_area"]), // New array field for multiple sites
  created_at: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, created_at: true });

// Create update schemas (for partial updates)
export const updateOrganizationSchema = createInsertSchema(organizations)
  .omit({ id: true, created_at: true })
  .partial(); // Make all fields optional for updates
export const insertUserSchema = createInsertSchema(users).omit({ id: true, created_at: true });

// Create update schema for users (for partial updates)
export const updateUserSchema = createInsertSchema(users)
  .omit({ id: true, created_at: true })
  .partial(); // Make all fields optional for updates
export const insertMenuCategorySchema = createInsertSchema(menu_categories).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menu_items).omit({ id: true, created_at: true });
export const insertCafeOrderSchema = createInsertSchema(cafe_orders).omit({ id: true, created_at: true, updated_at: true });
export const insertCafeOrderItemSchema = createInsertSchema(cafe_order_items).omit({ id: true });
export const insertMeetingRoomSchema = createInsertSchema(meeting_rooms).omit({ id: true, created_at: true });
export const insertMeetingBookingSchema = createInsertSchema(meeting_bookings).omit({ id: true, created_at: true, updated_at: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, created_at: true }).extend({
  sites: z.array(z.string()).optional(), // Add sites field as optional array of strings
  show_until: z.string().optional().nullable().or(z.date().optional().nullable()) // Accept string or date format
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type MenuCategory = typeof menu_categories.$inferSelect;
export type MenuItem = typeof menu_items.$inferSelect;
export type CafeOrder = typeof cafe_orders.$inferSelect;
export type CafeOrderItem = typeof cafe_order_items.$inferSelect;
export type MeetingRoom = typeof meeting_rooms.$inferSelect;
export type MeetingBooking = typeof meeting_bookings.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type InsertCafeOrder = z.infer<typeof insertCafeOrderSchema>;
export type InsertCafeOrderItem = z.infer<typeof insertCafeOrderItemSchema>;
export type InsertMeetingRoom = z.infer<typeof insertMeetingRoomSchema>;
export type InsertMeetingBooking = z.infer<typeof insertMeetingBookingSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginSchema>;
