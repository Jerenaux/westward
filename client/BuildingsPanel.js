/**
 * Created by Jerome on 05-02-18.
 */


function BuildingsPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.displayedSlots = [];
}

BuildingsPanel.prototype = Object.create(Panel.prototype);
BuildingsPanel.prototype.constructor = BuildingsPanel;

BuildingsPanel.prototype.displayListing = function(){
    var listing = Engine.currentBuiling.buildings;
    for(var i = 0; i < listing.length; i++){
        var data = listing[i];
        var buildingTypeData = Engine.buildingsData[data.type];

        var slot = this.displayedSlots[i] || this.getNextLongSlot(150);
        slot.setUp(this.x+15,this.y + 30 + i*50);
        var displayProd = buildingTypeData.displayProd || !data.built;

        var newSlot = (slot.topicID != data.id);
        if(newSlot){
            slot.topicID = data.id;
            var icon = buildingTypeData.icon;
            if(icon) slot.addIcon('aok',icon);
            slot.addText(43,2,buildingTypeData.name);

            if(displayProd) {
                // Top-right text
                slot.prodText = slot.addText(slot.totalwidth, 2, '100%', Utils.colors.white, 12);
                slot.prodText.setOrigin(1, 0);
            }
            slot.bar = slot.addProgressBar(43,22,100,100,(data.built ? 'green' : 'gold'));
            slot.bar.name = 'status bar of building '+buildingTypeData.name;
            // Bottom-right text
            slot.progressText = slot.addText(slot.totalwidth,18,'100%',Utils.colors.white,12);
            slot.progressText.setOrigin(1,0);
            this.displayedSlots.push(slot);
        }

        if(slot.prodText) {
            if(displayProd) {
                slot.prodText.setText(data.prod + '%');
                slot.prodText.setFill((data.prod >= 100 ? Utils.colors.green : Utils.colors.red));
            }else{
                slot.prodText.setText('');
            }
        }

        var progress = (data.built ? 100 : data.progress);
        slot.bar.setLevel(progress);
        slot.bar.setColor(data.built ? 'green' : 'gold');
        slot.progressText.setText(slot.bar.getPct() + '%');
        slot.progressText.setFill((data.built ? Utils.colors.green : Utils.colors.gold));
        slot.display();

        if(newSlot) {
            if (Engine.currentMenu.panels['map']) {
                var data = listing[i];
                var map = Engine.currentMenu.panels['map'].map;
                var pin = map.addPin(data.x, data.y, buildingTypeData.name);
                slot.pin = pin;
                slot.updateCallback('handleOver', pin.highlight.bind(pin));
                slot.updateCallback('handleOut', pin.unhighlight.bind(pin));
                slot.updateCallback('handleClick', pin.focus.bind(pin));
            }
        }
    }
};

BuildingsPanel.prototype.updateListing = function(){
    this.displayListing();
};

BuildingsPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
};

BuildingsPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.longSlots.forEach(function(s){
        s.topicID = -1;
        s.hide();
    });
    this.longSlotsCounter = 0;
    this.displayedSlots = [];
};