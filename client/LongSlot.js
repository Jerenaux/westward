/**
 * Created by jeren on 06-02-18.
 */

function LongSlot(){
    this.x = 0;
    this.y = 0;
    var x = 0;
    var y = 0;
    this.slices = [];
    this.texts = [];
    var sw = 8;
    var bw = 100;
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

    for(var i = 0; i < 2; i++){
        var t = Engine.scene.add.text(40,(i*15), 'Test', { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
        t.setDisplayOrigin(0,0);
        t.setScrollFactor(0);
        t.setDepth(Engine.UIDepth+2);
        t.setVisible(false);
        this.texts.push(t);
    }
}

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
};

LongSlot.prototype.display = function(){
    this.slices.forEach(function(s){
        s.setVisible(true);
    });
    this.texts.forEach(function(s){
        s.setVisible(true);
    });
};

LongSlot.prototype.hide = function(){
    this.slices.forEach(function(s){
        s.setVisible(false);
    });
    this.texts.forEach(function(s){
        s.setVisible(false);
    });
};