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
        this.previousTile = {
            x: this.tileX,
            y: this.tileY
        };
        this.orientation = 'down';
        this.previousOrientation = this.orientation;
        this.movement = null;

        this.setInteractive();
        //console.log('['+this.constructor.name+'] scene : ',this.scene);

        this.halo = Engine.scene.add.image(0,0,'battlehalo');
        this.halo.setDepth(2);
        this.halo.setVisible(false);
        this.displayedHalo = false;
        this.updateHalo();
        this.haloTween = Engine.scene.tweens.add({
            targets: this.halo,
            alpha: 0.2,
            duration: 750,
            yoyo: true,
            repeat: -1,
            paused: true
        });
    },

    displayHalo: function(){
        if(this.displayedHalo) return;
        this.halo.setVisible(true);
        this.haloTween.play();
        this.displayedHalo = true;
    },

    hideHalo: function(){
        if(!this.displayedHalo) return;
        this.halo.setVisible(false);
        this.haloTween.stop();
        this.displayedHalo = false;
    },

    updateHalo: function(){
        this.halo.setPosition(this.x+13,this.y+24);
    },

    updateDepth: function(){
        try {
            this.setDepth(Engine.playersDepth + this.tileY / 1000);
        }catch(e){
            /*console.log('attempted value : ',Engine.playersDepth + this.tileY / 1000);
            console.log(this.scene);
            console.log(this);
            throw e;*/
        }
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
        var mover = this;
        this.movement = Engine.scene.tweens.timeline({
            tweens: tweens,
            onStart: function(){
                mover.previousOrientation = null;
            },
            onUpdate: function(){
                    mover.updatePosition();
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
        if(this.constructor.name == 'Player') this.leaveFootprint();
        this.previousTile.x = this.tileX;
        this.previousTile.y = this.tileY;
        this.updateDepth();
        this.chunk = Utils.tileToAOI({x: this.tileX, y: this.tileY});

        if(this.bubble) this.bubble.updatePosition(this.x-this.bubbleOffsetX,this.y-this.bubbleOffsetY);
        this.updateHalo();

        if(this.constructor.name == 'Player' && this.id == Engine.player.id) {
            if(this.chunk != this.previousChunk) Engine.updateEnvironment();
            this.previousChunk = this.chunk;
        }
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
            // TODO: use pool instead
            var print = Engine.scene.add.image(sx,sy,'footsteps');
            print.angle += angle;
            print.alpha = 0.7;
            print.depth = Engine.playersDepth;

            Engine.scene.tweens.add({
                targets: print,
                alpha: 0,
                duration: 1500
            });
        }
    }
});