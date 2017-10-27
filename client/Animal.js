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
    },

    handleClick: function(){
        Client.startBattle(this.id);
    }
});