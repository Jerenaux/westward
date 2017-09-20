/**
 * Created by Jerome on 20-09-17.
 */

function Player(socket,id){
    this.socket = socket;
    this.id = id;
    console.log('['+id+'] Hi');
}

module.exports.Player = Player;