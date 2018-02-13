/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 13-02-18.
 */


function ProductionPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.texts = [];
    this.addInterface();
}

ProductionPanel.prototype = Object.create(Panel.prototype);
ProductionPanel.prototype.constructor = ProductionPanel;

ProductionPanel.prototype.addInterface = function(){
    this.addText(this.width/2,25,'Production:',null,20).setOrigin(0.5);
};

ProductionPanel.prototype.displaySlots = function(){
    var data = Engine.currentBuiling;
    var buildingTypeData = Engine.buildingsData[data.buildingType];
    var production = buildingTypeData.production;

    var y = 50;
    var w = 100;
    var x = (this.width-w)/2 - 30;
    for(var i = 0; i < production.length; i++){
        var slot = this.getNextLongSlot(w);
        slot.setUp(this.x+x,this.y + y + i*50);

        var item = production[i][0];
        var nb = production[i][1];
        var itemData = Engine.itemsData[item];
        slot.addIcon(itemData.atlas,itemData.frame);

        slot.addText(43,2,itemData.name);
        slot.addText(43,16,'+'+nb+'/cycle',Utils.colors.gold);
        slot.display();
    }
};

ProductionPanel.prototype.update = function(){
    this.hideLongSlots();
    this.displaySlots();
};

ProductionPanel.prototype.displayInterface = function(){
    this.texts.forEach(function(t){
        t.setVisible(true);
    });
    this.displaySlots();
};

ProductionPanel.prototype.hideInterface = function(){
    this.hideTexts();
    this.hideLongSlots();
};

ProductionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

ProductionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};