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

BuildingsPanel.prototype.updateListing = function(){
    var listing = Engine.currentBuiling.buildings;
    for(var i = 0; i < listing.length; i++){
        var data = listing[i];
        var slot = this.getNextSlot();
        slot.setUp(this.x+15,this.y + 30 + i*50);
        slot.addText(40,0,Engine.buildingsData[data.type].name);
        slot.addText(40,15,(data.built ? 'Completed' : 'Under construction'),(data.built ? '#11ee11' : '#ee1111'),12);
        slot.display();
        if(Engine.currentMenu.panels['map']) slot.pin = Engine.currentMenu.panels['map'].map.addPin(listing[i]);
    }
};

BuildingsPanel.prototype.hideInterface = function(){
    this.slots.forEach(function(s){
        s.hide();
    });
};

BuildingsPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    //this.displayInterface();
};

BuildingsPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
    this.slotCounter = 0;
};