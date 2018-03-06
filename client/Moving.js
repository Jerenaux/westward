/**
 * Created by Jerome on 04-10-17.
 */
var Moving = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Moving (x, y){// texture, id) {
        // Using call(), the called method will be executed while having 'this' pointing to the first argumentof call()
        //CustomSprite.call(this, x*Engine.tileWidth, y*Engine.tileHeight, texture);
        CustomSprite.call(this, 0,0);

        this.orientation = 'down';
        this.previousOrientation = this.orientation;
        this.movement = null;

        this.setInteractive();
    },

    setPosition: function(x,y){
        Phaser.GameObjects.Components.Transform.setPosition.call(this,x*Engine.tileWidth,y*Engine.tileHeight);
        this.chunk = Utils.tileToAOI({x:x,y:y});
        this.tileX = x;
        this.tileY = y;
        this.updateDepth();
        this.updatePreviousPosition(x,y);
    },

    updateDepth: function(){
        this.setDepth(Engine.playersDepth + this.tileY / 1000);
    },

    updatePreviousPosition: function(tileX,tileY){
        this.previousPosition = {
            x : this.x,
            y : this.y
        };
        this.previousTile = {
            x: tileX,
            y: tileY
        };
    },

    getShortID: function(){
        return this.constructor.name[0]+this.id;
    },

    move: function(path){
        path.shift();

        if(path.length == 0) this.endMovement();

        if(this.isActiveFighter) BattleManager.deactivateCell();

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
                /*onStart: function(){
                    console.log('start');
                }*/
            });
        }

        if(this.movement !== null) {
            this.movement.stop();
            this.updatePosition();
        }
        var mover = this;
        this.movement = Engine.scene.tweens.timeline({
            tweens: tweens,
            onStart: function(){
                mover.previousOrientation = null;
            },
            onUpdate: function(){
                mover.updateMovement();
            },
            onComplete: mover.endMovement.bind(mover)
        });
    },

    endMovement: function(){
        if(!this.active) return; // quick fix
        this.flagForStop = false;
        this.anims.stop();
        this.setFrame(this.restingFrames[this.orientation]);
    },
    
    updateMovement: function(){
        if(!this.scene) return; // quick fix before the bug gets fixed in Phaser
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
            this.anims.play(this.walkAnimPrefix+'_move_'+this.orientation);
        }

        this.updatePosition();

        if(this.constructor.name == 'Player') this.leaveFootprint();
        if(this.bubble) this.bubble.updatePosition(this.x-this.bubbleOffsetX,this.y-this.bubbleOffsetY);


        if(this.flagForStop && (this.tileX != this.previousTile.x || this.tileY != this.previousTile.y)){
            console.log(this.movement);
            this.movement.stop();
            this.endMovement();
        }

        this.previousTile.x = this.tileX;
        this.previousTile.y = this.tileY;
    },

    updatePosition: function(){
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
    },

    teleport: function(x,y){
        this.x = x*Engine.tileWidth;
        this.y = y*Engine.tileHeight;
        this.updatePosition();
        this.previousTile.x = this.tileX;
        this.previousTile.y = this.tileY;
    },

    stop: function(){
        this.flagForStop = true;
    },

    leaveFootprint: function(){
        if(this.tileX != this.previousTile.x || this.tileY != this.previousTile.y){
            var dx = this.tileX - this.previousTile.x;
            var dy = this.tileY - this.previousTile.y;
            var angle = 0;
            if(dx == 1 && dy == 0){
                angle = 90;
            }else if(dx == -1 && dy == 0){
                angle = -90
            }else if(dx == 0 && dy == 1){
                angle = 180;
            }
            var sx = this.previousTile.x*Engine.tileWidth + Engine.tileWidth/2;
            var sy = this.previousTile.y*Engine.tileHeight + Engine.tileHeight/2;

            var print = Engine.getNextPrint();
            //var print = Engine.spritePool.getNext();
            //print.setTexture('footsteps');
            print.setPosition(sx,sy);
            print.angle = angle;
            print.alpha = 0.7;
            print.depth = Engine.markerDepth;

            Engine.scene.tweens.add({
                targets: print,
                alpha: 0,
                duration: 1500,
                onComplete: function(tween,targets){
                    targets.forEach(function(t){
                        Engine.recyclePrint(t);
                        //t.recycle();
                    });
                }
            });
        }
    }
});