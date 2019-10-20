/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-04-18.
 */
import BigButton from './BigButton'
import Client from './Client'
import Engine from './Engine'
import {Equipment} from '../shared/Equipment'
import ItemSprite from './ItemSprite'
import Panel from './Panel'
import Utils from '../shared/Utils'

import itemsData from '../assets/data/items.json'

function ItemActionPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);

    this.icon = new ItemSprite(this.x + 30, this.y + 30);
    this.text = this.addText(50, 20,'',Utils.colors.white,16);
    this.warntext = this.addText(10, 105,'',Utils.colors.lightred,12);
    this.warntext.setOrigin(0,1);
    this.icon.showTooltip = false;
    this.useButton = new BigButton(this.x+50,this.y+65,'Equip',this.sendUse.bind(this));
    this.beltButton = new BigButton(this.x+140,this.y+65,'Put in belt',this.sendBelt.bind(this));
}

ItemActionPanel.prototype = Object.create(Panel.prototype);
ItemActionPanel.prototype.constructor = ItemActionPanel;

/**
 * Sets up the itemAction window to reflect the item that was clicked.
 * @param {number} itemID - ID of the clicked item.
 * @param {string} inventory - Whether the item was clicked in the backpack or in the belt.
 */
ItemActionPanel.prototype.setUp = function(itemID, inventory){
    const data = itemsData[itemID];
    this.itemID = itemID;
    this.inventory = inventory;
    this.icon.setUp(itemID,data);
    this.text.setText(data.name);
    this.warntext.setVisible(false);
    if(data.effects || data.equipment){
        this.useButton.setText(data.equipment ? 'Equip' : 'Use');
        this.useButton.enable();

        let container_item_id = Engine.player.getEquippedItemID('range_container');
        const container_item = itemsData[container_item_id];

        var ammoContainerMatch = (container_item && container_item.container_type === data.container_type);

        if(data.isAmmo && !ammoContainerMatch){
            this.useButton.disable();
            // this.warntext.setText('You need a '+Equipment.getData(data.ammo).name+' to be able to equip this!');
            var containerData = Equipment.container_types[data.container_type];
            this.warntext.setText('You need a '+ containerData.name +' to be able to equip this!');
            this.warntext.setVisible(true);
        }

        this.beltButton.setText(inventory == 'belt' ? 'Off belt' : 'In belt');
    }else{
        this.useButton.hide();
        this.beltButton.hide();
    }
};

ItemActionPanel.prototype.sendUse = function(){
    Client.sendUse(this.itemID, this.inventory);
    this.hide();
};

ItemActionPanel.prototype.sendBelt = function(){
    Client.sendBelt(this.itemID, this.inventory);
    this.hide();
};

ItemActionPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.icon.display();
    this.text.setVisible(true);
    this.useButton.display();
    this.beltButton.display();
};

ItemActionPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.icon.hide();
    this.text.setVisible(false);
    this.warntext.setVisible(false);
    this.useButton.hide();
    this.beltButton.hide();
};

export default ItemActionPanel
