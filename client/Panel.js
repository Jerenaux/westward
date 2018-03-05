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
    var capsule = new Capsule(this.x+x,this.y+y,icon,this.content);
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
    var ring = Engine.scene.add.sprite(x,y,'UI','ring');
    ring.setDepth(Engine.UIDepth+2);
    ring.setScrollFactor(0);
    ring.setDisplayOrigin(0,0);
    ring.setVisible(false);
    this.content.push(ring);

    x += 5;
    y += 5;

    var btn = new Button(x,y,color,callback);
    this.content.push(btn);
    x += 3;
    y += 3;

    var s = Engine.scene.add.sprite(x,y,'UI',symbol);
    s.setDepth(Engine.UIDepth+3);
    s.setScrollFactor(0);
    s.setDisplayOrigin(0,0);
    s.setVisible(false);
    this.content.push(s);

    var zone = Engine.scene.add.zone(x,y,24,24);
    zone.setDepth(Engine.UIDepth+10);
    zone.setScrollFactor(0);
    zone.setInteractive();
    zone.setOrigin(0);
    zone.setVisible(false);
    zone.handleOver = function(){
        Engine.tooltip.updateInfo(helpTitle,helpText);
        Engine.tooltip.display();
    };
    zone.handleOut = function(){
        Engine.tooltip.hide();
    };
    this.content.push(zone);

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
    var t = Engine.scene.add.text(this.x+x, this.y+y, text, { font: size+'px '+font, fill: color, stroke: '#000000', strokeThickness: 3 });
    t.setDisplayOrigin(0,0);
    t.setScrollFactor(0);
    t.setDepth(Engine.UIDepth+1);
    t.setVisible(false);
    this.texts.push(t);
    this.content.push(t);
    return t;
};

Panel.prototype.getNextLongSlot = function(width){
    if(this.longSlotsCounter >= this.longSlots.length){
        this.longSlots.push(new LongSlot(width || 100));
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