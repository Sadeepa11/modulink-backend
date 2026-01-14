const axios = require('axios');

async function debugChat() {
    try {
        // 1. Login to get token
        console.log('Logging in as alice...');
        const loginResponse = await axios.post('http://localhost:3000/login', {
            username: 'alice',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        console.log('Got token:', token ? 'Yes' : 'No');

        // 2. Fetch Chats
        console.log('Fetching chats...');
        const chatsResponse = await axios.get('http://localhost:3000/chats', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Chats fetched successfully:', chatsResponse.data);

    } catch (error) {
        if (error.response) {
            console.error('Server returned error:', error.response.status);
            console.error('Error Body:', error.response.data);
        } else {
            console.error('Network/Other Error:', error.message);
        }
    }
}

debugChat();
