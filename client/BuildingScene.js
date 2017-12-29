/**
 * Created by jeren on 27-12-17.
 */

var BScene = {
    key: 'BuildingScene',
    initialized: false
};

BScene.preload = function(){
    this.load.image('door', 'assets/sprites/exitdoor.png');
};

BScene.create = function(){
    BScene.scene = this.scene.scene;
    BScene.sprites = [];

    //BScene.makeTitle(buildingData.name,settlementData.name);
    BScene.makeTitle('Lorem ipsum','Lorem ipsum');
    //if(buildingData.shop) BScene.makeShop(building.inventory,building.prices,building.gold);
    BScene.makeShop();

    BScene.finalize();
    BScene.tooltip = new Tooltip();

    BScene.scene.input.events.on('POINTER_DOWN_EVENT', BScene.handleDown);
    BScene.scene.input.events.on('POINTER_UP_EVENT', BScene.handleClick);
    BScene.scene.input.events.on('POINTER_OVER_EVENT', BScene.handleOver);
    BScene.scene.input.events.on('POINTER_OUT_EVENT', BScene.handleOut);
    BScene.scene.input.events.on('POINTER_MOVE_EVENT', BScene.trackMouse);
    BScene.initialized = true;
};

BScene.handleClick = function(event){
    if(event.list.length > 0){
        for(var i = 0; i < Math.min(event.list.length,2); i++){ // disallow bubbling too deep, only useful in menus (i.e. shallow)
            if(event.list[i].handleClick) event.list[i].handleClick();
        }
    }
};

BScene.handleDown = function(event){
    if(event.gameObject && event.gameObject.handleDown) event.gameObject.handleDown();
};

BScene.handleOver = function(event){
    if(event.list.length > 0){
        for(var i = 0; i < Math.min(event.list.length,2); i++) { // disallow bubbling too deep, only useful in menus (i.e. shallow)
            var obj = event.list[i];
            if(obj.handleOver) obj.handleOver();
        }
    }
};

BScene.handleOut = function(event){
    if(event.gameObject){
        if(event.gameObject.handleOut) event.gameObject.handleOut();
    }
};

BScene.trackMouse = function(event){
    var position = Engine.getMouseCoordinates(event);
    if(BScene.tooltip && BScene.tooltip.displayed) BScene.tooltip.updatePosition(event.x,event.y);
};

BScene.makeShop = function(){
    BScene.shop = new Menu();
    var x = 212;
    var y = 100;
    var w = 300;
    var h = 300;
    var gap = 30;

    BScene.shop.playerStock = new Panel(x,y,w,h,'Your items');
    BScene.shop.shopStock = new Panel(x+w+gap,y,w,h,'Stockpile');
    BScene.shop.addPanel(BScene.shop.playerStock);
    BScene.shop.addPanel(BScene.shop.shopStock);

    BScene.shop.playerStock.addInventory(null,7,Engine.player.inventory.size,Engine.player.inventory,true,BScene.sellClick);

    Engine.goldTexts.push(BScene.shop.playerStock.addCapsule(200,-9,Engine.player.gold,'gold'));
    BScene.shop.goldText = BScene.shop.shopStock.addCapsule(200,-9,9999,'gold');
    BScene.shop.playerStock.finalize();
    BScene.shop.shopStock.finalize();

    BScene.shop.shopPanel = new ShopPanel(x,y+h+20,w,100,'Buy');
    BScene.shop.addPanel(BScene.shop.shopPanel);
};

BScene.setUp = function(buildingID){
    if(!BScene.initialized){
        setTimeout(BScene.setUp,50,buildingID);
        return;
    }
    var building = Engine.buildings[buildingID];
    var buildingData = Engine.buildingsData[building.buildingType];
    var settlementData = Engine.settlementsData[building.settlement];
    BScene.buildingTypeText.setText(buildingData.name);
    BScene.settlementText.setText(settlementData.name);

    if(buildingData.shop){
        BScene.shop.prices = building.prices;
        BScene.shop.inventory = building.inventory;
        BScene.shop.gold = building.gold;
        BScene.shop.playerStock.setInventoryFilter(building.prices,0);
        BScene.shop.shopStock.clearInventories();
        BScene.shop.shopStock.addInventory(null,7,building.inventory.size,building.inventory,true,BScene.buyClick);
        BScene.shop.shopStock.setInventoryFilter(building.prices,1);
        BScene.shop.goldText.setText(building.gold);

        BScene.shop.display();
        BScene.shop.shopPanel.hide();
    }
};

BScene.close = function(){
    BScene.shop.hide();
};

BScene.updateGold = function(gold){
    BScene.shop.goldText.setText(gold);
    BScene.shop.gold = gold;
};

BScene.makeTitle = function(name,setl){
    var texts = [];
    var textx = BScene.scene.game.config.width/2;
    var texty = 10;
    var typeText = BScene.scene.add.text(textx, texty, name,
        { font: '32px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    var setlText = BScene.scene.add.text(textx, texty+40, setl,
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    texts.push(typeText);
    texts.push(setlText);
    texts.forEach(function(t){
        t.setOrigin(0.5,0);
        t.setDepth(1);
        t.dontAlign = true;
        BScene.sprites.push(t);
    });

    var x = textx - Math.floor(typeText.width/2) - 35;
    var y = 5;
    var width = typeText.width;
    BScene.sprites.push(BScene.scene.add.sprite(x,y,'UI','title-left'));
    x += 32;
    BScene.sprites.push(BScene.scene.add.tileSprite(x,y,width,64,'UI','title-center'));
    x = x+width;
    BScene.sprites.push(BScene.scene.add.sprite(x,y,'UI','title-right'));
    x += 30;
    var exitDoor = BScene.scene.add.sprite(x,y+10,'door');
    exitDoor.setInteractive();
    exitDoor.handleClick = BScene.leave;

    BScene.sprites.push(exitDoor);

    x = textx - Math.floor(setlText.width/2) - 15;
    y += 45;
    var w = setlText.width - 20;
    BScene.sprites.push(BScene.scene.add.sprite(x,y,'UI','capsule-left'));
    x += 24;
    BScene.sprites.push(BScene.scene.add.tileSprite(x,y,w,24,'UI','capsule-middle'));
    x += w;
    BScene.sprites.push(BScene.scene.add.sprite(x,y,'UI','capsule-right'));

    this.buildingTypeText = typeText;
    this.settlementText = setlText;
};

BScene.finalize = function(){
    BScene.sprites.forEach(function(e){
        if(!e.dontAlign) e.setDisplayOrigin(0,0);
    });
};

BScene.leave = function(){
    Client.sendExit();
};

BScene.sellClick = function(){
    BScene.shop.shopPanel.updatePurchase(this.itemID,Engine.itemsData[this.itemID],'sell');
};

BScene.buyClick = function(){
    BScene.shop.shopPanel.updatePurchase(this.itemID,Engine.itemsData[this.itemID],'buy');
};
