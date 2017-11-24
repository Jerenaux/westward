/**
 * Created by Jerome on 04-10-17.
 */
var Player = new Phaser.Class({

    Extends: Moving,

    initialize: function Player (x, y, texture, id) {
        // Using call(), the called method will be executed while having 'this' pointing to the first argumentof call()
        //CustomSprite.call(this, x*Engine.tileWidth, y*Engine.tileHeight, texture);
        Moving.call(this,x,y,texture,id);
        this.setFrame(33);
        this.displayOriginX = 16;

        var height = 100;
        var width = 300;
        var py = Engine.baseViewHeight*Engine.tileHeight - height;
        this.panel = new Panel(0,py,width,height,'Player name');
        this.panel.addRing(260,-10,'red','close',Engine.closePanel.bind(this.panel));
        this.handleClick = Engine.togglePanel.bind(this);

        this.animsKeys = {
            move_down: 'player_move_down',
            move_up: 'player_move_up',
            move_right: 'player_move_right',
            move_left: 'player_move_left'
        };

        this.restingFrames = {
            up: 20,
            down: 33,
            left: 52,
            right: 7
        };
    }
});