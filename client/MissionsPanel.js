/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 15-09-19.
 */

import Engine from './Engine'
import ShopInventoryPanel from './ShopInventoryPanel'
import Utils from "../shared/Utils";
import UI from "./UI";
import Frame from "./Frame";

import buildingsData from '../assets/data/buildings.json'

function MissionsPanel(x,y,width,height,title,invisible){
    ShopInventoryPanel.call(this,x,y,width,height,title,invisible);
    this.addPagination();
}

MissionsPanel.prototype = Object.create(ShopInventoryPanel.prototype);
MissionsPanel.prototype.constructor = MissionsPanel;

MissionsPanel.prototype.getNextSlot = function(x,y){
    if(this.slotsCounter >= this.slots.length){
        this.slots.push(new MissionSlot(x,y,360,80));
    }

    return this.slots[this.slotsCounter++];
};

MissionsPanel.prototype.updateContent = function(){
    var NB_PER_PAGE = 4;
    var yOffset = 0;
    var sloty = this.y + 20;

    var goals = Engine.player.regionsStatus[Engine.player.region].goals;
    var i = 0;
    for(var bld in goals.buildings) {
        if (i < this.currentPage * NB_PER_PAGE) continue;
        if (i >= (this.currentPage + 1) * NB_PER_PAGE) continue;
        var data = goals.buildings[bld];
        var slot = this.getNextSlot(this.x + 20, sloty + yOffset);
        slot.display();
        slot.setUp('building',bld,data[0],data[1]);
        yOffset += 90;
        i++;
    }
};

// -------------------------------------

function MissionSlot(x,y,width,height){
    Frame.call(this,x,y,width,height);

    this.name = UI.scene.add.text(this.x + 60, this.y + 10, '', { font: '16px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });

    this.zone = UI.scene.add.zone(this.x,this.y,width,height);
    this.zone.setInteractive();
    this.zone.setOrigin(0);
    this.zone.on('pointerover',function(){
        // UI.tooltip.updateInfo('item',{id:this.itemID});
        // UI.tooltip.display();
        // UI.setCursor('item');
    }.bind(this));
    this.zone.on('pointerout',function(){
        UI.tooltip.hide();
        UI.setCursor();
    }.bind(this));

    this.content = [this.name, this.zone];

    this.addItem();
}

MissionSlot.prototype = Object.create(Frame.prototype);
MissionSlot.prototype.constructor = MissionSlot;


MissionSlot.prototype.addItem = function(){
    this.slot = UI.scene.add.sprite(this.x + 30,this.y+this.height/2,'UI','equipment-slot');
    this.icon = UI.scene.add.sprite(this.x + 30, this.y + this.height/2);
    this.content.push(this.slot);
    this.content.push(this.icon);
};

MissionSlot.prototype.setUp = function(type,id,actual,goal){
    var data, atlas, frame;
    switch(type){
        case 'building':
            data = buildingsData[id];
            atlas = 'buildingsicons';
            frame = data.icon;
            break;
        default:
            break;
    }
    this.icon.setTexture(atlas,frame);
    this.name.setText(data.name);
    // this.desc = itemData.desc;
};

MissionSlot.prototype.display = function(){
    Frame.prototype.display.call(this);
    this.content.forEach(function(c){
        c.setVisible(true);
    });
};

MissionSlot.prototype.hide = function(){
    Frame.prototype.hide.call(this);
    this.content.forEach(function(c){
        c.setVisible(false);
    });
};

export default MissionsPanel