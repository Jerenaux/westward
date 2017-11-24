/**
 * Created by Jerome on 20-11-17.
 */

function CraftingPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.buttons = [];
    this.targetIsBuilding = false;
    this.craftTarget = null;
    this.craftID = null;
    this.craftAmount = 0;
    this.craftAmountText = null;
    this.craftTargetMaterials = null;
    this.amounts = {}; // item.id -> text of nb needed
    this.canCraft = false;
    this.lastCraft = Date.now();
    this.makeRing();
    this.disableButtons();
}

CraftingPanel.prototype = Object.create(Panel.prototype);
CraftingPanel.prototype.constructor = CraftingPanel;

CraftingPanel.prototype.makeRing = function(){
    var ringx = 80;
    var ringy = 50;
    var ring = this.addSprite('UI','craftring',ringx,ringy);
    this.craftTarget = this.addSprite('items','void',ringx+(ring.frame.width/2),ringy+(ring.frame.height/2));
    this.craftTarget.centered = true;
    this.craftAmountText = Engine.scene.add.text(this.x+ringx+(ring.frame.width/2),this.y+ringy+85, '',
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.craftAmountText.setOrigin(0.5,0.5);
    this.craftAmountText.centered = true;
    this.container.push(this.craftAmountText);
    this.craftTargetMaterials = new Inventory(Engine.craftInvSize);
    this.buttons.push(this.addRing(ringx+92,ringy+13,'green','ok',this.requestCraft.bind(this)));
    this.buttons.push(this.addRing(ringx+5,ringy+82,'blue','plus',this.increaseAmount.bind(this)));
    this.buttons.push(this.addRing(ringx+22,ringy+99,'blue','minus',this.decreaseAmount.bind(this)));
    this.verticalOffset += 200;
};

CraftingPanel.prototype.increaseAmount = function(){
    this.changeAmount(1);
};

CraftingPanel.prototype.decreaseAmount = function(){
    this.changeAmount(-1);
};

CraftingPanel.prototype.changeAmount = function(inc){
    var plusbtn = this.buttons[1];
    var minusbtn = this.buttons[2];
    var button = (inc == 1 ? plusbtn : minusbtn);
    if(!button.enabled) return;
    if(inc == -1 && this.craftAmount == 1) return;
    if(inc == 1 && (this.craftAmount == 9999 || this.targetIsBuilding)) return;
    this.craftAmount += inc;
    this.craftAmountText.setText(this.craftAmount);
    this.updateNumbers();

    if(this.craftAmount == 1 && minusbtn.enabled){minusbtn.disable();}
    else if(this.craftAmount == 999 && plusbtn.enabled){plusbtn.disable();}
    else if(this.craftAmount > 1 && !minusbtn.enabled){minusbtn.enable();}
    else if(this.craftAmount < 999 && !plusbtn.enabled){plusbtn.enable();}
};

CraftingPanel.prototype.disableButtons = function(){
    for(var i = 0; i < this.buttons.length; i++){
        this.buttons[i].disable();
    }
};

/*CraftingPanel.prototype.enableButtons = function(){
    for(var i = 1; i < this.buttons.length; i++){ // start at 1 to skip ok button
        this.buttons[i].enable();
    }
};*/

CraftingPanel.prototype.updateOkButton = function(){
    var btn = this.buttons[0];
    if(this.canCraft){
        btn.enable();
    }else{
        btn.disable();
    }
};

CraftingPanel.prototype.requestCraft = function(){
    if(Date.now() - this.lastCraft < 200) return;
    Client.sendCraft(this.craftID,this.craftAmount);
    this.lastCraft = Date.now();
};

CraftingPanel.prototype.updateTarget = function(id,data){
    this.craftID = id;
    this.targetIsBuilding = (data.building >= 0);
    this.craftTarget.setTexture(data.atlas);
    this.craftTarget.setFrame(data.frame);
    this.craftTarget.setDisplayOrigin(Math.floor(this.craftTarget.frame.width/2),Math.floor(this.craftTarget.frame.height/2));
    this.craftAmount = 1;
    this.craftAmountText.setText(this.craftAmount);
    this.amounts = {};
    if(!this.targetIsBuilding) this.buttons[1].enable();
    this.buttons[2].disable();

    if(!data.recipe) throw Error('No recipe for provided item');
    this.craftTargetMaterials.setItems(data.recipe);
    this.refreshInventory();
};

CraftingPanel.prototype.refreshInventory = function(){
    this.hideInventory();
    this.displayIngredients();
    this.updateNumbers();
};

CraftingPanel.prototype.displayIngredients = function(){
    var inv = this.inventories[0];
    var inventory = inv.inventory;
    var j = inv.firstSlot;
    for(var item in inventory.items){
        if(!inventory.items.hasOwnProperty(item)) continue;
        var sprite = this.getNextItemSprite(item,inv.callback);
        var pos = this.slots[j];
        sprite.setPosition(pos.x+2+16,pos.y+4+16);
        if(inv.showNumbers) {
            var text = this.getNextText(0).setPosition(pos.x + 37, pos.y + 18);
            this.amounts[item] = text;
        }
        j++;
        this.nextItemSprite++;
    }
};

CraftingPanel.prototype.updateNumbers = function(){
    this.canCraft = true;
    for(var item in this.amounts){
        if(!this.amounts.hasOwnProperty(item)) continue;
        var text = this.amounts[item];
        var required = this.craftTargetMaterials.getNb(item)*this.craftAmount;
        text.setText(required);
        if(Engine.player.inventory.getNb(item) < required){
            text.setFill('#aa0000');
            this.canCraft = false;
        }else{
            text.setFill('#ffffff');
        }
    }
    this.updateOkButton();
};