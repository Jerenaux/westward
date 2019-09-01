/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 16-03-18.
 */
import Panel from './Panel'
import Utils from '../shared/Utils'

function ClassPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
}

ClassPanel.prototype = Object.create(Panel.prototype);
ClassPanel.prototype.constructor = ClassPanel;

ClassPanel.prototype.setClass = function(id){
    var classData = UI.classesData[id];
    var text = this.addText(10,15,classData.desc,Utils.colors.white,14,Utils.fonts.normal);
    text.setWordWrapWidth(this.width-15,true);
    this.button = new BigButton(this.x+(this.width/2),this.y+this.height-20,'Select',function(){
        UI.selectClass(id);
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

export default ClassPanel