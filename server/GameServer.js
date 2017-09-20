/**
 * Created by Jerome on 20-09-17.
 */

var Player = require('./Player.js').Player;

var GameServer = {
    lastPlayerID: 0,
    players: {}, // player.id -> player
    socketMap: {} // socket.id -> player.id
};

GameServer.addPlayer = function(socket){
    var player = new Player(socket,GameServer.lastPlayerID++);
    GameServer.players[player.id] = player;
    GameServer.socketMap[socket.id] = player.id;
    console.log(GameServer.server.getNbConnected()+' connected');
};

GameServer.removePlayer = function(socketID){
    var playerID = GameServer.socketMap[socketID];
    delete GameServer.socketMap[socketID];
    delete GameServer.players[playerID];
    console.log(GameServer.server.getNbConnected()+' connected');
};

module.exports.GameServer = GameServer;