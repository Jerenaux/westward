/**
 * Created by Jerome on 04-10-17.
 */
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

        var animalData = Engine.animalsData[data.type];
        this.id = data.id;

        Engine.animals[this.id] = this;
        Engine.entityManager.addToDisplayList(this);

        this.cellsWidth = animalData.width || 1;
        this.cellsHeight = animalData.height || 1;

        this.setPosition(data.x,data.y);
        this.setTexture(animalData.sprite);
        this.setFrame(animalData.frame);
        this.setDisplayOrigin(0);
        this.setInteractive();
        this.setVisible(true);
        this.dead = false;
        this.name = animalData.name+' '+this.id;
        this.animPrefix = animalData.walkPrefix;
        this.footprintsFrame = animalData.footprintsFrame;
        this.printsVertOffset = animalData.printsVertOffset;
        this.restingFrames = animalData.restingFrames;

        this.manageOrientationPin();
    },

    processMeleeAttack: function(facing){
        this.computeOrientation(this.tileX,this.tileY,facing.x,facing.y);
        this.faceOrientation();
        if(Utils.randomInt(1,10) >= 8) Engine.playLocalizedSound('wolfattack1',1,{x:this.tileX,y:this.tileY});
    },

    /*onAttack: function(){
        if(Utils.randomInt(1,10) >= 8) Engine.playLocalizedSound('wolfattack1',1,{x:this.tileX,y:this.tileY});
    },*/

    remove: function(){
        //console.log('remove ',this.id,'(',this.tileX,',',this.tileY,',',this.chunk,',)');
        //Engine.animalUpdates.add(this.id,'remove');
        CustomSprite.prototype.remove.call(this);
        this.orientationPin.hide();
        this.orientationPin.reset();
        delete Engine.animals[this.id];
    },

    die: function(){
        this.setFrame(49);
        this.dead = true;
    }
});