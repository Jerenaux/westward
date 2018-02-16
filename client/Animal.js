/**
 * Created by Jerome on 04-10-17.
 */
var Animal = new Phaser.Class({

    Extends: Moving,

    initialize: function Animal (x, y, type, id) {
        var data = Engine.animalsData[type];
        Moving.call(this,x,y,data.sprite,id);
        this.setFrame(data.frame);
        this.setDisplayOrigin(0);
        this.dead = false;
        this.name = data.name;
        this.walkAnimPrefix = data.walkPrefix;
        this.restingFrames = data.restingFrames;
    },

    die: function(){
        this.setFrame(49);
        this.dead = true;
        //Engine.deathAnimation(animal);
        //setTimeout(Engine.removeAnimal,500,animal.id);
    },

    handleClick: function(){
        console.log('animal click');
        // TODO: replace request logic
        if(Engine.player.inFight){
            Engine.requestBattleAttack(this);
        }else{
            Engine.requestBattle(Engine.player,this);
        }
        Engine.interrupt = true;
    }
});