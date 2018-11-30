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
    var ringy = 100;
    var ring = UI.scene.add.image(this.x+(this.width/2),this.y+ringy,'UI','craftring');
    ring.setScrollFactor(0);
    ring.setDepth(1);
    ring.setVisible(false);
    this.content.push(ring);
    this.ring = ring;
    var ringw = ring.frame.width;
    var ringh = ring.frame.height;

    var x = ring.x-(ringw/2)-this.x;
    var y = ring.y - (ringh/2)-this.y;
    this.addButton(x+92,y+13,'green','ok',this.requestCraft.bind(this),'Craft');
    this.addButton(x+5,y+82,'blue','plus',this.increaseAmount.bind(this),'Increase by 1');
    this.addButton(x+22,y+99,'blue','minus',this.decreaseAmount.bind(this),'Decrease by 1');

    var item = new ItemSprite();
    item.setPosition(this.x+x+(ringw/2)+5,this.y+y+(ringh/2));
    item.showTooltip = false;
    this.content.push(item);

    var count = UI.scene.add.text(this.x+x+(ringw/2)+5,this.y+y+(ringh/2)+30, '0',  { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    count.setOrigin(0.5,0.5);
    count.setVisible(false);
    count.setDepth(2);
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
     this.buttons[3].btn.enable(); // enable help button
};

CraftingPanel.prototype.setUp = function(itemID){
    var data = Engine.itemsData[itemID];
    this.craftItem.id = itemID;
    this.craftItem.item.setUp(itemID,data);
    this.craftItem.count = 1;
    var output = (Engine.itemsData[this.craftItem.id].output || 1);
    this.craftItem.countText.setText(this.craftItem.count*output);
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
    var helpBtn = this.buttons[3].btn;

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

    helpBtn.enable();
};

CraftingPanel.prototype.canCraft = function(){
    var refInventory = (Engine.craftingStock == 1 ? Engine.player.inventory : Engine.currentBuiling.inventory);
    var ingredients = Engine.getIngredientsPanel().inventory;
    for(var item in ingredients.items){
        if(!ingredients.items.hasOwnProperty(item)) continue;
        //if(ingredients.getNb(item) > Engine.player.inventory.getNb(item)) return false;
        if(ingredients.getNb(item) > refInventory.getNb(item)) return false;
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
    var output = (Engine.itemsData[this.craftItem.id].output || 1);
    this.craftItem.count = Utils.clamp(this.craftItem.count+inc,1,999);
    this.craftItem.countText.setText(this.craftItem.count*output);
    Engine.getIngredientsPanel().modifyInventory(this.makeIngredientsList(this.craftItem.recipe,this.craftItem.count));
    Engine.getIngredientsPanel().updateInventory();
    this.manageButtons();
};

CraftingPanel.prototype.makeIngredientsList = function(recipe,amount){
    var list = {};
    for(var item in recipe){
        if(!recipe.hasOwnProperty(item)) continue;
        list[item] = recipe[item]*amount;
    }
    var inv = new Inventory(10);
    inv.setItems(list);
    return inv;
};


CraftingPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.reset();
};

CraftingPanel.prototype.reset = function(){
    this.craftItem.id = -1;
    this.craftItem.count = 0;
    this.craftItem.recipe = null;
    Engine.getIngredientsPanel().modifyInventory(new Inventory(5));
};

CraftingPanel.prototype.requestCraft = function(){
    if(Date.now() - this.lastCraft < 200) return;
    Client.sendCraft(this.craftItem.id,this.craftItem.count,Engine.craftingStock);
    this.lastCraft = Date.now();
};