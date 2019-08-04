/**
 * Created by Jerome on 12-01-18.
 */

var fowID = 0;

var Map = new Phaser.Class({

    // Extends: CustomSprite,
    Extends: Phaser.GameObjects.RenderTexture,

    /*
    * README:
    * - The point on the screen where the focus should be is stored in this.center (typically, center of screen)
    * - centerMap() changes the pivot of the map, and positions that pivot on this.center
    * - dragMap() repositions the elements of the map when it has moved (useful for follow behavior, even if actual drag by player is disabled)
    * */

    initialize: function Map(x, y, viewW, viewH, dragWidth, dragHeight, showToponyms, minimap) {
        // viewW is either a radius or a rect width; controls the size of area in which pins will appear
        // (it is dissociated from the mask size, which depends on the size of the image used for masking)
        
        // CustomSprite.call(this, UI.scene, x, y, 'worldmap');
        Phaser.GameObjects.RenderTexture.call(this, UI.scene, x, y, 3000, 2280);
        UI.scene.add.displayList.add(this);
        this.draw('worldmap');
        this.setOrigin(0.5);
        this.displayed = false;

        this.minimap = minimap;
        this.setDepth(2);
        this.setScrollFactor(0);
        this.setVisible(false);

        this.scales = [0.35, 0.5, 1];
        this.setScale(0.5);

        this.center = { // position of map sprite on screen
            x: x,
            y: y
        };
        // unmasked area on screen
        this.viewRect = (this.minimap ?
             new Phaser.Geom.Circle(this.x,this.y,viewW)
            :new Phaser.Geom.Rectangle(this.x-viewW/2,this.y-viewH/2,viewW,viewH)
            );
        // var wcoord = (this.minimap ? 'radius' : 'width');
        // var hcoord = (this.minimap ? 'radius' : 'height');

        this.toponyms = [];

        /*if(showToponyms) {
            Engine.settlementsData.forEach(function (s) {
                this.addText(s);
            }, this);
            }, this);
        }*/

        if(!this.minimap) {
            this.offZone = new Phaser.Geom.Rectangle(932,418,60,50);
            this.setInteractive(); // { pixelPerfect: true } // not needed anymore with rendertexture apparently
            this.on('pointerup', this.handleClick.bind(this));
        }
        /*UI.scene.input.setDraggable(this);
        this.dragWidth = (dragWidth > -1 ? dragWidth : 999999);
        this.dragHeight = (dragHeight > -1 ? dragHeight : 999999);
        this.draggedX = 0;
        this.draggedY = 0;

        this.on('drag',this.handleDrag.bind(this));
        */

        this.pins = [];
        this.resetCounter();
        this.clickedTile = null;
    },

    addMask: function(texture,shapeData){
        if(texture){
            var mask = UI.scene.add.sprite(this.x,this.y,texture);
            mask.setVisible(false);
            if(Boot.WEBGL){
                mask.setDepth(2);
                mask.setScrollFactor(0);
                this.setMask(new Phaser.Display.Masks.BitmapMask(UI.scene,mask));
            }else{ // Creates a rect shape based on mask texture
                var w = mask.frame.width;
                var h = mask.frame.height;
                shapeData = {
                    type: 'rect',
                    x: this.x-(w/2),
                    y: this.y-(h/2),
                    w: w,
                    h: h
                };
            }
        }

        if(shapeData){
            var shape = UI.scene.make.graphics();
            shape.fillStyle('#ffffff');

            switch(shapeData.type){
                case 'rect':
                    shape.fillRect(shapeData.x,shapeData.y,shapeData.w,shapeData.h);
                    break;
                case 'circle':
                    shape.fillCircle(shapeData.x, shapeData.y, shapeData.w/2);
                    break;
            }

            this.setMask(shape.createGeometryMask());
        }

        this.toponyms.forEach(function(toponym){
            toponym.setMask(this.mask);
        },this);
    },

    addText: function(settlement){
        var text = UI.scene.add.text(0, 0, settlement.name,{font: '60px treamd', fill: '#966f33', stroke: '#000000', strokeThickness: 3});
        text.tx = settlement.x;
        text.ty = settlement.y;
        text.setDepth(3);
        text.setVisible(false);
        text.setScrollFactor(0,0);
        text.setAlpha(0.5);
        text.setOrigin(0.5);
        this.toponyms.push(text);
    },

    handleDrag: function(pointer,x,y){
        if(x < this.minX) return;
        if(x > this.maxX) return;
        if(y < this.minY) return;
        if(y > this.maxY) return;
        var dx = this.x - x;
        var dy = this.y - y;
        this.x = x;
        this.y = y;
        this.dragMap(dx,dy,false);
    },

    focus: function(x,y){
        var ox = this.displayOriginX;
        var oy = this.displayOriginY;
        this.centerMap({x:x/2,y:y/2});
        var dx = this.displayOriginX - ox;
        var dy = this.displayOriginY - oy;
        this.dragMap(dx*this.scaleX,dy*this.scaleY,false);
    },

    follow: function(){
        var pos = Engine.player.getTilePosition();
        var ox = this.displayOriginX;
        var oy = this.displayOriginY;
        this.centerMap(pos);
        // if(this.positionCross) this.positionCross.setPosition(this.center.x,this.center.y);
        if(this.positionCross){
            var loc = this.computeMapLocation(pos.x,pos.y);
            this.positionCross.setPosition(loc.x,loc.y);
        }
        var dx = this.displayOriginX - ox;
        var dy = this.displayOriginY - oy;
        this.dragMap(dx*this.scaleX,dy*this.scaleY,false);
    },

    dragMap: function(dx,dy,tween){ // x and y are destination coordinates
        // Used to keep track of the current center of the map
        this.draggedX += dx;
        this.draggedY += dy;

        if(tween){
            var targets = this.displayedPins.concat([this.text,this]).concat(this.toponyms);
            var duration = 300;
            UI.scene.tweens.add({
                    targets: targets,
                    x: '-='+dx,
                    y: '-='+dy,
                    duration: duration
                });
            /*UI.scene.tweens.add({
                targets: this.input.hitArea,
                x: '+='+dx,
                y: '+='+dy,
                duration: duration
            });*/
        }else {
            // this.input.hitArea.x += dx;
            // this.input.hitArea.y += dy;
            if(this.fow){
                this.fow.x -= dx;
                this.fow.y -= dy;
            }
            this.moveTexts(dx,dy);
            this.movePins(dx, dy);
        }
    },

    movePins: function(dx,dy){
        this.displayedPins.forEach(function(p){
            p.x -= dx;
            p.y -= dy;
            p.setVisibility();
        });
    },

    moveTexts: function(dx,dy){
        this.toponyms.forEach(function(p){
            p.x -= dx;
            p.y -= dy;
        });
    },

    handleClick: function(pointer,x,y){
        if(this.offZone.contains(pointer.downX,pointer.downY)) return;
        if(!this.viewRect.contains(pointer.downX,pointer.downY)) return;
        this.focus(x,y);
    },

    getNextPin: function(){
        if(this.pinsCounter >= this.pins.length) this.pins.push(new Pin(this));
        return this.pins[this.pinsCounter++];
    },

    // Maps a tile coordinate to px coordinate on the map
    computeMapLocation: function(tx,ty){
        var dx = (tx*2 - this.displayOriginX)*this.scaleX;
        var dy = (ty*2 - this.displayOriginY)*this.scaleY;
        return {
            x: this.x + dx,
            y: this.y + dy
        };
    },

    addPin: function(x,y,name,frame,alwaysOn){
        var location = this.computeMapLocation(x,y);
        var pin = this.getNextPin();
        pin.setUp(x,y,location.x,location.y,name,frame,alwaysOn);
        this.displayedPins.push(pin);
        return pin;
    },

    resetCounter: function(){
        this.pinsCounter = 0;
        this.displayedPins = [];
    },

    getZoomBtn: function(mode){
        var btnID = (mode == 'in' ? 1 : 2);
        return this.panel.buttons[btnID].btn;
    },

    zoomIn: function(){
        var idx  = Utils.clamp(this.scales.indexOf(this.scaleX)+1,0,this.scales.length-1);
        var newscale = this.scales[idx];
        this.setScale(newscale);
        this.zoom();
        if(idx == this.scales.length-1) this.getZoomBtn('in').disable();
        if(idx > 0) this.getZoomBtn('out').enable();
    },

    zoomOut: function(){
        var idx  = Utils.clamp(this.scales.indexOf(this.scaleX)-1,0,this.scales.length-1);
        var newscale = this.scales[idx];        
        this.setScale(newscale);
        this.zoom();
        if(idx < this.scales.length-1) this.getZoomBtn('in').enable();
        if(idx == 0) this.getZoomBtn('out').disable();
    },

    zoom: function(){
        this.centerMap(); // center on current center ; must be called before positioning pins
        this.displayedPins.forEach(function(pin){
            pin.reposition();
        });
        this.positionToponyms();
        // this.computeDragLimits();
    },

    positionToponyms: function(){
        this.toponyms.forEach(function(t){
            var location = this.computeMapLocation(t.tx,t.ty);
            t.setPosition(location.x,location.y);
            t.setVisible(true);
        },this);
    },

    centerMap: function(tile){ // Adjusts the anchor, then position it in the center of the screen
        // tile is world coordinates, not map px ; if tile is undefined, then it means recenter on whatever current center (used when zooming)
        var o = {
            x: tile ? tile.x * 2 : this.displayOriginX,
            y: tile ? tile.y * 2 : this.displayOriginY
        };
        var xSpan = (this.minimap ? 250 : 500)/this.scaleX;
        var ySpan = (this.minimap ? 70 : 270)/this.scaleY; // 190
        this.setDisplayOrigin(
            Utils.clamp(
                o.x,
                xSpan,
                this.width - xSpan
            ),
            Utils.clamp(
                o.y,
                ySpan,
                this.height - ySpan
            )
        );
        this.setPosition(this.center.x,this.center.y);
    },

    setInputArea: function(){
        if(!this.minimap) return; // disabled for simplicity, it's ok if we can drag the map from outside of the scroll...
        // TODO: remove draggedX,Y once enable re-centering upon zoom?
        var rectx = this.displayOriginX + this.draggedX -(this.viewRect.width/2);
        var recty = this.displayOriginY + this.draggedY -(this.viewRect.height/2);
        this.input.hitArea = new Phaser.Geom.Rectangle(rectx,recty,this.viewRect.width,this.viewRect.height);
    },

    computeDragLimits: function(){
        this.minY = this.y - (this.height-this.displayOriginY)/(1/this.scaleY) + this.viewRect.height/2;
        this.maxY = this.y + this.displayOriginY/(1/this.scaleY) - this.viewRect.height/2;
        this.minX = this.x - (this.width-this.displayOriginX)/(1/this.scaleX) + this.viewRect.width/2;
        this.maxX = this.x + this.displayOriginX/(1/this.scaleX) - this.viewRect.width/2;

        this.minX = Math.max(this.minX,this.x-this.dragWidth);
        this.minY = Math.max(this.minY,this.y-this.dragHeight);
        this.maxX = Math.min(this.maxX,this.x+this.dragWidth);
        this.maxY = Math.min(this.maxY,this.y+this.dragHeight);
    },

    applyFogOfWar: function(){
        // Maps rects to one single flat list of top-left and bottom-right coordinates,
        // for use by the shader
        var rects = [];
        Engine.player.FoW.forEach(function(rect){
            rects.push(rect.x/(this.width*this.scaleX));
            rects.push(rect.y/(this.height*this.scaleY));
            rects.push((rect.x+rect.width)/(this.width*this.scaleX));
            rects.push((rect.y+rect.height)/(this.height*this.scaleY));
        },this);

        var game = Engine.getGameInstance();
        var customPipeline = game.renderer.addPipeline('FoW'+fowID, new FoWPipeline(game,rects.length));
        customPipeline.setFloat1v('rects', rects);

        this.setPipeline('FoW'+fowID++); // ugly hack

        // Compute where to display polygon on screen, based on map location on screen
        /*path = path.map(function(pt){
            return this.computeMapLocation(pt.x,pt.y);
        },this);*/

        // console.warn(path);

        /*this.fow = UI.scene.add.polygon(0,0,path,0xffffff,1);
        this.fow.setOrigin(0);
        this.fow.setDepth(this.depth+1);
        this.fow.setScrollFactor(0);*/
    },

    display: function(){
        if(!this.minimap && this.scaleX > 0.5) this.zoomOut();
        if(!this.minimap && this.scaleX < 0.5) this.zoomIn();
        this.centerMap(Engine.player.getTilePosition());
        // this.setInputArea();
        this.positionToponyms();
        this.computeDragLimits();
        if(!this.minimap) this.applyFogOfWar();

        this.displayPins();
        this.setVisible(true);
        this.displayed = true;
        // if(!this.minimap) this.getZoomBtn('out').disable();
    },

    displayPins: function(){
        var tile = Engine.player.getTilePosition();
        this.positionCross = this.addPin(tile.x,tile.y,'Your position','x');
        Engine.player.buildingMarkers.forEach(function(data){
            this.addPin(data.x,data.y,
                Engine.buildingsData[data.type].name,
                (data.owner == Engine.player.id ? 'bld2own' : 'bld2')
            );
        },this);
        Engine.player.resourceMarkers.forEach(function(data){
            this.addPin(data[0],data[1],
                Engine.itemsData[data[2]].name,
                'herb',
                false
            );
        },this);
        Engine.player.animalMarkers.forEach(function(data){
            this.addPin(data[0],data[1],
                Engine.animalsData[data[2]].map_name,
                'wolf',
                false
            );
        },this);
        Engine.player.deathMarkers.forEach(function(data){
            this.addPin(data[0],data[1],
                'Death',
                'skull',
                true
            );
        },this);
        Engine.player.conflictMarkers.forEach(function(data){
            this.addPin(data[0],data[1],
                'Battle',
                'swords',
                true
            );
        },this);
    },

    updatePins: function(){
        this.hidePins();
        this.displayPins();
    },

    hide: function(){
        this.hidePins();
        this.toponyms.forEach(function(t){
            t.setVisible(false);
        });
        this.setVisible(false);
        if(this.fow) this.fow.destroy();
        this.displayed = false;
    },

    hidePins: function(){
        this.displayedPins.forEach(function(p){
            p.setVisible(false);
        });
        this.resetCounter();
    }
});

var Pin = new Phaser.Class({

    Extends: CustomSprite,

    initialize: function Pin (map) {
        CustomSprite.call(this, UI.scene, 0, 0, 'mapicons');
        this.setDepth(2);
        this.setScrollFactor(0);
        this.setVisible(false);
        this.setInteractive();
        this.parentMap = map;
        this.on('pointerover',this.handleOver.bind(this));
        this.on('pointerout',this.handleOut.bind(this));
    },

    setUp: function(tileX,tileY,x,y,name,frame,alwaysOn){
        this.setOrigin(0.5);
        this.setFrame(frame);
        this.alwaysOn = alwaysOn;

        this.tileX = tileX;
        this.tileY = tileY;
        this.setDepth(this.depth + this.tileY/1000); // /1000 to avoid appearing above tooltip
        this.setPosition(x,y);
        this.name = name;
        this.setVisibility();
    },

    setVisibility: function(){
        // If on minimap, display straight away if within rect; if in big map, display only if not within FoW
        if(this.parentMap.viewRect.contains(this.x,this.y)){
            if(this.parentMap.minimap){
                this.setVisible(true);
            }else{
                if(this.alwaysOn) this.setVisible(true);
                for(var i = 0; i < Engine.player.FoW.length; i++){
                    var rect = Engine.player.FoW[i];
                    var rect_ = new Phaser.Geom.Rectangle(
                        rect.x - 10,
                        rect.y - 10,
                        rect.width + 20,
                        rect.height + 20
                    ); // Hack not to miss markers on fringes of fog
                    if(rect_.contains(this.tileX,this.tileY)){
                        this.setVisible(true);
                        return;
                    }
                }
                this.setVisible(false);
            }
        }else{
            this.setVisible(false);
        }
    },

    highlight: function(){
        //this.setTexture('redpin');
    },

    unhighlight: function(){
        //this.setTexture('pin');
    },

    focus: function(){
        this.parentMap.focus(this.x,this.y);
    },

    reposition: function(){
        var location = this.parentMap.computeMapLocation(this.tileX,this.tileY);
        this.setPosition(location.x,location.y);
        this.setVisibility();
    },

    handleOver: function(){
        if(!this.parentMap.viewRect.contains(this.x,this.y)) return;
        UI.tooltip.updateInfo('free',{title:this.name});
        UI.tooltip.display();
        console.log(this.tileX,this.tileY);
    },

    handleOut: function(){
        UI.tooltip.hide();
    },

    hide: function(){
        this.setVisible(false);
    }
});
