/**
 * Created by Jerome on 05-02-18.
 */


function BuildingsPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
}

BuildingsPanel.prototype = Object.create(Panel.prototype);
BuildingsPanel.prototype.constructor = BuildingsPanel;

BuildingsPanel.prototype.displayListing = function(){
    var listing = Engine.currentBuiling.buildings;
    for(var i = 0; i < listing.length; i++){
        var data = listing[i];
        var buildingTypeData = Engine.buildingsData[data.type];
        var slot = this.getNextLongSlot(150);
        slot.setUp(this.x+15,this.y + 30 + i*50);

        var icon = buildingTypeData.icon;
        if(icon) slot.addIcon('aok',icon);

        slot.addText(43,2,buildingTypeData.name);

        if(buildingTypeData.displayProd || !data.built) {
            var prod = data.prod;//Utils.randomInt(70, 121);
            var p = slot.addText(slot.totalwidth, 2, prod + '%', (prod >= 100 ? Utils.colors.green : Utils.colors.red), 12);
            p.setOrigin(1, 0);
        }

        var progress = (data.built ? 100 : data.progress);
        var bar = slot.addProgressBar(43,22,progress,100,(data.built ? 'green' : 'gold'));
        var b = slot.addText(slot.totalwidth,18,bar.getPct()+'%',(data.built ? Utils.colors.green : Utils.colors.gold),12);
        b.setOrigin(1,0);

        slot.display();
        if(Engine.currentMenu.panels['map']) {
            var data = listing[i];
            var map = Engine.currentMenu.panels['map'].map;
            var pin = map.addPin(data.x,data.y,buildingTypeData.name);
            slot.pin = pin;
            slot.updateCallback('handleOver',pin.highlight.bind(pin));
            slot.updateCallback('handleOut',pin.unhighlight.bind(pin));
            slot.updateCallback('handleClick',pin.focus.bind(pin));
        }
    }
};

BuildingsPanel.prototype.updateListing = function(){
    this.hideLongSlots();
    this.displayListing();
};

BuildingsPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayListing();
};

BuildingsPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideLongSlots();
};