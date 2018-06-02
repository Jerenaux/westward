/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 23-04-18.
 */

var Hero = new Phaser.Class({
    Extends: Player,

    initialize: function(){
        Player.call(this);
        this.isHero = true;
    }
});