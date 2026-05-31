const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: "*" 
    },
    transports: ["websocket"] // <--- DIESE ZEILE MUSS HIER REIN!
});

const rooms = {};

io.on('connection', (socket) => {
    console.log(`Spieler verbunden: ${socket.id}`);

    socket.on('createRoom', (roomCode) => {
        rooms[roomCode] = { players: [socket.id] };
        socket.join(roomCode);
        console.log(`Lobby ${roomCode} erstellt.`);
    });

    // ==========================================
// MULTIPLAYER: GEGNER ZEICHNEN BEI MATCHSTART
// ==========================================

// Dein Server sendet 'matchStart', also fangen wir genau das ab!
socket.on('matchStart', () => {
    console.log("Das Match startet! Erstelle die gegnerische Spielfigur...");
    
    // Prüfen, ob der Gegner nicht schon existiert
    if (document.getElementById('enemy-player')) return;

    let gegner = document.createElement('div');
    gegner.id = 'enemy-player'; 
    gegner.style.position = 'absolute';
    
    // Da der Server keine Position mitschickt, setzen wir ihn auf eine Startposition
    gegner.style.left = '300px'; 
    gegner.style.top = '300px';  
    gegner.style.width = '50px';  
    gegner.style.height = '50px';
    gegner.style.background = 'red'; // Das rote Viereck
    gegner.style.zIndex = '9999';   // Ganz nach oben legen
    
    document.body.appendChild(gegner);
    console.log("Rote Gegner-Spielfigur wurde erfolgreich gezeichnet!");
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


server.listen(3000, () => {
    console.log('--- SERVER READY ---');
    console.log('Der Spieleserver läuft auf http://localhost:3000');
});
