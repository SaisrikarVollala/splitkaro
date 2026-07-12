import { Server } from 'socket.io';
import { auth } from '../lib/auth';

let io: Server | null = null;

export function initSocket(server: any): Server {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173"],
      credentials: true
    }
  });

  // Authenticate socket connections using better-auth session headers
  io.use(async (socket, next) => {
    try {
      const session = await auth.api.getSession({
        headers: socket.request.headers as any
      });
      
      if (!session) {
        return next(new Error('Unauthorized'));
      }

      socket.data.user = session.user;
      socket.data.session = session.session;
      next();
    } catch (err) {
      console.error('Socket authentication error:', err);
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    
    // Join a room for the group if needed (to sync group modifications)
    socket.on('join-group', (groupId: string) => {
      socket.join(`group:${groupId}`);
      console.log(`Socket ${socket.id} joined group:${groupId}`);
    });

    socket.on('leave-group', (groupId: string) => {
      socket.leave(`group:${groupId}`);
      console.log(`Socket ${socket.id} left group:${groupId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User socket disconnected: ${userId}`);
    });
  });

  return io;
}

export function getSocketIO(): Server {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return io;
}

export function sendToUser(userId: string, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function broadcastToGroup(groupId: string, event: string, data: any) {
  if (!io) return;
  io.to(`group:${groupId}`).emit(event, data);
}
