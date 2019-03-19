/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 15-03-19.
 */
function ShopInventoryPanel(x,y,width,height,title,invisible){
    Panel.call(this,x,y,width,height,title,invisible);
    this.slotsCounter = 0;
    this.slots = [];
}

ShopInventoryPanel.prototype = Object.create(Panel.prototype);
ShopInventoryPanel.prototype.constructor = ShopInventoryPanel;

ShopInventoryPanel.prototype.setInventory = function(inventory){
    this.inventory = inventory;
    this.starty = this.y+20;

    if(this.inventory == 'building'){
        this.pricesBtn = new BigButton(this.x+70,this.starty+15,'Set prices',function(){
            Engine.currentMenu.panels['prices'].display();
            Engine.currentMenu.panels['action'].hide();
        });
        this.starty += 35;
    }
};

ShopInventoryPanel.prototype.listItems = function(){
    var items = [];
    if(this.inventory == 'player'){
        items = Engine.player.inventory.toList(true); // true = filter out zeroes
    }else{
        items = Engine.currentBuiling.inventory.toList(true);
    }
    items.sort(function(a,b){
        if(Engine.itemsData[a[0]].name < Engine.itemsData[b[0]].name) return -1;
        return 1;
    });
    return items;
};

ShopInventoryPanel.prototype.getNextSlot = function(x,y){
    if(this.slotsCounter >= this.slots.length){
        this.slots.push(new ShopSlot(x,y,320,80));
    }

    return this.slots[this.slotsCounter++];
};

ShopInventoryPanel.prototype.updateContent = function(){
    this.hideContent();
    this.refreshContent();
};

ShopInventoryPanel.prototype.refreshContent = function(){
    this.listItems().forEach(function(item,i){
        var slot = this.getNextSlot(this.x+20,this.starty+(i*90));
        var action = (this.inventory == 'player' ? 'sell' : 'buy');
        slot.setUp(action,item[0],item[1]);
        slot.display();
    },this);
};

ShopInventoryPanel.prototype.display = function(){
    if(this.displayed) return;
    Panel.prototype.display.call(this);
    if(this.pricesBtn) this.pricesBtn.display();
    this.refreshContent();
};

ShopInventoryPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    if(this.pricesBtn) this.pricesBtn.hide();
    this.hideContent();
};

ShopInventoryPanel.prototype.hideContent = function(){
    this.slots.forEach(function(slot){
        slot.hide();
    });
    this.slotsCounter = 0;
};

// -----------------------

function ShopSlot(x,y,width,height){
    Frame.call(this,x,y,width,height);

    this.icon = UI.scene.add.sprite(this.x + 30, this.y + height/2);
    this.bagicon = UI.scene.add.sprite(this.x + 14, this.y + height - 12, 'UI','smallpack');
    this.goldicon = UI.scene.add.sprite(this.x + width - 12, this.y + 14, 'UI','gold');
    this.staticon = UI.scene.add.sprite(this.x + 70, this.y + 45, 'icons2');

    this.name = UI.scene.add.text(this.x + 60, this.y + 10, '', { font: '16px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.nb = UI.scene.add.text(this.x + 24, this.y + height - 22, '999', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.effect = UI.scene.add.text(this.x + 88, this.y + 35, '', { font: '14px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.rarity = UI.scene.add.text(this.x + 60, this.y + 60, '', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.price = UI.scene.add.text(this.x + width - 22, this.y + 6, '', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.price.setOrigin(1,0);

    this.zone = UI.scene.add.zone(this.x,this.y,width,height);
    this.zone.setInteractive();
    this.zone.setOrigin(0);
    this.zone.on('pointerover',function(){
        if(Engine.currentMenu.panels['prices'].displayed) return;
        UI.setCursor('item');
    });
    this.zone.on('pointerout',function(){
        if(Engine.currentMenu.panels['prices'].displayed) return;
        UI.setCursor();
    });

    this.content = [this.icon, this.bagicon, this.staticon, this.name, this.nb, this.effect, this.rarity,
    this.zone, this.goldicon];
    this.content.forEach(function(c){
        c.setScrollFactor(0);
        c.setDepth(1);
    });
}

ShopSlot.prototype = Object.create(Frame.prototype);
ShopSlot.prototype.constructor = ShopSlot;

ShopSlot.prototype.setUp = function(action,item,nb){
    var itemData = Engine.itemsData[item];
    this.icon.setTexture(itemData.atlas,itemData.frame);
    this.name.setText(itemData.name);
    this.nb.setText(nb);

    var rarityMap = {
        0: 'Unique',
        1: 'Rare',
        2: 'Common',
        3: 'Very common'
    };
    this.rarity.setText(rarityMap[Engine.rarity[item]]);
    this.rarity.setFill((Engine.rarity[item] <= 1 ? Utils.colors.gold : Utils.colors.white));

    var priceaction = (action == 'buy' ? 'sell' : 'buy');
    var price = Engine.currentBuiling.getPrice(item,priceaction);
    this.price.setText(price);
    if(action == 'sell'){
        this.price.setFill((price > Engine.currentBuiling.gold ? Utils.colors.red : Utils.colors.white));
    }else{
        this.price.setFill((price > Engine.player.gold ? Utils.colors.red : Utils.colors.white));
    }

    this.zone.on('pointerup',function(){
        if(Engine.currentMenu.panels['prices'].displayed) return;
        Engine.currentMenu.panels['action'].display();
        Engine.currentMenu.panels['action'].setUp(item,action);
    });

    if(itemData.hasOwnProperty('effects')) {
        this.hasEffect = true;
        for (var stat in itemData.effects) {
            this.staticon.setFrame(Stats[stat].frame);
            var effect = itemData.effects[stat];
            var stattext = effect;
            if(effect > 0) stattext = '+'+stattext;
            this.effect.setText(stattext);

            var equipped = Engine.player.getEquipped(itemData.equipment);
            if(equipped > 0) {
                var current = Engine.itemsData[equipped].effects[stat];
                if(current > effect){
                    this.effect.setFill(Utils.colors.red);
                }else if(current < effect){
                    this.effect.setFill(Utils.colors.green);
                }else{
                    this.effect.setFill(Utils.colors.gold);
                }
            }else{
                this.effect.setFill(Utils.colors.green);
            }
        }
    }else{
        this.hasEffect = false;
    }
};

ShopSlot.prototype.display = function(){
    Frame.prototype.display.call(this);
    this.content.forEach(function(c){
        c.setVisible(true);
    });
    if(!this.hasEffect) {
        this.staticon.setVisible(false);
        this.effect.setVisible(false);
    }
};

ShopSlot.prototype.hide = function(){
    Frame.prototype.hide.call(this);
    this.content.forEach(function(c){
        c.setVisible(false);
    });
};