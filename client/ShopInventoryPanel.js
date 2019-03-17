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
};

ShopInventoryPanel.prototype.listItems = function(){
    var items = [];
    if(this.inventory == 'player'){
        items = Engine.player.inventory.toList();
    }else{
        items = Engine.currentBuiling.inventory.toList();
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

ShopInventoryPanel.prototype.refreshContent = function(){
    this.listItems().forEach(function(item,i){
        var slot = this.getNextSlot(this.x+20,this.y+20+(i*90));
        // slot.setPosition();
        slot.setUp(item[0],item[1]);
        slot.display();
    },this);
};

ShopInventoryPanel.prototype.display = function(){
    if(this.displayed) return;
    Panel.prototype.display.call(this);
    this.refreshContent();
};

ShopInventoryPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.slots.forEach(function(slot){
        slot.hide();
    })
};

// -----------------------

function ShopSlot(x,y,width,height){
    Frame.call(this,x,y,width,height);

    this.icon = UI.scene.add.sprite(this.x + 30, this.y + height/2);
    this.bagicon = UI.scene.add.sprite(this.x + 14, this.y + height - 12, 'UI','smallpack');
    this.staticon = UI.scene.add.sprite(this.x + 70, this.y + 45, 'icons2');

    this.name = UI.scene.add.text(this.x + 60, this.y + 10, '', { font: '16px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.nb = UI.scene.add.text(this.x + 24, this.y + height - 22, '999', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.effect = UI.scene.add.text(this.x + 88, this.y + 35, '', { font: '14px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });

    var content = [this.icon, this.bagicon, this.name, this.nb];
    content.forEach(function(c){
        c.setScrollFactor(0);
        c.setDepth(1);
    });
}

ShopSlot.prototype = Object.create(Frame.prototype);
ShopSlot.prototype.constructor = ShopSlot;

ShopSlot.prototype.setUp = function(item,nb){
    var itemData = Engine.itemsData[item];
    this.icon.setTexture(itemData.atlas,itemData.frame);
    this.name.setText(itemData.name);
    this.nb.setText(nb);

    if(itemData.hasOwnProperty('effects')) {
        for (var stat in itemData.effects) {
            this.staticon.setFrame(Stats[stat].frame);
            var effect = itemData.effects[stat];
            var stattext = effect;
            if(effect > 0) stattext = '+'+stattext;
            this.effect.setText(stattext);

            var equipped = Engine.player.getEquipped(itemData.equipment);
            console.log(equipped);
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
        this.staticon.setVisible(false);
        this.effect.setVisible(false);
    }
};

ShopSlot.prototype.display = function(){
    Frame.prototype.display.call(this);
};

ShopSlot.prototype.hide = function(){
    Frame.prototype.hide.call(this);
    this.icon.setVisible(false);
    this.name.setVisible(false);
    this.nb.setVisible(false);
    this.bagicon.setVisible(false);
    this.staticon.setVisible(false);
    this.effect.setVisible(false);
};