/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 18-02-18.
 */

function DevLevelPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.displayedSlots = [];
    this.dummySlots = [];
    this.dummySlots.push({
        txt: "Food",
        icon: ["items","food"],
        level: 0
    });
    this.dummySlots.push({
        txt: "Timber",
        icon: ["items2","timber"],
        level: 0
    });
}

DevLevelPanel.prototype = Object.create(Panel.prototype);
DevLevelPanel.prototype.constructor = DevLevelPanel;

DevLevelPanel.prototype.displayInterface = function(){
    var yoffset = 30;
    var slotwidth = 150;

    for(var i = 0; i < this.dummySlots.length; i++) {
        var data = this.dummySlots[i];
        var slot = this.displayedSlots[i] || this.getNextLongSlot(slotwidth);
        slot.setUp(this.x + 15, this.y + yoffset + i * 50);

        var newSlot = (slot.topicID != i);
        if (newSlot) {
            slot.topicID = i;
            slot.addText(43, 2, data.txt);
            slot.progressTxt = slot.addText(slot.totalwidth, 2, "0/2", Utils.colors.red);
            slot.progressTxt.setOrigin(1, 0);
            slot.bar = slot.addProgressBar(43, 22, 0, 100, 'gold', slotwidth);
            slot.addIcon(data.icon[0],data.icon[1]);
            this.displayedSlots.push(slot);
        }
    }
};

DevLevelPanel.prototype.update = function(){
    this.displayInterface();
    //console.log(this.displayedSlots);
    var slot1 = this.displayedSlots[0];
    var slot2 = this.displayedSlots[1];

    var nb = Engine.currentBuiling.getItemNb(1);
    var total = 400;
    slot1.progressTxt.setText(nb+"/"+total);
    slot1.progressTxt.setFill(nb >= total ? Utils.colors.green : Utils.colors.white);
    slot1.bar.setLevel(nb,total);

    var nb = Engine.currentBuiling.getItemNb(3);
    var total = 250;
    slot2.progressTxt.setText(nb+"/"+total);
    slot2.progressTxt.setFill(nb >= total ? Utils.colors.green : Utils.colors.white);
    slot2.bar.setLevel(nb,total);

    slot1.display();
    slot2.display();
};

DevLevelPanel.prototype.hideInterface = function(){
    this.longSlots.forEach(function(s){
        s.topicID = -1;
        s.hide();
    });
    this.longSlotsCounter = 0;
    this.displayedSlots = [];
};

DevLevelPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
};

DevLevelPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};