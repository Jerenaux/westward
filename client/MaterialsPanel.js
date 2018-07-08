/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-02-18.
 */

function MaterialsPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.slotCounter = 0;
    this.slots = [];
    this.texts = [];
}

MaterialsPanel.prototype = Object.create(Panel.prototype);
MaterialsPanel.prototype.constructor = MaterialsPanel;

MaterialsPanel.prototype.getNextSlot = function(){
    if(this.slotCounter >= this.slots.length){
        this.slots.push(new LongSlot(100));
    }
    return this.slots[this.slotCounter++];
};
MaterialsPanel.prototype.displayMaterials = function(){
    var materials = Engine.buildingsData[Engine.currentBuiling.buildingType].recipe;
    if(!materials) return;
    var keys = Object.keys(materials);
    for(var i = 0; i < keys.length; i++) {
        var item = keys[i];
        var nb = materials[item];
        var slot = this.getNextSlot();
        var x = (this.width-slot.totalwidth)/2;
        slot.setUp(this.x+x, this.y + 20 + (i++ * 50));
        var itemData = Engine.itemsData[item];
        slot.addIcon(itemData.atlas,itemData.frame);
        slot.addText(43,2,itemData.name,null,13);
        var owned = Engine.currentBuiling.getItemNb(item);
        slot.addText(43,17,owned+'/'+nb,(owned >= nb ? Utils.colors.green : Utils.colors.red),13);
        slot.display();
    }
};

MaterialsPanel.prototype.hideInterface = function(){
    this.slots.forEach(function(s){
        s.hide();
    });
    this.slotsCounter = 0;
};

MaterialsPanel.prototype.update = function(){
    this.hideInterface();
    this.displayMaterials();
};

MaterialsPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayMaterials();
};

MaterialsPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};