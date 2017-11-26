/**
 * Created by Jerome on 06-10-17.
 */
function Panel(x,y,width,height,title){
    this.container = [];
    this.slots = []; // slot number -> coordinates
    this.sprites = []; // pool of sprites to display items
    this.texts = []; // pool of texts for items
    this.nextItemSprite = 0;
    this.test = [];
    this.x = x;
    this.y = y;
    this.previousX = this.x;
    this.previousY = this.y;
    this.width = width;
    this.height = height;
    this.verticalOffset = 20;
    this.displayed = false;
    this.displayInventory = false;
    this.inventories = [];
    this.nextFirstSlot = 0;
    this.domElement = null;
    this.makeBody();
    if(title) this.addCapsule(20,-9,title);
    this.finalize();
}

Panel.prototype.makeBody = function(){
    var sideWidth = 32;

    var w = this.width - 2*sideWidth;
    var h = this.height - 2*sideWidth;

    var x = this.x;
    var y = this.y;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-topleft'));
    x += sideWidth;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,sideWidth+2,'UI','panel-top'));
    x += w;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-topright'));
    x = this.x;
    y += sideWidth;
    this.container.push(Engine.scene.add.tileSprite(x,y,sideWidth,h+2,'UI','panel-left'));
    x += sideWidth;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,h+2,'UI','panel-center'));
    x += w;
    this.container.push(Engine.scene.add.tileSprite(x,y,sideWidth,h+2,'UI','panel-right'));
    x = this.x;
    y += h;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-bottomleft'));
    x += sideWidth;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,sideWidth+2,'UI','panel-bottom'));
    x += w;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-bottomright'));
};

Panel.prototype.addCapsule = function(xOffset,yOffset,title,image){
    var x = this.x + xOffset;
    var y = this.y + yOffset;

    if(image) {
        var img = Engine.scene.add.sprite(x+8,y+6,'UI',image);
        img.depth = Engine.UIDepth+2;
    }
    var textX = (image ? x + img.width : x) + 10;
    var textY = (image ? y - 1: y);

    var text = Engine.scene.add.text(textX, textY, title,
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    var w = text.width -25;
    if(image) w += img.width;
    this.container.push(text);
    this.container.push(Engine.scene.add.sprite(x,y,'UI','capsule-left'));
    x += 24;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,24,'UI','capsule-middle'));
    x += w;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','capsule-right'));

    if(image) this.container.push(img);
};

Panel.prototype.addRing = function(xs,ys,color,symbol,callback){
    var x = this.x + xs;
    var y = this.y + ys;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','ring'));
    x += 5;
    y += 5;

    var cs = new Button(x,y,color,callback);
    this.container.push(cs);
    x += 3;
    y += 3;

    var ss = Engine.scene.add.sprite(x,y,'UI',symbol);
    ss.notInteractive = true;
    this.container.push(ss);

    this.finalize();
    return cs;
};

Panel.prototype.addInventory = function(title,maxwidth,total,inventory,showNumbers,callback){
    this.displayInventory = true;
    var inv = {
        inventory: inventory,
        showNumbers: showNumbers,
        firstSlot: this.nextFirstSlot,
        callback: callback
    };
    this.inventories.push(inv);
    if(title) this.addLine(title);
    this.addSlots(maxwidth,total);
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
            this.slots.push({
                x: slotx,
                y: sloty
            });
            counter++;
            this.container.push(Engine.scene.add.sprite(slotx,sloty,'UI',frame));
        }
    }
    this.verticalOffset += nbVertical*36 + 5;
    this.nextFirstSlot += counter;
    this.finalize();
};

Panel.prototype.addEquip = function(){
    this.container.push(Engine.scene.add.sprite(this.x+150,this.y+50,'UI','equipment-slot'));
    this.container.push(Engine.scene.add.sprite(this.x+155,this.y+60,'UI','armor-shade'));
    this.container.push(Engine.scene.add.sprite(this.x+100,this.y+65,'UI','equipment-slot'));
    this.container.push(Engine.scene.add.sprite(this.x+108,this.y+75,'UI','gun-shade'));
    this.container.push(Engine.scene.add.sprite(this.x+100,this.y+115,'UI','equipment-slot'));
    this.container.push(Engine.scene.add.sprite(this.x+108,this.y+122,'UI','sword-shade'));
    this.container.push(Engine.scene.add.sprite(this.x+200,this.y+65,'UI','equipment-slot'));
    this.container.push(Engine.scene.add.sprite(this.x+208,this.y+75,'UI','shield-shade'));
    this.container.push(Engine.scene.add.sprite(this.x+200,this.y+15,'UI','equipment-slot'));
    this.container.push(Engine.scene.add.sprite(this.x+210,this.y+25,'UI','necklace-shade'));
    this.container.push(Engine.scene.add.sprite(this.x+150,this.y+100,'UI','equipment-slot'));
    this.container.push(Engine.scene.add.sprite(this.x+158,this.y+115,'UI','belt-shade'));
    this.container.push(Engine.scene.add.sprite(this.x+150,this.y+150,'UI','equipment-slot'));
    this.container.push(Engine.scene.add.sprite(this.x+155,this.y+165,'UI','boots-shade'));

    var accessorY = 200;
    this.container.push(Engine.scene.add.sprite(this.x+100,this.y+accessorY,'UI','equipment-slot'));
    this.container.push(Engine.scene.add.sprite(this.x+110,this.y+accessorY+10,'UI','ring-shade'));
    this.container.push(Engine.scene.add.sprite(this.x+150,this.y+accessorY,'UI','equipment-slot'));
    this.container.push(Engine.scene.add.sprite(this.x+160,this.y+accessorY+10,'UI','ring-shade'));
    this.container.push(Engine.scene.add.sprite(this.x+200,this.y+accessorY,'UI','equipment-slot'));
    this.container.push(Engine.scene.add.sprite(this.x+210,this.y+accessorY+10,'UI','ring-shade'));

    this.finalize();
};

Panel.prototype.addLine = function(line){
    var text = Engine.scene.add.text(this.x+15, this.y+this.verticalOffset, line,
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.container.push(text);
    this.verticalOffset += 20;
    this.finalize();
};

Panel.prototype.addSprite = function(atlas,frame,x,y){
    var sprite = Engine.scene.add.sprite(this.x+x,this.y+y,atlas,frame);
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
    this.previousX = this.x;
    this.previousY = this.y;
};

Panel.prototype.setTweens = function(sx,sy,ex,ey,duration){
    var _this = this;
    this.showTween = Engine.scene.tweens.add({
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
    this.hideTween = Engine.scene.tweens.add({
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
        //if(e.constructor.name == 'TileSprite') e.setDisplayOrigin(0,0);
        if(!e.centered) e.setDisplayOrigin(0,0);
        if(!e.notInteractive) e.setInteractive();
        e.visible = false;
    });
};

Panel.prototype.getNextItemSprite = function(item, callback){ // Pool of sprites common to all inventories of the panel
    if(this.sprites.length <= this.nextItemSprite){
        var empty = Engine.scene.add.sprite(0,0,'');
        empty.setScrollFactor(0);
        empty.depth = Engine.UIDepth+3;
        this.sprites.push(empty);
    }
    var data = Engine.itemsData[item];
    var sprite = this.sprites[this.nextItemSprite];
    sprite.setTexture(data.atlas);
    sprite.setFrame(data.frame);
    sprite.setDisplayOrigin(Math.floor(sprite.frame.width/2),Math.floor(sprite.frame.height/2));
    sprite.visible = true;
    if(callback){
        sprite.setInteractive();
        sprite.handleClick = callback.bind(sprite);
    }
    sprite.itemID = item;
    return sprite;
};

Panel.prototype.getNextText = function(nb){
    if(this.texts.length <= this.nextItemSprite){
        var empty = Engine.scene.add.text(100,10, 'lorem ipsum',
            { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
        );
        empty.setScrollFactor(0);
        empty.setOrigin(1,0);
        empty.depth = Engine.UIDepth+4;
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
        this.container[i].visible = true;
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
    for(var item in inventory.items){
        if(!inventory.items.hasOwnProperty(item)) continue;
        if(inventory.getNb(item) == 0) continue;
        var sprite = this.getNextItemSprite(item,inv.callback);
        var pos = this.slots[j];
        sprite.setPosition(pos.x+2+16,pos.y+4+16);
        if(inv.showNumbers) {
            var text = this.getNextText(inventory.getNb(item));
            text.setPosition(pos.x + 37, pos.y + 18);
        }
        j++;
        this.nextItemSprite++;
    }
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
    this.nextItemSprite = 0;
};

Panel.prototype.refreshInventory = function(){
    if(this.displayInventory) {
        this.hideInventory();
        for(var i = 0; i < this.inventories.length; i++) {
            this.displayTheInventory(this.inventories[i]);
        }
    }
};
