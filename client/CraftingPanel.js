/**
 * Created by Jerome on 20-11-17.
 */

function CraftingPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.buttons = [];
    this.craftTarget = null;
    this.craftAmount = 0;
    this.craftAmountText = null;
    this.craftTargetMaterials = null;
    this.makeRing();
    this.disableButtons();
}

CraftingPanel.prototype = Object.create(Panel.prototype);
CraftingPanel.prototype.constructor = CraftingPanel;

CraftingPanel.prototype.makeRing = function(){
    var ringx = 80;
    var ringy = 50;
    this.addSprite('UI','craftring',ringx,ringy);
    this.craftTarget = this.addSprite('items','void',ringx+32+20,ringy+32+16);
    this.craftAmountText = Engine.scene.add.text(this.x+ringx+32+25,this.y+ringy+32+50, '0',
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.container.push(this.craftAmountText);
    this.craftTargetMaterials = new Inventory(Engine.craftInvSize);
    this.buttons.push(this.addRing(ringx+92,ringy+13,'green','ok',Engine.closePanel));
    this.buttons.push(this.addRing(ringx+5,ringy+82,'blue','plus',Engine.closePanel));
    this.buttons.push(this.addRing(ringx+22,ringy+99,'blue','minus',Engine.closePanel));
    this.verticalOffset += 200;
};

CraftingPanel.prototype.disableButtons = function(){
    for(var i = 0; i < this.buttons.length; i++){
        this.buttons[i].setFrame('gray');
        this.buttons[i].upFrame = 'gray';
    }
    /*this.okButton.setFrame('gray');
    this.plusButton.setFrame('gray');
    this.minusButton.setFrame('gray');
    this.okButton.upFrame = 'gray';
    this.plusButton.upFrame = 'gray';
    this.minusButton.upFrame = 'gray';*/
};

CraftingPanel.prototype.updateTarget = function(data){
    this.craftTarget.setTexture(data.atlas);
    this.craftTarget.setFrame(data.frame);
    if(!data.recipe) throw Error('No recipe for provided item');
    this.craftTargetMaterials.setItems(data.recipe);

    this.hideInventory();
    this.displayTheInventory(this.inventories[0]);
};