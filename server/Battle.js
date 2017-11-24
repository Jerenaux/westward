/**
 * Created by Jerome on 27-10-17.
 */
var GameServer = require('./GameServer.js').GameServer;

var TURN_DURATION = 3; // 30

function Battle(f1,f2){
    this.id = GameServer.lastBattleID++;
    this.fighters = [f2,f1]; // the fighter at position 0 is the one currently in turn
    this.countdown = null;
    this.start();
}

Battle.prototype.start = function(){
    var _battle = this;
    this.fighters.forEach(function(f){
        if(f.constructor.name == 'Player') f.setProperty('inFight',true);
        f.battle = _battle;
    });
    this.loop = setInterval(this.update.bind(this),1000);
    this.newTurn();
};

Battle.prototype.newTurn = function(){
    this.fighters.push(this.fighters.shift());
    this.countdown = TURN_DURATION;
    console.log('[B'+this.id+'] It is now '+(this.fighters[0].constructor.name)+'\'s turn');
    // TODO notify client onf turn change
};

Battle.prototype.update = function(){
    console.log('[B'+this.id+'] Updating');
    this.countdown--;
    if(this.countdown == 0) this.newTurn();
};

Battle.prototype.end = function(){
    clearInterval(this.loop);
};

module.exports.Battle = Battle;