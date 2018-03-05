/**
 * Created by Jerome on 20-11-17.
 */

function CraftingPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.buttons = [];
    this.addInterface();
    this.lastCraft = Date.now();
}

CraftingPanel.prototype = Object.create(Panel.prototype);
CraftingPanel.prototype.constructor = CraftingPanel;

CraftingPanel.prototype.addInterface = function(){
    var ringx = 80;
    var ringy = 50;
    var ring = Engine.scene.add.image(this.x+ringx,this.y+ringy,'UI','craftring');
    ring.setScrollFactor(0);
    ring.setDisplayOrigin(0,0);
    ring.setDepth(Engine.UIDepth+1);
    ring.setVisible(false);
    this.content.push(ring);
    this.ring = ring;

    this.addButton(ringx+92,ringy+13,'green','ok',this.requestCraft.bind(this),'Craft');
    this.addButton(ringx+5,ringy+82,'blue','plus',this.increaseAmount.bind(this),'Increase by 1');
    this.addButton(ringx+22,ringy+99,'blue','minus',this.decreaseAmount.bind(this),'Decrease by 1');

    var item = new ItemSprite();
    item.setPosition(this.x+ringx+(ring.frame.width/2),this.y+ringy+(ring.frame.height/2));
    item.showTooltip = false;
    this.content.push(item);

    var count = Engine.scene.add.text(this.x+ringx+(ring.frame.width/2),this.y+ringy+85, '0',  { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    count.setOrigin(0.5,0.5);
    count.setVisible(false);
    count.setDepth(Engine.UIDepth+2);
    count.setScrollFactor(0);
    this.content.push(count);

    this.craftItem = {
        id: -1,
        count: 0,
        recipe: null,
        item: item,
        countText: count
    };
};

CraftingPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

CraftingPanel.prototype.displayInterface = function(){
     this.ring.setVisible(true);
     this.buttons.forEach(function(b){
         b.btn.disable();
     });
};

CraftingPanel.prototype.setUp = function(itemID){
    var data = Engine.itemsData[itemID];
    this.craftItem.id = itemID;
    this.craftItem.item.setUp(itemID,data);
    this.craftItem.count = 1;
    this.craftItem.countText.setText(1);
    this.craftItem.recipe = data.recipe;
    this.craftItem.item.setVisible(true);
    this.craftItem.countText.setVisible(true);

    Engine.getIngredientsPanel().modifyInventory(this.makeIngredientsList(data.recipe,1));
    Engine.getIngredientsPanel().updateInventory();
    this.manageButtons();
};

CraftingPanel.prototype.manageButtons = function(){
    var okBtn = this.buttons[0].btn;
    var plusBtn = this.buttons[1].btn;
    var minusBtn = this.buttons[2].btn;

    if(this.craftItem.count == 1){
        minusBtn.disable();
    }else{
        minusBtn.enable();
    }

    if(this.craftItem.count == 999){
        plusBtn.disable();
    }else{
        plusBtn.enable();
    }

    if(this.canCraft()){
        okBtn.enable();
    }else{
        okBtn.disable();
    }
};

CraftingPanel.prototype.canCraft = function(){
    var ingredients = Engine.getIngredientsPanel().inventory;
    for(var item in ingredients.items){
        if(!ingredients.items.hasOwnProperty(item)) continue;
        if(ingredients.getNb(item) > Engine.player.inventory.getNb(item)) return false;
    }
    return true;
};

CraftingPanel.prototype.increaseAmount = function(){
    this.changeAmount(1);
};

CraftingPanel.prototype.decreaseAmount = function(){
    this.changeAmount(-1);
};

CraftingPanel.prototype.changeAmount = function(inc){
    this.craftItem.count = Utils.clamp(this.craftItem.count+inc,1,999);
    this.craftItem.countText.setText(this.craftItem.count);
    Engine.getIngredientsPanel().modifyInventory(this.makeIngredientsList(this.craftItem.recipe,this.craftItem.count));
    this.manageButtons();
};

CraftingPanel.prototype.makeIngredientsList = function(recipe,amount){
    var result = {};
    for(var item in recipe){
        if(!recipe.hasOwnProperty(item)) continue;
        result[item] = recipe[item]*amount;
    }
    return result;
};


CraftingPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.reset();
};

CraftingPanel.prototype.reset = function(){
    this.craftItem.id = -1;
    this.craftItem.count = 0;
    this.craftItem.recipe = null;
    Engine.getIngredientsPanel().modifyInventory([]);
};

CraftingPanel.prototype.requestCraft = function(){
    if(Date.now() - this.lastCraft < 200) return;
    Client.sendCraft(this.craftItem.id,this.craftItem.count);
    this.lastCraft = Date.now();
};