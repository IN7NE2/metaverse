const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const players = {}; // Store player data

app.use(express.static(__dirname)); // Serve static files that means where you create html and game.js file 
//its root so we write here _dirname ok 

io.on('connection', (socket) => {
const spriteList = ["player_01", "player_02", "player_03"];
const randomSprite = spriteList[Math.floor(Math.random() * spriteList.length)];


const spawnPoint = { x: 400, y: 300 };

players[socket.id] = { x: spawnPoint.x, y: spawnPoint.y, sprite: randomSprite };
    console.log(`Player connected: ${socket.id}`);

    // When a new player joins
    players[socket.id] = { x: 400, y: 300 }; // Default position
    io.emit('updatePlayers', players); // Send all players data to everyone
    console.log("broadcasting palyers:",players)
    // When a player moves
    socket.on("playerMove", (data) => {
        console.log(`Received movement from ${socket.id}:`, data); // ✅ Debugging
    
        if (players[socket.id]) {
            players[socket.id] = { 
                x: data.x,
                y: data.y, 
                anim: data.anim,
                sprite: players[socket.id].sprite };
            
            console.log(`Updated player data:`, players[socket.id]); // ✅ Debugging
    
            io.emit('updatePlayers', players); // Broadcast movement + animation
            console.log("Broadcasting players:", players); // ✅ Debugging
        }
    });
    // When a player disconnects
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit('updatePlayers', players); // Update remaining players
    });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
