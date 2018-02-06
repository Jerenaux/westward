/**
 * Created by Jerome on 05-02-18.
 */


function BuildingsPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.slotCounter = 0;
    this.slots = [];
}

BuildingsPanel.prototype = Object.create(Panel.prototype);
BuildingsPanel.prototype.constructor = BuildingsPanel;

BuildingsPanel.prototype.getNextSlot = function(){
    if(this.slotCounter >= this.slots.length){
        this.slots.push(new LongSlot());
    }
    return this.slots[this.slotCounter++];
};


BuildingsPanel.prototype.displayInterface = function(){
    var nb = 3;
    for(var i = 0; i < nb; i++){
        var slot = this.getNextSlot();
        slot.setUp(this.x+15,this.y + 30 + i*50);
        slot.display();
    }
};

BuildingsPanel.prototype.hideInterface = function(){
    this.slots.forEach(function(s){
        s.hide();
    });
};

BuildingsPanel.prototype.makeSlot = function(i){
    /*var x = 15;
    var y = 30 + i*50;
    for(var j = 1; j <= 9; j++){
        if(j == 6 || j == 7 || j == 8) continue;
        var s;
        var sx = this.x + x;
        var sy = this.y + y;
        var frame = 'longslot_' + j;
        if(j == 2){
            var w = 8;
            s = Engine.scene.add.tileSprite(sx,sy,w,40,'UI',frame);
            x += w;
        }else if(j == 5){
            var w = 100;
            s = Engine.scene.add.tileSprite(sx,sy,w,40,'UI',frame);
            x += w;
        }else {
            s = Engine.scene.add.sprite(sx, sy, 'UI', frame);
            x += 16;
        }
        s.setDisplayOrigin(0,0);
        s.setScrollFactor(0);
        s.setDepth(Engine.UIDepth+1);
        this.content.push(s);
    }*/
};

BuildingsPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

BuildingsPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
    this.slotCounter = 0;
};