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
    var btnx = (this.width-100)/2;
    this.button = new BigButton(this.x+btnx,this.y+250,'Commit!',Engine.commitClick);
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

        var increment = Formulas.computeProdIncrement(data.prod,nb);
        slot.addText(43,16,'+'+increment+'/cycle',Utils.colors.gold);
        slot.display();
    }
};

ProductionPanel.prototype.update = function(){
    this.hideLongSlots();
    this.displaySlots();
    this.displayCommitButton();
};

ProductionPanel.prototype.displayCommitButton = function(){
    if(Engine.canCommit()){
        this.button.display();
    }else{
        this.button.hide();
    }
};

ProductionPanel.prototype.displayInterface = function(){
    this.displayTexts();
    this.displaySlots();
    this.displayCommitButton();
};

ProductionPanel.prototype.hideInterface = function(){
    this.hideTexts();
    this.hideLongSlots();
    this.button.hide();
};

ProductionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

ProductionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};