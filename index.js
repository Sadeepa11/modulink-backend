const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const http = require('http');
const { Server } = require("socket.io");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now (adjust for production)
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Logic
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        // Update user to online
        prisma.user.update({
            where: { id: parseInt(userId) },
            data: { isOnline: true }
        }).catch(err => console.error("Error updating online status:", err));

        // Broadcast online status
        socket.broadcast.emit("user_online", { userId: parseInt(userId) });
    }

    socket.on("join_chat", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on("typing", ({ room, userId, isTyping }) => {
        socket.to(room).emit("typing", { userId, isTyping });
    });

    socket.on("disconnect", async () => {
        console.log("User disconnected:", socket.id);
        if (userId) {
            // Update user to offline and lastSeen
            const now = new Date();
            await prisma.user.update({
                where: { id: parseInt(userId) },
                data: { isOnline: false, lastSeen: now }
            }).catch(err => console.error("Error updating offline status:", err));

            socket.broadcast.emit("user_offline", { userId: parseInt(userId), lastSeen: now });
        }
    });
});


// Routes
app.get('/', (req, res) => {
    res.send('Backend is running');
});

app.use('/', authRoutes);
app.use('/chats', require('./routes/chatRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/groups', require('./routes/groupRoutes'));

if (require.main === module) {
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;
