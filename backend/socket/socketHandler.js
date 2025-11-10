let ioInstance = null;
const userSockets = new Map(); // userId -> socketId

const initializeSocket = (io) => {
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // User joins their personal room
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(`user_${userId}`);
                userSockets.set(userId, socket.id);
                console.log(`User ${userId} joined room: user_${userId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Remove user from map
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    break;
                }
            }
        });
    });
};

const emitNotification = (event, data, userId = null) => {
    if (!ioInstance) {
        console.warn('Socket.io not initialized');
        return;
    }

    if (userId) {
        // Send to specific user
        ioInstance.to(`user_${userId}`).emit(event, data);
        console.log(`Notification sent to user ${userId}: ${event}`);
    } else {
        // Broadcast to all connected clients (or specific roles)
        if (event === 'user_registered') {
            // For user registration, notify all Admins and Managers
            ioInstance.emit(event, data);
            console.log(`Broadcast notification: ${event}`);
        } else {
            ioInstance.emit(event, data);
            console.log(`Broadcast notification: ${event}`);
        }
    }
};

module.exports = {
    initializeSocket,
    emitNotification
};

