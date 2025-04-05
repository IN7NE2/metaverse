const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const players = {}; // Store player data

app.use(express.static(__dirname)); // Serve static files

io.on('connection', (socket) => {
    const spriteList = ["player_01", "player_02", "player_03"];
    const randomSprite = spriteList[Math.floor(Math.random() * spriteList.length)];

    // Initialize new player
    players[socket.id] = { x: 400, y: 300, anim: "idle", sprite: randomSprite }; // Animation is included but commented out in updates
    console.log(`Player connected: ${socket.id}`);

    // Send existing players to the new player and notify all players
    socket.emit("updatePlayers", players);
    io.emit('updatePlayers', players);
    console.log("Broadcasting players:", players);

    // Handle player movement
    socket.on("playerMove", (data) => {
        if (players[socket.id]) {
            players[socket.id] = { 
                x: data.x, 
                y: data.y, 
              
                sprite: players[socket.id].sprite
            };
            console.log(data);
            io.emit('updatePlayers', players);
        }
    });


     // Handle chat messages
     socket.on("chatMessage", (message) => {
        io.emit("chatMessage", { id: socket.id, message });
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });

    // Send all players to a new player upon request
    socket.on("requestPlayers", () => {
        socket.emit("updatePlayers", players);
    });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));