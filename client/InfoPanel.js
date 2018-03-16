/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 16-03-18.
 */

function InfoPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
}

InfoPanel.prototype = Object.create(Panel.prototype);
InfoPanel.prototype.constructor = InfoPanel;

InfoPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
};
InfoPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideTexts();
};