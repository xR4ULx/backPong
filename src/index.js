const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

// POSTGRES SQL
//const { Client } = require('pg');

//const client = new Client({
//  connectionString: process.env.DATABASE_URL,
//  ssl: {
//    rejectUnauthorized: false
//  }
//});

//client.connect();


const app = express();
const server = http.Server(app);
const io = socketio(server);

class Player{
    constructor(name, id){
       this.name = name ;
       this.id = id;
    }
}

let Players = [];

app.get('/', (req, res) => {
    res.send(Players);
});

//socket io logic
io.on('connection', socket => {

    console.log('Usuario conectado');
    socket.emit('on-connected');
    
    socket.on('login',(player)=>{
        p = new Player(player, socket.id);
        Players.push(p);
    })

    // Nos conectamos a una room llamada game
    socket.on('request',(player1, player2)=>{

        socket.join(`${player1}`);
        const indexPlayer2 = Players.findIndex(item => item.displayName === player2);
        io.to(Players[indexPlayer2].id).emit('on-request', player1);
        console.log('Player1 in game')

    })

    socket.on('response',(gameid, accept)=>{
        if(accept){
            socket.join(`${gameid}`);
            socket.in('${gameid}').emit('on-response');
            console.log('Player2 accept game')
        }
    })

    // Emitimos a todos los players de game
    socket.on('changeTurn',(gameid)=> {
        socket.in('${gameid}').emit('on-changeTurn');
    })

    socket.on('exit', (gameid)=>{
        io.sockets.clients(gameid).forEach(function(s){
            s.leave(gameid);
        })
        socket.in('${gameid}').emit('on-exit');
    })

});

const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
    console.log('Server corriendo en ' + PORT);
});