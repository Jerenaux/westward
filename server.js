var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

//app.use('/css',express.static(__dirname + '/client/css'));
app.use('/assets',express.static(__dirname + '/assets'));
app.use('/client',express.static(__dirname + '/client'));
app.use('/server',express.static(__dirname + '/server'));
app.use('/shared',express.static(__dirname + '/shared'));
if(process.env.DEV == 1) app.use('/studio',express.static(__dirname + '/studio'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

if(process.env.DEV == 1) {
    app.get('/studio', function (req, res) {
        res.sendFile(__dirname + '/studio/studio.html');
    });
    app.get('/map', function (req, res) {
        res.sendFile(__dirname + '/studio/map.html');
    });
}

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
    server.setUpdateLoop();
});

var gs = require('./server/GameServer.js').GameServer;
gs.server = server;

server.clientUpdateRate = 1000/5; // Rate at which update packets are sent

io.on('connection',function(socket){

    socket.on('init-world',function(){
        console.log('['+socket.id+'] Initialized');
        gs.addPlayer(socket);

        socket.on('move',function(data){
            gs.move(socket.id,data.x,data.y);
        });
    });

    socket.on('disconnect',function(){
        console.log('['+socket.id+'] Disconnected');
        gs.removePlayer(socket.id);
    });

    // #########################
    if(process.env.DEV == 1) {
        socket.on('mapdata',function(data){
            console.log('Saving changes to chunk '+data.id+'...');
            var dir = __dirname+'/assets/maps/chunks/'; // Replace by env variable
            fs.writeFile(dir+'chunk'+data.id+'.json',JSON.stringify(data.data),function(err){
                if(err) throw err;
                console.log('done'); // replace by counter
            });
        });
    }
});

server.sendMsg = function(socket,msg,data){
    socket.emit(msg,data);
};

server.emitMsg = function(msg,data){
    //console.log('msg = '+msg+', data = '+data);
    io.emit(msg,data);
};

server.setUpdateLoop = function(){
    setInterval(gs.updatePlayers,server.clientUpdateRate);
};


server.getNbConnected =function(){
    return Object.keys(gs.players).length;
};
