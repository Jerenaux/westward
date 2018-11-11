/**
 * Created by jeren on 28-12-17.
 */
function ShopPanel(x,y,width,height,title,notShop){
    Panel.call(this,x,y,width,height,title);
    this.buttons = [];
    this.lastPurchase = Date.now();
    this.addInterface();
    this.isShop = !notShop;
}

ShopPanel.prototype = Object.create(Panel.prototype);
ShopPanel.prototype.constructor = ShopPanel;

ShopPanel.prototype.addInterface = function(){
    var slot = UI.scene.add.sprite(this.x+20,this.y+30,'UI','equipment-slot');
    slot.setDepth(1);
    slot.setScrollFactor(0);
    slot.setDisplayOrigin(0,0);
    slot.setVisible(false);
    this.content.push(slot);
    this.slot = slot;

    if(this.isShop) {
        var gold = UI.scene.add.sprite(this.x + 240, this.y + 35, 'items2', 'gold-pile');
        gold.setScale(1.5);
        gold.setDepth(1);
        gold.setScrollFactor(0);
        gold.setDisplayOrigin(0, 0);
        gold.setVisible(false);
        this.content.push(gold);
        this.gold = gold;
    }

    var item = new ItemSprite();
    item.setPosition(this.x+20+18,this.y+30+18);
    item.showTooltip = false;
    this.content.push(item);

    // this.x+47,this.y+50
    var count = UI.scene.add.text(slot.x+38,slot.y+40, '0',  { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    count.setVisible(false);
    count.setDepth(2);
    count.setScrollFactor(0);
    count.setOrigin(1,1);
    this.content.push(count);

    if(this.isShop) {
        var price = UI.scene.add.text(this.x + 240, this.y + 50, '0', {
            font: '14px belwe',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        price.setVisible(false);
        price.setDepth(2);
        price.setScrollFactor(0);
        this.content.push(price);
    }

    var name = Engine.scene.add.text(this.x+65,this.y+25, '0',  { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    name.setVisible(false);
    name.setDepth(2);
    name.setScrollFactor(0);
    this.content.push(name);

    this.addButton(125,50,'green','ok',this.requestPurchase.bind(this),'Confirm');
    this.addButton(90,50,'blue','plus',this.increaseAmount.bind(this),'Increase by 1');
    this.addButton(65,50,'blue','minus',this.decreaseAmount.bind(this),'Decrease by 1');

    this.shopItem = {
        id: -1,
        count: 0,
        price: 0,
        priceText: price,
        item: item,
        countText: count,
        nameText: name,
        action: null
    };
};

ShopPanel.prototype.setUp = function(id,action,title){
    var data = Engine.itemsData[id];
    this.shopItem.id = id;
    this.shopItem.count = 1;
    this.shopItem.action = action;
    if(this.isShop) this.shopItem.price = this.getPrice(id);
    this.shopItem.item.setUp(id,data);
    this.shopItem.item.setVisible(true);
    this.shopItem.nameText.setText(data.name);
    this.shopItem.nameText.setVisible(true);
    this.shopItem.countText.setText(1);
    this.shopItem.countText.setVisible(true);
    if(this.isShop) this.displayPrice();
    //var title = (action == 'buy' ? 'Buy' : 'Sell');
    this.capsules['title'].setText(title);
    this.manageButtons();
};

ShopPanel.prototype.update = function(){
    if(!this.displayed) return;
    if(this.isShop) this.displayPrice();
    this.manageButtons();
};

ShopPanel.prototype.displayPrice = function(){
    this.shopItem.priceText.setText(this.shopItem.price*this.shopItem.count);
    this.shopItem.priceText.setVisible(true);

    var fill = (this.canBuy() ? '#ffffff' : '#ee1111');
    this.shopItem.priceText.setFill(fill);
};

ShopPanel.prototype.canBuy = function(){
    if(this.shopItem.action == 'buy'){
        if(this.shopItem.price*this.shopItem.count > Engine.player.gold) return false;
    }else{
        if(this.shopItem.price*this.shopItem.count > Engine.currentBuiling.gold) return false;
    }
    return true;
};

ShopPanel.prototype.isAtZero = function(){
    if(this.shopItem.action == 'buy'){
        if(Engine.currentBuiling.inventory.getNb(this.shopItem.id) == 0) return true;
    }else{
        if(Engine.player.inventory.getNb(this.shopItem.id) == 0) return true;
    }
    return false;
};

ShopPanel.prototype.isAtMax = function(){
    if(this.shopItem.action == 'buy'){
        if(this.shopItem.count >= Engine.currentBuiling.inventory.getNb(this.shopItem.id)) return true;
    }else{
        if(this.shopItem.count >= Engine.player.inventory.getNb(this.shopItem.id)) return true;
    }
    return false;
};

ShopPanel.prototype.getPrice = function(id){
    return Engine.currentBuiling.getPrice(id,this.shopItem.action);
};

ShopPanel.prototype.manageButtons = function(){
    var okBtn = this.buttons[0].btn;
    var plusBtn = this.buttons[1].btn;
    var minusBtn = this.buttons[2].btn;

    if(this.shopItem.count <= 1){
        minusBtn.disable();
    }else{
        minusBtn.enable();
    }

    if(this.shopItem.count == 999 || this.isAtMax()){
        plusBtn.disable();
    }else{
        plusBtn.enable();
    }

    if(this.canBuy() && !this.isAtZero()){
        okBtn.enable();
    }else{
        okBtn.disable();
    }
};

ShopPanel.prototype.increaseAmount = function(){
    this.changeAmount(1);
};

ShopPanel.prototype.decreaseAmount = function(){
    this.changeAmount(-1);
};

ShopPanel.prototype.changeAmount = function(inc){
    this.shopItem.count = Utils.clamp(this.shopItem.count+inc,1,999);
    this.shopItem.countText.setText(this.shopItem.count);
    if(this.isShop) this.displayPrice();
    this.manageButtons();
};

ShopPanel.prototype.displayInterface = function(){
    this.slot.setVisible(true);
    if(this.isShop) this.gold.setVisible(true);
    this.buttons.forEach(function(b){
        b.btn.disable();
    });
};

ShopPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

ShopPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    // No need to manually hide the buttons, addButton() adds them to content so the Panel hides them
    this.reset();
};

ShopPanel.prototype.reset = function(){
    this.shopItem.id = -1;
    this.shopItem.count = 0;
    this.shopItem.price = 0;
    this.capsules['title'].setText('Buy/Sell');
};

ShopPanel.prototype.requestPurchase = function(){
    if(Date.now() - this.lastPurchase < 200) return;
    if(this.isShop) {
        Client.sendPurchase(this.shopItem.id, this.shopItem.count, this.shopItem.action);
    }else{
        Client.sendStock(this.shopItem.id,this.shopItem.count,Engine.currentBuiling.id,this.shopItem.action);
        if(Client.tutorial && this.shopItem.action == 'buy') Engine.tutorialHook('take:'+this.shopItem.id+':'+this.shopItem.count);
        if(Client.tutorial && this.shopItem.action == 'sell') Engine.tutorialHook('give:'+this.shopItem.id+':'+this.shopItem.count);
    }
    this.lastPurchase = Date.now();
};