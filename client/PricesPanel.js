/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 02-12-18.
 */
function PricesPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);

    this.slots = [];
    this.slotsCounter = 0;

    var center = Engine.getGameConfig().width/2;
    var w = 200;

    this.title = this.addText(width/2,70,'Enter item name:');
    this.title.setOrigin(0.5);

    this.input = this.addInput(w,(width-w)/2,100);
    this.input.onkeyup = function(){
        var value = this.input.value.toLowerCase();
        if(value.length >= 3){
            var hits = [];
            for(var id in Engine.itemsData) {
                if(Engine.itemsData[id].permanent) continue; // don't sell hands and fists
                if(this.craftingOnly && !Engine.itemsData[id].isCrafted) continue;
                if(id != 1 && this.prodOnly && !Engine.isProduced(id)) continue;

                var name = Engine.itemsData[id].name.toLowerCase();
                if(name.includes(value)) hits.push(id);
                if(hits.length >= 3) break;
            }
            this.refreshContent(hits);
        }
    }.bind(this);
    document.getElementById('game').appendChild(this.input);

    this.buyText = 'Buy';
    this.sellText = 'Sell';
}

PricesPanel.prototype = Object.create(Panel.prototype);
PricesPanel.prototype.constructor = PricesPanel;

PricesPanel.prototype.limitToCrafting = function(){
    this.craftingOnly = true;
    this.buyText = '';
    this.sellText = 'Craft';
};

PricesPanel.prototype.limitToProduction = function(){
    this.prodOnly = true;
};

PricesPanel.prototype.getNextSlot = function(y){
    var w = 250;
    var x = 1024/2 - w/2;
    if(this.slotsCounter >= this.slots.length){
        this.slots.push(new PriceSlot(x,y,w,90,this.buyText,this.sellText));
    }

    return this.slots[this.slotsCounter++];
};

PricesPanel.prototype.refreshContent = function(hits){
    this.hideContent();
    hits.forEach(function(item,i){
        var slot = this.getNextSlot(this.y+150+(i*100));
        slot.setUp(item);
        slot.moveUp(6);
        slot.display();
    },this);
};

PricesPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
    this.input.style.display = "inline";
    this.input.focus();
};

PricesPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.input.value = '';
    this.input.style.display = "none";
    this.hideContent();
};


PricesPanel.prototype.hideContent = function(){
    this.slots.forEach(function(slot){
        slot.hide();
    });
    this.slotsCounter = 0;
};


// -----------------------

function PriceSlot(x,y,width,height,buyLabel,sellLabel){
    Panel.call(this,x,y,width,height);

    this.icon = UI.scene.add.sprite(this.x + 30, this.y + height/2);
    this.name = UI.scene.add.text(this.x + 60, this.y + 10, '', { font: '16px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });

    var labely = 41;
    if(buyLabel) {
        this.buyText = UI.scene.add.text(this.x + 60, this.y + labely, buyLabel+' for:', { font: '14px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        this.buy = this.addInput(50,120,labely);
        labely += 25;
    }
    if(sellLabel){
        this.sellText = UI.scene.add.text(this.x + 60, this.y + labely, sellLabel+' for:', { font: '14px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        var sellx = (buyLabel ? 120 : 135);
        this.sell = this.addInput(50,sellx,labely);
    }


    this.addButton(width-20,height-20,'green','ok',function(){
        Client.setPrices(this.itemID,(this.buy ? this.buy.value : -1),(this.sell ? this.sell.value : -1));
    }.bind(this),'Confirm');

    this.content = [this.icon, this.name];
    if(buyLabel) this.content.push(this.buyText);
    if(sellLabel) this.content.push(this.sellText);

    this.content.forEach(function(c){
        c.setScrollFactor(0);
        c.setDepth(1);
    });
}

PriceSlot.prototype = Object.create(Panel.prototype);
PriceSlot.prototype.constructor = PriceSlot;

PriceSlot.prototype.setUp = function(item){
    var itemData = Engine.itemsData[item];
    // console.log(itemData);
    this.icon.setTexture(itemData.atlas,itemData.frame);
    this.name.setText(itemData.name);
    if(this.buy) this.buy.value = (item in Engine.currentBuiling.prices ? Engine.currentBuiling.prices[item].buy : 0);
    if(this.sell) this.sell.value = (item in Engine.currentBuiling.prices ? Engine.currentBuiling.prices[item].sell : 0);
    this.itemID = item;
};

PriceSlot.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.content.forEach(function(c){
        c.setVisible(true);
    });
    if(this.buy) this.buy.style.display = "inline";
    if(this.sell) this.sell.style.display = "inline";
};

PriceSlot.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.content.forEach(function(c){
        c.setVisible(false);
    });
    if(this.buy) this.buy.style.display = "none";
    if(this.sell) this.sell.style.display = "none";
    this.hideButtons();
};