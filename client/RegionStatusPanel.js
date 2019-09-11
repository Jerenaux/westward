/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-09-19.
 */

import Engine from './Engine'
import Panel from './Panel'
import UI from './UI'
import Utils from '../shared/Utils'

function RegionsStatusPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title,false);
    this.texts = [];
    this.textsCounter = 0;

    var x = 20;
    var y = 30;
    var t = this.addText(x,y,'Status:');
    this.statusText = this.addText(t.x+t.width+10,y,'');
}

RegionsStatusPanel.prototype = Object.create(Panel.prototype);
RegionsStatusPanel.prototype.constructor = RegionsStatusPanel;

RegionsStatusPanel.prototype.update = function(){
    // this.hideContent();

    var statusMap = {
        0: 'Wild',
        1: 'Occupied',
        2: 'Contested',
        3: 'Settled'
    };

    this.capsules['title'].setText(Engine.setlCapsule.text.text+' region');
    this.statusText.setText(statusMap[Engine.player.regionsStatus[Engine.player.region].status]);
};


RegionsStatusPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
};

RegionsStatusPanel.prototype.hideContent = function(){
    this.hideTexts();
    this.textsCounter = 0;
};

RegionsStatusPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideContent();
};

export default RegionsStatusPanel