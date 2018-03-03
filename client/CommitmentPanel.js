/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 */

function CommitmentPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

CommitmentPanel.prototype = Object.create(Panel.prototype);
CommitmentPanel.prototype.constructor = CommitmentPanel;

CommitmentPanel.prototype.addInterface = function(){
    var size = 16;
    var x = 15;
    var txts = this.addPolyText(x,200,['3/3 ','free commitment slots'],[Utils.colors.gold,null],size);
    this.nbText = txts[0];
};

/*CommitmentPanel.prototype.displayInterface = function(){
    this.update();
};*/

CommitmentPanel.prototype.update = function(){
    this.hideLongSlots();

    var yoffset = 40;
    var nb = Engine.player.commitSlots.max;
    var slots = Engine.getCommitSlots();
    console.log(slots);
    for(var i = 0; i < nb; i++){
        var slot = this.getNextLongSlot(100);
        slot.setUp(this.x+15,this.y + yoffset + i*50);

        if(i < slots.length){
            var buildingTypeData =  Engine.buildingsData[slots[i]];
            var icon = buildingTypeData.icon;
            if(icon) slot.addIcon('aok',icon);
            slot.addText(43,2,buildingTypeData.name);
        }else{
            console.log('clearing');
            slot.clear();
        }

        slot.display();
    }

    var current = (Engine.player.commitSlots.max-slots.length);
    this.nbText.setText(current+'/'+Engine.player.commitSlots.max);
};

CommitmentPanel.prototype.hideInterface = function(){
    this.hideLongSlots();
    this.hideTexts();
};

CommitmentPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
    //this.displayInterface();
};

CommitmentPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};