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
    var txts = this.addPolyText(x,210,['3/3 ','free commitment slots'],[Utils.colors.gold,null],size);
    this.nbText = txts[0];
};

CommitmentPanel.prototype.displayInterface = function(){
    var yoffset = 40;
    var nb = Engine.player.commitSlots[1];
    for(var i = 0; i < nb; i++){
        var slot = this.getNextLongSlot(100);
        slot.setUp(this.x+15,this.y + yoffset + i*50);
        slot.display();
    }
    this.displayTexts();
    this.update();
};

CommitmentPanel.prototype.update = function(){
    this.nbText.setText(Engine.player.commitSlots[0]+'/'+Engine.player.commitSlots[1]);
};

CommitmentPanel.prototype.hideInterface = function(){
    this.hideLongSlots();
    this.hideTexts();
};

CommitmentPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

CommitmentPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};