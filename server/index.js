const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIO = require('socket.io');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/task');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*', // allow frontend dev server
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// 👇 Make `io` accessible in routes
app.set('io', io);

// 🔗 Middlewares
app.use(cors());
app.use(express.json());

// 🔐 Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// 🌐 MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// 🔁 Socket.IO connection
io.on('connection', socket => {
  console.log('🔌 User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
