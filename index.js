const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/', authRoutes);
app.use('/chats', require('./routes/chatRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/groups', require('./routes/groupRoutes'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
