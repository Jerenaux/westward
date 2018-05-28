/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 17-03-18.
 */

function MessagesPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
}

MessagesPanel.prototype = Object.create(Panel.prototype);
MessagesPanel.prototype.constructor = MessagesPanel;

MessagesPanel.prototype.addMessages = function(list){
    list.forEach(function(entry,i){
        var slot = this.getNextLongSlot(150);
        slot.setUp(this.x+15,this.y + 25 + i*50);
        slot.addIcon('faces',0);
        slot.addText(43,2,entry.name);
        slot.hide();
    },this);
};

MessagesPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.longSlots.forEach(function(slot){
        slot.display();
    });
    this.displayTexts();
};

MessagesPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.longSlots.forEach(function(slot){
        slot.hide();
    });
    this.hideTexts();
};