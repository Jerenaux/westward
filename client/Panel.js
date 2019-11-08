/**
 * Created by Jerome on 06-10-17.
 */

import Button from './Button'
import Capsule from './Capsule'
import Frame from './Frame'
import LongSlot from './LongSlot'
import UI from './UI'
import Utils from '../shared/Utils'

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
    var capsule = new Capsule(UI.scene,this.x+x,this.y+y,'UI',icon,this.content);
    capsule.setText(text);
    this.capsules[name] = capsule;
    return capsule;
};

Panel.prototype.updateCapsule = function(name,text){
    if(text === undefined) text = 'undefined';
    this.capsules[name].setText(text);
};

Panel.prototype.addButton = function(x,y,color,symbol,callback,helpTitle,helpText){
    // TODO: make proper Button class that wraps all of this
    x += this.x;
    y += this.y;
    var ring = UI.scene.add.sprite(x,y,'UI','ring');
    ring.setDepth(2);
    ring.setScrollFactor(0);
    ring.setDisplayOrigin(0,0);
    ring.setVisible(false);
    this.content.push(ring);

    var zone = UI.scene.add.zone(x,y,30,30);
    zone.setDepth(10);
    zone.setScrollFactor(0);
    zone.setInteractive();
    zone.setVisible(false);
    if(helpTitle || helpText) {
        zone.on('pointerover', function () {
            UI.tooltip.updateInfo('free', {title: helpTitle, body: helpText});
            UI.tooltip.display();
        });
        zone.on('pointerout', function () {
            UI.tooltip.hide();
        });
    }
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
        zone: zone,
        hide: function(){
            this.symbol.setVisible(false);
            this.btn.setVisible(false);
            this.ring.setVisible(false);
            this.zone.setVisible(false);
        }
    };
    this.buttons.push(btnObj);

    return btnObj;
};

Panel.prototype.addPolyText = function(x,y,texts,colors,size){
    if(!colors) colors = [];
    if(colors.length && texts.length != colors.length) return;
    var txts = [];
    for(var i = 0; i < texts.length; i++){
        var color = (i < colors.length ? colors[i] : Utils.colors.white);
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

Panel.prototype.addInput = function(width,x,y){
    var input = document.createElement("input");
    input.className = 'game_input';
    input.type = "text";
    input.style.width = width+'px';
    x = UI.scene.game.canvas.offsetLeft+this.x+x;
    y = UI.scene.game.canvas.offsetTop+this.y+y;
    input.style.left = x+'px';
    input.style.top = y+'px';
    input.style.background = 'rgba(0,0,0,0.5)';
    input.style.display = "none";
    document.getElementById('game').appendChild(input);
    return input;
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

    this.displayButtons();

    if(this.button) this.button.display(); // big button

    if(this.scrollable){
        this.scrollItems.forEach(function(e){
            e.setVisible(true);
        })
    }

    UI.inPanel = true;
    UI.currentPanel = this;
};

Panel.prototype.hide = function(){
    Frame.prototype.hide.call(this);
    if(this.scrollable) this.scroll(-this.scrolled);
    if(this.button) this.button.hide(); // big button
    for(var caps in this.capsules){
        this.capsules[caps].hide();
    };
    UI.inPanel = false;
};

Panel.prototype.displayButtons = function(){
    this.buttons.forEach(function(b){
        b.btn.setVisible(true);
        b.symbol.setVisible(true);
        b.ring.setVisible(true);
        b.zone.setVisible(true);
    });
};

Panel.prototype.hideButtons = function(){
    this.buttons.forEach(function(b){
        b.btn.setVisible(false);
        b.symbol.setVisible(false);
        b.ring.setVisible(false);
        b.zone.setVisible(false);
    });
};

export default Panel