/**
 * Created by jeren on 23-01-18.
 */

var BattleManager = {
    inBattle: false
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
    // show counter?
    // show arrow?
    Engine.fightText.tween.play();
};

BattleManager.endFight = function(){
    Engine.displayUI();
    Engine.showMarker();
    Engine.hideCounter();
    Engine.hideBattleArrow();
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