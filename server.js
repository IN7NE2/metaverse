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
    console.log(`Player connected: ${socket.id}`);

    // When a new player joins
    players[socket.id] = { x: 400, y: 300 }; // Default position
    io.emit('updatePlayers', players); // Send all players data to everyone

    // When a player moves
    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id] = data;
            io.emit('updatePlayers', players); // Broadcast movement
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
