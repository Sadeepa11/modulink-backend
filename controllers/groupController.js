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

// NEW: Get Group Details
exports.getGroupDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const group = await prisma.group.findUnique({
            where: { id: parseInt(id) },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, username: true, profilePic: true }
                        }
                    }
                }
            }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if user is member
        const isMember = group.members.some(member => member.userId === userId);
        if (!isMember) {
            return res.status(403).json({ error: 'Not authorized to view this group' });
        }

        res.json(group);
    } catch (error) {
        console.error('Error fetching group details:', error);
        res.status(500).json({ error: 'Failed to fetch group details' });
    }
};

// NEW: Update Group Info
exports.updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon } = req.body;
        const userId = req.user.userId;

        // Check if user is admin
        const member = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: userId,
                    groupId: parseInt(id)
                }
            }
        });

        if (!member || member.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can update group settings' });
        }

        const updatedGroup = await prisma.group.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                icon
            }
        });

        res.json(updatedGroup);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Failed to update group' });
    }
};

// NEW: Manage Members (Promote/Remove)
exports.updateGroupMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { memberId, action } = req.body; // action: 'PROMOTE', 'DEMOTE', 'REMOVE'
        const userId = req.user.userId;

        // Check format of memberId
        if (!memberId) {
            return res.status(400).json({ error: 'Member ID is required' });
        }

        // Check requester is admin
        const requester = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: userId,
                    groupId: parseInt(id)
                }
            }
        });

        if (!requester || requester.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can manage members' });
        }

        // Perform action
        if (action === 'REMOVE') {
            await prisma.groupMember.delete({
                where: {
                    userId_groupId: {
                        userId: memberId,
                        groupId: parseInt(id)
                    }
                }
            });
            return res.json({ message: 'Member removed' });
        } else if (action === 'PROMOTE') {
            const updatedMember = await prisma.groupMember.update({
                where: {
                    userId_groupId: {
                        userId: memberId,
                        groupId: parseInt(id)
                    }
                },
                data: { role: 'ADMIN' }
            });
            return res.json(updatedMember);
        } else if (action === 'DEMOTE') {
            const updatedMember = await prisma.groupMember.update({
                where: {
                    userId_groupId: {
                        userId: memberId,
                        groupId: parseInt(id)
                    }
                },
                data: { role: 'MEMBER' }
            });
            return res.json(updatedMember);
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

    } catch (error) {
        console.error('Error updating group member:', error);
        res.status(500).json({ error: 'Failed to update member' });
    }
};
