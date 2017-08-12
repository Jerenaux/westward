/**
 * Created by Jerome on 30-06-17.
 */

Client = {};

Client.socket = io.connect();

Client.sendPoints = function(pts){
    socket.emit('points',pts);
};

Client.socket.on('hull',function(data){
    Engine.drawHull(data);
});