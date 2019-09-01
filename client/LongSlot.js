/**
 * Created by jeren on 06-02-18.
 */
import UI from './UI'
import Utils from '../shared/Utils'

function LongSlot(width,mask){
    this.x = 0;
    this.y = 0;
    this.mask = mask;
    this.width = width;
    this.totalwidth = this.width + 70;
    var x = 0;
    var y = 0;
    this.slices = [];
    this.texts = [];
    this.images = [];
    this.textCounter = 0;
    var sw = 8;
    var bw = width;
    this.slices.push(UI.scene.add.sprite(x, y, 'UI', 'longslot_1'));
    x += 16;
    this.slices.push(UI.scene.add.tileSprite(x, y, sw, 40, 'UI', 'longslot_2'));
    x += sw;
    this.slices.push(UI.scene.add.sprite(x, y, 'UI', 'longslot_3'));
    x += 16;
    this.slices.push(UI.scene.add.sprite(x, y, 'UI', 'longslot_4'));
    x += 16;
    this.slices.push(UI.scene.add.tileSprite(x, y, bw, 40, 'UI', 'longslot_5'));
    x += bw;
    this.slices.push(UI.scene.add.sprite(x, y, 'UI', 'longslot_9'));

    this.width = 0;
    this.height = this.slices[0].height;
    this.slices.forEach(function(s){
        s.setDisplayOrigin(0,0);
        s.setScrollFactor(0);
        s.setDepth(1);
        s.setVisible(false);
        // s.setMask(this.mask);
        this.width += s.width;
    },this);

    this.zone = this.createZone();
}

LongSlot.prototype.clearCallbacks = function(){
    this.zone.removeAllListeners();
};

LongSlot.prototype.updateCallback = function(event,callback){
    this.zone.on(event,callback);
};

LongSlot.prototype.createZone = function(){
    var zone = UI.scene.add.zone(0,0,this.totalwidth,38);
    zone.setDepth(10);
    zone.setScrollFactor(0);
    zone.setInteractive();
    return zone;
};

LongSlot.prototype.addIcon = function(atlas,frame){
    if(this.icon){
        this.icon.setTexture(atlas);
        this.icon.setFrame(frame);
    }else {
        this.icon = UI.scene.add.sprite(this.x + 21, this.y + 20, atlas, frame);
        this.icon.setScrollFactor(0);
        this.icon.setDepth(1);
        this.icon.setVisible(false);
        this.icon.setMask(this.mask);
    }
    this.icon.setDisplayOrigin(Math.floor(this.icon.frame.width / 2), Math.floor(this.icon.frame.height / 2));
};

LongSlot.prototype.getNextText = function(){
    if(this.textCounter >= this.texts.length){
        var t = UI.scene.add.text(0,0, '', { font: '14px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        t.setDisplayOrigin(0,0);
        t.setScrollFactor(0);
        t.setDepth(1);
        t.setMask(this.mask);
        this.texts.push(t);
    }
    return this.texts[this.textCounter++];
};

LongSlot.prototype.addText = function(x,y,text,color,size){
    var t = this.getNextText();
    if(color) {
        t.setFill(color);
        //if(color == Utils.colors.red) t.setStroke(Utils.strokes.red);
    }
    if(size) t.setFont(size+'px '+Utils.fonts.fancy);
    t.setText(text);
    t.setPosition(this.x+x,this.y+y);
    return t;
};

LongSlot.prototype.addImage = function(x,y,atlas,frame){
    var img = UI.scene.add.sprite(this.x + x, this.y + y, atlas, frame);
    img.setScrollFactor(0);
    img.setDepth(2);
    this.images.push(img);
};

LongSlot.prototype.addProgressBar = function(x,y,level,max,color,width){
    width = width || 0.8*this.width;
    this.bar = new MiniProgressBar(this.x+x,this.y+y,width,color,this.mask);
    this.bar.setLevel(level,max);
    return this.bar;
};

LongSlot.prototype.setUp = function(x,y){
    var dx = this.x - x;
    var dy = this.y - y;
    this.slices.forEach(function(s){
        s.x -= dx;
        s.y -= dy;
    });
    this.texts.forEach(function(s){
        s.x -= dx;
        s.y -= dy;
    });
    this.x = x;
    this.y = y;
    this.zone.setPosition(this.x,this.y);
};

LongSlot.prototype.move = function(dx,dy){
    var content = this.slices.concat(this.texts);
    if(this.icon) content.push(this.icon);
    content.forEach(function(c){
        c.x += dx;
        c.y += dy;
    });
    if(this.bar) this.bar.move(dx,dy);
};

LongSlot.prototype.display = function(){
    if(this.displayed) return;
    this.slices.forEach(function(s){
        s.setVisible(true);
    });
    this.texts.forEach(function(s){
        s.setVisible(true);
    });
    this.images.forEach(function(s){
        s.setVisible(true);
    });
    if(this.bar) this.bar.display();
    if(this.icon) this.icon.setVisible(true);
    this.zone.setVisible(true);
    this.displayed = true;
};

LongSlot.prototype.clear = function(){
    this.hideTexts();
    this.textCounter = 0;
    if(this.bar) this.bar.hide();
    if(this.icon) this.icon.setVisible(false);
    if(this.pin) this.pin.setVisible(false);
};

LongSlot.prototype.hideTexts = function(){
    this.texts.forEach(function(t){
        t.setVisible(false);
    });
};

LongSlot.prototype.hide = function(){
    this.slices.forEach(function(s){
        s.setVisible(false);
    });
    this.images.forEach(function(s){
        s.setVisible(false);
    });
    this.clear();
    this.zone.setVisible(false);
    this.displayed = false;
};

LongSlot.prototype.moveUp = function(nb){
    this.slices.forEach(function(e){
        e.setDepth(e.depth+nb);
    });
    this.texts.forEach(function(e){
        e.setDepth(e.depth+nb);
    });
    this.images.forEach(function(e){
        e.setDepth(e.depth+nb);
    });
    if(this.button) this.button.moveUp(nb);
    if(this.buttons) {
        this.buttons.forEach(function (b) {
            b.btn.setDepth(b.btn.depth + nb);
            b.symbol.setDepth(b.symbol.depth + nb);
            b.ring.setDepth(b.ring.depth + nb);
            b.zone.setDepth(b.zone.depth + nb);
        });
    }
    if(this.icon) this.icon.setDepth(this.icon.depth+nb);
    this.depth = nb;
};

export default LongSlot