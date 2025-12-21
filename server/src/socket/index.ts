import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../config/logger';
import { User } from '../models';
import { SOCKET_EVENTS } from '@opencrisis/shared';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
    userName?: string;
}

interface JwtPayload {
    userId: string;
    role: string;
}

let io: Server;

export const initializeSocket = (httpServer: HttpServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: config.corsOrigin,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
            const user = await User.findById(decoded.userId);

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.userRole = user.role;
            socket.userName = user.name;

            next();
        } catch (error) {
            logger.error('Socket authentication error:', error);
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        logger.info(`User connected: ${socket.userName} (${socket.userId})`);

        // Join committee room
        socket.on(SOCKET_EVENTS.JOIN_COMMITTEE, ({ committeeId }) => {
            if (!committeeId) return;

            const room = `committee:${committeeId}`;
            socket.join(room);
            logger.debug(`${socket.userName} joined ${room}`);

            // Notify others in the room
            socket.to(room).emit(SOCKET_EVENTS.USER_JOINED, {
                userId: socket.userId,
                name: socket.userName,
                role: socket.userRole,
            });
        });

        // Leave committee room
        socket.on(SOCKET_EVENTS.LEAVE_COMMITTEE, ({ committeeId }) => {
            if (!committeeId) return;

            const room = `committee:${committeeId}`;
            socket.leave(room);
            logger.debug(`${socket.userName} left ${room}`);

            // Notify others
            socket.to(room).emit(SOCKET_EVENTS.USER_LEFT, {
                userId: socket.userId,
                name: socket.userName,
            });
        });

        socket.on('disconnect', () => {
            logger.info(`User disconnected: ${socket.userName}`);
        });

        socket.on('error', (error) => {
            logger.error(`Socket error for ${socket.userName}:`, error);
        });
    });

    return io;
};

// Emit directive created event to committee room
export const emitDirectiveCreated = (committeeId: string, directive: object) => {
    if (!io) return;
    io.to(`committee:${committeeId}`).emit(SOCKET_EVENTS.DIRECTIVE_CREATED, { directive });
};

// Emit directive updated event to committee room
export const emitDirectiveUpdated = (committeeId: string, payload: {
    directiveId: string;
    status: string;
    feedback?: string;
    outcome?: string;
    updatedBy: { _id: string; name: string };
}) => {
    if (!io) return;
    io.to(`committee:${committeeId}`).emit(SOCKET_EVENTS.DIRECTIVE_UPDATED, payload);
};

// Emit new crisis update to committee room
export const emitCrisisUpdate = (committeeId: string, update: object, targetDelegates?: string[]) => {
    if (!io) return;

    // For public updates, broadcast to entire committee
    // For private updates, send only to targeted delegates
    if (!targetDelegates || targetDelegates.length === 0) {
        io.to(`committee:${committeeId}`).emit(SOCKET_EVENTS.UPDATE_NEW, { update });
    } else {
        // Send to staff in the room and targeted delegates
        const room = `committee:${committeeId}`;
        io.in(room).fetchSockets().then((sockets) => {
            sockets.forEach((s) => {
                const socket = s as unknown as AuthenticatedSocket;
                const isStaff = socket.userRole === 'staff' || socket.userRole === 'admin';
                const isTargeted = targetDelegates.includes(socket.userId || '');

                if (isStaff || isTargeted) {
                    socket.emit(SOCKET_EVENTS.UPDATE_NEW, { update });
                }
            });
        });
    }
};

// Emit new note to specific user
export const emitCrisisNote = (recipientId: string, note: object) => {
    if (!io) return;

    // Find sockets for this user
    io.fetchSockets().then((sockets) => {
        sockets.forEach((s) => {
            const socket = s as unknown as AuthenticatedSocket;
            if (socket.userId === recipientId) {
                socket.emit(SOCKET_EVENTS.NOTE_NEW, { note });
            }
        });
    });
};

export const getIO = (): Server => io;

export default { initializeSocket, emitDirectiveCreated, emitDirectiveUpdated, emitCrisisUpdate, emitCrisisNote, getIO };
