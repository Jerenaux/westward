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

        this.bubbleOffsetX = 55;
        this.bubbleOffsetY = 75;
        this.bubble = new Bubble(0,0);
    },

    update: function(data){
        var callbacks = {
            'animation': Engine.handleBattleAnimation,
            'bomb_atk': this.processBombThrow,
            'chat': this.talk,
            'hit': this.handleHit, // for HP display and blink
            'melee_atk': this.processMeleeAttack, // for character animation
            'ranged_atk': this.processRangedAttack, // for character animation
            'rangedMiss': this.handleMiss,
            'stop': this.serverStop
        };

        for(var field in callbacks){
            if(!callbacks.hasOwnProperty(field)) continue;
            if(field in data) callbacks[field].call(this,data[field]);
        }
    },

    // Sets position regardless of previous position; primarily called by children.setUp()
    setPosition: function(x,y){ // x and y are tile coordinates
        Phaser.GameObjects.Components.Transform.setPosition.call(this,x*Engine.tileWidth,y*Engine.tileHeight);
        this.setTilePosition(x,y);
        this.updatePosition(x,y);
    },

    // Updates the position; primarily called as the entity moves around and has moved by at least 1 tile
    updatePosition: function(x,y){ // x and y are tile cordinates
        this.updatePreviousPosition();
        this.setTilePosition(x,y);
        this.updateDepth();
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
        //this.setDepth(Engine.playersDepth + this.tileY / 1000);
        this.setDepth(this.tileY+1.6); // 1.6 to be greatet than Item's 1.5
    },

    manageOrientationPin: function(){
        if(this.isHero) return;
        if(!this.orientationPin) return;

        if(this.dead) {
            this.orientationPin.hide();
            return;
        }

        var c = this.getCenter();
        if(Engine.isInView(c.x,c.y)) {
            this.orientationPin.hide();
        }else{
            this.orientationPin.update(this.tileX,this.tileY);
            this.orientationPin.display();
        }
    },

    move: function(path){
        //if(this.isHero) console.log('move from (',path[0][0],',',path[0][1],') to (',path[path.length-1][0],',',path[path.length-1][1],')');
        if(!path || path.length <= 1) {
            this.endMovement();
            return;
        }
        //if(this.isActiveFighter) BattleManager.deactivateCell();
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
        if(this.bubble) this.updateBubblePosition();
    },

    updateBubblePosition: function(){
        this.bubble.updatePosition(this.x-this.bubbleOffsetX,this.y-this.bubbleOffsetY,this.depth);
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

    faceOrientation: function(){
        this.setFrame(this.restingFrames[this.orientation]);
    },
    
    tileByTilePreUpdate: function(tween,targets,startX,startY,endX,endY){
        if(!this.scene) return; // quick fix before the bug gets fixed in Phaser
        //if(this.isHero) console.warn('pre-start');
        this.currentTweenTo = {x:endX,y:endY};

        this.computeOrientation(startX,startY,endX,endY);

        if(this.orientation != this.previousOrientation) {
            this.previousOrientation = this.orientation;
            this.play(this.animPrefix + '_move_' + this.orientation);
            if(this.hollowed) this.hollow();
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

        //if(this.isActiveFighter) Engine.updateGrid();

        if(Engine.overlay.get(tx,ty)){
            this.hollow();
        }else{
            this.unhollow();
        }
        this.leaveFootprint();
        this.playSound();
        if(this.isHero){
            Engine.updateAllOrientationPins();
            if(Engine.miniMap) Engine.miniMap.follow();
        }else{
            this.manageOrientationPin();
        }

        if(this.flagForStop || (this.stopPos && this.stopPos.x == tx && this.stopPos.y == ty)){
            this.movement.stop();
            this.endMovement(); // TODO: have it called automatically by stop()
        }
    },

    teleport: function(x,y){
        this.setPosition(x,y);
        if(this.isHero) Engine.miniMap.follow();
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

    selfStop: function(){
        console.log('self stopping');
        if(this.currentPath.length < 2) return;
        this.queuePath([this.currentPath[1]]);
    },

    serverStop: function(data){ //one argument because called from updates() metods
        var x = data.x;
        var y = data.y;
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
        if(this.dead) return;
        this.moving = false;
        this.flagForStop = false;
        this.stopPos = null;
        this.previousOrientation = null;
        this.anims.stop();
        this.setFrame(this.restingFrames[this.orientation]);

        if(this.isHero && Client.tutorial){
            TutorialManager.triggerHook('move');
            TutorialManager.checkHook();
        }

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
        if(this.printsHorizOffset) sx += this.printsHorizOffset;
        print.setPosition(sx,sy);

        // Angle
        var angles = {
            'up': 0,
            'down': 180,
            'left': -90,
            'right': 90
        };
        var angle = angles[this.orientation];
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

    },

    playSound: function(){
        Engine.playLocalizedSound('footsteps',2,{x:this.tileX,y:this.tileY});
    },

    talk: function(text){
        //if(this.isHero) return;
        this.updateBubblePosition();
        this.bubble.update(text);
        this.bubble.display();
        Engine.scene.sound.add('speech').play();
    },

    getHPposition: function(){
        return {
            x: this.x+(this.cellsWidth*32)/2,
            y: this.y+(this.cellsHeight*32)/2
        }
    },

   handleHit: function(data){
        var pos = this.getHPposition();
        Engine.displayHit(this,pos.x,pos.y,20,40,data.dmg,false,data.delay);
   },

    handleMiss: function(data){
        var pos = this.getHPposition();
        Engine.displayHit(this,pos.x,pos.y,20,40,null,true,data.delay);
    },

    handleOver: function(){
    },

    handleOut: function(){
    },

    isDisabled: function(){
        return !!this.dead;
    },

    getRect: function(){
        return {
            x: this.tileX,
            y: this.tileY,
            w: this.cellsWidth,
            h: this.cellsHeight
        }
    },

    getCenter: function(){ // returns center in tiles
        return {
            x: this.tileX + this.cellsWidth/2,//Math.floor(this.tileX + this.cellsWidth/2),
            y: this.tileY + this.cellsHeight/2//Math.floor(this.tileY + this.cellsHeight/2)
        };
    },

    isDead: function(){
        return this.dead;
    }
});