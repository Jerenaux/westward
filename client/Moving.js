/**
 * Created by Jerome on 04-10-17.
 */
var Moving = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Moving (){
        // Using call(), the called method will be executed while having 'this' pointing to the first argumentof call()
        CustomSprite.call(this, Engine.scene, 0,0);

        this.orientation = 'down';
        this.previousOrientation = null;
        this.movement = null;
        this.currentPath = [];

        this.setInteractive();
    },

    // Sets position regardless of previous position; primarily called by children.setUp()
    setPosition: function(x,y){ // x and y are tile coordinates
        Phaser.GameObjects.Components.Transform.setPosition.call(this,x*Engine.tileWidth,y*Engine.tileHeight);
        this.setTilePosition(x,y);
        this.updatePosition(x,y);
    },

    setTilePosition: function(x,y){
        this.tileX = x;
        this.tileY = y;
    },

    // Updates the position; primarily called as the entity moves around and has moved by at least 1 tile
    updatePosition: function(x,y){ // x and y are tile cordinates
        this.updatePreviousPosition();
        this.setTilePosition(x,y);
        this.updateDepth();
        this.updateChunk();
    },

    updatePreviousPosition: function(){
        this.previousPosition = {
            x : this.x,
            y : this.y,
            tx: this.tileX,
            ty: this.tileY
        };
    },

    updateDepth: function(){
        this.setDepth(Engine.playersDepth + this.tileY / 1000);
    },

    updateChunk: function(){
        this.chunk = Utils.tileToAOI({x:this.tileX,y:this.tileY});
        if(this.isHero) {
            if(this.chunk != this.previousChunk) Engine.updateEnvironment();
            this.previousChunk = this.chunk;
        }
    },

    getShortID: function(){
        return this.constructor.name[0]+this.id;
    },

    move: function(path){
        if(path.length <= 1) {
            this.endMovement();
            return;
        }
        if(this.isActiveFighter) BattleManager.deactivateCell();
        this.currentPath = path;

        var tweens = [];
        for(var i = 0; i < path.length-1; i++){
            var sx = path[i][0];
            var sy = path[i][1];
            var ex = path[i+1][0];
            var ey = path[i+1][1];
            var time = PFUtils.getDuration(sx,sy,ex,ey); // in sec
            tweens.push({
                targets: this,
                x: {value: ex*Engine.tileWidth, duration: time*1000},
                y: {value: ey*Engine.tileHeight, duration: time*1000},
                onStartParams: [sx,sy,ex,ey],
                onStart: this.tileByTilePreUpdate.bind(this),
                onComplete: this.tileByTilePostUpdate.bind(this)
            });
        }

        this.moving = true;
        this.movement = Engine.scene.tweens.timeline({
            tweens: tweens,
            onUpdate: this.frameByFrameUpdate.bind(this),
            onComplete: this.endMovement.bind(this)
        });
    },

    frameByFrameUpdate: function(){
        if(this.bubble) this.bubble.updatePosition(this.x-this.bubbleOffsetX,this.y-this.bubbleOffsetY);
    },

    computeOrientation: function(fromX,fromY,toX,toY){
        if(fromX > toX){
            this.orientation = 'left';
        }else if(fromX < toX) {
            this.orientation = 'right';
        }else if(fromY > toY) {
            this.orientation = 'up';
        }else if(fromY < toY) {
            this.orientation = 'down';
        }
    },

    setOrientation: function(orientation){
        this.orientation = orientation;
    },

    faceOrientation: function(){
        this.setFrame(this.restingFrames[this.orientation]);
    },
    
    tileByTilePreUpdate: function(tween,targets,startX,startY,endX,endY){
        if(!this.scene) return; // quick fix before the bug gets fixed in Phaser
        this.currentTweenTo = {x:endX,y:endY};

        this.computeOrientation(startX,startY,endX,endY);

        if(this.orientation != this.previousOrientation){
            this.previousOrientation = this.orientation;
            this.play(this.walkAnimPrefix+'_move_'+this.orientation);
        }

        if(this.isHero){
            var position = Engine.getMouseCoordinates(Engine.lastPointer);
            Engine.updateMarker(position.tile);
        }
    },

    tileByTilePostUpdate: function(){
        if(!this.scene) return; // quick fix before the bug gets fixed in Phaser

        var tx = Math.floor(this.x/Engine.tileWidth);
        var ty = Math.floor(this.y/Engine.tileHeight);
        this.updatePosition(tx,ty);

        this.leaveFootprint();

        if(this.flagForStop || (this.stopPos && this.stopPos.x == tx && this.stopPos.y == ty)){
            this.movement.stop();
            this.endMovement(); // TODO: have it called automatically by stop()
        }
    },

    teleport: function(x,y){
        this.setPosition(x,y);
    },

    getPFstart: function(){
        if(this.moving){
            return this.currentTweenTo;
        }else{
            return {
                x: this.tileX,
                y: this.tileY
            }
        }
    },

    serverStop: function(x,y){
        //console.log('SERVER STOP AT',x,y,'currently going to',this.currentTweenTo);
        var timeOffset = -1; // assume stop position in the past
        var stopIndex = -1;
        var currentIndex = -1;
        for(var i = 0; i < this.currentPath.length; i++){
            var px = this.currentPath[i][0];
            var py = this.currentPath[i][1];
            if(this.currentTweenTo && this.currentTweenTo.x == px && this.currentTweenTo.y == py) currentIndex = i;
            if(px == x && py == y) stopIndex = i;
            if(currentIndex > -1 && stopIndex > -1) break;
        }
        if(stopIndex == -1) console.warn('stop index not found');
        if(stopIndex == currentIndex) timeOffset = 0;
        if(stopIndex > currentIndex) timeOffset = 1;

        switch (timeOffset){
            case -1:
                var backtrack = this.currentPath.slice(stopIndex,currentIndex+1);
                backtrack.reverse();
                this.stop();
                this.queuePath(backtrack);
                break;
            case 0:
                this.stop();
                break;
            case 1:
                this.stopPos = {x:x,y:y};
                break;
        }

    },

    stop: function(){
        if(this.moving) this.flagForStop = true;
    },

    queuePath: function(path){
        if(this.moving){
            this.queuedPath = path;
        }else{
            this.move(path);
        }
    },

    endMovement: function(){
        if(!this.active) return; // quick fix
        this.moving = false;
        this.flagForStop = false;
        this.stopPos = null;
        this.previousOrientation = null;
        this.anims.stop();
        this.setFrame(this.restingFrames[this.orientation]);

        if(this.queuedPath){
            var _path = this.queuedPath.slice();
            this.queuedPath = null;
            this.move(_path);
        }
    },

    leaveFootprint: function(){
        var print = Engine.footprintsPool.getNext();
        print.setFrame(this.footprintsFrame);

        // Position
        var sx = this.previousPosition.x + Engine.tileWidth/2;
        var sy = this.previousPosition.y + Engine.tileHeight/2;
        if(this.printsVertOffset) sy += this.printsVertOffset;
        print.setPosition(sx,sy);

        // Angle
        var dx = this.tileX - this.previousPosition.tx;
        var dy = this.tileY - this.previousPosition.ty;

        var angle = 0; // clockwise rotations
        if(dx == 1 && dy == 0){ // went right
            angle = 90;
        }else if(dx == -1 && dy == 0){ // went left
            angle = -90
        }else if(dx == 0 && dy == 1){ // went down
            angle = 180;
        }
        print.angle = angle;

        //Flip
        print.flipX = this.flipPrint;
        this.flipPrint = !this.flipPrint;

        print.alpha = 0.7;
        print.depth = Engine.markerDepth;
        print.setVisible(true);

        Engine.scene.tweens.add({
            targets: print,
            alpha: 0,
            duration: 15000,
            onComplete: function(){
                print.recycle();
            }
        });
    }
});