/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 29-03-18.
 */
import BattleManager from './BattleManager'
import CustomSprite from './CustomSprite'
import Engine from './Engine'
import Insect from './Insect'
import OrientationPin from './OrientationPin'
import UI from './UI'
import Utils from '../shared/Utils'
import World from '../shared/World'

import itemsData from '../assets/data/items.json'

var Item = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Item() {
        CustomSprite.call(this, Engine.scene, 0, 0);
        this.setInteractive();
        this.entityType = 'item';
    },

    setUp: function(data){
        var itemData = itemsData[data.type];
        var atlas = (itemData.envFrames ? 'tileset' : itemData.atlas);
        var frame = (itemData.envFrames ? Utils.randomElement(itemData.envFrames) : itemData.frame);
        this.itemType = data.type;
        this.outFrame = frame;
        this.inFrame = (itemData.envFrames ? frame+'_lit' : frame);

        this.setTexture(atlas);
        this.setFrame(frame);
        this.setVisible(true);
        this.orientationPin = new OrientationPin('item',itemData.atlas,itemData.frame);

        this.setTilePosition(data.x,data.y,true);
        // this.setOrigin(0.5);
        this.updateDepth();

        if(itemData.collides) {
            this.collides = true;
            Engine.collisions.add(this.tileX,this.tileY);
        }

        this.x += World.tileWidth/2;
        this.y += World.tileHeight/2;
        this.setID(data.id);
        this.name = itemData.name;
        Engine.items[this.id] = this;
        Engine.entityManager.addToDisplayList(this);

        this.manageOrientationPin();
        this.manageBehindness();

        if(itemData.insect && Utils.randomInt(1,10) > 8) new Insect(this.x,this.y);
    },

    updateDepth: function(){
        this.setDepth(this.tileY+1.5); // for e.g. when wood spawns on the roots of a tree
    },

    remove: function(){
        CustomSprite.prototype.remove.call(this);
        if(this.collides) Engine.collisions.delete(this.tileX,this.tileY);
        this.orientationPin.hide();
        delete Engine.items[this.id];
    },

    manageOrientationPin: function(){
        if(Engine.isInView(this.tileX,this.tileY)) {
            this.orientationPin.hide();
        }else{
            this.orientationPin.update(this.tileX,this.tileY);
            if(this.orientationPin.side){
                var sideMap = Engine.orientationPins[this.orientationPin.side];
                if(!sideMap.hasOwnProperty(this.itemType)) sideMap[this.itemType] = [];
                sideMap[this.itemType].push(this.orientationPin);
            }
            this.orientationPin.display();
        }
    },

    manageBehindness: function(){
        if(Engine.overlay.get(this.tileX,this.tileY)){
            this.hollow();
        }else{
            this.unhollow();
        }
    },

    // Overrides the corresponding CustomSprite methods
    hollow: function(){
        if(this.hollowed) return;
        this.hollowed = true;
        this.setDepth(this.tileY + 5);
        this.setTexture('tileset_wh',this.frame.name);
    },

    unhollow: function(){
        if(!this.hollowed) return;
        this.hollowed = false;
        this.updateDepth();
        this.setTexture('tileset',this.frame.name);
    },

    handleClick: function(){
        if(!BattleManager.inBattle) Engine.processItemClick(this);
    },

    setCursor: function(){
        if(BattleManager.inBattle || Engine.inMenu) return;
        UI.setCursor('item');
        UI.tooltip.updateInfo('pickupItem',{id:this.itemType});
        UI.tooltip.display();
    },

    handleOver: function(){
        UI.manageCursor(1,'item',this);
        if(!this.hollowed) this.setFrame(this.inFrame);
        Engine.hideMarker();
        // console.log(this.depth);
    },

    handleOut: function(){
        UI.manageCursor(0,'item');
        //UI.setCursor();
        UI.tooltip.hide();
        if(!this.hollowed) this.setFrame(this.outFrame);
        Engine.showMarker();
    }
});

export default Item