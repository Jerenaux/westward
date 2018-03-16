/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 09-03-18.
 */

function SuggestPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    //this.makeInterface();
}

SuggestPanel.prototype = Object.create(Panel.prototype);
SuggestPanel.prototype.constructor = SuggestPanel;

SuggestPanel.prototype.getText = function(i,x,y){
    if(i >= this.texts.length) this.addText(0,0,'');
    var text = this.texts[i];
    text.setPosition(x,y);
    text.setVisible(true);
    text.setWordWrapWidth(this.width - 20,true);
    text.setFill(Utils.colors.white);
    //text.setFont('14px '+Utils.fonts.normal);
    return text;
};

SuggestPanel.prototype.displayTips = function(){
    var i = 0;
    var x = this.x + 10;
    var y = this.y + 20;
    var padding = 10;

    if(Engine.player.foodSurplus < 0){
        var txt = this.getText(i++,x,y);
        txt.setText(UI.textsData['deficit_advice']);
        txt.setFill(Utils.colors.gold);
        y += txt.height + padding;
    }

    if(Engine.player.getStatValue('hp') < Engine.player.getStatValue('hpmax')/3){
        var txt = this.getText(i++,x,y);
        txt.setText(UI.textsData['health_advice']);
        y += txt.height + padding;
    }

    if(Engine.player.getEquipped('armor',0) == -1){
        var txt = this.getText(i++,x,y);
        txt.setText(UI.textsData['equip_advice']);
        y += txt.height + padding;
    }

    if(Engine.player.gold < 100){
        var txt = this.getText(i++,x,y);
        if(Engine.player.hasItem(1,1) || Engine.player.hasItem(9,1)){
            txt.setText(UI.textsData['gold_advice_food']);
        }else{
            txt.setText(UI.textsData['gold_advice']);
        }
        y += txt.height + padding;
    }

    var txt = this.getText(i++,x,y);
    txt.setText(UI.textsData['location_advice']);
};

SuggestPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTips();
};
SuggestPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideTexts();
};