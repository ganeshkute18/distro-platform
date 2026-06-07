import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

// Helper function to check if origin matches allowed patterns (supports wildcards)
function isOriginAllowed(origin: string, allowedPatterns: string[]): boolean {
  if (allowedPatterns.includes('*')) return true;
  
  return allowedPatterns.some(pattern => {
    if (pattern === origin) return true;
    
    // Support wildcard patterns like 'https://*.vercel.app'
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '[^/]+');
      return new RegExp(`^${regexPattern}$`).test(origin);
    }
    
    return false;
  });
}

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Get allowed origins from environment
      // This will be set by the NotificationsGateway constructor
      const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:3000', 'http://localhost:3001'];
      
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
      } else {
        callback(new Error(`WebSocket CORS: Origin "${origin}" not allowed`));
      }
    },
    credentials: true,
  },
  namespace: '/',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      // Join role-based rooms
      client.data.userId = payload.sub;
      client.data.role = payload.role;
      await client.join(`user:${payload.sub}`);
      await client.join(`role:${payload.role}`);

      this.logger.log(`Client connected: ${payload.sub} (${payload.role})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.data.userId}`);
  }

  @SubscribeMessage('ping')
  handlePing() { return 'pong'; }

  // ─── Emit helpers ────────────────────────────────────────

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToRole(role: string, event: string, data: unknown) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  // ─── Domain event listeners → push to clients ─────────────

  @OnEvent('order.created')
  onOrderCreated(order: unknown) {
    this.emitToRole('OWNER', 'notification', {
      type: 'ORDER_PLACED',
      message: 'New order pending approval',
      data: order,
    });
  }

  @OnEvent('order.approved')
  onOrderApproved(order: unknown) {
    this.emitToRole('STAFF', 'notification', { type: 'ORDER_APPROVED', data: order });
  }

  @OnEvent('order.rejected')
  onOrderRejected(order: unknown) {
    const o = order as { customerId: string };
    this.emitToUser(o.customerId, 'notification', { type: 'ORDER_REJECTED', data: order });
  }

  @OnEvent('order.dispatched')
  onOrderDispatched(order: unknown) {
    const o = order as { customerId: string };
    this.emitToUser(o.customerId, 'notification', { type: 'ORDER_DISPATCHED', data: order });
  }

  @OnEvent('order.delivered')
  onOrderDelivered(order: unknown) {
    const o = order as { customerId: string };
    this.emitToUser(o.customerId, 'notification', { type: 'ORDER_DELIVERED', data: order });
  }

  @OnEvent('inventory.lowStock')
  onLowStock(payload: unknown) {
    this.emitToRole('OWNER', 'notification', { type: 'LOW_STOCK', data: payload });
  }
}
