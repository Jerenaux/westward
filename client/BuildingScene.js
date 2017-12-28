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
    BScene.panels = [];
    var building = Engine.buildings[BScene.buildingID];
    if(!building){
        setTimeout(BScene.create.bind(this),100);
        return;
    }
    var buildingData = Engine.buildingsData[building.buildingType];
    var settlementData = Engine.settlementsData[building.settlement];
    BScene.makeTitle(buildingData.name,settlementData.name);
    if(buildingData.shop) BScene.makeShop(building.inventory);

    BScene.finalize();
    BScene.scene.input.events.on('POINTER_UP_EVENT', BScene.handleClick);

    BScene.initialized = true;
    Client.emptyQueue();
};

BScene.handleClick = function(event){
    if(event.list.length > 0){
        for(var i = 0; i < Math.min(event.list.length,2); i++){ // disallow bubbling too deep, only useful in menus (i.e. shallow)
            if(event.list[i].handleClick) event.list[i].handleClick();
        }
    }
};

BScene.makeShop = function(inventory){
    console.log('creatin shop');
    var x = 212;
    var y = 100;
    var w = 350;
    var h = 400;
    var gap = 30;
    var playerStock = new Panel(x,y,w,h,'Your items');
    var shopStock = new Panel(x+w+gap,y,w,h,'Stockpile');
    playerStock.addInventory(null,5,Engine.player.inventory.size,Engine.player.inventory,true);
    shopStock.addInventory(null,5,inventory.size,inventory,true);
    playerStock.display();
    shopStock.display();
    BScene.panels.push(playerStock);
    BScene.panels.push(shopStock);
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
};

BScene.finalize = function(){
    BScene.sprites.forEach(function(e){
        if(!e.dontAlign) e.setDisplayOrigin(0,0);
    });
};

BScene.leave = function(){
    Client.sendExit();
};

BScene.close = function(){
    BScene.panels.forEach(function(p){
        p.hide();
    });
};