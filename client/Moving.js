/**
 * Created by Jerome on 04-10-17.
 */
var Moving = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Moving (x, y, texture, id) {
        // Using call(), the called method will be executed while having 'this' pointing to the first argumentof call()
        CustomSprite.call(this, x*Engine.tileWidth, y*Engine.tileHeight, texture);

        this.id = id;
        this.chunk = Utils.tileToAOI({x:x,y:y});
        this.tileX = x;
        this.tileY = y;
        this.updateDepth();
        this.previousPosition = {
            x : x*Engine.tileWidth,
            y : y*Engine.tileHeight
        };
        this.orientation = 'down';
        this.previousOrientation = this.orientation;
        this.movement = null;

        this.setInteractive();
    },

    updateDepth: function(){
        this.depth = Engine.playersDepth + this.tileY/1000;
    },

    move: function(path){
        path.shift();
        var tweens = [];
        for(var i = 0; i < path.length; i++){
            var sx = (i == 0 ? this.tileX : path[i-1][0]);
            var sy = (i == 0 ? this.tileY : path[i-1][1]);
            var ex = path[i][0];
            var ey = path[i][1];
            var time = PFUtils.getDuration(sx,sy,ex,ey); // in sec
            tweens.push({
                targets: this,
                x: {value: ex*Engine.tileWidth, duration: time*1000},
                y: {value: ey*Engine.tileHeight, duration: time*1000}
            });
        }

        if(this.movement !== null) {
            this.movement.stop();
            this.updatePosition();
        }
        //this.lastUpdateStamp = Date.now();
        var mover = this;
        this.movement = Engine.scene.tweens.timeline({
            tweens: tweens,
            onStart: function(){
                mover.previousOrientation = null;
            },
            onUpdate: function(){
                //if(Date.now() - mover.lastUpdateStamp > 5){
                    mover.updatePosition();
                    //mover.lastUpdateStamp = Date.now();
                //}
            },
            onComplete: function(){
                mover.updatePosition();
                mover.anims.stop();
                mover.setFrame(mover.restingFrames[mover.orientation]);
            }
        });
    },
    
    updatePosition: function(){
        if(this.x > this.previousPosition.x){ // right
            this.orientation = 'right';
        }else if(this.x < this.previousPosition.x) { // left
            this.orientation = 'left';
        }else if(this.y > this.previousPosition.y) { // down
            this.orientation = 'down';
        }else if(this.y < this.previousPosition.y) { // up
            this.orientation = 'up';
        }
        if(this.orientation != this.previousOrientation){
            this.previousOrientation = this.orientation;
            this.anims.play(this.animsKeys['move_'+this.orientation]);
        }
        this.previousPosition = {
            x: this.x,
            y: this.y
        };
        this.tileX = Math.floor(this.x/Engine.tileWidth);
        this.tileY = Math.floor(this.y/Engine.tileHeight);
        this.updateDepth();
        this.chunk = Utils.tileToAOI({x: this.tileX, y: this.tileY});

        if(this.constructor.name == 'Player' && this.id == Engine.player.id) {
            if(this.chunk != this.previousChunk) Engine.updateEnvironment();
            this.previousChunk = this.chunk;
        }
    }
});