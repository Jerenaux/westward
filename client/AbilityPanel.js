/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 22-08-18.
 */

function AbilityPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

AbilityPanel.prototype = Object.create(Panel.prototype);
AbilityPanel.prototype.constructor = AbilityPanel;

AbilityPanel.prototype.addInterface = function(){
    this.desc = this.addText(20,100,'Lorem ipsum dolor sit amet');
};

AbilityPanel.prototype.setUp = function(){

};

AbilityPanel.prototype.displayInterface = function(){
    var slot = this.getNextLongSlot(100);
    slot.setUp(this.x+145,this.y +50);
    slot.display();
};

AbilityPanel.prototype.hideInterface = function(){
    this.hideTexts();
    this.longSlots.forEach(function(s){
        s.hide();
    });
    this.longSlotsCounter = 0;
};

AbilityPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
    this.displayTexts();
};

AbilityPanel.prototype.hide = function() {
    Panel.prototype.hide.call(this);
    this.hideInterface();
    this.hideTexts();
};