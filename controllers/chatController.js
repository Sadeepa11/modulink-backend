const prisma = require('../db');

const getChats = async (req, res) => {
    try {
        const userId = req.user.userId;
        const chats = await prisma.chat.findMany({
            where: {
                users: {
                    some: {
                        id: userId
                    }
                }
            },
            include: {
                users: {
                    select: {
                        id: true,
                        username: true,
                        profilePic: true
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });
        res.json(chats);
    } catch (error) {
        console.error('Error in getChats:', error);
        console.error('User ID:', req.user ? req.user.userId : 'undefined');
        res.status(500).json({ error: 'Failed to fetch chats', details: error.message });
    }
};

const getMessages = async (req, res) => {
    try {
        const chatId = parseInt(req.params.id);
        const messages = await prisma.message.findMany({
            where: {
                chatId: chatId
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const chatId = parseInt(req.params.id);
        const { content, type, mediaUrl } = req.body;

        const message = await prisma.message.create({
            data: {
                content,
                type: type || 'TEXT',
                mediaUrl,
                senderId: userId,
                chatId
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });

        // Update chat updatedAt
        await prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
};

const createChat = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { targetUserId } = req.body;

        // Check if chat already exists
        if (userId === targetUserId) {
            // Self-chat logic
            const existingChat = await prisma.chat.findFirst({
                where: {
                    AND: [
                        { users: { some: { id: userId } } },
                        // Ensure it has exactly 1 user (the self) or at least ensure it's the self-chat
                        // A simple check is to find a chat where this user is present and it might be a specific "self" type or just checking participants
                        // For now, let's assume if we find a chat with just this user, that's it. 
                        // However, Prisma doesn't easily support "count of users = 1" in a simple where clause without raw query or post-filtering.
                        // We will rely on finding a chat where the users array contains ONLY this user.
                    ]
                },
                include: { users: true }
            });

            // Filter for exact match in memory if needed, or rely on the logic that self-chat is unique
            // A better approach for self-chat:
            const userChats = await prisma.chat.findMany({
                where: {
                    users: { some: { id: userId } }
                },
                include: { users: true }
            });

            const selfChat = userChats.find(chat => chat.users.length === 1 && chat.users[0].id === userId);

            if (selfChat) {
                return res.json(selfChat);
            }

            const chat = await prisma.chat.create({
                data: {
                    users: {
                        connect: [
                            { id: userId }
                        ]
                    }
                }
            });
            return res.status(201).json(chat);
        }

        // Normal chat logic
        const existingChat = await prisma.chat.findFirst({
            where: {
                AND: [
                    { users: { some: { id: userId } } },
                    { users: { some: { id: targetUserId } } }
                ]
            },
            include: { users: true }
        });

        // Ensure we don't accidentally return a group chat or self chat (though self chat is handled above)
        // For 1-on-1, ideally we check user count is 2.
        if (existingChat) {
            // Optional: Check if it's strictly 2 users. 
            // For now, keeping existing logic but returning if found.
            return res.json(existingChat);
        }

        const chat = await prisma.chat.create({
            data: {
                users: {
                    connect: [
                        { id: userId },
                        { id: targetUserId }
                    ]
                }
            }
        });
        res.status(201).json(chat);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
};

module.exports = {
    getChats,
    getMessages,
    sendMessage,
    createChat
};
