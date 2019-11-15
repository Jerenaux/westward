import Engine from './Engine';
import ItemSlot from "./ItemSlot";
import UI from './UI'
import Utils from '../shared/Utils'

/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 31-08-19.
 */
function IngredientSlot(x,y,width,height,showprice){
    ItemSlot.call(this,x,y,width,height);

    this.addIngredients();
    this.showprice = showprice;

    this.content.forEach(function(c){
        c.setScrollFactor(0);
        c.setDepth(1);
    });
}

IngredientSlot.prototype = Object.create(ItemSlot.prototype);
IngredientSlot.prototype.constructor = IngredientSlot;

IngredientSlot.prototype.addIngredients = function(){
    this.ingredients = UI.scene.add.text(this.x + this.width - 10, this.y + this.height - 25, '0/4', { font: '16px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.ingredients.setOrigin(1,0);
    this.content.push(this.ingredients);
};

IngredientSlot.prototype.setUp = function(item,nb){
    ItemSlot.prototype.setUp.call(this,'buy',item,Engine.player.getItemNb(item));

    if(this.showprice){
        this.price.setText(Engine.currentBuiling.getPrice(item,'sell'));
    }else{
        this.goldicon.setVisible(false);
        this.price.setVisible(false);
    }

    if(nb > -1){
        this.ingredients.setText(Engine.player.getItemNb(item)+'/'+nb);
        this.ingredients.setFill(Engine.player.getItemNb(item) >= nb ? Utils.colors.green : Utils.colors.red);
    }else{
        this.ingredients.setVisible(false);
    }

    this.zone.off('pointerup');
    if(Engine.player.craftRecipes.hasItem(item)) {
        this.zone.on('pointerup', function () {
            Engine.currentMenu.panels['combi'].setUp(item);
        }.bind(this));
    }
};

export default IngredientSlot