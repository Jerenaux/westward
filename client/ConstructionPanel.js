/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 */

function ConstructionPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

ConstructionPanel.prototype = Object.create(Panel.prototype);
ConstructionPanel.prototype.constructor = ConstructionPanel;

ConstructionPanel.prototype.addInterface = function(){
    this.bar = new LiquidBar(this.x+50,this.y+50,200);
    this.bar.setLevel(50,100);
};

ConstructionPanel.prototype.displayInterface = function(){
    this.bar.display();
};

ConstructionPanel.prototype.hideInterface = function(){
    this.bar.hide();
};

ConstructionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayInterface();
};

ConstructionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideInterface();
};