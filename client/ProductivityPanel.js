/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 13-02-18.
 */

function ProductivityPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.texts = [];
    this.addInterface();
}

ProductivityPanel.prototype = Object.create(Panel.prototype);
ProductivityPanel.prototype.constructor = ProductivityPanel;

ProductivityPanel.prototype.addInterface = function(){
    var alignx = 10;
    var y = 20;
    var x = alignx;
    this.addPolyText(x,y,['+0%',' development level'],[null,null]);
    y += 15;
    this.addPolyText(x,y,['-10%',' food deficit'],[Utils.colors.red,null]);
    y += 15;
    this.addPolyText(x,y,['+7%',' citizen commitment ','(2)'],[Utils.colors.green,null,Utils.colors.gold]);
};

ProductivityPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
};

ProductivityPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideTexts();
};