// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, desc, asc, gte, lte, sql, or, isNull, gt, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";

// Get DATABASE_URL with proper error handling
const getDatabaseUrl = () => {
  console.log("🔍 DEBUGGING DATABASE CONNECTION:");
  console.log("📦 NODE_ENV:", process.env.NODE_ENV);
  console.log("🌍 All environment variables containing 'DATA':", 
    Object.keys(process.env).filter(k => k.toUpperCase().includes('DATA')));
  console.log("🌍 All environment variables containing 'POSTGRES':", 
    Object.keys(process.env).filter(k => k.toUpperCase().includes('POSTGRES')));
  console.log("🌍 All environment variables containing 'DB':", 
    Object.keys(process.env).filter(k => k.toUpperCase().includes('DB')));
    
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error("❌ DATABASE_URL environment variable is not set!");
    console.error("🔧 First 10 environment variables:", Object.keys(process.env).slice(0, 10));
    
    // Provide helpful error message
    throw new Error(`
❌ DATABASE_URL environment variable is required but not set.

📋 To fix this in Railway:
1. Go to your Railway project dashboard
2. Click on your "co-working-space" service  
3. Go to Variables tab
4. Add: DATABASE_URL = (your PostgreSQL connection string)
5. Wait for automatic redeployment OR click "Deploy"

🔗 The URL should look like:
postgresql://postgres:password@host:port/database

💡 If you have a Postgres service in Railway, copy its DATABASE_URL variable.
`);
  }
  
  console.log("✅ DATABASE_URL found! Length:", url.length);
  console.log("🔗 DATABASE_URL starts with:", url.substring(0, 20) + "...");
  
  // Validate URL format
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    console.error("⚠️ DATABASE_URL doesn't start with postgresql:// or postgres://");
    console.error("🔧 Current value starts with:", url.substring(0, 20));
  }
  
  return url;
};

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 1,
});
export const db = drizzle(pool, { schema });

export interface IStorage {
  // Users
  getUserById(id: number): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  getUsersByRole(role: string): Promise<schema.User[]>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  updateUser(id: number, updates: Partial<schema.User>): Promise<schema.User>;
  deleteUser(id: number): Promise<void>;
  
  // Password Reset
  setPasswordResetToken(userId: number, token: string, expires: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<schema.User | undefined>;
  clearPasswordResetToken(userId: number): Promise<void>;
  
  // Organizations
  getOrganizations(site?: string): Promise<schema.Organization[]>;
  getOrganizationById(id: string): Promise<schema.Organization | undefined>;
  createOrganization(org: schema.InsertOrganization): Promise<schema.Organization>;
  updateOrganization(id: string, updates: Partial<schema.Organization>): Promise<schema.Organization>;
  deleteOrganization(id: string): Promise<void>;
  
  // Menu
  getMenuCategories(site?: string): Promise<schema.MenuCategory[]>;
  getMenuItems(site?: string): Promise<schema.MenuItem[]>;
  getAllMenuItems(site?: string): Promise<schema.MenuItem[]>;
  getMenuItemById(id: number): Promise<schema.MenuItem | undefined>;
  createMenuItem(item: schema.InsertMenuItem): Promise<schema.MenuItem>;
  updateMenuItem(id: number, updates: Partial<schema.MenuItem>): Promise<schema.MenuItem>;
  
  // Cafe Orders
  createCafeOrder(order: schema.InsertCafeOrder): Promise<schema.CafeOrder>;
  createCafeOrderItem(item: schema.InsertCafeOrderItem): Promise<schema.CafeOrderItem>;
  getCafeOrders(userId?: number, orgId?: string, site?: string): Promise<any[]>;
  getCafeOrderById(id: number): Promise<any>;
  getCafeOrdersSince(since: Date, site?: string, userId?: number): Promise<any[]>;
  updateCafeOrderStatus(id: number, status: string, handledBy?: number): Promise<schema.CafeOrder>;
  updateCafeOrderPaymentStatus(id: number, paymentStatus: string, updatedBy: number): Promise<schema.CafeOrder>;
  createCafeOrderOnBehalf(order: schema.InsertCafeOrder, items: Partial<schema.InsertCafeOrderItem>[], createdBy: number): Promise<any>;
  
  // Meeting Rooms
  getMeetingRooms(site?: string): Promise<schema.MeetingRoom[]>;
  getMeetingRoomById(id: number): Promise<schema.MeetingRoom | undefined>;
  createMeetingRoom(room: schema.InsertMeetingRoom): Promise<schema.MeetingRoom>;
  updateMeetingRoom(id: number, updates: Partial<schema.MeetingRoom>): Promise<schema.MeetingRoom>;
  
  // Meeting Bookings
  createMeetingBooking(booking: schema.InsertMeetingBooking): Promise<schema.MeetingBooking>;
  getMeetingBookings(userId?: number, orgId?: string, site?: string): Promise<any[]>;
  getMeetingBookingById(id: number): Promise<any>;
  updateMeetingBookingStatus(id: number, status: string, cancelledBy?: number): Promise<schema.MeetingBooking>;
  checkRoomAvailability(roomId: number, startTime: Date, endTime: Date): Promise<boolean>;
  
  // Announcements
  getAnnouncements(site?: string): Promise<schema.Announcement[]>;
  createAnnouncement(announcement: schema.InsertAnnouncement): Promise<schema.Announcement>;
  updateAnnouncement(id: number, updates: Partial<schema.Announcement>): Promise<schema.Announcement>;
  deleteAnnouncement(id: number): Promise<void>;
  
  // Organization Management
  getOrganizationEmployees(orgId: string): Promise<schema.User[]>;
  updateEmployeePermissions(userId: number, permissions: { can_charge_cafe_to_org?: boolean; can_charge_room_to_org?: boolean }): Promise<schema.User>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: number): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async getUsersByRole(role: string): Promise<schema.User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.role, role as any));
  }

  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const [newUser] = await db.insert(schema.users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<schema.User>): Promise<schema.User> {
    const [updatedUser] = await db.update(schema.users).set(updates).where(eq(schema.users.id, id)).returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    // Delete related records first to avoid foreign key constraint errors
    
    // Delete user's cafe orders and their items
    const userOrders = await db.select({ id: schema.cafe_orders.id })
      .from(schema.cafe_orders)
      .where(eq(schema.cafe_orders.user_id, id));
    
    for (const order of userOrders) {
      await db.delete(schema.cafe_order_items)
        .where(eq(schema.cafe_order_items.order_id, order.id));
    }
    
    // Delete cafe orders where user is involved
    await db.delete(schema.cafe_orders).where(eq(schema.cafe_orders.user_id, id));
    
    // Update orders where user is referenced in other fields (set to null)
    await db.update(schema.cafe_orders)
      .set({ 
        created_by: null, 
        handled_by: null, 
        payment_updated_by: null 
      })
      .where(or(
        eq(schema.cafe_orders.created_by, id),
        eq(schema.cafe_orders.handled_by, id),
        eq(schema.cafe_orders.payment_updated_by, id)
      ));
    
    // Delete user's meeting bookings
    await db.delete(schema.meeting_bookings).where(eq(schema.meeting_bookings.user_id, id));
    
    // Finally, delete the user
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }

  // Password Reset Methods
  async setPasswordResetToken(userId: number, token: string, expires: Date): Promise<void> {
    await db.update(schema.users)
      .set({ 
        password_reset_token: token,
        password_reset_expires: expires
      })
      .where(eq(schema.users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<schema.User | undefined> {
    const [user] = await db.select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.password_reset_token, token),
          sql`${schema.users.password_reset_expires} > NOW()`
        )
      );
    return user;
  }

  async clearPasswordResetToken(userId: number): Promise<void> {
    await db.update(schema.users)
      .set({ 
        password_reset_token: null,
        password_reset_expires: null
      })
      .where(eq(schema.users.id, userId));
  }

  async getOrganizations(site?: string): Promise<schema.Organization[]> {
    try {
      console.log("🗄️ Storage: getOrganizations called with site:", site);
      
      let organizations;
      if (site && site !== 'all') {
        console.log("🔍 Storage: Querying organizations for specific site:", site);
        organizations = await db.select().from(schema.organizations)
          .where(eq(schema.organizations.site, site as any))
          .orderBy(asc(schema.organizations.name));
      } else {
        console.log("🔍 Storage: Querying all organizations");
        organizations = await db.select().from(schema.organizations)
          .orderBy(asc(schema.organizations.name));
      }
      
      console.log("✅ Storage: Successfully fetched", organizations.length, "organizations");
      return organizations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Storage: Database error in getOrganizations:", errorMessage);
      console.error("❌ Storage: Full error:", error);
      throw error;
    }
  }

  async getOrganizationById(id: string): Promise<schema.Organization | undefined> {
    const [org] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, id));
    return org;
  }

  async getOrganizationTeamCount(orgId: string): Promise<number> {
    try {
      console.log("🗄️ Storage: getOrganizationTeamCount called for orgId:", orgId);
      
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(schema.users)
        .where(eq(schema.users.organization_id, orgId));
      
      const count = result[0]?.count || 0;
      console.log("✅ Storage: Team count for org", orgId, ":", count);
      return count;
    } catch (error) {
      console.error("❌ Storage: Error getting team count:", error);
      return 0;
    }
  }

  async createOrganization(org: schema.InsertOrganization): Promise<schema.Organization> {
    try {
      console.log("🗄️ Storage: createOrganization called with data:", org);
      
      const [newOrg] = await db.insert(schema.organizations).values(org).returning();
      
      console.log("✅ Storage: Organization created successfully:", newOrg);
      return newOrg;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Storage: Error creating organization:", errorMessage);
      console.error("❌ Storage: Full error:", error);
      throw error;
    }
  }

  async updateOrganization(id: string, updates: schema.UpdateOrganization): Promise<schema.Organization> {
    try {
      console.log("🗄️ Storage: updateOrganization called with id:", id);
      console.log("🗄️ Storage: updates:", updates);
      
      // Check if organization exists first
      const existingOrg = await this.getOrganizationById(id);
      if (!existingOrg) {
        throw new Error(`Organization with id ${id} not found`);
      }
      
      console.log("🗄️ Storage: Organization exists, updating...");
      
      const [updatedOrg] = await db.update(schema.organizations)
        .set(updates)
        .where(eq(schema.organizations.id, id))
        .returning();
      
      console.log("✅ Storage: Organization updated successfully:", updatedOrg);
      return updatedOrg;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Storage: Error updating organization:", errorMessage);
      console.error("❌ Storage: Full error:", error);
      throw error;
    }
  }

  async deleteOrganization(id: string): Promise<void> {
    // Get all users associated with this organization
    const orgUsers = await db.select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.organization_id, id));
    
    // Delete all related records for each user
    for (const user of orgUsers) {
      // Delete user's cafe orders and their items
      const userOrders = await db.select({ id: schema.cafe_orders.id })
        .from(schema.cafe_orders)
        .where(eq(schema.cafe_orders.user_id, user.id));
      
      for (const order of userOrders) {
        await db.delete(schema.cafe_order_items)
          .where(eq(schema.cafe_order_items.order_id, order.id));
      }
      
      await db.delete(schema.cafe_orders).where(eq(schema.cafe_orders.user_id, user.id));
      
      // Delete user's meeting bookings
      await db.delete(schema.meeting_bookings).where(eq(schema.meeting_bookings.user_id, user.id));
    }
    
    // Delete all users associated with this organization
    await db.delete(schema.users).where(eq(schema.users.organization_id, id));
    
    // Finally, delete the organization
    await db.delete(schema.organizations).where(eq(schema.organizations.id, id));
  }

  async getMenuCategories(site?: string): Promise<schema.MenuCategory[]> {
    if (site && site !== 'all') {
      return await db.select().from(schema.menu_categories)
        .where(and(eq(schema.menu_categories.is_active, true), eq(schema.menu_categories.site, site as any)))
        .orderBy(asc(schema.menu_categories.display_order));
    } else {
      return await db.select().from(schema.menu_categories)
        .where(eq(schema.menu_categories.is_active, true))
        .orderBy(asc(schema.menu_categories.display_order));
    }
  }

  async getMenuItems(site?: string): Promise<schema.MenuItem[]> {
    if (site) {
      return await db.select().from(schema.menu_items)
        .where(and(eq(schema.menu_items.is_available, true), eq(schema.menu_items.site, site as any)))
        .orderBy(asc(schema.menu_items.name));
    } else {
      return await db.select().from(schema.menu_items)
        .where(eq(schema.menu_items.is_available, true))
        .orderBy(asc(schema.menu_items.name));
    }
  }

  async getAllMenuItems(site?: string): Promise<schema.MenuItem[]> {
    if (site) {
      // Include items for specific site AND items marked as "both"
      return await db.select().from(schema.menu_items)
        .where(or(
          eq(schema.menu_items.site, site as any),
          eq(schema.menu_items.site, "both" as any)
        ))
        .orderBy(asc(schema.menu_items.name));
    } else {
      return await db.select().from(schema.menu_items)
        .orderBy(asc(schema.menu_items.name));
    }
  }

  async getMenuItemById(id: number): Promise<schema.MenuItem | undefined> {
    const [item] = await db.select().from(schema.menu_items).where(eq(schema.menu_items.id, id));
    return item;
  }

  async createMenuItem(item: schema.InsertMenuItem): Promise<schema.MenuItem> {
    const [newItem] = await db.insert(schema.menu_items).values(item).returning();
    return newItem;
  }

  async updateMenuItem(id: number, updates: Partial<schema.MenuItem>): Promise<schema.MenuItem> {
    const [updatedItem] = await db.update(schema.menu_items).set(updates).where(eq(schema.menu_items.id, id)).returning();
    return updatedItem;
  }

  async deleteMenuItem(id: number): Promise<void> {
    await db.delete(schema.menu_items).where(eq(schema.menu_items.id, id));
  }

  async deleteCafeOrderItemsByMenuId(menuItemId: number): Promise<void> {
    await db.delete(schema.cafe_order_items).where(eq(schema.cafe_order_items.menu_item_id, menuItemId));
  }

  async createCafeOrder(order: schema.InsertCafeOrder): Promise<schema.CafeOrder> {
    const [newOrder] = await db.insert(schema.cafe_orders).values(order).returning();
    console.log(`Order #${newOrder.id} created for user ${order.user_id}`);
    return newOrder;
  }

  async createCafeOrderItem(item: schema.InsertCafeOrderItem): Promise<schema.CafeOrderItem> {
    const [newItem] = await db.insert(schema.cafe_order_items).values(item).returning();
    return newItem;
  }

  async getCafeOrders(userId?: number, orgId?: string, site?: string): Promise<any[]> {
    const baseQuery = db.select({
      id: schema.cafe_orders.id,
      user_id: schema.cafe_orders.user_id,
      total_amount: schema.cafe_orders.total_amount,
      status: schema.cafe_orders.status,
      billed_to: schema.cafe_orders.billed_to,
      org_id: schema.cafe_orders.org_id,
      handled_by: schema.cafe_orders.handled_by,
      created_by: schema.cafe_orders.created_by,
      payment_status: schema.cafe_orders.payment_status,
      payment_updated_by: schema.cafe_orders.payment_updated_by,
      payment_updated_at: schema.cafe_orders.payment_updated_at,
      notes: schema.cafe_orders.notes,
      delivery_location: schema.cafe_orders.delivery_location,
      site: schema.cafe_orders.site,
      created_at: schema.cafe_orders.created_at,
      updated_at: schema.cafe_orders.updated_at,
      user: {
        id: schema.users.id,
        first_name: schema.users.first_name,
        last_name: schema.users.last_name,
        email: schema.users.email,
      },
      organization: {
        id: schema.organizations.id,
        name: schema.organizations.name,
      }
    })
    .from(schema.cafe_orders)
    .leftJoin(schema.users, eq(schema.cafe_orders.user_id, schema.users.id))
    .leftJoin(schema.organizations, eq(schema.cafe_orders.org_id, schema.organizations.id));

    let orders;
    if (userId) {
      orders = await baseQuery.where(eq(schema.cafe_orders.user_id, userId))
        .orderBy(desc(schema.cafe_orders.created_at));
    } else if (orgId) {
      orders = await baseQuery.where(eq(schema.cafe_orders.org_id, orgId))
        .orderBy(desc(schema.cafe_orders.created_at));
    } else if (site && site !== 'all') {
      orders = await baseQuery.where(eq(schema.cafe_orders.site, site as any))
        .orderBy(desc(schema.cafe_orders.created_at));
    } else {
      orders = await baseQuery.orderBy(desc(schema.cafe_orders.created_at));
    }

    // Get order items for all orders in a single query to avoid connection pooling issues
    const orderIds = orders.map(o => o.id);
    const allItems = orderIds.length > 0 ? await db
      .select({
        order_id: schema.cafe_order_items.order_id,
        id: schema.cafe_order_items.id,
        quantity: schema.cafe_order_items.quantity,
        price: schema.cafe_order_items.price,
        menu_item: {
          id: schema.menu_items.id,
          name: schema.menu_items.name,
          description: schema.menu_items.description,
        },
      })
      .from(schema.cafe_order_items)
      .leftJoin(schema.menu_items, eq(schema.cafe_order_items.menu_item_id, schema.menu_items.id))
      .where(inArray(schema.cafe_order_items.order_id, orderIds)) : [];

    // Group items by order_id
    const itemsByOrderId = allItems.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {} as Record<number, any[]>);

    // Attach items to orders
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: itemsByOrderId[order.id] || []
    }));

    return ordersWithItems;
  }

  async getCafeOrderById(id: number): Promise<any> {
    const [order] = await db.select({
      id: schema.cafe_orders.id,
      total_amount: schema.cafe_orders.total_amount,
      status: schema.cafe_orders.status,
      billed_to: schema.cafe_orders.billed_to,
      created_by: schema.cafe_orders.created_by,
      payment_status: schema.cafe_orders.payment_status,
      payment_updated_by: schema.cafe_orders.payment_updated_by,
      payment_updated_at: schema.cafe_orders.payment_updated_at,
      notes: schema.cafe_orders.notes,
      created_at: schema.cafe_orders.created_at,
      user: {
        id: schema.users.id,
        first_name: schema.users.first_name,
        last_name: schema.users.last_name,
        email: schema.users.email,
      },
      organization: {
        id: schema.organizations.id,
        name: schema.organizations.name,
      }
    })
    .from(schema.cafe_orders)
    .leftJoin(schema.users, eq(schema.cafe_orders.user_id, schema.users.id))
    .leftJoin(schema.organizations, eq(schema.cafe_orders.org_id, schema.organizations.id))
    .where(eq(schema.cafe_orders.id, id));

    if (order) {
      const items = await db.select({
        id: schema.cafe_order_items.id,
        quantity: schema.cafe_order_items.quantity,
        price: schema.cafe_order_items.price,
        menu_item: {
          id: schema.menu_items.id,
          name: schema.menu_items.name,
          description: schema.menu_items.description,
        }
      })
      .from(schema.cafe_order_items)
      .leftJoin(schema.menu_items, eq(schema.cafe_order_items.menu_item_id, schema.menu_items.id))
      .where(eq(schema.cafe_order_items.order_id, id));

      return { ...order, items };
    }
    return undefined;
  }

  async getCafeOrdersSince(since: Date, site?: string, userId?: number): Promise<any[]> {
    let query = db.select({
      id: schema.cafe_orders.id,
      user_id: schema.cafe_orders.user_id,
      total_amount: schema.cafe_orders.total_amount,
      status: schema.cafe_orders.status,
      billed_to: schema.cafe_orders.billed_to,
      org_id: schema.cafe_orders.org_id,
      notes: schema.cafe_orders.notes,
      payment_status: schema.cafe_orders.payment_status,
      created_at: schema.cafe_orders.created_at,
      updated_at: schema.cafe_orders.updated_at,
      site: schema.cafe_orders.site,
      handled_by: schema.cafe_orders.handled_by,
      user: {
        id: schema.users.id,
        first_name: schema.users.first_name,
        last_name: schema.users.last_name,
        email: schema.users.email,
      },
      organization: {
        id: schema.organizations.id,
        name: schema.organizations.name,
      }
    }).from(schema.cafe_orders)
      .leftJoin(schema.users, eq(schema.cafe_orders.user_id, schema.users.id))
      .leftJoin(schema.organizations, eq(schema.cafe_orders.org_id, schema.organizations.id));

    const conditions = [gte(schema.cafe_orders.created_at, since)];
    
    if (site) {
      conditions.push(eq(schema.cafe_orders.site, site as any));
    }
    
    if (userId) {
      conditions.push(eq(schema.cafe_orders.user_id, userId));
    }

    return await query.where(and(...conditions)).orderBy(desc(schema.cafe_orders.created_at));
  }

  async updateCafeOrderStatus(id: number, status: string, handledBy?: number): Promise<schema.CafeOrder> {
    const updates: any = { status, updated_at: new Date() };
    if (handledBy) updates.handled_by = handledBy;
    
    const [updatedOrder] = await db.update(schema.cafe_orders).set(updates).where(eq(schema.cafe_orders.id, id)).returning();
    return updatedOrder;
  }

  async updateCafeOrderPaymentStatus(id: number, paymentStatus: string, updatedBy: number): Promise<schema.CafeOrder> {
    const [order] = await db.update(schema.cafe_orders)
      .set({ 
        payment_status: paymentStatus,
        payment_updated_by: updatedBy,
        payment_updated_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(schema.cafe_orders.id, id))
      .returning();
    
    return order;
  }

  async createCafeOrderOnBehalf(order: schema.InsertCafeOrder, items: Partial<schema.InsertCafeOrderItem>[], createdBy: number): Promise<any> {
    // Create order with created_by field
    const [newOrder] = await db.insert(schema.cafe_orders)
      .values({
        ...order,
        created_by: createdBy
      })
      .returning();

    // Create order items
    const orderItems = [];
    for (const item of items) {
      const [orderItem] = await db.insert(schema.cafe_order_items)
        .values({
          menu_item_id: item.menu_item_id!,
          quantity: item.quantity!,
          price: item.price!,
          order_id: newOrder.id
        })
        .returning();
      orderItems.push(orderItem);
    }

    // Return the complete order with items and user details
    return this.getCafeOrderById(newOrder.id);
  }

  async getMeetingRooms(site?: string): Promise<schema.MeetingRoom[]> {
    if (site) {
      return await db.select().from(schema.meeting_rooms)
        .where(and(eq(schema.meeting_rooms.is_available, true), eq(schema.meeting_rooms.site, site as any)))
        .orderBy(asc(schema.meeting_rooms.name));
    } else {
      return await db.select().from(schema.meeting_rooms)
        .where(eq(schema.meeting_rooms.is_available, true))
        .orderBy(asc(schema.meeting_rooms.name));
    }
  }

  async getMeetingRoomById(id: number): Promise<schema.MeetingRoom | undefined> {
    const [room] = await db.select().from(schema.meeting_rooms).where(eq(schema.meeting_rooms.id, id));
    return room;
  }

  async createMeetingRoom(room: schema.InsertMeetingRoom): Promise<schema.MeetingRoom> {
    const [newRoom] = await db.insert(schema.meeting_rooms).values(room).returning();
    return newRoom;
  }

  async updateMeetingRoom(id: number, updates: Partial<schema.MeetingRoom>): Promise<schema.MeetingRoom> {
    const [updatedRoom] = await db.update(schema.meeting_rooms).set(updates).where(eq(schema.meeting_rooms.id, id)).returning();
    return updatedRoom;
  }

  async createMeetingBooking(booking: schema.InsertMeetingBooking): Promise<schema.MeetingBooking> {
    const [newBooking] = await db.insert(schema.meeting_bookings).values(booking).returning();
    return newBooking;
  }

  async getMeetingBookings(userId?: number, orgId?: string, site?: string): Promise<any[]> {
    let query = db.select({
      id: schema.meeting_bookings.id,
      user_id: schema.meeting_bookings.user_id,
      room_id: schema.meeting_bookings.room_id,
      org_id: schema.meeting_bookings.org_id,
      start_time: schema.meeting_bookings.start_time,
      end_time: schema.meeting_bookings.end_time,
      credits_used: schema.meeting_bookings.credits_used,
      status: schema.meeting_bookings.status,
      billed_to: schema.meeting_bookings.billed_to,
      notes: schema.meeting_bookings.notes,
      cancelled_by: schema.meeting_bookings.cancelled_by,
      created_at: schema.meeting_bookings.created_at,
      site: schema.meeting_bookings.site,
      booking_source: schema.meeting_bookings.booking_source,
      user: {
        id: schema.users.id,
        first_name: schema.users.first_name,
        last_name: schema.users.last_name,
        email: schema.users.email,
      },
      room: {
        id: schema.meeting_rooms.id,
        name: schema.meeting_rooms.name,
        capacity: schema.meeting_rooms.capacity,
      },
      organization: {
        id: schema.organizations.id,
        name: schema.organizations.name,
      }
    })
    .from(schema.meeting_bookings)
    .leftJoin(schema.users, eq(schema.meeting_bookings.user_id, schema.users.id))
    .leftJoin(schema.meeting_rooms, eq(schema.meeting_bookings.room_id, schema.meeting_rooms.id))
    .leftJoin(schema.organizations, eq(schema.meeting_bookings.org_id, schema.organizations.id));

    // Build where conditions
    const conditions = [];
    if (userId) {
      conditions.push(eq(schema.meeting_bookings.user_id, userId));
    }
    if (orgId) {
      conditions.push(eq(schema.meeting_bookings.org_id, orgId));
    }
    if (site && site !== 'all') {
      conditions.push(eq(schema.meeting_rooms.site, site as any));
    }

    if (conditions.length > 0) {
      return await query
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(schema.meeting_bookings.created_at));
    }

    return await query.orderBy(desc(schema.meeting_bookings.created_at));


  }

  async getMeetingBookingById(id: number): Promise<any> {
    const [booking] = await db.select({
      id: schema.meeting_bookings.id,
      user_id: schema.meeting_bookings.user_id,
      start_time: schema.meeting_bookings.start_time,
      end_time: schema.meeting_bookings.end_time,
      credits_used: schema.meeting_bookings.credits_used,
      status: schema.meeting_bookings.status,
      billed_to: schema.meeting_bookings.billed_to,
      notes: schema.meeting_bookings.notes,
      cancelled_by: schema.meeting_bookings.cancelled_by,
      created_at: schema.meeting_bookings.created_at,
      user: {
        id: schema.users.id,
        first_name: schema.users.first_name,
        last_name: schema.users.last_name,
        email: schema.users.email,
      },
      room: {
        id: schema.meeting_rooms.id,
        name: schema.meeting_rooms.name,
        capacity: schema.meeting_rooms.capacity,
        amenities: schema.meeting_rooms.amenities,
      },
      organization: {
        id: schema.organizations.id,
        name: schema.organizations.name,
      }
    })
    .from(schema.meeting_bookings)
    .leftJoin(schema.users, eq(schema.meeting_bookings.user_id, schema.users.id))
    .leftJoin(schema.meeting_rooms, eq(schema.meeting_bookings.room_id, schema.meeting_rooms.id))
    .leftJoin(schema.organizations, eq(schema.meeting_bookings.org_id, schema.organizations.id))
    .where(eq(schema.meeting_bookings.id, id));

    return booking;
  }

  async updateMeetingBookingStatus(id: number, status: string, cancelledBy?: number): Promise<schema.MeetingBooking> {
    const updateData: any = { 
      status: status as any, 
      updated_at: new Date() 
    };
    
    // If cancelling and cancelled_by is provided, record who cancelled it
    if (status === 'cancelled' && cancelledBy !== undefined) {
      updateData.cancelled_by = cancelledBy;
    }
    
    const [updatedBooking] = await db.update(schema.meeting_bookings).set(updateData).where(eq(schema.meeting_bookings.id, id)).returning();
    return updatedBooking;
  }

  async checkRoomAvailability(roomId: number, startTime: Date, endTime: Date): Promise<boolean> {
    const [existing] = await db.select().from(schema.meeting_bookings)
      .where(
        and(
          eq(schema.meeting_bookings.room_id, roomId),
          eq(schema.meeting_bookings.status, "confirmed"),
          sql`${schema.meeting_bookings.start_time} < ${endTime}`,
          sql`${schema.meeting_bookings.end_time} > ${startTime}`
        )
      );
    return !existing;
  }

  async getAnnouncements(site?: string): Promise<schema.Announcement[]> {
    // SQL query uses NOW() AT TIME ZONE 'Asia/Karachi' for correct timezone handling
    // FIXED: Use proper timezone formatting for debug log
    const pakistanTimeStr = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
    console.log("Current Pakistan time for filtering:", pakistanTimeStr);
    
    if (site) {
      const result = await db.select().from(schema.announcements)
        .where(
          and(
            eq(schema.announcements.is_active, true),
            or(
              // Check if site is in the sites array
              sql`${schema.announcements.sites} @> ${[site]}`,
              // Check if 'all' is in the sites array
              sql`${schema.announcements.sites} @> ${['all']}`,
              // Fallback to old single site field for backwards compatibility
              eq(schema.announcements.site, site as any)
            ),
            or(
              isNull(schema.announcements.show_until),
              sql`${schema.announcements.show_until} > NOW() AT TIME ZONE 'Asia/Karachi'`
            )
          )
        )
        .orderBy(desc(schema.announcements.created_at));
      
      console.log("Filtered announcements for site", site, ":", result.map(a => ({ id: a.id, title: a.title, show_until: a.show_until })));
      return result;
    } else {
      const result = await db.select().from(schema.announcements)
        .where(
          and(
            eq(schema.announcements.is_active, true),
            or(
              isNull(schema.announcements.show_until),
              sql`${schema.announcements.show_until} > NOW() AT TIME ZONE 'Asia/Karachi'`
            )
          )
        )
        .orderBy(desc(schema.announcements.created_at));
      
      console.log("Filtered announcements (no site filter):", result.map(a => ({ id: a.id, title: a.title, show_until: a.show_until })));
      return result;
    }
  }

  async createAnnouncement(announcement: schema.InsertAnnouncement): Promise<schema.Announcement> {
    // Convert show_until string to Date if provided
    const processedAnnouncement = {
      ...announcement,
      show_until: announcement.show_until ? new Date(announcement.show_until) : null
    };
    
    const [newAnnouncement] = await db.insert(schema.announcements).values(processedAnnouncement).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, updates: Partial<schema.Announcement>): Promise<schema.Announcement> {
    const [updatedAnnouncement] = await db.update(schema.announcements).set(updates).where(eq(schema.announcements.id, id)).returning();
    return updatedAnnouncement;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db.delete(schema.announcements).where(eq(schema.announcements.id, id));
  }

  async getOrganizationEmployees(orgId: string): Promise<schema.User[]> {
    // Ensure stable ordering so UI rows don't shuffle after each refresh
    return await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.organization_id, orgId))
      .orderBy(asc(schema.users.id));
  }

  async updateEmployeePermissions(userId: number, permissions: { can_charge_cafe_to_org?: boolean; can_charge_room_to_org?: boolean }): Promise<schema.User> {
    const [updatedUser] = await db.update(schema.users).set(permissions).where(eq(schema.users.id, userId)).returning();
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
