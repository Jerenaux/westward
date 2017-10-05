/**
 * Created by Jerome on 04-10-17.
 */
var Player = new Phaser.Class({

    Extends: Phaser.GameObjects.Sprite,

    initialize: function Player (x, y, texture, id) {
        // Using call(), the called method will be executed while having 'this' pointing to the first argumentof call()
        Phaser.GameObjects.Sprite.call(this, Engine.scene, x*Engine.tileWidth, y*Engine.tileHeight, texture);
        Engine.scene.add.displayList.add(this);
        Engine.scene.add.updateList.add(this);

        this.depth = 1;
        this.id = id;
        this.chunk = Utils.tileToAOI({x:x,y:y});
        this.tileX = x;
        this.tileY = y;
        this.previousPosition = {
            x : x,
            y : y
        };
        this.displayOriginX = 16;
        this.orientation = 'down';
        this.movement = null;
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
        this.lastUpdateStamp = Date.now();
        var player = this;
        this.movement = Engine.scene.tweens.timeline({
            tweens: tweens,
            onUpdate: function(){
                if(Date.now() - player.lastUpdateStamp > 200){
                    player.updatePosition();
                    player.lastUpdateStamp = Date.now();
                }
            },
            onComplete: function(){
                player.updatePosition();
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
        this.previousPosition = {
            x: this.x,
            y: this.y
        };
        this.tileX = Math.floor(this.x/Engine.tileWidth);
        this.tileY = Math.floor(this.y/Engine.tileHeight);
        this.chunk = Utils.tileToAOI({x: this.tileX, y: this.tileY});

        if(this.id == Engine.player.id) {
            if(this.chunk != this.previousChunk) Engine.updateEnvironment();
            this.previousChunk = this.chunk;
        }
    }
});