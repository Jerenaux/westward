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
        this.slots.push(new LongSlot(150));
    }
    return this.slots[this.slotCounter++];
};

BuildingsPanel.prototype.displayListing = function(){
    var listing = Engine.currentBuiling.buildings;
    for(var i = 0; i < listing.length; i++){
        var data = listing[i];
        var slot = this.getNextSlot();
        slot.setUp(this.x+15,this.y + 30 + i*50);
        var icon = Engine.buildingsData[data.type].icon;
        if(icon) slot.addIcon('aok',icon);
        slot.addText(43,2,Engine.buildingsData[data.type].name);
        var prod = Utils.randomInt(70,121);
        var p = slot.addText(slot.totalwidth,2,prod+'%',(prod > 100 ? Utils.colors.green : Utils.colors.red),12);
        p.setOrigin(1,0);
        var progress = Utils.randomInt(0,101);
        var bar = slot.addProgressBar(43,22,progress,100,(data.built ? 'green' : 'gold'));
        var b = slot.addText(slot.totalwidth,18,bar.getPct()+'%',Utils.colors.gold,12);
        b.setOrigin(1,0);
        slot.display();
        if(Engine.currentMenu.panels['map']) {
            var pin = Engine.currentMenu.panels['map'].map.addPin(listing[i]);
            slot.updateCallback('handleOver',pin.highlight.bind(pin));
            slot.updateCallback('handleOut',pin.unhighlight.bind(pin));
        }
    }
};

BuildingsPanel.prototype.hideInterface = function(){
    this.slots.forEach(function(s){
        s.hide();
    });
};

BuildingsPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayListing();
};

BuildingsPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
    this.slotCounter = 0;
};