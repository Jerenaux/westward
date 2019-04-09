/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 13-02-18.
 */


function ProductionPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.texts = [];
    this.slotsCounter = 0;
    this.slots = [];
    this.title = this.addText(this.width/2,25,'Production:',null,20).setOrigin(0.5);
}

ProductionPanel.prototype = Object.create(Panel.prototype);
ProductionPanel.prototype.constructor = ProductionPanel;

ProductionPanel.prototype.getNextSlot = function(x,y){
    if(this.slotsCounter >= this.slots.length){
        this.slots.push(new ProdSlot(x,y,360,70));
    }

    return this.slots[this.slotsCounter++];
};

ProductionPanel.prototype.displayInterface = function(){
    var data = Engine.currentBuiling;
    var buildingTypeData = Engine.buildingsData[data.buildingType];
    var production = buildingTypeData.production;
    var sloty = this.y + 55;
    var yOffset = 0;

    production.forEach(function(prod){
        var slot = this.getNextSlot(this.x+20,sloty+yOffset);
        slot.display();
        var item = prod[0];
        var output = prod[1];
        var nbturns = prod[2];
        var cap = prod[3] ;
        slot.setUp(item,cap, nbturns, data.countdowns[item], output);
        yOffset += 90;
    }, this);
};

ProductionPanel.prototype.hideInterface = function(){
    this.slots.forEach(function(slot){
        slot.hide();
    });
    this.slotsCounter = 0;
};

ProductionPanel.prototype.update = function(){
    this.hideInterface();
    this.displayInterface();
};

ProductionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.title.setVisible(true);
    this.displayInterface();
};

ProductionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.title.setVisible(false);
    this.hideInterface();
};

// ---------------------------------------------

function ProdSlot(x,y,width,height){
    Frame.call(this,x,y,width,height);

    this.name = UI.scene.add.text(this.x + 60, this.y + 15, '', { font: '16px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });

    this.zone = UI.scene.add.zone(this.x,this.y,width,height);
    this.zone.setInteractive();
    this.zone.setOrigin(0);
    this.zone.on('pointerover',function(){
        UI.tooltip.updateInfo(this.name.text,this.desc,this.itemID);
        UI.tooltip.display();
        UI.setCursor('item');
    }.bind(this));
    this.zone.on('pointerout',function(){
        UI.tooltip.hide();
        UI.setCursor();
    }.bind(this));

    this.content = [this.name, this.zone];

    this.addItem();
    this.addCount();
    this.addBar();
}

ProdSlot.prototype = Object.create(Frame.prototype);
ProdSlot.prototype.constructor = ProdSlot;

ProdSlot.prototype.addBar = function(){
    this.prodtext = UI.scene.add.text(this.x + 55, this.y + 35, '+1', { font: '12px '+Utils.fonts.fancy, fill: Utils.colors.gold, stroke: '#000000', strokeThickness: 3 });
    this.content.push(this.prodtext);
    this.bar = new MiniProgressBar(this.x+80,this.y+38,100,'gold');
    this.bar.setLevel(0,100);
};

ProdSlot.prototype.addItem = function(){
    this.slot = UI.scene.add.sprite(this.x + 30,this.y+this.height/2,'UI','equipment-slot');
    this.icon = UI.scene.add.sprite(this.x + 30, this.y + this.height/2);
    this.content.push(this.slot);
    this.content.push(this.icon);
};

ProdSlot.prototype.addCount = function(){
    this.countText = UI.scene.add.text(this.x + this.width - 10, this.y + this.height - 25, '20/20', { font: '16px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.countText.setOrigin(1,0);
    this.content.push(this.countText);
};

ProdSlot.prototype.checkForPanelOnTop = function(){
    return Engine.currentMenu.isPanelDisplayed('action');
};

ProdSlot.prototype.setUp = function(item, cap, turns, remaining, output){
    if(!this.displayed) console.warn('Setting up slot before displaying it');
    var itemData = Engine.itemsData[item];
    this.icon.setTexture(itemData.atlas,itemData.frame);
    this.name.setText(itemData.name);
    this.desc = itemData.desc;
    this.itemID = item;
    var nb = Engine.currentBuiling.getItemNb(item);
    this.countText.setText(nb+'/'+cap);
    this.countText.setFill((nb == cap ? Utils.colors.gold : Utils.colors.white));
    var newlevel = ( nb == cap ? turns : turns-remaining);
    this.bar.setLevel(newlevel, turns, (newlevel < this.bar.level));
    this.prodtext.setText('+'+output);

    if(Engine.currentBuiling.isOwned()){
        this.zone.off('pointerup');
        this.zone.on('pointerup',function(){
            if(this.checkForPanelOnTop()) return;
            Engine.currentMenu.displayPanel('action');
            Engine.currentMenu.panels['action'].setUp(item,'buy');
        }.bind(this));
    }
};

ProdSlot.prototype.display = function(){
    Frame.prototype.display.call(this);
    this.content.forEach(function(c){
        c.setVisible(true);
    });
    this.bar.display();
};

ProdSlot.prototype.hide = function(){
    Frame.prototype.hide.call(this);
    this.content.forEach(function(c){
        c.setVisible(false);
    });
    this.bar.hide();
};
