/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 */

function ConstructionPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.texts = [];
    this.addInterface();
}

ConstructionPanel.prototype = Object.create(Panel.prototype);
ConstructionPanel.prototype.constructor = ConstructionPanel;

ConstructionPanel.prototype.addInterface = function(){
    this.addText(this.width/2,25,'Building under construction',null,20).setOrigin(0.5);
    var pctText = this.addText(this.width/2,50,'0%',null,20).setOrigin(0.5);
    this.addText(this.width/2,75,'(+10%/day)',Utils.colors.gold,16).setOrigin(0.5);
    var barw = this.width-100;
    var barx = (this.width-barw)/2;
    this.bar = new BigProgressBar(this.x+barx,this.y+100,barw,'gold');
    this.bar.setLevel(50,100);
    pctText.setText(this.bar.getPct()+'%');

    var alignx = 10;
    var y = 130;
    var x = alignx;
    y += this.addText(x,y,'Productivity modifiers:',null,14,Utils.fonts.normal).height;
    x += this.addText(x,y,'+0%',null,14,Utils.fonts.normal).width;
    y += this.addText(x,y,'development level',null,14,Utils.fonts.normal).height;
    x = alignx;
    x += this.addText(x,y,'-10%',Utils.colors.red,14,Utils.fonts.normal).width;
    y += this.addText(x,y,'food deficit',null,14,Utils.fonts.normal).height;
    x = alignx;
    x += this.addText(x,y,'+7%',Utils.colors.green,14,Utils.fonts.normal).width;
    y += this.addText(x,y,'citizen commitment (2)',null,14,Utils.fonts.normal).height;
    x = alignx;
};

ConstructionPanel.prototype.displayInterface = function(){
    this.bar.display();
    this.texts.forEach(function(t){
        t.setVisible(true);
    })
};

ConstructionPanel.prototype.hideInterface = function(){
    this.bar.hide();
    this.texts.forEach(function(t){
        t.setVisible(false);
    })
};

ConstructionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

ConstructionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};