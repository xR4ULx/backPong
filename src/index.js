const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const axios = require('axios');
dotenv.config();

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();


const app = express();
const server = http.Server(app);
const io = socketio(server);

app.get('/', (req, res) => {
    client.query('SELECT * FROM users', (error, results) => {
        if (error) {
          throw error
        }
        res.status(200).json(results.rows)
      })
});

//socket io logic
io.on('connection', socket => {

    console.log('Usuario conectado');
    socket.emit('on-connected');
    
    socket.on('registered',(id)=>{
        client.query(`SELECT name FROM users WHERE device = '${id}'`,(error, results) =>{
            if(error){
                socket.emit('on-registered');
            }else if(results.rowCount > 0){
                socket.emit('on-registered', results.rows);
            }else{
                socket.emit('on-registered');
            }
            
        })
    })

    // Nos conectamos a una room llamada game
    socket.on('start',()=>{
        socket.join('game');
        console.log('user in game')
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
    console.log('Server corriendo en ' + PORT);
});