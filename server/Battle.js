/**
 * Created by Jerome on 27-10-17.
 */
var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;

var TURN_DURATION = 3*1000; // milliseconds
var TICK_RATE = 100; // milliseconds

function Battle(f1,f2){
    this.id = GameServer.lastBattleID++;
    this.participants = [];
    this.fighters = []; // the fighter at position 0 is the one currently in turn
    this.teams = { // number of fighters of each 'team' involved in the fight
        'Animal': 0,
        'Player': 0
    };
    this.fallen = [];
    this.area = []; // array of rectangular areas
    this.spannedAOIs = new Set();
    this.ended = false;
    this.reset();
    this.start(f1,f2);
}

Battle.prototype.start = function(f1,f2){
    this.addFighter(f2);
    this.addFighter(f1);

    this.computeArea();
    GameServer.checkForFighter(this.spannedAOIs);

    // todo: refine this? Compute center..?
    this.x = this.fighters[0].x;
    this.y = this.fighters[0].y;
    this.aoi = Utils.tileToAOI({x:this.x,y:this.y});
    GameServer.addAtLocation(this);
    GameServer.handleAOItransition(this, null);

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

Battle.prototype.addFighter = function(f){
    this.fighters.push(f);
    this.participants.push(f);
    this.updateTeams(f.constructor.name,1);
    f.setProperty('inFight',true);
    f.stopWalk();
    if(f.isPlayer) f.notifyFight(true);
    f.battle = this;
};

Battle.prototype.removeFighter = function(f,idx){
    if(idx == -1) idx = this.getFighterIndex(f);
    if(idx == -1) return;
    var isTurnOf = this.isTurnOf(f);
    f.endFight();
    f.die();
    this.fighters.splice(idx,1);
    this.updateTeams(f.constructor.name,-1);
    if(isTurnOf) this.setEndOfTurn(0);
};

Battle.prototype.updateTeams = function(team,increment){
    //console.log('team ',team,':',this.teams[team],'inc = ',increment);
    this.teams[team] += increment;
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
    /*if(f.inBattleRange(x,y)){
        f.setPath(GameServer.findPath({x:f.x,y:f.y},{x:x,y:y}));
        return {
            success: true,
            delay: f.getPathDuration()
        };
    }
    return false;*/
    if(!f.isPlayer) f.setPath(GameServer.findPath({x:f.x,y:f.y},{x:x,y:y}));
    return {
        success: true,
        delay: f.getPathDuration()
    };
};

Battle.prototype.nextTo = function(a,b){
    var dx = Math.abs(a.x - b.x);
    var dy = Math.abs(a.y - b.y);
    return (dx <= 1 && dy <= 1);
};

Battle.prototype.computeMeleeDamage = function(a,b){
    return Math.max(a.getStat('mdmg').getValue() - b.getStat('def').getValue(),0);
};

Battle.prototype.computeRangedDamage = function(a,b){
    return Math.max(a.getStat('rdmg').getValue() - b.getStat('def').getValue(),0);
};

Battle.prototype.computeRangedHit = function(a,b){
    var dist = Utils.euclidean({
        x: a.x,
        y: a.y
    },{
        x: b.x,
        y: b.y
    });
    var chance = Math.ceil(a.getStat('acc').getValue() - (dist*5));
    var rand = Utils.randomInt(0,101);
    //console.log('ranged hit : ',rand,chance);
    return rand < chance;
};

Battle.prototype.applyDamage = function(f,dmg){
    f.applyDamage(-dmg);
    if(f.getHealth() == 0) this.fallen.push(f);
};

Battle.prototype.processAttack = function(a,b){
    var delay = 500;
    if(b.dead) return;
    if(this.nextTo(a,b)){
        //console.log('melee attack');
        var dmg = this.computeMeleeDamage(a,b);
        this.applyDamage(b,dmg);
        b.setProperty('meleeHit',dmg);
        return {
            success: true,
            delay: delay
        };
    }else{
        //console.log('ranged attack');
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
        return {
            success: true,
            delay: delay
        };
    }
};

// Entites are only removed when the battle is over ; battlezones are only cleared at that time
Battle.prototype.end = function(){
    this.ended = true;
    clearInterval(this.loop);
    this.participants.forEach(function(f){
        f.endFight();
        if(f.isPlayer) f.notifyFight(false);
    });
    GameServer.removeEntity(this);
    this.cleanUp();
    console.log('[B'+this.id+'] Ended');
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

    this.addArea({
        x: tl.x,
        y: tl.y,
        w: w,
        h: h
    });
};

Battle.prototype.addArea = function(area){
    this.spannedAOIs.add(Utils.tileToAOI({x:area.x,y:area.y}));
    this.spannedAOIs.add(Utils.tileToAOI({x:area.x+area.w,y:area.y}));
    this.spannedAOIs.add(Utils.tileToAOI({x:area.x+area.w,y:area.y+area.h}));
    this.spannedAOIs.add(Utils.tileToAOI({x:area.x,y:area.y+area.h}));

    for(var x = area.x; x < area.x+area.w; x++){
        for(var y = area.y; y < area.y+area.h; y++){
            GameServer.battleCells.add(x,y,this);
        }
    }
    this.area.push(area);
};

Battle.prototype.removeArea = function(area){
    for(var x = area.x; x < area.x+area.w; x++){
        for(var y = area.y; y < area.y+area.h; y++){
            GameServer.battleCells.delete(x,y);
        }
    }
};

Battle.prototype.cleanUp = function(){
    for(var i = 0; i < this.area.length; i++){
        this.removeArea(this.area[i]);
    }
};

Battle.prototype.trim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','area']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    return trimmed;
};

module.exports.Battle = Battle;