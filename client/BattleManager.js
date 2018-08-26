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
        case 'C':
            map = Engine.civs;
            break;
        case 'B':
            map = Engine.buildings;
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
    if(!BattleManager.isPlayerTurn) UI.manageCursor(0,'sticky'); // remove any sticky
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
    if(Engine.dead) return false;
    return !BattleManager.actionTaken;
};

BattleManager.processBombClick = function(tile){
    Engine.requestBomb(tile.tx,tile.ty);
    BattleManager.actionTaken = true;
    Engine.stickyCursor = false;
};

BattleManager.processTileClick = function(tile,pointer){
    if(!BattleManager.canTakeAction()) return;

    if(Engine.stickyCursor){
        BattleManager.processBombClick(tile);
        return;
    }

    if(!tile.inRange) return;
    Engine.moveToClick(pointer);
    BattleManager.actionTaken = true;
};

BattleManager.processNPCClick = function(target){
    if(!BattleManager.canTakeAction()) return;

    if(Engine.stickyCursor) return; // Will bubble down to TileClick

    if(target.dead) return;
    Engine.requestBattleAttack(target);
    BattleManager.actionTaken = true;
};

BattleManager.processInventoryClick = function(){
    if(!BattleManager.canTakeAction()) return;
    BattleManager.actionTaken = Engine.inventoryClick.call(this); // "this" has been bound to the clicked item
};

BattleManager.isActiveCell = function(cell){
    if(!this.active) return false;
    //console.log(this.active.getOccupiedCells());
    //return this.active.getOccupiedCells(true).includes(cell.hash());
    return Engine.getOccupiedCells(this.active,true).includes(cell.hash());
};

/*BattleManager.getActiveCells = function(){
    if(!this.active) return;
    return this.active.getOccupiedCells();
    //return Engine.battleCellsMap.get(this.active.tileX,this.active.tileY);
};*/

/*BattleManager.deactivateCell = function(){
    var cell = this.getActiveCells();
    if(cell) cell.deactivate();
};*/

/*BattleManager.activateCell = function(){
    var cell = this.getActiveCell();
    if(cell) cell.activate();
};*/

BattleManager.onDeath = function(){
    Engine.updateGrid();
    var respawnPanel = Engine.menus["battle"].panels['respawn'];
    setTimeout(function(){
        respawnPanel.display();
    },1000);
};

BattleManager.endFight = function(){
    //UI.setCursor();
    UI.manageCursor(0,'sticky'); // remove sticku, if any
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