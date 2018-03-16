/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 16-03-18.
 */
function ClassPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
}

ClassPanel.prototype = Object.create(Panel.prototype);
ClassPanel.prototype.constructor = ClassPanel;

ClassPanel.prototype.setClass = function(name){
    var text = this.addText(10,15,UI.textsData[name+'_desc'],Utils.colors.white,14,Utils.fonts.normal);
    text.setWordWrapWidth(this.width-15,true);
    this.button = new BigButton(this.x+(this.width/2)-45,this.y+this.height-35,'Select',function(){
        UI.selectClass(name);
    });
};

ClassPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.button.display();
    this.displayTexts();
};

ClassPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.button.hide();
    this.hideTexts();
};