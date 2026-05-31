const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

io.on('connection', (socket) => {
    console.log(`Spieler verbunden: ${socket.id}`);

    socket.on('createRoom', (roomCode) => {
        rooms[roomCode] = { players: [socket.id] };
        socket.join(roomCode);
        console.log(`Lobby ${roomCode} erstellt.`);
    });

    socket.on('joinRoom', (roomCode) => {
        if (rooms[roomCode]) {
            rooms[roomCode].players.push(socket.id);
            socket.join(roomCode);
            console.log(`Spieler ist Lobby ${roomCode} beigetreten.`);
            io.to(roomCode).emit('matchStart');
        } else {
            socket.emit('errorMsg', 'Lobby nicht gefunden!');
        }
    });

    socket.on('playerMove', (data) => {
        socket.to(data.roomCode).emit('enemyMove', { x: data.x, z: data.z });
    });

    socket.on('disconnect', () => {
        console.log(`Spieler getrennt: ${socket.id}`);
    });
});

server.listen(3000, () => {
    console.log('--- SERVER READY ---');
    console.log('Der Spieleserver läuft auf http://localhost:3000');
});
