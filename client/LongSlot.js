/**
 * Created by jeren on 06-02-18.
 */

function LongSlot(width){
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.totalwidth = this.width + 70;
    var x = 0;
    var y = 0;
    this.slices = [];
    this.texts = [];
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

    this.slices.forEach(function(s){
        s.setDisplayOrigin(0,0);
        s.setScrollFactor(0);
        s.setDepth(1);
        s.setVisible(false);
    });

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
    }
    this.icon.setDisplayOrigin(Math.floor(this.icon.frame.width / 2), Math.floor(this.icon.frame.height / 2));
};

LongSlot.prototype.getNextText = function(){
    if(this.textCounter >= this.texts.length){
        var t = UI.scene.add.text(0,0, '', { font: '14px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        t.setDisplayOrigin(0,0);
        t.setScrollFactor(0);
        t.setDepth(1);
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

LongSlot.prototype.addProgressBar = function(x,y,level,max,color,width){
    width = width || 0.8*this.width;
    this.bar = new MiniProgressBar(this.x+x,this.y+y,width,color);
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

LongSlot.prototype.display = function(){
    if(this.displayed) return;
    this.slices.forEach(function(s){
        s.setVisible(true);
    });
    this.texts.forEach(function(s){
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
    if(this.icon) {
        this.icon.setVisible(false);
        //this.icon = null;
    }
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
    this.clear();
    this.zone.setVisible(false);
    this.displayed = false;
};