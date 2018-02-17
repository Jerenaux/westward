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
    //Engine.displayBattleArrow();
    Engine.fightText.tween.play();
    BattleManager.inBattle = true;
    Engine.menus.battle.display();

    BattleManager.onFightStart();
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
    //console.log('##############');
    if(!BattleManager.inBattle) return;

    if(this.active) {
        BattleManager.deactivateCell();
        this.active.isActiveFighter = false;
    }

    this.active = BattleManager.getActiveFighter(shortID);
    if(!this.active){
        console.log('shortID = ',shortID);
    }
    if(this.active.isHero) BattleManager.actionTaken = false;
    this.active.isActiveFighter = true;
    BattleManager.activateCell();

    var timerPanel = Engine.currentMenu.panels['timer'];
    timerPanel.updateText(this.active.name,this.active.isHero);
    var timer = timerPanel.bar;
    timer.reset();
    timer.setLevel(0,100,BattleManager.countdown*1000);

    if(this.active.isHero) BattleManager.onOwnTurn();
};

BattleManager.getActiveCell = function(){
    if(!this.active) return;
    return Engine.battleZones.get(this.active.tileX,this.active.tileY);
};

BattleManager.deactivateCell = function(){
    var cell = this.getActiveCell();
    if(cell) cell.deactivate();
};

BattleManager.activateCell = function(){
    var cell = this.getActiveCell();
    if(cell) cell.activate();
};

BattleManager.endFight = function(){
    Engine.displayUI();
    Engine.showMarker();
    Engine.setCursor();
    BattleManager.inBattle = false;
    Engine.menus.battle.hide();
};

// #######################

BattleManager.onFightStart = function(){
    if(BattleManager.simulate) Client.sendChat('Attack the white one!');
};

BattleManager.onOwnTurn = function(){
    if(BattleManager.simulate) Engine.computePath({x:505,y:659});
};