import { Battle } from "../server/Battle";

/**
 * Created by jeren on 23-01-18.
 */

var BattleManager = {
    inBattle: false,
    countdown: -1,
    orderBoxes: [],
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

    Engine.tweenFighText();
    Engine.updateGrid();
    Engine.menus.battle.display();
    Engine.menus.battle.panels.timer.hide();

    //BattleManager.onFightStart();
};

BattleManager.getFighter = function(id,debug){
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

BattleManager.updateBattle = function(battleData){
    if(!BattleManager.inBattle) return;

    var timerPanel = Engine.currentMenu.panels['timer'];
    var timer = timerPanel.bar;
    if(!timerPanel.displayed) timerPanel.display();

    if(BattleManager.activeFighter) BattleManager.activeFighter.isActiveFighter = false;

    BattleManager.activeFighter = BattleManager.getFighter(battleData.active,false); // false = no debug

    BattleManager.isPlayerTurn = BattleManager.activeFighter.isHero;
    if(!BattleManager.isPlayerTurn) UI.manageCursor(0,'sticky'); // remove any sticky
    BattleManager.actionTaken = false;
    BattleManager.activeFighter.isActiveFighter = true;
    Engine.updateGrid();

    timerPanel.updateText(BattleManager.activeFighter.name,BattleManager.activeFighter.isHero);
    timer.reset();
    timer.setLevel(0,100,battleData.countdown*1000);

    BattleManager.updateFightersOrder(battleData.order);

    //if(BattleManager.activeFighter.isHero) BattleManager.onOwnTurn();
};

BattleManager.updateFightersOrder = function(order){
    BattleManager.orderBoxes.forEach(function(b){
        b.destroy();
    });
    BattleManager.orderBoxes = []; // TODO: make pool instead
    order.forEach(function(fid,i){
        var x = i > 0 ? 341-(i*36) : 680;
        var square = UI.scene.add.renderTexture(x,0,38,38);
        square.drawFrame('UI','equipment-slot',0,0);
        var f = BattleManager.getFighter(fid);
        if(f.isHero){
            square.drawFrame('faces',0,4,4);
        }else{
            square.drawFrame(f.battleBoxData.atlas,f.battleBoxData.frame,4,4);
        }
        square.setScrollFactor(0).setOrigin(0);
    });
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

BattleManager.resetTurn = function(){
    BattleManager.actionTaken = false;
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

BattleManager.processEntityClick = function(target){
    if(!BattleManager.canTakeAction()) return;

    if(Engine.stickyCursor) return; // Will bubble down to TileClick

    //if(target.dead) return;
    if(target.isDisabled()) return;
    Engine.requestBattleAttack(target);
    BattleManager.actionTaken = true;
};

BattleManager.processInventoryClick = function(){
    if(!BattleManager.canTakeAction()) return;
    BattleManager.actionTaken = Engine.inventoryClick.call(this); // "this" has been bound to the clicked item
};

BattleManager.isActiveCell = function(cell){
    if(!BattleManager.activeFighter) return false;
    //console.log(BattleManager.activeFighter.getOccupiedCells());
    //return BattleManager.activeFighter.getOccupiedCells(true).includes(cell.hash());
    return Engine.getOccupiedCells(BattleManager.activeFighter,true).includes(cell.hash());
};

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
    }/*else{
        Engine.displayUI();
        Engine.showMarker();
    }*/
};



// #######################

BattleManager.onFightStart = function(){
    if(BattleManager.simulate) Client.sendChat('Attack the white one!');
};

BattleManager.onOwnTurn = function(){
    if(BattleManager.simulate) Engine.computePath({x:505,y:659});
};