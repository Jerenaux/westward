/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-04-18.
 */

function ItemActionPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title,true);

    this.slot = this.getNextLongSlot(100);
    this.slot.setUp(this.x,this.y);
}

ItemActionPanel.prototype = Object.create(Panel.prototype);
ItemActionPanel.prototype.constructor = ItemActionPanel;

ItemActionPanel.prototype.setUp = function(itemID){
    var data = Engine.itemsData[itemID];
    this.slot.addIcon(data.atlas,data.frame);
};

ItemActionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.slot.display();
};

ItemActionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.slot.hide();
};