var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

//app.use('/css',express.static(__dirname + '/client/css'));
app.use('/assets',express.static(__dirname + '/assets'));
app.use('/client',express.static(__dirname + '/client'));
app.use('/server',express.static(__dirname + '/server'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/lab.html');
});

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});

io.on('connection',function(socket){
    socket.on('mapdata',function(data){
        console.log('Saving changes to chunk '+data.id+'...');
        var dir = __dirname+'/assets/maps/chunks/';
        fs.writeFile(dir+'chunk'+data.id+'.json',JSON.stringify(data.data),function(err){
            if(err) throw err;
            console.log('done');
        });
    });
});
