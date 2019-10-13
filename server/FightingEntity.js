/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 31-05-19.
 */
import GameObject from './GameObject'
import GameServer from './GameServer'

function FightingEntity(){
    GameObject.call(this);
    this.isFightingEntity = true;
}

FightingEntity.prototype = Object.create(GameObject.prototype);
FightingEntity.prototype.constructor = FightingEntity;

FightingEntity.prototype.checkForAggro = function(){
    if(!this.isInVision()) return;
    if(!this.isAggressive() || this.isInFight() || !this.isAvailableForFight()) return;
    // console.warn(this.getShortID(),'checking for aggro');

    var r = GameServer.battleParameters.aggroRange;
    // implies Chebyshev distance
    var neighbors = GameServer.getEntitiesAt(Math.floor(this.x-r/2),Math.floor(this.y-r/2),r,r);
    // console.warn(Math.floor(this.x-r/2),Math.floor(this.y-r/2),r,r);
    for(var i = 0; i < neighbors.length; i++){
        var entity = neighbors[i];
        // console.warn('considering',entity.getShortID());
        if(this.getShortID() == entity.getShortID()) continue;
        if(!this.aggroAgainst(entity)) continue;
        if(!entity.isAvailableForFight()) continue;
        if(entity.instance != this.instance) continue;
        if(entity.isInFight() && this.isMovingEntity){
            this.goToDestination(entity);
        }else {
            GameServer.handleBattle(this, entity);
            if(this.isCiv) this.talk('battle_start');
        }
        break;
    }
};

FightingEntity.prototype.selectTarget = function(){
    if(!this.battle) return;
    var fighters = this.battle.fighters.slice();
    if(fighters.length == 0) return null;
    var target = null;
    // Iterate over all fighters to find the one with highest priority to target
    for(var i = 1; i < fighters.length; i++){
        var f = fighters[i];
        if(this.isSameTeam(f)) continue;
        if(!target){
            target = f;
            continue;
        }
        if(target.battlePriority == f.battlePriority){
            if(f.getHealth() < target.getHealth()) target = f;
        }else{
            if(f.battlePriority < target.battlePriority) target = f;
        }
    }
    return target;
};

FightingEntity.prototype.isSameTeam = function(f){
    return this.battleTeam == f.battleTeam;
};

FightingEntity.prototype.aggroAgainst = function(f){
    return this.aggroMatrix[f.entityCategory];
};

FightingEntity.prototype.endFight = function(){
    this.setProperty('inFight',false);
    this.battle = null;
};

FightingEntity.prototype.isInFight = function(){
    return this.inFight;
};

FightingEntity.prototype.incrementStat = function(stat,amount){
    this.getStat(stat).increment(amount);
};

FightingEntity.prototype.applyDamage = function(dmg){
   this.incrementStat('hp',dmg);
};

FightingEntity.prototype.getHealth = function(){
    return this.getStat('hp').getValue();
};

FightingEntity.prototype.getStat = function(key){
    return this.stats[key];
};

FightingEntity.prototype.getStats = function(){
    return Object.keys(this.stats);
};

export default FightingEntity
