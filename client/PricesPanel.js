/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 02-12-18.
 */
function PricesPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);

    this.slots = [];
    this.slotsCounter = 0;

    var center = Engine.getGameConfig().width/2;
    var w = 200;

    this.input = document.createElement("input");
    this.input.className = 'game_input';
    this.input.type = "text";
    this.input.style.width = w+'px';
    this.input.style.left = (center-(w/2))+'px';
    this.input.style.top = (this.y+100)+'px';
    this.input.style.background = 'red';
    this.input.style.display = "none";

    this.input.onkeyup = function(){
        var value = this.input.value.toLowerCase();
        if(value.length >= 3){
            var hits = [];
            for(var id in Engine.itemsData) {
                var name = Engine.itemsData[id].name.toLowerCase();
                if(name.includes(value)) hits.push(id);
                if(hits.length >= 3) break;
            }
            this.refreshContent(hits);
        }
    }.bind(this);
    document.getElementById('game').appendChild(this.input);
}

PricesPanel.prototype = Object.create(Panel.prototype);
PricesPanel.prototype.constructor = PricesPanel;

PricesPanel.prototype.getNextSlot = function(x,y){
    if(this.slotsCounter >= this.slots.length){
        this.slots.push(new PriceSlot(x,y,500,80));
    }

    return this.slots[this.slotsCounter++];
};

PricesPanel.prototype.refreshContent = function(hits){
    console.log(hits);
    hits.forEach(function(item,i){
        var slot = this.getNextSlot(this.x+20,this.starty+(i*90));
        slot.setUp(item);
        slot.display();
    },this);
};

PricesPanel.prototype.display = function(){
    // Panel.prototype.display.call(this);
    this.input.style.display = "inline";
    this.input.focus();
};

PricesPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.input.style.display = "none";
    this.slotsCounter = 0;
};


// -----------------------

function PriceSlot(x,y,width,height){
    Frame.call(this,x,y,width,height);

    this.icon = UI.scene.add.sprite(this.x + 30, this.y + height/2);
    /*this.bagicon = UI.scene.add.sprite(this.x + 14, this.y + height - 12, 'UI','smallpack');
    this.staticon = UI.scene.add.sprite(this.x + 70, this.y + 45, 'icons2');

    this.name = UI.scene.add.text(this.x + 60, this.y + 10, '', { font: '16px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.nb = UI.scene.add.text(this.x + 24, this.y + height - 22, '999', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.effect = UI.scene.add.text(this.x + 88, this.y + 35, '', { font: '14px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.rarity = UI.scene.add.text(this.x + 60, this.y + 60, '', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });

    this.zone = UI.scene.add.zone(this.x,this.y,width,height);
    // this.zone.setDepth(10);
    this.zone.setInteractive();
    this.zone.setOrigin(0);
    this.zone.on('pointerover',function(){
        UI.setCursor('item');
    });
    this.zone.on('pointerout',function(){
        UI.setCursor();
    });*/

    this.content = [this.icon];
    this.content.forEach(function(c){
        c.setScrollFactor(0);
        c.setDepth(100);
    });
}

PriceSlot.prototype = Object.create(Frame.prototype);
PriceSlot.prototype.constructor = PriceSlot;

PriceSlot.prototype.setUp = function(item){
    var itemData = Engine.itemsData[item];
    console.log(itemData);
    this.icon.setTexture(itemData.atlas,itemData.frame);
    // this.name.setText(itemData.name);
    // this.nb.setText(nb);
};

PriceSlot.prototype.display = function(){
    Frame.prototype.display.call(this);
    this.content.forEach(function(c){
        c.setVisible(true);
    });
};

PriceSlot.prototype.hide = function(){
    Frame.prototype.hide.call(this);
    this.content.forEach(function(c){
        c.setVisible(false);
    });
};