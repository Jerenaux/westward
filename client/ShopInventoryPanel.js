/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 15-03-19.
 */
function ShopInventoryPanel(x,y,width,height,title,invisible){
    Panel.call(this,x,y,width,height,title,invisible);
}

ShopInventoryPanel.prototype = Object.create(Panel.prototype);
ShopInventoryPanel.prototype.constructor = ShopInventoryPanel;


ShopInventoryPanel.prototype.display = function(){
    if(this.displayed) return;
    Panel.prototype.display.call(this);
};

ShopInventoryPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
};


function ShopSlot(x,y,width,height){
    Frame.call(this,x,y,width,height,invisible);
}

ShopSlot.prototype = Object.create(Frame.prototype);
ShopSlot.prototype.constructor = ShopSlot;