/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 13-02-18.
 */
import Panel from './Panel'

function ProductionPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.texts = [];
    this.slotsCounter = 0;
    this.slots = [];
    this.title = this.addText(this.width/2,25,'Production:',null,20).setOrigin(0.5);

    var btnsx = this.x + this.width - 300;
    var btnsy = this.y + this.height - 25;
    Engine.addAdminButtons(this,btnsx,btnsy);

    this.foodcontent = [];
    var x = this.x + 45;
    var y = this.y+ this.height - 100;
    this.slot = UI.scene.add.sprite(x,y, 'UI','equipment-slot');
    this.icon = UI.scene.add.sprite(x,y, 'items','food');
    this.goldicon = UI.scene.add.sprite(x-15,y+30, 'UI','gold');
    this.goldtxt = this.addText(x - this.x - 7,y+20-this.y, '200',null,12);
    this.goldtxt.setOrigin(0);
    this.foodtexts = this.addPolyText(this.slot.x - this.x + 30,this.slot.y - this.y - 15,['99','Food  -  Productivity ','x1'],[null,null,null]);
    this.foodcontent.push(this.slot);
    this.foodcontent.push(this.icon);
    this.foodcontent.push(this.goldicon);
    this.foodcontent.push(this.goldtxt);
    this.foodcontent = this.foodcontent.concat(this.foodtexts);
    this.foodcontent.forEach(function(c){
        c.setVisible(false);
    });

    var panel_ = this;
    var btnx = x + 75;
    var btny = y + 20;
    this.gfBtn = new BigButton(btnx,btny,'Give food',function(){
        if(panel_.checkForPanelOnTop()) return;
        Engine.currentMenu.hidePanel('goldaction');
        Engine.currentMenu.displayPanel('action');
        Engine.currentMenu.panels['action'].setUp(1,'sell',false); // false = force non-financial

    });
    btnx += 110;
    this.sfBtn = new BigButton(btnx,btny,'Sell food',function(){
        Engine.currentMenu.displayPanel('action');
        Engine.currentMenu.hidePanel('goldaction');
        Engine.currentMenu.panels['action'].setUp(1,'sell',true); // false = force non-financial
    });
}

ProductionPanel.prototype = Object.create(Panel.prototype);
ProductionPanel.prototype.constructor = ProductionPanel;

ProductionPanel.prototype.checkForPanelOnTop = function(){
    return Engine.currentMenu.isPanelDisplayed('prices');// || Engine.currentMenu.isPanelDisplayed('goldaction');
};

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

    var food = Engine.currentBuiling.getItemNb(1);
    production.forEach(function(prod){
        var slot = this.getNextSlot(this.x+20,sloty+yOffset);
        slot.display();
        var item = prod[0];
        var output = prod[1];
        if(food > 0) output *= 2;
        var nbturns = prod[2];
        var cap = prod[3] ;
        var cnt = (data.countdowns ? data.countdowns[item] : 0);
        slot.setUp(item,cap, nbturns, cnt, output);
        yOffset += 90;
    }, this);

    if(Engine.currentBuiling.isOwned()) {
        this.pricesBtn.display();
        this.ggBtn.display();
        this.tgBtn.display();
    }

    this.manageFood();
};

ProductionPanel.prototype.manageFood = function(){
    this.foodcontent.forEach(function(c){
        c.setVisible(true);
    });
    this.gfBtn.display();

    var foodPrice = Engine.currentBuiling.getPrice(1,'buy');
    if(!Engine.currentBuiling.isOwned() && foodPrice > 0) this.sfBtn.display();
    if(foodPrice == 0) {
        this.goldtxt.setText('--');
        this.goldtxt.setFill(Utils.colors.white);
    }else{
        this.goldtxt.setText(foodPrice);
        this.goldtxt.setFill((foodPrice > Engine.currentBuiling.gold ? Utils.colors.red : Utils.colors.white));
    }

    var food = Engine.currentBuiling.getItemNb(1);
    this.foodtexts[0].setText(food);
    this.foodtexts[2].setText(food > 0 ? 'x2' : 'x1');
    this.foodtexts[2].setFill(food > 0 ? Utils.colors.gold : Utils.colors.white);
};

ProductionPanel.prototype.hideInterface = function(){
    this.slots.forEach(function(slot){
        slot.hide();
    });
    this.slotsCounter = 0;

    this.pricesBtn.hide();
    this.ggBtn.hide();
    this.tgBtn.hide();

    this.foodcontent.forEach(function(c){
        c.setVisible(false);
    });
    this.gfBtn.hide();
    this.sfBtn.hide();
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
        UI.tooltip.updateInfo('item',{id:this.itemID});
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
    this.addPrice();
}

ProdSlot.prototype = Object.create(Frame.prototype);
ProdSlot.prototype.constructor = ProdSlot;

ProdSlot.prototype.addBar = function(){
    this.prodtext = UI.scene.add.text(this.x + 55, this.y + 35, '+1', { font: '12px '+Utils.fonts.fancy, fill: Utils.colors.gold, stroke: '#000000', strokeThickness: 3 });
    this.content.push(this.prodtext);
    this.bar = new MiniProgressBar(this.x+85,this.y+38,100,'gold');
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

ProdSlot.prototype.addPrice = function(){
    this.goldicon = UI.scene.add.sprite(this.x + this.width - 12, this.y + 16, 'UI','gold');
    this.price = UI.scene.add.text(this.x + this.width - 22, this.y + 6, '', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.price.setOrigin(1,0);
    this.content.push(this.goldicon);
    this.content.push(this.price);
};

ProdSlot.prototype.checkForPanelOnTop = function(){
    return Engine.currentMenu.isPanelDisplayed('prices');
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
    this.countText.setFill((nb >= cap ? Utils.colors.gold : Utils.colors.white));
    var newlevel = ( nb >= cap ? turns : turns-remaining);
    this.bar.setLevel(newlevel, turns, (newlevel < this.bar.level));
    this.prodtext.setText('+'+output);

    var price = Engine.currentBuiling.getPrice(item,'sell');
    if(price == 0) {
        this.price.setText('--');
        this.price.setFill(Utils.colors.white);
    }else{
        this.price.setText(price);
        this.price.setFill((price > Engine.player.gold ? Utils.colors.red : Utils.colors.white));
    }

    this.zone.off('pointerup');
    this.zone.on('pointerup',function(){
        if(this.checkForPanelOnTop()) return;
        Engine.currentMenu.displayPanel('action');
        Engine.currentMenu.panels['action'].setUp(item,'buy');
    }.bind(this));
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

export default ProductionPanel