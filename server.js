console.log(require('dotenv').config());
var express = require('express');
var app = express();
var server = require('http').Server(app);
var bodyParser = require("body-parser");
var io = require('socket.io').listen(server);
var path = require('path');


var quickselect = require('quickselect'); // Used to compute the median for latency
var mongoose = require('mongoose');
var myArgs = require('optimist').argv;

console.log(process.memoryUsage().heapUsed/1024/1024,'Mb memory used');

import GameServer from './server/GameServer'
GameServer.server = server;

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    next();
});

const corssss =  function (res, path) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
        res.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
        res.setHeader("X-Powered-By", ' 3.2.1');
        res.type("application/json");
        res.type("jpg");
};

app.use('/assets',express.static('./assets', corssss));
// app.use('/client',express.static('./client'));
app.use('/dist',express.static('./dist'));
// app.use('/server',express.static('./server'));
// app.use('/shared',express.static('./shared'));
app.use('/maps',express.static('./maps'));
app.use('/admin',express.static('./admin'));
app.use('/api',express.static('./admin'));
app.use('/editor',express.static('./editor'));

// app.use((req, res, next) => { //change app.all to app.use here and remove '*', i.e. the first parameter part
//     res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
//     res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
//     res.setHeader("X-Powered-By",' 3.2.1')
//     res.type("application/json");
//     res.type("jpg");
//     next();
// });

// app.use('/assets', express.static('upload', {
//     setHeaders: function(res, path) {
//         res.set("Access-Control-Allow-Origin", "*");
//         res.set("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
//         res.set("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
//         res.set("X-Powered-By",' 3.2.1')
//         res.type("application/json");
//         res.type("jpg");
//     }
// }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

if(process.env.DEV == 1) app.use('/studio',express.static(__dirname + '/studio'));


app.get('/',function(req,res){
    res.sendFile(path.join(__dirname,'..','index.html'));
});

app.get('/admin',function(req,res){
    res.sendFile(path.join(__dirname,'..','admin','admin.html'));
});

app.get('/api',function(req,res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
    res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.setHeader("X-Powered-By",' 3.2.1');
    res.type("application/json");
    res.type("jpg");
    res.sendFile(path.join(__dirname,'admin','admin.html'));
});

app.get('/editor',function(req,res){
    res.sendFile(path.join(__dirname,'editor','index.html'));
});

app.get('/crafting',function(req,res){
    res.sendFile(path.join(__dirname,'editor','crafting.html'));
});

var GEThandlers = {
    'buildings': GameServer.getBuildings,
    'count-items': GameServer.countItems,
    'events': GameServer.getEvents,
    'players': GameServer.getPlayers,
    'screenshots': GameServer.getScreenshots
};
var categories = Object.keys(GEThandlers);

categories.forEach(function(cat){
    app.get('/api/' + cat, function (req, res) {
        console.log('[ADMIN] requesting ' + cat);
        if(!(cat in GEThandlers)) return;
        GEThandlers[cat](function(data){
            if (data.length == 0) {
                res.status(204).end();
            } else {
                // res.setHeader('Access-Control-Allow-Origin', '*');
                // res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(data).end();
            }
        });
    });
    // TODO: redundant
    app.get('/admin/' + cat, function (req, res) {
        console.log('[ADMIN] requesting ' + cat);
        if(!(cat in GEThandlers)) return;
        GEThandlers[cat](function(data){
            if (data.length == 0) {
                res.status(204).end();
            } else {
                // res.setHeader('Access-Control-Allow-Origin', '*');
                // res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(data).end();
            }
        });
    });
});

// var POSThandlers = {
//     'deletebuilding': GameServer.deleteBuilding,
//     'dump': GameServer.dump,
//     'newbuilding': GameServer.insertNewBuilding,
//     'setgold': GameServer.setBuildingGold,
//     'setitem': GameServer.setBuildingItem,
//     'setprice': GameServer.setBuildingPrice,
// };
// var events = Object.keys(POSThandlers);

// events.forEach(function(e){
//     app.post('/admin/' + e, function (req, res) {
//         console.log('[ADMIN] posting ' + e);
//         var data = req.body;
//         if(!data){
//             res.status(400).end();
//             return;
//         }
//         var result = POSThandlers[e](data);
//         if (!result) {
//             res.status(500).end();
//         } else {
//             res.setHeader('Content-Type', 'application/json');
//             res.status(201).send().end();
//         }
//     });
// });

if(process.env.DEV == 1) {
    app.get('/studio', function (req, res) {
        res.sendFile(__dirname + '/studio/studio.html');
    });
    app.get('/map', function (req, res) {
        res.sendFile(__dirname + '/studio/gmaps/map.html');
    });
    app.get('/bezier', function (req, res) {
        res.sendFile(__dirname + '/studio/bezier/bezier.html');
    });
}

server.listen(process.env.PORT || myArgs.port || 8081,function(){
    console.log(process.memoryUsage().heapUsed/1024/1024,'Mb memory used');
    console.log('Listening on '+server.address().port);
    console.log('Config environment: '+(process.env.NODE_CONFIG_ENV || 'default'));

    let mongodbAuth = {
        useNewUrlParser: true
    };
    if (process.env.MONGODB_AUTH) {
        console.log('Create auth object with user, pass, client');
        mongodbAuth = {
            user: process.env.MONGODB_USERNAME || 'root',
            pass: process.env.MONGODB_PASSWORD || 'password',
            useMongoClient: true,
            useNewUrlParser: true
        };
    }

    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/westward', mongodbAuth);
    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        server.db = db;
        console.log('Connection to db established');
        GameServer.readMap();
    });
    console.log(process.memoryUsage().heapUsed/1024/1024,'Mb memory used');
});


server.resetStamp = 1519130567967; // ignore returning players with stamps older than this and treat them as new

process.on('uncaughtException', function(err) {
    GameServer.sendSlackNotification(err.toString(),'warning');
    console.error('Caught exception: ' + err);
    console.trace(err);
});

io.on('connection',function(socket){
    socket.emit('ack');

    socket.on('boot-params',function(data){
        GameServer.getBootParams(socket,data);
    });

    socket.on('init-world',function(data){ // Sent by client.requestData()
        if(!GameServer.initialized){
            socket.emit('wait');
            return;
        }
        console.log('['+socket.id+'] Initialized');
        if(!data.stamp || data.stamp < server.resetStamp) data.new = true; // TODO Remove eventually

        console.log(data);
        // data.new = true;
        // data.characterName = 'Joe';
        if(data.new){ // new players OR tutorial
            GameServer.addNewPlayer(socket,data);
        }else{
            GameServer.loadPlayer(socket,data);
        }

        var callbacksMap = {
            'ability': GameServer.purchaseAbility,
            'battleAction': GameServer.handleBattleAction,
            'buildingClick': GameServer.handleBuildingClick,
            'build': GameServer.handleBuild,
            'belt': GameServer.handleBelt,
            'chat': GameServer.handleChat,
            'craft': GameServer.handleCraft,
            'exit': GameServer.handleExit,
            'gold': GameServer.handleGold,
            'menu': GameServer.logMenu,
            'mic': GameServer.logMisc,
            'NPCClick': GameServer.handleNPCClick,
            'prices': GameServer.setBuildingPrice,
            'path': GameServer.handlePath,
            'respawn': GameServer.handleRespawn,
            'screenshot': GameServer.handleScreenshot,
            'shop': GameServer.handleShop,
            'tutorial-end': GameServer.handleTutorialEnd,
            'tutorial-start': GameServer.handleTutorialStart,
            'tutorial-step': GameServer.handleTutorialStep,
            'unequip': GameServer.handleUnequip,
            'use': GameServer.handleUse,
        };

        var handler = socket.onevent;
        socket.onevent = function(pkt){
            var event = pkt.data[0];
            var data = pkt.data[1];
            console.log(event,data);
            if(callbacksMap.hasOwnProperty(event)) callbacksMap[event](data,socket.id);
            handler.call(this,pkt); // just in case
        };

        /*socket.pings = [];

       socket.on('ponq',function(sentStamp){
           // Compute a running estimate of the latency of a client each time an interaction takes place between client and server
           // The running estimate is the median of the last 20 sampled values
           var ss = server.getShortStamp();
           var delta = (ss - sentStamp)/2;
           if(delta < 0) delta = 0;
           socket.pings.push(delta); // socket.pings is the list of the 20 last latencies
           if(socket.pings.length > 20) socket.pings.shift(); // keep the size down to 20
           socket.latency = server.quickMedian(socket.pings.slice(0)); // quickMedian used the quickselect algorithm to compute the median of a list of values
       });*/
    }); // end of on init-world

    socket.on('region-data',function(){
        socket.emit('region-data',GameServer.listRegions());
    });

    socket.on('camps-data',function(){
        socket.emit('camps-data',GameServer.listCamps());
    });

    socket.on('disconnect',function(){
        GameServer.handleDisconnect(socket.id);
    });
});

server.sendInitializationPacket = function(socket,packet){
    // console.warn('sending init');
    packet = server.addStamp(packet);
    //if(server.enableBinary) packet = Encoder.encode(packet,CoDec.initializationSchema);
    socket.emit('init',packet);
};

server.sendUpdate = function(socketID,pkg){
    // console.warn('sending update',pkg);
    var socket = server.getSocket(socketID);
    if(!socket) console.warn('No socket found');
    pkg = server.addStamp(pkg);
    if(socket) pkg.latency = Math.floor(socket.latency);
    //if(server.enableBinary) pkg = Encoder.encode(pkg,CoDec.finalUpdateSchema);
    if(pkg) io.in(socketID).emit('update',pkg);
};

server.addStamp = function(pkg){
    pkg.stamp = server.getShortStamp();
    return pkg;
};

server.getShortStamp = function(){
    return parseInt(Date.now().toString().substr(-9));
};

server.getSocket = function(id){
    return io.sockets.connected[id]; // won't work if the socket is subscribed to a namespace, because the namsepace will be part of the id
};

server.getNbConnected =function(){
    return Object.keys(GameServer.players).length;
};

server.quickMedian = function(arr){ // Compute the median of an array using the quickselect algorithm
    var  l = arr.length;
    var n = (l%2 == 0 ? (l/2)-1 : (l-1)/2);
    quickselect(arr,n);
    return arr[n];
};

server.sendID = function(socket,playerID){
    socket.emit('pid',playerID);
};

server.sendError = function(socket){
    socket.emit('serv-error'); // "error" only is a reserved socket.io event name
};

