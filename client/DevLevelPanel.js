/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 18-02-18.
 */

function DevLevelPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
}

DevLevelPanel.prototype = Object.create(Panel.prototype);
DevLevelPanel.prototype.constructor = DevLevelPanel;

DevLevelPanel.prototype.displayInterface = function(){
    var yoffset = 30;
    var i = 0;
    var slotwidth = 150;

    var slot = this.getNextLongSlot(slotwidth);
    slot.setUp(this.x+15,this.y + yoffset + i*50);
    slot.addText(43,2,"Food");
    var total = slot.addText(slot.totalwidth,2,"100/400",Utils.colors.white);
    total.setOrigin(1,0);
    this.foodText = total;
    this.foodBar = slot.addProgressBar(43,22,66,100,'gold',slotwidth);
    slot.addIcon("items","food");
    slot.display();
    i++;

    var slot = this.getNextLongSlot(slotwidth);
    slot.setUp(this.x+15,this.y + yoffset + i*50);
    slot.addText(43,2,"Lumber camp");
    var total = slot.addText(slot.totalwidth,2,"0/2",Utils.colors.red);
    total.setOrigin(1,0);
    slot.addProgressBar(43,22,0,2,'gold',slotwidth);
    slot.addIcon("aok","lumbercamp");
    slot.display();

    this.update();
};

DevLevelPanel.prototype.update = function(){
    var nb = Engine.currentBuiling.getItemNb(1);
    var total = 400;
    this.foodText.setText(nb+"/"+total);
    this.foodText.setFill(nb >= total ? Utils.colors.green : Utils.colors.white);
    this.foodBar.setLevel(nb,total);
};

DevLevelPanel.prototype.hideInterface = function(){
    this.hideLongSlots();
};

DevLevelPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();

};

DevLevelPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};