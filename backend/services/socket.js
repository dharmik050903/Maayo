import { Server } from "socket.io";

let ioInstance = null;

// Initialize a single Socket.IO server instance and configure CORS
export function initSocketServer(httpServer, allowedOrigins = []) {
    if (ioInstance) {
        return ioInstance;
    }

    ioInstance = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (allowedOrigins.includes(origin)) return callback(null, true);
                return callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
            methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
            allowedHeaders: ['Content-Type','Authorization']
        }
    });

    // Socket connection lifecycle
    ioInstance.on('connection', (socket) => {
        // Expect userId via query to bind socket to a user room for direct notifications
        const { userId } = socket.handshake.query || {};
        if (userId) {
            socket.join(`user:${userId}`);
        }

        // Allow clients to join a chat room for a specific accepted bid
        socket.on('chat:join', ({ bid_id }) => {
            if (!bid_id) return;
            socket.join(`chat:${bid_id}`);
        });

        socket.on('disconnect', () => {
            // No-op for now
        });
    });

    return ioInstance;
}

export function getIO() {
    if (!ioInstance) {
        throw new Error('Socket server not initialized. Call initSocketServer() first.');
    }
    return ioInstance;
}



