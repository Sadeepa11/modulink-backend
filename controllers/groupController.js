const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createGroup = async (req, res) => {
    try {
        const { name, icon, memberIds } = req.body; // memberIds is array of userIds
        const userId = req.user.userId;

        // Create group and add creator as admin
        const group = await prisma.group.create({
            data: {
                name,
                icon,
                members: {
                    create: [
                        { userId: userId, role: 'ADMIN' },
                        ...memberIds.map(id => ({ userId: id, role: 'MEMBER' }))
                    ]
                }
            },
            include: {
                members: {
                    include: { user: true }
                }
            }
        });

        res.json(group);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
};

exports.getGroups = async (req, res) => {
    try {
        const userId = req.user.userId;

        const groups = await prisma.group.findMany({
            where: {
                members: {
                    some: { userId: userId }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, username: true, profilePic: true }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { content: true, createdAt: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
};

exports.getGroupMessages = async (req, res) => {
    try {
        const { id } = req.params;

        const messages = await prisma.groupMessage.findMany({
            where: { groupId: parseInt(id) },
            include: {
                sender: {
                    select: { id: true, username: true, profilePic: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching group messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, type, mediaUrl } = req.body;
        const senderId = req.user.userId;

        const message = await prisma.groupMessage.create({
            data: {
                content,
                type: type || 'TEXT',
                mediaUrl,
                groupId: parseInt(id),
                senderId
            },
            include: {
                sender: {
                    select: { id: true, username: true, profilePic: true }
                }
            }
        });

        // Update group updated at
        await prisma.group.update({
            where: { id: parseInt(id) },
            data: { updatedAt: new Date() }
        });

        res.json(message);
    } catch (error) {
        console.error('Error sending group message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};
