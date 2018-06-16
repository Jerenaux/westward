/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 16-06-18.
 */

function ClassMiniPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

ClassMiniPanel.prototype = Object.create(Panel.prototype);
ClassMiniPanel.prototype.constructor = ClassMiniPanel;

ClassMiniPanel.prototype.addInterface = function(){
    var xoffset = 7;
    this.addPolyText(xoffset,15,["Level ","100 "," - ","1000/1000 ",UI.textsData['classxp']],[null,Utils.colors.gold,null,Utils.colors.gold,null]);
    var classbar = new MiniProgressBar(this.x+xoffset,this.y+40,this.width-30);
    classbar.name = 'class xp bar';
    classbar.setLevel(100,100);
    this.bar = classbar;
};

ClassMiniPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    //this.button.display();
    this.bar.display();
    this.displayTexts();
};

ClassMiniPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    //this.button.hide();
    this.bar.hide();
    this.hideTexts();
};