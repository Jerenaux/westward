/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 24-03-19.
 */

function RecipesPanel(x,y,width,height,title,invisible){
    ShopInventoryPanel.call(this,x,y,width,height,title,invisible);
}

RecipesPanel.prototype = Object.create(ShopInventoryPanel.prototype);
RecipesPanel.prototype.constructor = RecipesPanel;

RecipesPanel.prototype.getNextSlot = function(x,y){
    if(this.slotsCounter >= this.slots.length){
        this.slots.push(new RecipeSlot(x,y,320,80));
    }

    return this.slots[this.slotsCounter++];
};

// -------------------------------------

function RecipeSlot(x,y,width,height){
    ShopSlot.call(this,x,y,width,height);
}

RecipeSlot.prototype = Object.create(ShopSlot.prototype);
RecipeSlot.prototype.constructor = RecipeSlot;

RecipeSlot.prototype.addSpecificContent = function(width, height){
    this.bagicon = UI.scene.add.sprite(this.x + width - 14, this.y + height - 12, 'UI','smallpack');
    this.ingredients = UI.scene.add.text(this.x + width - 64, this.y + height - 22, '3/4', { font: '12px '+Utils.fonts.fancy, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.content.push(this.bagicon);
    this.content.push(this.ingredients);
};