/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 18-06-18.
 */

var Civ = new Phaser.Class({

    Extends: NPC,

    initialize: function Civ() {
        NPC.call(this);
        this.entityType = 'civ';
        this.orientationPin = new OrientationPin('civ');
    },

    setUp: function(data){
        var civData = Engine.civsData[data.type];
        this.id = data.id;

        Engine.civs[this.id] = this;
        Engine.entityManager.addToDisplayList(this);

        this.cellsWidth = civData.width || 1;
        this.cellsHeight = civData.height || 1;

        this.setPosition(data.x,data.y);
        this.setTexture('enemy');
        this.restingFrames = {
            up: 104,
            down: 130,
            left: 117,
            right: 143
        };
        this.setFrame(this.restingFrames.down,false,false);
        this.setOrigin(0.2,0.5);

        var shape = new Phaser.Geom.Polygon([20,15,50,15,50, 60, 20, 60]);
        this.setInteractive(shape, Phaser.Geom.Polygon.Contains);

        this.setVisible(true);
        this.dead = false;
        this.name = 'מִ  ת  נַ  גֵ  ד';

        this.animPrefix = 'enemy';
        this.footprintsFrame = 0;
        this.printsVertOffset = 10;

        this.manageOrientationPin();
    },

    processMeleeAttack: function(facing){
        this.computeOrientation(this.tileX,this.tileY,facing.x,facing.y);
        this.faceOrientation();
        this.play(this.animPrefix+'_attack_'+this.orientation);
    },

    /*onAttack: function(){
        this.play(this.animPrefix+'_attack_'+this.orientation);
    },*/

    remove: function(){
        //console.log('remove ',this.id,'(',this.tileX,',',this.tileY,',',this.chunk,',)');
        CustomSprite.prototype.remove.call(this);
        this.orientationPin.hide();
        this.orientationPin.reset();
        delete Engine.civs[this.id];
    },

    die: function(){
        this.play(this.animPrefix+'_death');
        this.dead = true;
    }
});