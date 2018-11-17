/**
 * Created by Jerome on 06-10-17.
 */

function Panel(x,y,width,height,title,invisible){
    Frame.call(this,x,y,width,height,invisible);
    this.capsules = {};
    this.longSlotsCounter = 0;
    this.longSlots = [];
    this.texts = [];
    this.buttons = [];
    if(title) this.addCapsule('title',20,-9,title);
}

Panel.prototype = Object.create(Frame.prototype);
Panel.prototype.constructor = Panel;

Panel.prototype.addCapsule = function(name,x,y,text,icon){
    var capsule = new Capsule(this.x+x,this.y+y,'UI',icon,this.content);
    capsule.setText(text);
    this.capsules[name] = capsule;
};

Panel.prototype.updateCapsule = function(name,text){
    if(text === undefined) text = 'undefined';
    this.capsules[name].setText(text);
};

Panel.prototype.addButton = function(x,y,color,symbol,callback,helpTitle,helpText){
    x += this.x;
    y += this.y;
    var ring = UI.scene.add.sprite(x,y,'UI','ring');
    ring.setDepth(2);
    ring.setScrollFactor(0);
    ring.setDisplayOrigin(0,0);
    ring.setVisible(false);
    this.content.push(ring);

    var zone = UI.scene.add.zone(x,y,24,24);
    zone.setDepth(10);
    zone.setScrollFactor(0);
    zone.setInteractive();
    zone.setVisible(false);
    zone.on('pointerover',function(){
        UI.tooltip.updateInfo(helpTitle,helpText);
        UI.tooltip.display();
    });
    zone.on('pointerout',function(){
        UI.tooltip.hide();
    });
    this.content.push(zone);

    x += 5;
    y += 5;

    var btn = new Button(x,y,color,callback);
    this.content.push(btn);
    x += 3;
    y += 3;

    var s = UI.scene.add.sprite(x,y,'UI',symbol);
    s.setDepth(3);
    s.setScrollFactor(0);
    s.setDisplayOrigin(0,0);
    s.setVisible(false);
    this.content.push(s);

    var btnObj = {
        btn: btn,
        symbol: s,
        ring: ring,
        zone: zone
    };
    this.buttons.push(btnObj);

    return btnObj;
};

Panel.prototype.addPolyText = function(x,y,texts,colors,size){
    if(texts.length != colors.length) return;
    var txts = [];
    for(var i = 0; i < texts.length; i++){
        var t = this.addText(x,y,texts[i],colors[i],size); // addText() pushed to this.texts
        x += t.width;
        txts.push(t);
    }
    return txts;
};

Panel.prototype.addText = function(x,y,text,color,size,font){
    var color = color || '#ffffff';
    var size = size || 14;
    var font = font || Utils.fonts.fancy;
    var t = UI.scene.add.text(this.x+x, this.y+y, text, { font: size+'px '+font, fill: color, stroke: '#000000', strokeThickness: 4 });
    t.setWordWrapWidth(this.width-20,false);
    t.setDisplayOrigin(0,0);
    t.setScrollFactor(0);
    t.setDepth(1);
    t.setVisible(false);
    this.texts.push(t);
    this.content.push(t);
    return t;
};

Panel.prototype.makeScrollable = function(){
    if(this.scrollable) return;
    this.scrollable = true;
    this.addMask();
    this.addScroll();
};

Panel.prototype.addMask = function(){
    var shape = UI.scene.make.graphics();
    shape.fillStyle('#ffffff');
    shape.fillRect(this.x,this.y+15,this.width,this.height-25);
    this.mask = shape.createGeometryMask();
};

Panel.prototype.setWrap = function(wrap){
    this.wrap = wrap;
};

Panel.prototype.scroll = function(y){
    y = Utils.clamp(y,this.upperScrollLimit,this.lowerScrollLimit);
    var dy = this.scrollPin.y - y;
    this.scrollPin.y = y;
    this.texts.forEach(function(t){
        t.y += dy;
    });
    this.longSlots.forEach(function(s){
        s.move(0,dy);
    });
    this.scrolled += y;
};

Panel.prototype.addScroll = function(){
    this.setWrap(45);
    var x = this.x+this.width-18;
    var downY = this.y+this.height-20;
    var upOffset = 25;
    var upY = this.y+upOffset;
    var height = downY-upY-25;
    var up = UI.scene.add.sprite(x,upY,'UI','scroll_up');
    var mid = UI.scene.add.tileSprite(x,upY+13+(height/2),24,height,'UI','scroll');
    var down = UI.scene.add.sprite(x,downY,'UI','scroll_down');
    var pin = UI.scene.add.sprite(x,upY+25,'UI','scroll_pin');

    this.scrolled = 0;
    this.upperScrollLimit = upY+25;
    this.lowerScrollLimit = downY-25;
    this.scrollPin = pin;
    /*function scroll(y){
        y = Utils.clamp(y,upY+25,downY-25);
        var dy = pin.y - y;
        pin.y = y;
        _this.texts.forEach(function(t){
            t.y += dy;
        })
        _this.longSlots.forEach(function(s){
            s.move(0,dy);
        });
        this.scrolled += y;
    }*/

    pin.setInteractive();
    UI.scene.input.setDraggable(pin);
    var _this = this;
    pin.on('drag',function(pointer,x,y){
        _this.scroll(y);
    });

    this.addButton(this.width-30,upOffset-15,'blue','up',function(){
        _this.scroll(pin.y - 20);
    },'Scroll up');
    this.addButton(this.width-30,this.height-32,'blue','down',function(){
        _this.scroll(pin.y + 20);
    },'Scroll down');

    up.setVisible(false);
    mid.setVisible(false);
    down.setVisible(false);
    pin.setVisible(false);
    this.scrollItems = [up,mid,down,pin];

    this.content.push(up);
    this.content.push(mid);
    this.content.push(down);
    this.content.push(pin);
};

Panel.prototype.getNextLongSlot = function(width){
    if(this.longSlotsCounter >= this.longSlots.length){
        this.longSlots.push(new LongSlot(width || 100,this.mask));
    }
    return this.longSlots[this.longSlotsCounter++];
};

Panel.prototype.hideLongSlots = function(){
    this.longSlots.forEach(function(s){
        s.hide();
    });
    this.longSlotsCounter = 0;
};

Panel.prototype.displayTexts = function(){
    this.texts.forEach(function(t){
        t.setVisible(true);
    })
};

Panel.prototype.hideTexts = function(){
    this.texts.forEach(function(t){
        t.setVisible(false);
    })
};

Panel.prototype.display = function(){
    Frame.prototype.display.call(this);
    for(var capsule in this.capsules){
        this.capsules[capsule].display();
    }

    this.buttons.forEach(function(b){
        b.btn.setVisible(true);
        b.symbol.setVisible(true);
        b.ring.setVisible(true);
        b.zone.setVisible(true);
    });

    if(this.button) this.button.display(); // big button

    if(this.scrollable){
        this.scrollItems.forEach(function(e){
            e.setVisible(true);
        })
    }

    Engine.inPanel = true;
    Engine.currentPanel = this;
};

Panel.prototype.hide = function(){
    Frame.prototype.hide.call(this);
    if(this.scrollable) this.scroll(-this.scrolled);
    if(this.button) this.button.hide(); // big button
    Engine.inPanel = false;
};

function Capsule(x,y,iconAtlas,iconFrame,container){
    this.slices = [];
    this.icon = null;
    this.width = 1;
    this.width_ = this.width; // previous width
    
    if(iconFrame) {
        this.icon = UI.scene.add.sprite(x+8,y+6,iconAtlas,iconFrame);
        this.icon.setDepth(2);
        this.icon.setScrollFactor(0);
        this.icon.setDisplayOrigin(0,0);
        this.icon.setVisible(false);
    }
    var textX = (this.icon ? x + this.icon.width : x) + 10;
    var textY = (this.icon ? y +1: y+2);

    this.text = UI.scene.add.text(textX, textY, '',
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );

    this.slices.push(UI.scene.add.sprite(x,y,'UI','capsule-left'));
    x += 24;
    this.slices.push(UI.scene.add.tileSprite(x,y,this.width,24,'UI','capsule-middle'));
    x += this.width;
    this.slices.push(UI.scene.add.sprite(x,y,'UI','capsule-right'));

    this.slices.forEach(function(e){
        e.setDepth(1);
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setVisible(false);
        if(container) container.push(e); // don't use concat
    });

    this.text.setDepth(2);
    this.text.setScrollFactor(0);
    this.text.setDisplayOrigin(0,0);
    this.text.setVisible(false);

    if(container) {
        container.push(this.text);
        if (this.icon) container.push(this.icon);
    }
}

Capsule.prototype.setText = function(text){
    this.text.setText(text);
    this.width = this.text.width -25;
    if(this.icon) this.width += this.icon.width;

    this.slices[1].width = this.width;
    if(this.extraW) this.slices[1].width += this.extraW;
    this.slices[2].x += (this.width-this.width_);

    this.width_ = this.width;
};

Capsule.prototype.removeLeft = function(){
    //var w = this.slices[0].width;
    //console.warn(w);
    this.extraW = 17;
    this.slices[0].destroy();
    this.slices[1].x -= this.extraW;
};

Capsule.prototype.display = function(){
    this.slices.forEach(function(e){
        e.setVisible(true);
    });
    this.text.setVisible(true);
    if(this.icon) this.icon.setVisible(true);
};

Capsule.prototype.hide = function(){
    this.slices.forEach(function(e){
        e.setVisible(false);
    });
    this.text.setVisible(false);
    if(this.icon) this.icon.setVisible(false);
};

Capsule.prototype.move = function(dx,dy){
    this.slices.forEach(function(e){
        e.x += dx;
        e.y += dy;
    });
    this.text.x += dx;
    this.text.y += dy;
    if(this.icon) {
        this.icon.x += dx;
        this.icon.y += dy;
    }
};