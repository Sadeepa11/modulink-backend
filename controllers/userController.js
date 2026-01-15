const prisma = require('../db');

const getUsers = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { search } = req.query;

        console.log('Fetching users. Current User ID:', currentUserId, 'Search:', search);

        let where = {
            id: {
                not: currentUserId // Exclude current user from the general list (optional, but good for "other contacts")
            }
        };

        if (search) {
            where.username = {
                contains: search
            };
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                profilePic: true,
                email: true
            }
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                profilePic: true,
                email: true,
                bio: true,
                website: true,
                isOnline: true,
                lastSeen: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Failed to fetch current user' });
    }
};

const getUserById = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                profilePic: true,
                isOnline: true,
                lastSeen: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { username, bio, website, gender } = req.body;

        let updateData = {
            username,
            bio,
            website,
            gender
        };

        if (req.file) {
            updateData.profilePic = req.file.path;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                profilePic: true,
                email: true,
                bio: true,
                website: true,
                gender: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Prisma doesn't always cascade depending on DB, so manual cleanups often safer
        // But for SQLite with Prisma cascade relations (usually handled by Prisma client middleware or DB foreign keys)
        // Let's assume simple delete for now, if errors occur we can revisit.
        // Or we can soft delete. User asked for "delete account".

        await prisma.user.delete({
            where: { id: userId }
        });

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

module.exports = {
    getUsers,
    getCurrentUser,
    updateProfile,
    deleteAccount,
    getUserById
};
