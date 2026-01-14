const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
    // 1. Create Data
    const password = await bcrypt.hash('password123', 10);

    // Ensure we have at least two users
    let alice = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
            username: 'alice',
            email: 'alice@example.com',
            password: password,
            gender: 'Female'
        }
    });

    let bob = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: {
            username: 'bob',
            email: 'bob@example.com',
            password: password,
            gender: 'Male'
        }
    });

    console.log(`Users created: ${alice.username}, ${bob.username}`);

    // 2. Create Chat
    const existingChat = await prisma.chat.findFirst({
        where: {
            AND: [
                { users: { some: { id: alice.id } } },
                { users: { some: { id: bob.id } } }
            ]
        }
    });

    let chat;
    if (!existingChat) {
        chat = await prisma.chat.create({
            data: {
                users: {
                    connect: [
                        { id: alice.id },
                        { id: bob.id }
                    ]
                }
            }
        });
        console.log(`Chat created between ${alice.username} and ${bob.username}`);
    } else {
        chat = existingChat;
        console.log('Chat already exists');
    }

    // 3. Create Message
    const message = await prisma.message.create({
        data: {
            content: 'Hello Bob! This is a test message.',
            senderId: alice.id,
            chatId: chat.id
        }
    });

    console.log('Test message sent:', message.content);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
