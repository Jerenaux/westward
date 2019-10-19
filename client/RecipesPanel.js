/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 24-03-19.
 */

import Client from './Client'
import Engine from './Engine'
import ItemSlot from './ItemSlot'
import ShopInventoryPanel from './ShopInventoryPanel'
import UI from './UI'
import Utils from '../shared/Utils'

import itemsData from '../assets/data/items.json'

function RecipesPanel(x,y,width,height,title,invisible){
    ShopInventoryPanel.call(this,x,y,width,height,title,invisible);
}

RecipesPanel.prototype = Object.create(ShopInventoryPanel.prototype);
RecipesPanel.prototype.constructor = RecipesPanel;

RecipesPanel.prototype.getNextSlot = function(x,y){
    if(this.slotsCounter >= this.slots.length){
        this.slots.push(new RecipeSlot(x,y,360,80));
    }

    return this.slots[this.slotsCounter++];
};

// -------------------------------------

function RecipeSlot(x,y,width,height){
    ItemSlot.call(this,x,y,width,height);

    this.addIngredients();

    this.content.forEach(function(c){
        c.setScrollFactor(0);
        c.setDepth(1);
    });
}

RecipeSlot.prototype = Object.create(ItemSlot.prototype);
RecipeSlot.prototype.constructor = RecipeSlot;

RecipeSlot.prototype.addIngredients = function(){
    this.ingredients = UI.scene.add.text(this.x + this.width - 10, this.y + this.height - 25, '0/4', { font: '16px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.ingredients.setOrigin(1,0);
    this.content.push(this.ingredients);
};

RecipeSlot.prototype.setUp = function(action,item,nb){
    ItemSlot.prototype.setUp.call(this,action,item,nb);

    var status = Engine.player.needsToCraft(item);
    var itemData = itemsData[item];
    if(itemData.ability && !Engine.player.hasAbility(itemData.ability)){
        this.ingredients.setText('Ability needed');
        this.ingredients.setFill(Utils.colors.red);
    }else {
        this.ingredients.setText(status[0]+'/'+status[1]);
        this.ingredients.setFill(status[0] == status[1] ? Utils.colors.green : Utils.colors.red);
    }

    this.price.setText(Engine.currentBuiling.getPrice(item,'sell'));

    this.zone.off('pointerup');
    this.zone.on('pointerup',function(){
        if(this.checkForPanelOnTop()) return;
        Engine.currentMenu.panels['combi'].setUp(item);
        if(Client.tutorial) TutorialManager.triggerHook('recipe:'+item);
    }.bind(this));
};


export default RecipesPanel