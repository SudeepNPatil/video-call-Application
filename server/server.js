const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3001;

app.use(cors());

io.on('connection', socket => {
    console.log('User connected:', socket.id);

    socket.on('join-room', roomId => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', socket.id);

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', socket.id);
        });
    });
});

app.get('/', (req, res) => {
    res.send('Video Chat Backend is Running');
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
