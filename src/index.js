const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const { json, response } = require('express');
const { disconnect } = require('process');
dotenv.config();

const app = express();
const server = http.Server(app);
const io = socketio(server);

class Player {
    constructor(displayName, socket_id, room) {
        this.displayName = displayName;
        this.socket_id = socket_id;
        this.room = room;
    }
}

let Players = [];

function getPlayerByName(displayName) {
    try {
        player = Players.findIndex(item => item.displayName === displayName);
        if (player != -1) {
            return Players[player];
        } else {
            return null;
        }
    } catch (error) {
        console.log('wizard say:' + error.message);
        return null;
    }

};

function getPlayerById(id) {
    try {
        player = Players.findIndex(item => item.socket_id === id);
        if (player != -1) {
            return Players[player];
        } else {
            return null;
        }
    } catch (error) {
        console.log('wizard say:' + error.message);
        return null;
    }

};



app.get('/', (req, res) => {
    res.json(Players);
});

//socket io logic
io.on('connection', socket => {

    socket.emit('on-connected');

    socket.on('disconnect', () => {
        try {
            player = getPlayerById(socket.id);
            io.to(socket.id).emit('on-finish', data);
            socket.in(player.room).emit('on-finish', data);
            if (player.room != null) {
                socket.leave(player.room);
                player.room = null;
            }
            console.log(player.displayName + 'disconnect');
        } catch (error) {
            console.log('wizard say:' + error.message);
        }
    });

    socket.on('login', (displayName) => {

        try {
            indexPlayer = Players.findIndex(item => item.displayName === displayName);
            if (indexPlayer != -1) {
                Players.splice(indexPlayer, 1);
                p = new Player(displayName, socket.id, null);
                Players.push(p);
            } else {
                p = new Player(displayName, socket.id, null);
                Players.push(p);
            }
        } catch (error) {
            console.log('wizard say:' + error.message);
        }

    })

    socket.on('logout', (displayName) => {

        try {
            player = getPlayerByName(displayName);

            if (player != null) {
                /* Salimos de la room si existe */
                if (player.room != null) {
                    socket.leave(player.room);
                    player.room = null;
                }
                /* Eliminamos el usuario de la lista */
                if (player != null) {
                    Players.splice(player, 1);
                }
            } else {
                console.log('wizard say: Player null');
            }

        } catch (error) {
            console.log('wizard say:' + error.message);
        }

    })

    socket.on('request', (displayName) => {
        try {
            player1 = getPlayerById(socket.id);
            player2 = getPlayerByName(displayName);

            if (player1 != null && player2 != null) {

                roomid = player1.socket_id + player2.socket_id;
                player1.room = roomid;
                player2.room = roomid;
                io.sockets.connected[player1.socket_id].join(roomid);
                io.sockets.connected[player2.socket_id].join(roomid);

                io.to(player2.socket_id).emit('on-request', player1.displayName);
            } else {
                io.to(socket.id).emit('on-cancel-request', true);
            }
        } catch (error) {
            io.to(socket.id).emit('on-cancel-request', true);
            console.log('wizard say:' + error.message);
        }


    })

    socket.on('response', ({ displayName, accept }) => {
        try {
            if (accept) {

                player1 = getPlayerByName(displayName);
                player2 = getPlayerById(socket.id);

                if (player1 != null && player2 != null) {

                    io.to(player1.socket_id).emit('on-response', true);

                } else {
                    io.to(socket.id).emit('on-cancel-request', true);
                }

            } else {
                io.to(player1.socket_id).emit('on-response', false);
            }
        } catch (error) {
            io.to(socket.id).emit('on-cancel-request', true);
            console.log('wizard say:' + error.message);
        }

    })



    // Emitimos a todos los players de game
    socket.on('changeTurn', (data) => {
        try {
            player = getPlayerById(socket.id);
            socket.in(player.room).emit('on-changeTurn', data);
        } catch (error) {
            console.log('wizard say:' + error.message);
        }

    });


    socket.on('finish', (data) => {
        try {
            player = getPlayerById(socket.id);
            socket.in(player.room).emit('on-finish', data);
            console.log(player.displayName + 'finish');
        } catch (error) {
            console.log('wizard say:' + error.message);
        }

    });

    socket.on('exit-game', (data) => {
        try {
            player = getPlayerById(socket.id);
            if (player.room != null) {
                socket.leave(player.room);
                player.room = null;
            }
            io.to(socket.id).emit('on-exit-game', true);
            console.log(player.displayName + 'exit-game');
        } catch (error) {
            console.log('wizard say:' + error.message);
        }

    })

});

//change
const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
    console.log('Server corriendo en ' + PORT);
});