/**
 * Created by Jerome on 30-06-17.
 */

Client = {};

Client.socket = io.connect();

Client.sendMapData = function(id,data){
    Client.socket.emit('mapdata',{id:id,data:data});
};
