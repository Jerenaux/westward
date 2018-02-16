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
    Engine.displayBattleArrow();
    Engine.fightText.tween.play();
    BattleManager.inBattle = true;
    Engine.menus.battle.display();
    console.log('Battle status set to : ',BattleManager.inBattle);
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
    if(!active){
        console.log('shortID = ',shortID);
    }
    if(active.isHero) BattleManager.actionTaken = false;

    var timerPanel = Engine.currentMenu.panels['timer'];
    timerPanel.updateText(active.name,active.isHero);
    var timer = timerPanel.bar;
    timer.setLevel(100,100,1);
    timer.setLevel(0,100,BattleManager.countdown*1000);
    BattleManager.manageArrow(active);
};

BattleManager.manageArrow = function(entity){
    if(!BattleManager.inBattle) return;
    Engine.battleArrow.setPosition(entity.x,entity.y-20);
};

BattleManager.endFight = function(){
    Engine.displayUI();
    Engine.showMarker();
    Engine.hideBattleArrow();
    BattleManager.inBattle = false;
    Engine.menus.battle.hide();
};