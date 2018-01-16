/**
 * Created by Jerome on 27-10-17.
 */
var GameServer = require('./GameServer.js').GameServer;

var TURN_DURATION = 5 // 30

function Battle(f1,f2){
    this.id = GameServer.lastBattleID++;
    this.fighters = [f2,f1]; // the fighter at position 0 is the one currently in turn
    this.area = []; // array of rectangular areas
    this.countdown = null;
    this.start();
}

Battle.prototype.start = function(){
    this.computeArea();
    var _battle = this;
    this.fighters.forEach(function(f){
        f.setProperty('inFight',true);
        f.battle = _battle;
    });
    this.loop = setInterval(this.update.bind(this),1000);
    this.newTurn();
};

Battle.prototype.computeArea = function(){
    var f1 = this.fighters[1];
    var f2 = this.fighters[0]; // TODO: generalize to more fighters

    var tl = {x: null, y: null};
    if (f1.x <= f2.x && f1.y <= f2.y) {
        tl.x = f1.x;
        tl.y = f1.y;
    } else if (f1.x <= f2.x && f1.y > f2.y) {
        tl.x = f1.x;
        tl.y = f2.y;
    }else if(f1.x > f2.x && f1.y <= f2.y){
        tl.x = f2.x;
        tl.y = f1.y;
    }else if(f1.x > f2.x && f1.y > f2.y){
        tl.x = f2.x;
        tl.y = f2.y;
    }

    if(f1.x == f2.x) tl.x -= 1;
    if(f1.y == f2.y) tl.y -= 1;

    var w = Math.max(Math.abs(f1.x - f2.x)+1,3);
    var h = Math.max(Math.abs(f1.y - f2.y)+1,3);

    this.area.push({
        x: tl.x,
        y: tl.y,
        w: w,
        h: h
    });

    var area = this.area;
    this.fighters.forEach(function(f){
        f.setProperty('battlezone',area);
    });
};

Battle.prototype.newTurn = function(){
    this.fighters.push(this.fighters.shift());
    this.countdown = TURN_DURATION;
    console.log('[B'+this.id+'] It is now '+(this.fighters[0].constructor.name)+'\'s turn');

    for(var i = 0; i < this.fighters.length; i++){
        var f = this.fighters[i];
        if(i == 0 && f.constructor.name == 'Player') f.updatePacket.remainingTime = this.countdown;
    };
};

Battle.prototype.update = function(){
    console.log('[B'+this.id+'] Updating');
    this.countdown--;
    if(this.countdown == 0) this.newTurn();
};

Battle.prototype.end = function(){
    clearInterval(this.loop);
    this.fighters.forEach(function(f){
        f.setProperty('inFight',false);
        f.setProperty('battlezone',[]);
        f.battle = null;
    });
    console.log('[B'+this.id+'] Ended');
    // TODO: respawn if quitting battle by disconnecting
};

module.exports.Battle = Battle;