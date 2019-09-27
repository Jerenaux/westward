/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-09-19.
 */
import BigButton from './BigButton';
import Engine from './Engine'
import Panel from './Panel'
import Utils from '../shared/Utils'

import missionsData from '../assets/data/missions.json'
import regionsData from '../assets/data/regions.json'

function RegionsStatusPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title,false);
    this.texts = [];
    this.textsCounter = 0;

    var x = 20;
    var y = 20;
    var t = this.addText(x,y,'This region is currently');
    this.statusText = this.addText(t.x+t.width-10,y,'');

    // y += 20;
    // t = this.addText(x,y,'Contested regions:');
    // this.contestedText = this.addText(t.x+t.width,y,''); // -this.width

    // y += 20;
    // t = this.addText(x,y,'Occupied regions:');
    // this.occupiedText = this.addText(t.x+t.width,y,'');

    this.bigButtons = [];
    for(var i = 0; i < 5; i++){
        var btn = new BigButton(this.x+110,this.y+65+i*30);
        btn.hide();
        btn.moveUp(3);
        this.bigButtons.push(btn);
    }
}

RegionsStatusPanel.prototype = Object.create(Panel.prototype);
RegionsStatusPanel.prototype.constructor = RegionsStatusPanel;

RegionsStatusPanel.prototype.update = function(){
    // this.hideContent();

    var statusMap = {
        0: 'Wild',
        1: 'Occupied',
        2: 'Settled'
    };

    var regionData = regionsData[Engine.player.region];
    var contested = [];
    var occupied = [];
    Engine.player.regionsStatus.forEach(function(region){
        if(region.status == 2) contested.push(regionData.name);
        if(region.status == 1) occupied.push(regionData.name);
    });

    this.capsules['title'].setText(Engine.setlCapsule.text.text+' region');
    var status = Engine.player.regionsStatus[Engine.player.region].status;
    this.statusText.setText(statusMap[status]);
    var fill = Utils.colors.gold;
    if(status == 1 || status == 2) fill = Utils.colors.red;
    if(status == 3) fill = Utils.colors.green;
    this.statusText.setFill(fill);

    // this.contestedText.setText(contested.join(',  '));
    // this.occupiedText.setText(occupied.join(',  '));

    var categories = {};
    var categoriesFulfilled = {}
    missionsData.missions.forEach(function(mission, i){
        if(!mission.regionStatus.includes(status)) return;
        if(mission.skipSea && regionData.sea) return;
        var goal = mission.variableGoal ? Engine.computeMissionGoal(mission) : mission.goal;
        if(!goal) return;

        if(!(mission.type in categories)){
            categories[mission.type] = [];
            categoriesFulfilled[mission.type] = 0;
        }
        categories[mission.type].push(i);

        if(Engine.computeMissionActual(mission) >= goal) categoriesFulfilled[mission.type]++;
    });

    var i = 0;
    for(var type in categories){
        var btn = this.bigButtons[i++];
        var nb  = categories[type].length - categoriesFulfilled[type];
        btn.setText(nb + ' ' + type + ' Missions');
        btn.missions = categories[type];
        btn.setCallback(function () {
            var missions = Engine.currentMenu.panels['missions'];
            missions.display();
            missions.updateContent(this.missions);
        }.bind(btn));
        btn.display();
    }
};


RegionsStatusPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
};

RegionsStatusPanel.prototype.hideContent = function(){
    this.hideTexts();
    this.textsCounter = 0;
    this.bigButtons.forEach(function(bb){
        bb.hide();
    });
    Engine.currentMenu.panels['missions'].hide();
};

RegionsStatusPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideContent();
};

export default RegionsStatusPanel