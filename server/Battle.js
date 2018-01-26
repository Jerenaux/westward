/**
 * Created by Jerome on 27-10-17.
 */
var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;

var TURN_DURATION = 5*1000; // milliseconds
var TICK_RATE = 100; // milliseconds

function Battle(f1,f2){
    this.id = GameServer.lastBattleID++;
    this.participants = [f1,f2];
    this.fighters = [f2,f1]; // the fighter at position 0 is the one currently in turn
    this.teams = { // number of fighters of each 'team' involved in the fight
        'Animal': 1,
        'Player': 1
    };
    this.fallen = [];
    this.area = []; // array of rectangular areas
    this.ended = false;
    this.reset();
    this.start();
}

Battle.prototype.start = function(){
    this.computeArea();
    var _battle = this;
    this.fighters.forEach(function(f){
        f.setProperty('inFight',true);
        f.stopWalk();
        if(f.isPlayer) f.notifyFight(true);
        f.battle = _battle;
    });
    this.loop = setInterval(this.update.bind(this),TICK_RATE);
    this.newTurn();
};

Battle.prototype.update = function(){
    this.countdown -= TICK_RATE;
    if(this.countdown <= this.endTime) {
        this.endOfTurn();
        this.newTurn();
    }
};

Battle.prototype.endOfTurn = function(){
    for(var j = 0; j < this.fallen.length; j++) {
        for (var i = this.fighters.length - 1; i >= 0; i--) {
            var fighter = this.fighters[i];
            var fallen = this.fallen[j];
            if(fighter.getShortID() == fallen.getShortID()) this.removeFighter(fighter,i);
        }
    }
    this.fallen = [];
};

Battle.prototype.getFighterIndex = function(f){
    for(var i = 0; i < this.fighters.length; i++){
        if(this.fighters[i].getShortID() == f.getShortID()) return i;
    }
    return -1;
};

Battle.prototype.removeFighter = function(f,idx){
    if(idx == -1) idx = this.getFighterIndex(f);
    if(idx == -1) return;
    f.endFight();
    f.die();
    this.fighters.splice(idx,1);
    this.updateTeams(f.constructor.name);
};

Battle.prototype.updateTeams = function(team){
    this.teams[team]--;
    if(this.teams[team] <= 0) this.end();
};

Battle.prototype.reset = function(){
    this.countdown = TURN_DURATION;
    this.endTime = 0;
    this.actionTaken = false;
};

Battle.prototype.newTurn = function(){
    if(this.ended) return;
    this.fighters.push(this.fighters.shift());
    this.reset();
    console.log('[B'+this.id+'] New turn');
    //console.log('[B'+this.id+'] It is now '+(this.fighters[0].constructor.name)+'\'s turn');

    var activeFighter = this.getActiveFighter();
    for(var i = 0; i < this.fighters.length; i++){
        var f = this.fighters[i];
        if(f.isPlayer) {
            if(i == 0) f.updatePacket.remainingTime = this.countdown/1000;
            f.updatePacket.activeID = activeFighter.getShortID();
        }
    }

    if(!activeFighter.isPlayer) activeFighter.decideBattleAction();
};

Battle.prototype.getActiveFighter = function(){
    return this.fighters[0];
};

Battle.prototype.getFighterByID = function(id){
    var map;
    switch(id[0]){
        case 'P':
            map = GameServer.players;
            break;
        case 'A':
            map = GameServer.animals;
            break;
    }
    return map[id.slice(1)];
};

Battle.prototype.isTurnOf = function(f){
    return (f.getShortID() == this.getActiveFighter().getShortID());
};

Battle.prototype.processAction = function(f,data){
    if(!this.isTurnOf(f) || this.actionTaken) return;
    var result;
    switch(data.action){
        case 'move':
            result = this.processMove(f,data.x,data.y);
            break;
        case 'attack':
            var target = this.getFighterByID(data.id);
            result = this.processAttack(f,target);
            break;
    }
    if(result && result.success) this.setEndOfTurn(result.delay);
};

Battle.prototype.setEndOfTurn = function(delay){
    this.actionTaken = true;
    this.endTime = this.countdown - delay;
};

Battle.prototype.processMove = function(f,x,y){
    if(f.inBattleRange(x,y)){
        f.setPath(GameServer.findPath({x:f.x,y:f.y},{x:x,y:y}));
        return {
            success: true,
            delay: f.getPathDuration()
        };
    }
    return false;
};

Battle.prototype.nextTo = function(a,b){
    var dx = Math.abs(a.x - b.x);
    var dy = Math.abs(a.y - b.y);
    return (dx <= 1 && dy <= 1);
};

Battle.prototype.computeMeleeDamage = function(a,b){
    return Math.max(a.stats['mdmg'] - b.stats['def'],0);
};

Battle.prototype.computeRangedDamage = function(a,b){
    return Math.max(a.stats['rdmg'] - b.stats['def'],0);
};

Battle.prototype.computeRangedHit = function(a,b){
    var dist = Utils.euclidean({
        x: a.x,
        y: a.y
    },{
        x: b.x,
        y: b.y
    });
    var chance = Math.ceil(a.stats['acc'] - (dist*5));
    var rand = Utils.randomInt(0,101);
    console.log('ranged hit : ',rand,chance);
    return rand < chance;
};

Battle.prototype.applyDamage = function(f,dmg){
    f.setStat('hp',Math.max(f.stats['hp'] - dmg,0));
    if(f.stats['hp'] == 0) this.fallen.push(f);
};

Battle.prototype.processAttack = function(a,b){
    if(this.nextTo(a,b)){
        console.log('melee attack');
        var dmg = this.computeMeleeDamage(a,b);
        this.applyDamage(b,dmg);
        b.setProperty('meleeHit',dmg);
        return {
            success: true,
            delay: 500
        };
    }else{
        if(!a.canRange()) return false;
        a.decreaseAmmo();
        var hit = this.computeRangedHit(a,b);
        if(hit){
            dmg = this.computeRangedDamage(a,b);
            this.applyDamage(b,dmg);
            b.setProperty('meleeHit',dmg);
        }else { // miss
            b.setProperty('rangedMiss',true);
        }
        console.log('ranged attack');
        return {
            success: true,
            delay: 500
        };
    }
    return false;
};

// Entites are only removed when the battle is over ; battlezones are only cleared at that time
Battle.prototype.end = function(){
    console.log('ending fight');
    this.ended = true;
    clearInterval(this.loop);
    this.participants.forEach(function(f){
        f.endFight();
        f.setProperty('battlezone',[]);
        if(f.isPlayer) f.notifyFight(false);
        if(f.dead) setTimeout(GameServer.removeEntity,500,f);
    });
    console.log('[B'+this.id+'] Ended');
    // TODO: respawn if quitting battle by disconnecting
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

    tl.x -= 1;
    tl.y -= 1;

    var w = Math.max(Math.abs(f1.x - f2.x)+3,3);
    var h = Math.max(Math.abs(f1.y - f2.y)+3,3);

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

module.exports.Battle = Battle;