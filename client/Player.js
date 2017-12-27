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
        this.panel = new Panel(0,py+height,width,height,'Player name');
        this.panel.addRing(260,-10,'red','close',Engine.togglePanel.bind(this));
        this.panel.setTweens(0,py+height,0,py,300);
        this.handleClick = Engine.togglePanel.bind(this);

        this.bubbleOffsetX = 55;
        this.bubbleOffsetY = 75;
        //this.bubble = new Bubble(this.x-this.bubbleOffsetX,this.y-this.bubbleOffsetY);

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

        this.destinationAction = null;
    },

    setDestinationAction: function(type,id){
        if(type == 0){
            this.destinationAction = null;
            return;
        }
        this.destinationAction = {
            type: type,
            id: id
        }
    },

    move: function(path){
        console.log('Client moving : ',path);
        if(this.isHero) Client.sendPath(path,this.destinationAction);
        Moving.prototype.move.call(this,path);
    },

    onArrival: function(){
        console.log('arrived');
        if(!this.destinationAction) return;
        if(this.destinationAction.type == 1){
            console.log('Entering building ',this.destinationAction.id);
        }
    }
});