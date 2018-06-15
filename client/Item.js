/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 29-03-18.
 */
var Item = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Item() {
        CustomSprite.call(this, Engine.scene, 0, 0);
        this.setDepth(2);
        //this.setOrigin(-0.3);
        this.setInteractive();
        this.entityType = 'item';
    },

    setUp: function(data){
        var itemData = Engine.itemsData[data.type];
        this.setTexture(itemData.atlas);
        this.setFrame(itemData.frame);
        this.setVisible(true);
        this.orientationPin = new OrientationPin('item',itemData.atlas,itemData.frame);

        this.setTilePosition(data.x,data.y,true);
        this.x += World.tileWidth/2;
        this.y += World.tileHeight/2;
        this.setID(data.id);

        this.name = itemData.name;
        Engine.items[this.id] = this;
        Engine.entityManager.addToDisplayList(this);

        this.manageOrientationPin();
    },

    remove: function(){
        CustomSprite.prototype.remove.call(this);
        this.orientationPin.hide();
        delete Engine.items[this.id];
    },

    manageOrientationPin: function(){
        return; // enable based on explorer abilities
        var viewRect = new Phaser.Geom.Rectangle(Engine.camera.scrollX,Engine.camera.scrollY,Engine.camera.width-World.tileWidth,Engine.camera.height-World.tileHeight);
        var inCamera = viewRect.contains(this.x,this.y);
        if(inCamera) {
            this.orientationPin.hide();
        }else{
            this.orientationPin.update(this.tx,this.ty);
            this.orientationPin.display();
        }
    },

    handleClick: function(){
        if(!BattleManager.inBattle) Engine.processItemClick(this);
    },

    handleOver: function(){
        if(BattleManager.inBattle || Engine.inMenu) return;
        UI.setCursor(UI.handCursor);
        UI.tooltip.updateInfo(this.name);
        UI.tooltip.display();
    },

    handleOut: function(){
        UI.setCursor();
        UI.tooltip.hide();
    }
});