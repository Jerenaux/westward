/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 17-03-18.
 */

function StaffPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
}

StaffPanel.prototype = Object.create(Panel.prototype);
StaffPanel.prototype.constructor = StaffPanel;

StaffPanel.prototype.addCenterText = function(txt){
    var txt = Panel.prototype.addText.call(this,this.width/2,this.height-10,txt,Utils.colors.red);
    txt.setOrigin(0.5,1);
    txt.setWordWrapWidth(this.width-15,true);
};

StaffPanel.prototype.addStaff = function(list){
    list.forEach(function(entry,i){
        var slot = this.getNextLongSlot();
        slot.setUp(this.x+15,this.y + 25 + i*50);
        slot.addIcon('faces',0);
        slot.addText(43,2,entry.name);
        slot.hide();
    },this);
};

StaffPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.longSlots.forEach(function(slot){
        slot.display();
    });
    this.displayTexts();
};

StaffPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.longSlots.forEach(function(slot){
        slot.hide();
    });
    this.hideTexts();
};