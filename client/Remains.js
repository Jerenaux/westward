/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) 
 */

import CustomSprite from './CustomSprite'

var Remains = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Remains() {
        CustomSprite.call(this, Engine.scene, 0, 0);
        // this.setInteractive();
        this.entityType = 'remain';
    },

    setUp: function(data){
        this.setTexture('bones');
        this.setFrame(0);
        this.setVisible(true);
        this.setTilePosition(data.x,data.y,true);
        this.setOrigin(0.5,0);
        this.updateDepth();

        if(Utils.randomInt(0,10) > 5) this.flipX = true;

        this.x += World.tileWidth/2;
        this.y += World.tileHeight/2;

        Engine.remains[this.id] = this;
        Engine.entityManager.addToDisplayList(this);
    },

    updateDepth: function(){
        this.setDepth(this.tileY+1.5); // for e.g. when wood spawns on the roots of a tree
    },

    remove: function(){
        CustomSprite.prototype.remove.call(this);
        delete Engine.remains[this.id];
    }
});

export default Remains