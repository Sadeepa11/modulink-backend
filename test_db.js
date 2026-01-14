const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log('Attempting to connect to database...');
    try {
        const userCount = await prisma.user.count();
        console.log(`Successfully connected! User count: ${userCount}`);

        // Test Chat table existence
        const chatCount = await prisma.chat.count();
        console.log(`Chat table exists! Chat count: ${chatCount}`);

        // Test Implicit Table existence by trying to query chats with users
        const formattedUsers = await prisma.user.findMany({
            include: { chats: true },
            take: 1
        });
        console.log('Successfully queried relation table _UserChats.');

    } catch (e) {
        console.error('CONNECTION ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
