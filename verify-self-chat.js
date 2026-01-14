const axios = require('axios');

async function testSelfChat() {
    try {
        // 1. Login to get token
        console.log('Logging in as alice...');
        let token;
        let userId;

        try {
            const loginRes = await axios.post('http://localhost:3000/login', {
                username: 'alice', // Known user
                password: 'password123'
            });
            token = loginRes.data.token;
            userId = loginRes.data.user.id;
        } catch (loginErr) {
            console.error('Login failed for alice:', loginErr.message);
            if (loginErr.response) {
                console.error('Login Status:', loginErr.response.status);
                console.error('Login Data:', loginErr.response.data);
            }
            // Try to register if login failed (maybe alice doesn't exist?)
            console.log('Trying to register new user...');
            const regRes = await axios.post('http://localhost:3000/register', {
                username: 'SelfChatTester_' + Date.now(),
                email: 'selfchat_' + Date.now() + '@test.com',
                password: 'password123'
            });
            token = regRes.data.token;
            userId = regRes.data.user.id;
        }

        console.log('Logged in as User ID:', userId);

        // 2. Create Self Chat
        console.log('Creating self chat...');
        const createRes = await axios.post('http://localhost:3000/chats', {
            targetUserId: userId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Create Chat Response:', createRes.data);
        const chatId = createRes.data.id;
        const chatUsers = createRes.data.users;

        if (chatUsers.length === 1 && chatUsers[0].id === userId) {
            console.log('SUCCESS: Chat created with exactly 1 user (self).');
        } else if (chatUsers.length === 0) {
            // Prisma might verify connect return
            console.log('Chat users likely linked.');
        } else {
            console.log('WARNING: Chat users count:', chatUsers.length);
        }

        // 3. Verify Idempotency (Create again)
        console.log('Creating self chat AGAIN (should return same)...');
        const createRes2 = await axios.post('http://localhost:3000/chats', {
            targetUserId: userId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (createRes2.data.id === chatId) {
            console.log('SUCCESS: Returned existing chat ID.');
        } else {
            console.log('FAILURE: Created a duplicate chat!', createRes2.data.id);
        }

        // 4. Send Message
        console.log('Sending message to self...');
        await axios.post(`http://localhost:3000/chats/${chatId}/messages`, {
            content: 'Note to self'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 5. Get Chats
        console.log('Fetching chats...');
        const chatsRes = await axios.get('http://localhost:3000/chats', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const myChat = chatsRes.data.find(c => c.id === chatId);
        if (myChat) {
            console.log('SUCCESS: Self chat found in list.');
            console.log('Last message:', myChat.messages[0]?.content);
        } else {
            console.log('FAILURE: Self chat NOT found in list.');
        }

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testSelfChat();
