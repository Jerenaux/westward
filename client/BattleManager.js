/**
 * Created by jeren on 23-01-18.
 */

var BattleManager = {
    inBattle: false,
    countdown: -1,
    actionTaken: false
};

BattleManager.handleFightStatus = function(status){
    if(status === true){
        BattleManager.startFight();
    }else if(status === false){
        BattleManager.endFight();
    }
};

BattleManager.startFight = function(){
    Engine.hideUI();
    Engine.hideMarker();
    Engine.fightText.tween.play();
    BattleManager.inBattle = true;
};

BattleManager.setCounter = function(seconds){
    BattleManager.countdown = seconds;
};

BattleManager.getActiveFighter = function(id){
    var map;
    switch(id[0]){
        case 'P':
            map = Engine.players;
            break;
        case 'A':
            map = Engine.animals;
            break;
    }
    return map[id.slice(1)];
};

BattleManager.manageTurn = function(shortID){
    if(!BattleManager.inBattle) return;
    var active = BattleManager.getActiveFighter(shortID);
    if(active.isHero){
        Engine.displayCounter();
        BattleManager.actionTaken = false;
    }else{
        Engine.hideCounter();
    }
    Engine.manageArrow(active);
};

BattleManager.endFight = function(){
    Engine.displayUI();
    Engine.showMarker();
    Engine.hideCounter();
    Engine.hideBattleArrow();
    BattleManager.inBattle = false;
};


/*
* Info about self:
* - Start of fight: send a self update
* - Whose turn it is
* => handle UI, display message(s), arrow, counter and equipment
* - End of fight
* Info about others:
* - battlezones
* - animations and HP
* */