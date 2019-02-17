/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 29-03-18.
 */
var Item = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Item() {
        CustomSprite.call(this, Engine.scene, 0, 0);
        this.setInteractive();
        this.entityType = 'item';
    },

    setUp: function(data){
        var itemData = Engine.itemsData[data.type];
        var atlas = 'tileset';
        var frame = Utils.randomElement(itemData.envFrames);
        this.outFrame = frame;
        this.inFrame = frame+'_lit';

        this.setTexture(atlas);
        this.setFrame(frame);
        this.setVisible(true);
        this.orientationPin = new OrientationPin('item',itemData.atlas,itemData.frame);

        this.setTilePosition(data.x,data.y,true);
        this.setDepth(this.ty+1); // for e.g. when wood spawns on the roots of a tree

        if(itemData.collides) {
            this.collides = true;
            Engine.collisions.add(this.tx,this.ty);
        }

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
        if(this.collides) Engine.collisions.delete(this.tx,this.ty);
        this.orientationPin.hide();
        delete Engine.items[this.id];
    },

    manageOrientationPin: function(){
        if(Engine.camera.worldView.contains(this.x,this.y)) {
            this.orientationPin.hide();
        }else{
            this.orientationPin.update(this.tx,this.ty);
            this.orientationPin.display();
        }
    },

    handleClick: function(){
        if(!BattleManager.inBattle) Engine.processItemClick(this);
    },

    setCursor: function(){
        if(BattleManager.inBattle || Engine.inMenu) return;
        UI.setCursor('item');
        UI.tooltip.updateInfo(this.name);
        UI.tooltip.display();
    },

    handleOver: function(){
        UI.manageCursor(1,'item',this);
        this.setFrame(this.inFrame);
        // console.log(this.depth);
    },

    handleOut: function(){
        UI.manageCursor(0,'item');
        //UI.setCursor();
        UI.tooltip.hide();
        //if(this.isPlant) this.setFrame(this.outFrame);
        this.setFrame(this.outFrame);
    }
});