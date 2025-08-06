import type { Response } from 'express';
import type { User } from '../shared/schema';

// In-memory registries for SSE connections
const cafes = new Map<string, Set<Response>>();
const users = new Map<number, Set<Response>>();

// Connection tracking for logging
let connectionCount = 0;
let broadcastCount = 0;

// Broadcaster interface for future Redis Pub/Sub support
interface IBroadcaster {
  addCafeConnection(cafeId: string, res: Response): void;
  addUserConnection(userId: number, res: Response): void;
  removeConnection(res: Response): void;
  broadcastNewOrder(cafeId: string, orderData: any): void;
  broadcastOrderUpdate(userId: number, orderData: any, cafeId?: string): void;
  getStats(): { connections: number; broadcasts: number };
}

class LocalBroadcaster implements IBroadcaster {
  addCafeConnection(cafeId: string, res: Response): void {
    if (!cafes.has(cafeId)) {
      cafes.set(cafeId, new Set());
    }
    cafes.get(cafeId)!.add(res);
    connectionCount++;
    console.log(`📡 Cafe connection added for ${cafeId}, total: ${cafes.get(cafeId)!.size}`);
  }

  addUserConnection(userId: number, res: Response): void {
    if (!users.has(userId)) {
      users.set(userId, new Set());
    }
    users.get(userId)!.add(res);
    connectionCount++;
    console.log(`👤 User connection added for ${userId}, total: ${users.get(userId)!.size}`);
  }

  removeConnection(res: Response): void {
    // Remove from cafes
    for (const [cafeId, connections] of Array.from(cafes.entries())) {
      if (connections.has(res)) {
        connections.delete(res);
        connectionCount--;
        console.log(`📡 Cafe connection removed from ${cafeId}, remaining: ${connections.size}`);
        if (connections.size === 0) {
          cafes.delete(cafeId);
        }
        return;
      }
    }

    // Remove from users
    for (const [userId, connections] of Array.from(users.entries())) {
      if (connections.has(res)) {
        connections.delete(res);
        connectionCount--;
        console.log(`👤 User connection removed from ${userId}, remaining: ${connections.size}`);
        if (connections.size === 0) {
          users.delete(userId);
        }
        return;
      }
    }
  }

  broadcastNewOrder(cafeId: string, orderData: any): void {
    const connections = cafes.get(cafeId);
    if (!connections || connections.size === 0) {
      console.log(`🚫 No cafe connections for ${cafeId} to broadcast new order`);
      return;
    }

    const message = JSON.stringify({
      type: 'order.new',
      data: orderData,
      timestamp: new Date().toISOString()
    });

    let successCount = 0;
    for (const res of Array.from(connections)) {
      try {
        if (!res.destroyed) {
          res.write(`data: ${message}\n\n`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to broadcast to cafe ${cafeId}:`, error);
        connections.delete(res);
      }
    }

    broadcastCount++;
    console.log(`🔔 NEW ORDER broadcasted to cafe ${cafeId}: ${successCount}/${connections.size} connections`);
  }

  broadcastOrderUpdate(userId: number, orderData: any, cafeId?: string): void {
    let successCount = 0;
    let totalAttempts = 0;

    const message = JSON.stringify({
      type: 'order.update',
      data: orderData,
      timestamp: new Date().toISOString()
    });

    // Broadcast to user
    const userConnections = users.get(userId);
    if (userConnections && userConnections.size > 0) {
      for (const res of Array.from(userConnections)) {
        try {
          if (!res.destroyed) {
            res.write(`data: ${message}\n\n`);
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to broadcast to user ${userId}:`, error);
          userConnections.delete(res);
        }
        totalAttempts++;
      }
    }

    // Optionally broadcast to cafe
    if (cafeId) {
      const cafeConnections = cafes.get(cafeId);
      if (cafeConnections && cafeConnections.size > 0) {
        for (const res of Array.from(cafeConnections)) {
          try {
            if (!res.destroyed) {
              res.write(`data: ${message}\n\n`);
              successCount++;
            }
          } catch (error) {
            console.error(`❌ Failed to broadcast to cafe ${cafeId}:`, error);
            cafeConnections.delete(res);
          }
          totalAttempts++;
        }
      }
    }

    broadcastCount++;
    console.log(`📋 ORDER UPDATE broadcasted: ${successCount}/${totalAttempts} connections`);
  }

  getStats(): { connections: number; broadcasts: number } {
    return { connections: connectionCount, broadcasts: broadcastCount };
  }
}

// Export the broadcaster instance
export const broadcaster: IBroadcaster = new LocalBroadcaster();

// SSE endpoint handler
export function handleSSEConnection(user: User, res: Response) {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'X-Accel-Buffering': 'no' // Disable nginx buffering
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    user: { id: user.id, role: user.role }
  })}\n\n`);

  // Add connection based on user role
  if (user.role === 'cafe_manager' || user.role === 'calmkaaj_admin') {
    // For cafe managers, use their site as cafeId
    const cafeId = user.site || 'default';
    broadcaster.addCafeConnection(cafeId, res);
  } else {
    // For regular users, add to user connections
    broadcaster.addUserConnection(user.id, res);
  }

  // Set up heartbeat
  const heartbeatInterval = setInterval(() => {
    try {
      if (!res.destroyed) {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        })}\n\n`);
      } else {
        clearInterval(heartbeatInterval);
      }
    } catch (error) {
      clearInterval(heartbeatInterval);
      broadcaster.removeConnection(res);
    }
  }, 20000); // 20 seconds

  // Handle client disconnect
  res.on('close', () => {
    clearInterval(heartbeatInterval);
    broadcaster.removeConnection(res);
  });

  res.on('error', (error) => {
    console.error('SSE connection error:', error);
    clearInterval(heartbeatInterval);
    broadcaster.removeConnection(res);
  });
}

// Cleanup dead connections periodically
setInterval(() => {
  const stats = broadcaster.getStats();
  console.log(`📊 SSE Stats - Connections: ${stats.connections}, Broadcasts: ${stats.broadcasts}`);
  
  // Clean up destroyed connections
  for (const [cafeId, connections] of Array.from(cafes.entries())) {
    const activeConnections = new Set(Array.from(connections).filter(res => !res.destroyed));
    if (activeConnections.size !== connections.size) {
      cafes.set(cafeId, activeConnections);
      console.log(`🧹 Cleaned up dead connections for cafe ${cafeId}`);
    }
  }

  for (const [userId, connections] of Array.from(users.entries())) {
    const activeConnections = new Set(Array.from(connections).filter(res => !res.destroyed));
    if (activeConnections.size !== connections.size) {
      users.set(userId, activeConnections);
      console.log(`🧹 Cleaned up dead connections for user ${userId}`);
    }
  }
}, 60000); // Every minute