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
    this.slices.push(Engine.scene.add.sprite(x, y, 'UI', 'longslot_1'));
    x += 16;
    this.slices.push(Engine.scene.add.tileSprite(x, y, sw, 40, 'UI', 'longslot_2'));
    x += sw;
    this.slices.push(Engine.scene.add.sprite(x, y, 'UI', 'longslot_3'));
    x += 16;
    this.slices.push(Engine.scene.add.sprite(x, y, 'UI', 'longslot_4'));
    x += 16;
    this.slices.push(Engine.scene.add.tileSprite(x, y, bw, 40, 'UI', 'longslot_5'));
    x += bw;
    this.slices.push(Engine.scene.add.sprite(x, y, 'UI', 'longslot_9'));

    this.slices.forEach(function(s){
        s.setDisplayOrigin(0,0);
        s.setScrollFactor(0);
        s.setDepth(Engine.UIDepth+1);
        s.setVisible(false);
    });

    this.zone = this.createZone();
}

LongSlot.prototype.updateCallback = function(event,callback){
    this.zone[event] = callback;
};

LongSlot.prototype.createZone = function(){
    var zone = Engine.scene.add.zone(0,0,this.totalwidth,38); // this.x,this.y,this.totalwidth,40
    zone.setDepth(Engine.UIDepth+10);
    zone.setScrollFactor(0);
    zone.setInteractive();
    return zone;
};

LongSlot.prototype.addIcon = function(atlas,frame){
    this.icon = Engine.scene.add.sprite(this.x+21, this.y+20, atlas, frame); // 4 + 18, 4 + 20
    this.icon.setDisplayOrigin(Math.floor(this.icon.frame.width/2),Math.floor(this.icon.frame.height/2));
    //this.icon.setDisplayOrigin(0,0);
    this.icon.setScrollFactor(0);
    this.icon.setDepth(Engine.UIDepth+1);
    this.icon.setVisible(false);
};

LongSlot.prototype.getNextText = function(){
    if(this.textCounter >= this.texts.length){
        var t = Engine.scene.add.text(0,0, '', { font: '14px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        t.setDisplayOrigin(0,0);
        t.setScrollFactor(0);
        t.setDepth(Engine.UIDepth+1);
        this.texts.push(t);
    }
    return this.texts[this.textCounter++];
};

LongSlot.prototype.addText = function(x,y,text,color,size){
    var t = this.getNextText();
    if(color) {
        t.setFill(color);
        if(color == Utils.colors.red) t.setStroke(Utils.strokes.red);
    }
    if(size) t.setFont(size+'px '+Utils.fonts.fancy);
    t.setText(text);
    t.setPosition(this.x+x,this.y+y);
    return t;
};

LongSlot.prototype.addProgressBar = function(x,y,level,max,color){
    this.bar = new MiniProgressBar(this.x+x,this.y+y,0.8*this.width,color);
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
    this.slices.forEach(function(s){
        s.setVisible(true);
    });
    this.texts.forEach(function(s){
        s.setVisible(true);
    });
    if(this.bar) this.bar.display();
    if(this.icon) this.icon.setVisible(true);
    this.zone.setVisible(true);
};

LongSlot.prototype.hide = function(){
    this.slices.forEach(function(s){
        s.setVisible(false);
    });
    this.texts.forEach(function(s){
        s.setVisible(false);
    });
    this.textCounter = 0;
    if(this.bar) this.bar.hide();
    if(this.icon) this.icon.setVisible(false);
    if(this.pin) this.pin.setVisible(false);
    this.zone.setVisible(false);
};