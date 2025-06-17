const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { ExpressPeerServer } = require("peer"); // ✅ Import Peer server
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.get("/", (req, res) => {
    res.send("Video Chat Backend + PeerJS Server Running ✅");
});

// ✅ Create PeerJS server
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: "/peerjs",
});

app.use("/peerjs", peerServer); // ✅ mount it at /peerjs

// ✅ Socket.io events
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-joined", socket.id);

        socket.on("disconnect", () => {
            socket.to(roomId).emit("user-disconnected", socket.id);
        });
    });
});

// ✅ Start server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
