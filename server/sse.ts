import type { Response } from 'express';

// Store active SSE connections
const connections = new Map<string, Response[]>();

export class SSEManager {
  // Add a new SSE connection
  static addConnection(type: 'cafe_manager' | 'user', userId: string, res: Response) {
    const key = `${type}_${userId}`;
    
    if (!connections.has(key)) {
      connections.set(key, []);
    }
    
    connections.get(key)!.push(res);
    
    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    // Handle client disconnect
    res.on('close', () => {
      this.removeConnection(type, userId, res);
    });

    console.log(`SSE connection added: ${key}`);
  }

  // Remove a specific SSE connection
  static removeConnection(type: 'cafe_manager' | 'user', userId: string, res: Response) {
    const key = `${type}_${userId}`;
    const conns = connections.get(key);
    
    if (conns) {
      const index = conns.indexOf(res);
      if (index !== -1) {
        conns.splice(index, 1);
        console.log(`SSE connection removed: ${key}`);
      }
      
      if (conns.length === 0) {
        connections.delete(key);
      }
    }
  }

  // Send new order notification to all cafe managers
  static notifyNewOrder(orderData: any, site?: string) {
    console.log('Notifying cafe managers of new order:', orderData.id);
    
    // Find all cafe manager connections
    for (const [key, conns] of connections.entries()) {
      if (key.startsWith('cafe_manager_')) {
        conns.forEach(res => {
          try {
            res.write(`data: ${JSON.stringify({
              type: 'new_order',
              order: orderData,
              timestamp: new Date().toISOString()
            })}\n\n`);
          } catch (error) {
            console.error('Error sending SSE message:', error);
          }
        });
      }
    }
  }

  // Send order status update to specific user
  static notifyOrderStatusUpdate(userId: number, orderData: any) {
    const key = `user_${userId}`;
    const conns = connections.get(key);
    
    console.log(`Notifying user ${userId} of order status update:`, orderData.status);
    
    if (conns) {
      conns.forEach(res => {
        try {
          res.write(`data: ${JSON.stringify({
            type: 'order_status_update',
            order: orderData,
            timestamp: new Date().toISOString()
          })}\n\n`);
        } catch (error) {
          console.error('Error sending SSE message:', error);
        }
      });
    }
  }

  // Send payment status update to specific user
  static notifyPaymentStatusUpdate(userId: number, orderData: any) {
    const key = `user_${userId}`;
    const conns = connections.get(key);
    
    console.log(`Notifying user ${userId} of payment status update:`, orderData.payment_status);
    
    if (conns) {
      conns.forEach(res => {
        try {
          res.write(`data: ${JSON.stringify({
            type: 'payment_status_update',
            order: orderData,
            timestamp: new Date().toISOString()
          })}\n\n`);
        } catch (error) {
          console.error('Error sending SSE message:', error);
        }
      });
    }
  }

  // Get connection stats for debugging
  static getConnectionStats() {
    const stats: Record<string, number> = {};
    for (const [key, conns] of connections.entries()) {
      stats[key] = conns.length;
    }
    return stats;
  }

  // Cleanup dead connections
  static cleanup() {
    for (const [key, conns] of connections.entries()) {
      const activeConns = conns.filter(res => !res.destroyed);
      if (activeConns.length !== conns.length) {
        connections.set(key, activeConns);
        console.log(`Cleaned up dead connections for ${key}`);
      }
    }
  }
}

// Periodic cleanup of dead connections
setInterval(() => {
  SSEManager.cleanup();
}, 60000); // Every minute