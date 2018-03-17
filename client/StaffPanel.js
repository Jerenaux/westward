/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 17-03-18.
 */

function StaffPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
}

StaffPanel.prototype = Object.create(Panel.prototype);
StaffPanel.prototype.constructor = StaffPanel;


StaffPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
};
StaffPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideTexts();
};