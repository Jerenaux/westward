/**
 * Created by Jerome on 06-10-17.
 */

function Panel(x,y,width,height,title,invisible){
    Frame.call(this,x,y,width,height,invisible);
    this.capsules = {};
    if(title) this.addCapsule('title',20,-9,title);
}

Panel.prototype = Object.create(Frame.prototype);
Panel.prototype.constructor = Panel;

Panel.prototype.addCapsule = function(name,x,y,text,icon){
    var capsule = new Capsule(this.x+x,this.y+y,icon,this.content);
    capsule.setText(text);
    this.capsules[name] = capsule;
};

Panel.prototype.display = function(){
    Frame.prototype.display.call(this);
    this.content.forEach(function(e){
        e.setVisible(true);
    });
    for(var capsule in this.capsules){
        this.capsules[capsule].display();
    }
};

function Capsule(x,y,icon,container){
    this.slices = [];
    this.icon = null;
    this.width = 1;
    this.width_ = this.width; // previous width
    
    if(icon) {
        this.icon = Engine.scene.add.sprite(x+8,y+6,'UI',icon);
        this.icon.setDepth(Engine.UIDepth+2);
        this.icon.setScrollFactor(0);
        this.icon.setDisplayOrigin(0,0);
        this.icon.setVisible(false);
    }
    var textX = (this.icon ? x + this.icon.width : x) + 10;
    var textY = (this.icon ? y - 1: y);

    this.text = Engine.scene.add.text(textX, textY, '',
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );

    this.slices.push(Engine.scene.add.sprite(x,y,'UI','capsule-left'));
    x += 24;
    this.slices.push(Engine.scene.add.tileSprite(x,y,this.width,24,'UI','capsule-middle'));
    x += this.width;
    this.slices.push(Engine.scene.add.sprite(x,y,'UI','capsule-right'));

    this.slices.forEach(function(e){
        e.setDepth(Engine.UIDepth+1);
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setVisible(false);
        container.push(e); // don't use concat
    });

    this.text.setDepth(Engine.UIDepth+2);
    this.text.setScrollFactor(0);
    this.text.setDisplayOrigin(0,0);
    this.text.setVisible(false);

    container.push(this.text);
    if(this.icon) container.push(this.icon);
}

Capsule.prototype.setText = function(text){
    this.text.setText(text);
    this.width = this.text.width -25;
    if(this.icon) this.width += this.icon.width;

    this.slices[1].width = this.width;
    this.slices[2].x += (this.width-this.width_);

    this.width_ = this.width;
};

Capsule.prototype.display = function(){
    this.slices.forEach(function(e){
        e.setVisible(true);
    });
    this.text.setVisible(true);
    if(this.icon) this.icon.setVisible(true);
};

/*function Panel(x,y,width,height,title){
    this.container = [];
    this.slots = []; // slot number -> coordinates
    this.sprites = []; // pool of sprites to display items
    this.zones = [];
    this.texts = []; // pool of texts for items
    this.nextItemSprite = 0;
    this.nextZone = 0;
    this.x = x;
    this.y = y;
    this.previousX = this.x;
    this.previousY = this.y;
    this.width = width;
    this.height = height;
    this.startingVerticalOffset = 20;
    this.verticalOffset = this.startingVerticalOffset;
    this.displayed = false;
    this.displayInventory = false;
    this.inventories = [];
    this.nextFirstSlot = 0;
    this.domElement = null;
    this.makeBody();
    if(title) this.titleText = this.addCapsule(20,-9,title);
    this.finalize();
}

Panel.prototype.makeBody = function(){
    var sideWidth = 32;

    var w = this.width - 2*sideWidth;
    var h = this.height - 2*sideWidth;

    var x = this.x;
    var y = this.y;
    this.container.push(currentScene.scene.add.sprite(x,y,'UI','panel-topleft'));
    x += sideWidth;
    this.container.push(currentScene.scene.add.tileSprite(x,y,w,sideWidth,'UI','panel-top'));
    x += w;
    this.container.push(currentScene.scene.add.sprite(x,y,'UI','panel-topright'));
    x = this.x;
    y += sideWidth;
    this.container.push(currentScene.scene.add.tileSprite(x,y,sideWidth,h,'UI','panel-left'));
    x += sideWidth;

    var center = currentScene.scene.add.tileSprite(x,y,w,h,'UI','panel-center');
    this.container.push(center);
    x += w;
    this.container.push(currentScene.scene.add.tileSprite(x,y,sideWidth,h,'UI','panel-right'));
    x = this.x;
    y += h;
    this.container.push(currentScene.scene.add.sprite(x,y,'UI','panel-bottomleft'));
    x += sideWidth;
    this.container.push(currentScene.scene.add.tileSprite(x,y,w,sideWidth,'UI','panel-bottom'));
    x += w;
    this.container.push(currentScene.scene.add.sprite(x,y,'UI','panel-bottomright'));
};

Panel.prototype.addCapsule = function(xOffset,yOffset,title,image){
    var x = this.x + xOffset;
    var y = this.y + yOffset;

    if(image) {
        var img = currentScene.scene.add.sprite(x+8,y+6,'UI',image);
        img.setDepth(Engine.UIDepth+2);
    }
    var textX = (image ? x + img.width : x) + 10;
    var textY = (image ? y - 1: y);

    var text = currentScene.scene.add.text(textX, textY, title,
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    var w = text.width -25;
    if(image) w += img.width;
    this.container.push(text);
    this.container.push(currentScene.scene.add.sprite(x,y,'UI','capsule-left'));
    x += 24;
    this.container.push(currentScene.scene.add.tileSprite(x,y,w,24,'UI','capsule-middle'));
    x += w;
    this.container.push(currentScene.scene.add.sprite(x,y,'UI','capsule-right'));

    if(image) this.container.push(img);
    return text;
};

Panel.prototype.addRing = function(xs,ys,color,symbol,callback){
    var x = this.x + xs;
    var y = this.y + ys;
    this.container.push(currentScene.scene.add.sprite(x,y,'UI','ring'));
    x += 5;
    y += 5;

    var cs = new Button(x,y,color,callback);
    this.container.push(cs);
    x += 3;
    y += 3;

    var ss = currentScene.scene.add.sprite(x,y,'UI',symbol);
    ss.notInteractive = true;
    this.container.push(ss);

    this.finalize();
    return cs;
};

Panel.prototype.addInventory = function(title,maxwidth,total,inventory,showNumbers,callback){
    this.displayInventory = true;
    var inv = {
        inventory: inventory,
        maxWidth: maxwidth,
        showNumbers: showNumbers,
        firstSlot: this.nextFirstSlot,
        callback: callback
    };
    this.inventories.push(inv);
    if(title) this.addLine(title);
    this.addSlots(maxwidth,total);
};

Panel.prototype.createZone = function(){
    var zone = currentScene.scene.add.zone(0,0,0,0);
    zone.setDepth(Engine.UIDepth+10);
    zone.setScrollFactor(0);
    zone.handleOver = function(){
        currentScene.tooltip.display();
    };
    zone.handleOut = function(){
        currentScene.tooltip.hide();
    };
    return zone;
};

Panel.prototype.clearInventories = function(){
    //console.log(BScene.scene.children);
    this.displayInventory = false;
    this.inventories = [];
    //this.slots = [];
    this.nextFirstSlot = 0;
    this.verticalOffset = this.startingVerticalOffset;
    //console.log(BScene.scene.children);
};

Panel.prototype.setInventoryFilter = function(prices,key){
    this.inventoryFilter = prices;
    this.inventoryFilterKey = key;
};

Panel.prototype.addSlots = function(nbHorizontal,total){
    var nbVertical = Math.ceil(total/nbHorizontal);
    //var paddingX = 15;
    var paddingX = (this.width/2) - (nbHorizontal*36/2);
    var offsetx = 0; // slight offset depending on whether the slot is on the fringes or not
    var offsety = 0;
    var counter = 0;
    this.verticalOffset += 5;

    for(var y = 0; y < nbVertical; y++){
        for(var x = 0; x < nbHorizontal; x++){
            if((y*nbHorizontal)+x >= total) break;
            var frame = 'slots-';
            var center = 0;
            switch(y){
                case 0:
                    frame += 'top';
                    break;
                case nbVertical-1:
                    frame += 'bottom';
                    break;
                default:
                    center++;
                    break;
            }
            switch(x){
                case 0:
                    frame += 'left';
                    break;
                case nbHorizontal-1:
                    frame += 'right';
                    break;
                default:
                    center++;
                    break;
            }
            if(center == 2) frame += 'middle';
            offsetx = (x > 0 ? 2 : 0);
            offsety = (y > 0 ? 2 : 0);
            var slotx = this.x+paddingX+(x*36)+offsetx;
            var sloty = this.y+this.verticalOffset+(y*36)+offsety;

            if(this.slots.length > counter){
                this.slots[counter].setFrame(frame);
                this.slots[counter].setPosition(slotx,sloty);
            }else{
                var slot = currentScene.scene.add.sprite(slotx,sloty,'UI',frame);
                slot.setDepth(Engine.UIDepth);
                slot.setDisplayOrigin(0,0);
                slot.setScrollFactor(0,0);
                slot.setVisible(false);
                this.slots.push(slot);
            }

            counter++;
        }
    }
    this.verticalOffset += nbVertical*36 + 5;
    this.nextFirstSlot += counter;
    this.finalize();
};

Panel.prototype.addLine = function(line){
    var text = currentScene.scene.add.text(this.x+15, this.y+this.verticalOffset, line,
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.container.push(text);
    this.verticalOffset += 20;
    this.finalize();
};

Panel.prototype.addSprite = function(atlas,frame,x,y){
    var sprite = currentScene.scene.add.sprite(this.x+x,this.y+y,atlas,frame);
    this.container.push(sprite);
    this.finalize();
    return sprite;
};

Panel.prototype.updatePosition = function(){
    var dx = this.x - this.previousX;
    var dy = this.y - this.previousY;
    if(dx == 0 && dy == 0) return;
    this.container.forEach(function(e){
        e.x += dx;
        e.y += dy;
    });
    this.sprites.forEach(function(e){
        e.x += dx;
        e.y += dy;
    });
    this.texts.forEach(function(e){
        e.x += dx;
        e.y += dy;
    });
    this.previousX = this.x;
    this.previousY = this.y;
};

Panel.prototype.setTweens = function(sx,sy,ex,ey,duration){
    var _this = this;
    this.showTween = currentScene.scene.tweens.add({
        targets: this,
        x: ex,
        y: ey,
        ease: 'Bounce.easeOut',
        paused: true,
        onStart: function(){
            //console.log('show start');
        },
        onUpdate: function(){
            _this.updatePosition();
        },
        duration: duration
    });
    this.hideTween = currentScene.scene.tweens.add({
        targets: this,
        x: sx,
        y: sy,
        paused: true,
        onStart: function(){
            //console.log('hide start');
        },
        onUpdate: function(){
            _this.updatePosition();
        },
        onComplete: function(){
            _this.hidePanel();
        },
        duration: 200
    });
};

Panel.prototype.finalize = function(){
    this.container.forEach(function(e){
        var isText = (e.constructor.name == 'Text');
        if(e.depth == 1 || !e.depth) e.depth = Engine.UIDepth;
        if(isText) e.depth++;
        e.setScrollFactor(0);
        if(!e.centered) e.setDisplayOrigin(0,0);
        if(!e.notInteractive) e.setInteractive();
        e.visible = false;
    });
};

Panel.prototype.getNextZone = function(){
    if(this.zones.length <= this.nextZone){
        this.zones.push(this.createZone());
    }
    var zone = this.zones[this.nextZone];
    return zone;
};

Panel.prototype.getNextItemSprite = function(item, callback){ // Pool of sprites common to all inventories of the panel
    if(this.sprites.length <= this.nextItemSprite){
        this.sprites.push(new ItemSprite());
    }
    var sprite = this.sprites[this.nextItemSprite];
    sprite.setUp(item,Engine.itemsData[item],callback);
    return sprite;
};

Panel.prototype.getNextText = function(nb){
    if(this.texts.length <= this.nextItemSprite){
        var empty = currentScene.scene.add.text(100,10, 'lorem ipsum',
            { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
        );
        empty.setScrollFactor(0);
        empty.setOrigin(1,0);
        empty.setDepth(Engine.UIDepth);
        this.texts.push(empty);
    }
    var text = this.texts[this.nextItemSprite];
    text.setText(nb);
    text.visible = true;
    return text;
};

Panel.prototype.toggle = function(){
    if(this.displayed){
        this.hide();
    }else{
        this.display();
    }
};

Panel.prototype.display = function(){
    for(var i = 0; i < this.container.length; i++){
        this.container[i].setVisible(true);
        if(this.container[i].upFrame) this.container[i].setFrame(this.container[i].upFrame);
    }
    if(this.displayInventory) {
        for(var i = 0; i < this.inventories.length; i++) {
            this.displayTheInventory(this.inventories[i]);
        }
    }
    if(this.showTween) this.showTween.play();
    if(this.domElement){
        this.domElement.style.display = "inline";
        this.domElement.focus();
    }
    this.displayed = true;
};

Panel.prototype.displayTheInventory = function(inv){
    var inventory = inv.inventory;
    var j = inv.firstSlot;
    var nbDisplayed = 0;
    for(var i = 0; i < inventory.maxSize; i++){
        console.log('showing',i);
        this.slots[i].setVisible(true);
    }
    for(var item in inventory.items){
        if(!inventory.items.hasOwnProperty(item)) continue;
        if(inventory.getNb(item) == 0) continue;
        if(this.inventoryFilter){
            if(!this.inventoryFilter.hasOwnProperty(item)) continue;
            if(!this.inventoryFilter[item][this.inventoryFilterKey] > 0) continue;
        }
        nbDisplayed++;
        var sprite = this.getNextItemSprite(item,inv.callback);
        var slot = this.slots[j];
        sprite.setPosition(slot.x+2+16,slot.y+4+16);
        if(inv.showNumbers) {
            var text = this.getNextText(inventory.getNb(item));
            text.setPosition(slot.x + 37, slot.y + 18);
        }
        j++;
        this.nextItemSprite++;
    }

    var slotSize = 36;
    var zoneX = this.slots[inv.firstSlot].x;
    var zoneY = this.slots[inv.firstSlot].y;
    var zoneW = Math.min(nbDisplayed,inv.maxWidth)*slotSize;
    var zoneH = Math.ceil(nbDisplayed/inv.maxWidth)*slotSize;
    var shape = [0,0,zoneW,0];
    // Diff = how many empty slots in the last inventory row
    var diff = inv.maxWidth - Math.ceil(nbDisplayed%inv.maxWidth);
    if(diff == inv.maxWidth) diff = 0;
    if(diff > 0 && nbDisplayed > inv.maxWidth){
        shape.push(zoneW);
        shape.push(zoneH-slotSize);

        shape.push(zoneW-(diff*slotSize));
        shape.push(zoneH-slotSize);

        shape.push(zoneW-(diff*slotSize));
        shape.push(zoneH);
    }else{
        shape.push(zoneW);
        shape.push(zoneH);
    }
    shape.push(0);
    shape.push(zoneH);
    var polygon = new Phaser.Geom.Polygon(shape);

    var zone = this.getNextZone();
    zone.setVisible(true);
    zone.setPosition(zoneX,zoneY);
    zone.setSize(zoneW,zoneH);
    zone.setInteractive(polygon,Phaser.Geom.Polygon.Contains);
};

Panel.prototype.hide = function(){
    if(this.domElement) {
        this.domElement.style.display = "none";
        this.domElement.value = "";
    }
    if(this.hideTween){
        this.hideTween.play();
    }else{
        this.hidePanel();
    }
};

Panel.prototype.hidePanel = function(){
    for(var i = 0; i < this.container.length; i++){
        this.container[i].visible = false;
    }
    if(this.displayInventory) this.hideInventory();
    this.displayed = false;
};

Panel.prototype.hideInventory = function(){ // Hide all items of all inventories of the panel at once
    for(var j = 0; j < this.sprites.length; j++){
        this.sprites[j].visible = false;
        if(this.texts[j]) this.texts[j].visible = false;
    }
    for(var i = 0; i < this.slots.length; i++){
        console.log('hiding ',i);
        this.slots[i].setVisible(false);
    }
    for(var i = 0; i < this.zones.length; i++){
        this.zones[i].setVisible(false);
    }
    this.nextItemSprite = 0;
    this.nextZone = 0;
};

Panel.prototype.refreshInventory = function(){
    if(this.displayInventory) {
        this.hideInventory();
        for(var i = 0; i < this.inventories.length; i++) {
            this.displayTheInventory(this.inventories[i]);
        }
    }
};*/
