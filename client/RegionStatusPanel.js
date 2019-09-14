/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-09-19.
 */

import Engine from './Engine'
import Panel from './Panel'

import regionsData from '../assets/data/regions.json'

function RegionsStatusPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title,false);
    this.texts = [];
    this.textsCounter = 0;

    var x = 20;
    var y = 30;
    var t = this.addText(x,y,'Status:');
    this.statusText = this.addText(t.x+t.width,y,'');

    y += 20;
    t = this.addText(x,y,'Contested regions:');
    this.contestedText = this.addText(t.x+t.width,y,''); // -this.width

    y += 20;
    t = this.addText(x,y,'Occupied regions:');
    this.occupiedText = this.addText(t.x+t.width,y,'');
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

    var contested = [];
    var occupied = [];
    Engine.player.regionsStatus.forEach(function(region){
        if(region.status == 2) contested.push(regionsData[region.id].name);
        if(region.status == 1) occupied.push(regionsData[region.id].name);
    });

    this.capsules['title'].setText(Engine.setlCapsule.text.text+' region');
    this.statusText.setText(statusMap[Engine.player.regionsStatus[Engine.player.region].status]);
    this.contestedText.setText(contested.join(',  '));
    this.occupiedText.setText(occupied.join(',  '));
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