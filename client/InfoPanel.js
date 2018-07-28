/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 16-03-18.
 */

function InfoPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
}

InfoPanel.prototype = Object.create(Panel.prototype);
InfoPanel.prototype.constructor = InfoPanel;

InfoPanel.prototype.addText = function(x,y,text,color,size,font){
    var txt = Panel.prototype.addText.call(this,x,y,text,color,size,font);
    txt.setWordWrapWidth(this.width-(this.wrap || 15),true);
    if(this.mask) txt.mask = this.mask;
    return txt;
};

InfoPanel.prototype.addBigButton = function(text){
    this.button = new BigButton(this.x+(this.width/2),this.y+this.height-20,text,this.hide.bind(this));
};

InfoPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
    //if(this.button) this.button.display();
};

InfoPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideTexts();
    //if(this.button) this.button.hide();
};