var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

//app.use('/css',express.static(__dirname + '/client/css'));
app.use('/assets',express.static(__dirname + '/assets'));
app.use('/client',express.static(__dirname + '/client'));
app.use('/server',express.static(__dirname + '/server'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});
