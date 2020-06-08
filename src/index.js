const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

const app = express();
const server = http.Server(app);
const io = socketio(server);

app.get('/', (req, res) => {
    res.send('backPong server is running');
});

//socket io logic
io.on('connection', socket => {

    console.log('User connected');

    // Nos conectamos a una room llamada game
    socket.on('start',()=>{
        socket.join('game');
    })

    // Emitimos a todos los players de game
    socket.on('down',(data)=> {
        socket.in('game').emit('down', data);
    })
    
    socket.on('move',(data)=> {
        socket.in('game').emit('move', data);
    })

});

const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
    console.log('running on ' + PORT);
});