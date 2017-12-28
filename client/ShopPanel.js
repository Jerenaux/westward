/**
 * Created by jeren on 28-12-17.
 */
function ShopPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.buttons = [];
    this.lastPurchase = Date.now();
    this.build();
}

ShopPanel.prototype = Object.create(Panel.prototype);
ShopPanel.prototype.constructor = ShopPanel;

ShopPanel.prototype.build = function(){
    var slot = currentScene.scene.add.sprite(this.x+20,this.y+30,'UI','equipment-slot');
    //this.purchase = this.addSprite('items','void',10+15,15+20);
    this.purchase = new ItemSprite(this.x+20+18,this.y+30+18);
    var gold = currentScene.scene.add.sprite(this.x+240,this.y+35,'items2','gold-pile').setScale(1.5);
    this.nameText = currentScene.scene.add.text(this.x+65, this.y+25, 'Item name',
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.countText = currentScene.scene.add.text(this.x+47, this.y+50, 1,
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.priceText = currentScene.scene.add.text(this.x+240, this.y+50, 0,
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.container.push(this.nameText);
    this.container.push(this.countText);
    this.container.push(this.priceText);
    this.container.push(slot);
    this.container.push(gold);

    var ringx = 65;
    var ringy = 50;
    this.buttons.push(this.addRing(ringx,ringy,'blue','minus',this.decreaseAmount.bind(this)));
    this.buttons.push(this.addRing(ringx+25,ringy,'blue','plus',this.increaseAmount.bind(this)));
    this.buttons.push(this.addRing(ringx+60,ringy,'green','ok',this.requestPurchase.bind(this)));
};

ShopPanel.prototype.updatePurchase = function(id,data,action){
    if(!this.displayed) this.display();
    var key = (action == 'sell' ? 0 : 1);
    var title = (action == 'sell' ? 'Sell' : 'Buy');

    this.currentAction = action;
    this.currentAmount = 1;
    this.currentPrice = BScene.prices[id][key];
    this.currentItem = id;
    this.computeMaxAmount();

    this.titleText.setText(title);
    this.countText.setText(this.currentAmount);
    this.nameText.setText(data.name);
    this.priceText.setText(this.currentPrice);

    this.purchase.setUp(id,data);
    this.updateButtons();
};

ShopPanel.prototype.updateButtons = function(){
    var minusbtn = this.buttons[0];
    var plusbtn = this.buttons[1];
    var okbtn = this.buttons[2];
    minusbtn.disable();
    if(this.currentAmount < this.currentMaxAmount){
        plusbtn.enable();
    }else{
        plusbtn.disable();
    }
    if(this.currentMaxAmount > 0) {
        okbtn.enable();
    }else{
        okbtn.disable();
    }
    if(this.currentAction == 'buy' && Engine.player.inventory.isFull()) okbtn.disable();
    if(this.currentAction == 'sell' && BScene.inventory.isFull()) okbtn.disable();
};

ShopPanel.prototype.computeMaxAmount = function(){
    if(this.currentAction == 'sell'){
        var owned = Engine.player.inventory.getNb(this.currentItem);
        var canSell = Math.floor(BScene.gold/this.currentPrice);
        this.currentMaxAmount = Math.min(9999,owned,canSell);
    }else{ // player buys
        var owned = BScene.inventory.getNb(this.currentItem);
        var canBuy = Math.floor(Engine.player.gold/this.currentPrice);
        this.currentMaxAmount = Math.min(9999,owned,canBuy);
    }
};

ShopPanel.prototype.increaseAmount = function(){
    this.changeAmount(1);
};

ShopPanel.prototype.decreaseAmount = function(){
    this.changeAmount(-1);
};

ShopPanel.prototype.changeAmount = function(inc){
    var minusbtn = this.buttons[0];
    var plusbtn = this.buttons[1];
    var button = (inc == 1 ? plusbtn : minusbtn);
    if(!button.enabled) return;
    if(inc == -1 && this.currentAmount == 1) return;
    if(inc == 1 && this.currentAmount == this.currentMaxAmount) return;
    this.currentAmount += inc;
    this.countText.setText(this.currentAmount);
    this.priceText.setText(this.currentPrice*this.currentAmount);

    if(this.currentAmount == 1 && minusbtn.enabled){minusbtn.disable();}
    else if(this.currentAmount == this.currentMaxAmount && plusbtn.enabled){plusbtn.disable();}
    else if(this.currentAmount > 1 && !minusbtn.enabled){minusbtn.enable();}
    else if(this.currentAmount < this.currentMaxAmount && !plusbtn.enabled){plusbtn.enable();}
};

ShopPanel.prototype.requestPurchase = function(){
    if(Date.now() - this.lastPurchase < 200) return;
    Client.sendPurchase(this.currentItem,this.currentAmount,this.currentAction);
    this.lastPurchase = Date.now();
};