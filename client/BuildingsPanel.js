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

BuildingsPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

BuildingsPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
    this.slotCounter = 0;
};