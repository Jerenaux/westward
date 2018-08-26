/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 21-08-18.
 */


function AbilitiesPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

AbilitiesPanel.prototype = Object.create(Panel.prototype);
AbilitiesPanel.prototype.constructor = AbilitiesPanel;

AbilitiesPanel.prototype.addInterface = function(){

};

AbilitiesPanel.prototype.update = function(){

};

AbilitiesPanel.prototype.displayInterface = function(){
    var abilities = [
        {
            name: 'Ability 1',
            cost: 3
        },
        {
            name: 'Ability 2',
            cost: 2
        },
        {
            name: 'Ability 3',
            cost: 4
        },
        {
            name: 'Ability 4',
            cost: 1
        }
    ];

    var initx = 20;
    var xoffset = initx;
    var yoffset = 20;
    abilities.forEach(function(ab,i){
        var slot = this.getNextLongSlot(100);
        if(i > 0 && i%3 == 0) yoffset += 50;
        slot.setUp(this.x+xoffset + (i%3)*190,this.y + yoffset);
        slot.addText(43,2,ab.name);
        slot.addText(43,20,ab.cost+' AP');
        slot.clearCallbacks();
        slot.updateCallback('pointerup', function(){
            console.log('Click on ',ab.name);
        });
        slot.display();
    },this);
    this.update();
};

AbilitiesPanel.prototype.hideInterface = function(){
    this.hideTexts();
    this.longSlots.forEach(function(s){
        s.hide();
    });
    this.longSlotsCounter = 0;
};

AbilitiesPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

AbilitiesPanel.prototype.hide = function() {
    Panel.prototype.hide.call(this);
    this.hideInterface();
};