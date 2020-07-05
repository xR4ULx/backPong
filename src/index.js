const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const axios = require('axios');
const { json, response } = require('express');
dotenv.config();

const app = express();
const server = http.Server(app);
const io = socketio(server);

class Player{
    constructor(displayName, socket, room){
       this.displayName = displayName ;
       this.socket = socket;
       this.room = room;
    }
}

let Players = [];

function getPlayerByName(displayName) {
    player = Players.findIndex(item => item.displayName === displayName);
    if (player != -1) {
        return Players[player];
    }
};

function getPlayerById(id) {
    player = Players.findIndex(item => item.socket.id === id);
    if (player != -1) {
        return Players[player];
    }
};

function getRoom(player){
    roomName = Object.keys(player.socket.adapter.rooms)[0];
    return roomName;
}


app.get('/', (req, res) => {
    res.send('alchemy')
});

//socket io logic
io.on('connection', socket => {

    socket.emit('on-connected');
    
    socket.on('login',(displayName)=>{
        player = getPlayerByName(displayName);
        if(player != null){
            Players.pop(player);
            p = new Player(displayName, socket);
            Players.push(p);
        }else{
            p = new Player(displayName, socket);
            Players.push(p);
        }
    })

    socket.on('logout', (displayName)=>{
        player = getPlayerByName(displayName);
        if(player != null){
            Players.pop(player);
        }
    })

    // Nos conectamos a una room llamada game
    socket.on('request',(displayName)=>{
        
        player1 = getPlayerById(socket.id);
        player2 = getPlayerByName(displayName);

        io.to(player2.socket.id).emit('on-request', player1.displayName);

    })

    socket.on('response',({ displayName, accept })=>{

        if(accept){

            player1 = getPlayerByName(displayName);
            player2 = getPlayerById(socket.id);
            roomid = player1.socket.id + player2.socket.id;
            player1.room = roomid;
            player2.room = roomid;
            player1.socket.join(roomid);
            player2.socket.join(roomid);

            io.to(player1.socket.id).emit('on-response', true);

        }else{
            io.to(player1.socket.id).emit('on-response', false);
        }
    })
    
    // Emitimos a todos los players de game
    socket.on('changeTurn',(data)=> {
        player = getPlayerById(socket.id);
        socket.in(player.room).emit('on-changeTurn',data);
    })

    socket.on('finish', (data)=>{
        player = getPlayerById(socket.id);
        room = player.room;
        socket.leave(room);
    })

});

const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
    console.log('Server corriendo en ' + PORT);
});