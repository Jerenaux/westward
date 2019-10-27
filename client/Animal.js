/**
 * Created by Jerome on 04-10-17.
 */

import CustomSprite from './CustomSprite'
import Engine from './Engine'
import NPC from './NPC'
import OrientationPin from './OrientationPin'
import Utils from '../shared/Utils'

var Animal = new Phaser.Class({

    Extends: NPC,

    initialize: function Animal() {
        NPC.call(this);
        this.entityType = 'animal';
        this.orientationPin = new OrientationPin('animal');
    },

    setUp: function(data){
        //Engine.animalUpdates.add(data.id,'create');
        if(Engine.animals.hasOwnProperty(data.id)){
            if(Engine.debug) console.warn('duplicate animal ',data.id,'at',data.x,data.y,'last seen at ',
                Engine.animals[data.id].tileX,',',Engine.animals[data.id].tileY);
            Engine.animals[data.id].remove();
        }

        var animalData = Engine.getAnimalData(data.type);
        this.id = data.id;

        Engine.animals[this.id] = this;
        Engine.entityManager.addToDisplayList(this);

        this.cellsWidth = animalData.width || 1;
        this.cellsHeight = animalData.height || 1;

        this.setPosition(data.x,data.y);
        this.setTexture(animalData.sprite);
        // this.setFrame(animalData.frame); // TODO: remove, do it based on walk anim
        if(animalData.origin){
            this.setOrigin(animalData.origin.x,animalData.origin.y);
        }else {
            this.setOrigin(0);
        }
        this.setInteractive();
        this.setVisible(true);
        this.dead = false;
        this.name = animalData.name+' '+this.id;
        this.animPrefix = animalData.animPrefix;
        this.faceOrientation();
        this.footprintsFrame = animalData.footprintsFrame;
        this.printsVertOffset = animalData.printsVertOffset;
        this.printsHorizOffset = animalData.printsHorizOffset;
        this.overlayOffset = animalData.overlayOffset;

        this.battleBoxData = {
            'atlas': 'battleicons',
            'frame':animalData.battleicon
        }
    },

    update: function(data){
        NPC.prototype.update.call(this,data);
        this.manageOrientationPin();
    },

    processMeleeAttack: function(facing){
        this.computeOrientation(this.tileX,this.tileY,facing.x,facing.y);
        this.faceOrientation();
        var atkAnim  = this.animPrefix + '_attack_' + this.orientation;
        if(atkAnim in Engine.scene.anims.anims.entries) this.play(atkAnim);
        // TODO: read sound and probability from conf
        if(Utils.randomInt(1,10) >= 8) Engine.playLocalizedSound('wolfattack1',1,{x:this.tileX,y:this.tileY});
    },

    getShortID: function(){
        return 'A'+this.id;
    },

    remove: function(){
        //console.log('remove ',this.id,'(',this.tileX,',',this.tileY,',',this.chunk,',)');
        //Engine.animalUpdates.add(this.id,'remove');
        CustomSprite.prototype.remove.call(this);
        this.orientationPin.hide();
        this.orientationPin.reset();
        delete Engine.animals[this.id];
    },

    die: function(){
        var deathAnim  = this.animPrefix + '_die_' + this.orientation;
        // console.warn('playing ',deathAnim);
        if(deathAnim in Engine.scene.anims.anims.entries){
            this.play(deathAnim);
        }else{
            this.setFrame(49);
        }
        this.dead = true;
    }
});

export default Animal