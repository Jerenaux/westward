/**
 * Created by jeren on 23-01-18.
 */

var BattleManager = {
    inBattle: false,
    countdown: -1,
    actionTaken: false,
    isPlayerTurn: false
};

BattleManager.handleFightStatus = function(status){
    if(status === true){
        BattleManager.startFight();
    }else if(status === false){
        BattleManager.endFight();
    }
};

BattleManager.startFight = function(){
    BattleManager.inBattle = true;
    if(Engine.currentMenu) Engine.currentMenu.hide();
    Engine.hideUI();
    Engine.hideMarker();
    //Engine.fightText.tween.play();
    Engine.tweenFighText();
    Engine.updateGrid();
    Engine.menus.battle.display();
    Engine.menus.battle.panels.timer.hide();

    /*if(Client.isFirstBattle()){
        console.log('first battle');
        Client.hadFirstBattle();
    }*/

    //BattleManager.onFightStart();
};

BattleManager.setCounter = function(seconds){
    BattleManager.countdown = seconds;
};

BattleManager.getActiveFighter = function(id,debug){
    var map;
    switch(id[0]){
        case 'P':
            map = Engine.players;
            break;
        case 'A':
            map = Engine.animals;
            break;
    }
    if(debug) console.warn(map);
    return map[id.slice(1)];
};

BattleManager.manageTurn = function(shortID){
    if(!BattleManager.inBattle) return;

    var timerPanel = Engine.currentMenu.panels['timer'];
    var timer = timerPanel.bar;
    if(!timerPanel.displayed) timerPanel.display();

    if(this.active) this.active.isActiveFighter = false;

    this.active = BattleManager.getActiveFighter(shortID,false);

    if(!this.active) {
        console.warn('shortID = ',shortID);
        BattleManager.getActiveFighter(shortID,true);
    }

    BattleManager.isPlayerTurn = this.active.isHero;
    BattleManager.actionTaken = false;
    this.active.isActiveFighter = true;
    Engine.updateGrid();

    timerPanel.updateText(this.active.name,this.active.isHero);
    timer.reset();
    timer.setLevel(0,100,BattleManager.countdown*1000);

    //if(this.active.isHero) BattleManager.onOwnTurn();
};

BattleManager.onEndOfMovement = function(){
    Engine.updateGrid();
};

BattleManager.canTakeAction = function(){
    if(!BattleManager.inBattle) return false;
    if(!BattleManager.isPlayerTurn) return false;
    return !BattleManager.actionTaken;
};

BattleManager.processTileClick = function(tile,pointer){
    if(!BattleManager.canTakeAction()) return;
    if(!tile.inRange) return;
    Engine.moveToClick(pointer);
    BattleManager.actionTaken = true;
};

BattleManager.processAnimalClick = function(animal){
    // TODO: replace request logic
    if(!BattleManager.canTakeAction()) return;
    if(animal.dead) return;
    Engine.requestBattleAttack(animal);
    BattleManager.actionTaken = true;
};

BattleManager.processInventoryClick = function(){
    if(!BattleManager.canTakeAction()) return;
    Engine.inventoryClick.call(this); // "this" has been bound to the clicked item
    BattleManager.actionTaken = true;
};

BattleManager.isActiveCell = function(cell){
    if(!this.active) return false;
    return (cell.tx == this.active.tileX && cell.ty == this.active.tileY);
};

BattleManager.getActiveCell = function(){
    if(!this.active) return;
    return Engine.battleCellsMap.get(this.active.tileX,this.active.tileY);
};

BattleManager.deactivateCell = function(){
    var cell = this.getActiveCell();
    if(cell) cell.deactivate();
};

BattleManager.activateCell = function(){
    var cell = this.getActiveCell();
    if(cell) cell.activate();
};

BattleManager.onDeath = function(){
    Engine.updateGrid();
    var respawnPanel = Engine.menus["battle"].panels['respawn'];
    setTimeout(function(){
        respawnPanel.display();
    },1000);
};

BattleManager.endFight = function(){
    UI.setCursor();
    BattleManager.inBattle = false;
    Engine.menus.battle.hide();
    if(Engine.dead) {
       BattleManager.onDeath();
    }else{
        Engine.displayUI();
        Engine.showMarker();
    }
};

// #######################

BattleManager.onFightStart = function(){
    if(BattleManager.simulate) Client.sendChat('Attack the white one!');
};

BattleManager.onOwnTurn = function(){
    if(BattleManager.simulate) Engine.computePath({x:505,y:659});
};