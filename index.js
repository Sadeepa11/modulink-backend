const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/', (req, res) => {
    res.send('Backend is running');
});

app.use('/', authRoutes);
app.use('/chats', require('./routes/chatRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/groups', require('./routes/groupRoutes'));

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;
