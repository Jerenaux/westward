/**
 * Created by Jerome on 12-01-18.
 */
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

        this.minimap = minimap;
        this.setDepth(2);
        this.setScrollFactor(0);
        this.setVisible(false);
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

        var wcoord = (this.minimap ? 'radius' : 'width');
        var hcoord = (this.minimap ? 'radius' : 'height');

        // Used to make sur that the map won't be centered in a position that allows to see the edges
        this.minOrigin = {
            x: (this.viewRect[wcoord]/2)*(1/this.scaleX),
            y: (this.viewRect[hcoord]/2)*(1/this.scaleY),
            xOffset: 0
        };
        if(this.minimap) this.minOrigin.y *= 2; // quick fix
        this.maxOrigin =  {
            x: (World.worldWidth-this.viewRect[wcoord]/2)*(1/this.scaleX),
            y: (World.worldHeight-this.viewRect[hcoord]/2)*(1/this.scaleY),
            xOffset: 0
        };

        if(!this.minimap){
            this.minOrigin.xOffset = 70;
            this.maxOrigin.xOffset = -60;
        }

        this.toponyms = [];

        /*if(showToponyms) {
            Engine.settlementsData.forEach(function (s) {
                this.addText(s);
            }, this);
        }*/

        if(!this.minimap) {
            this.offZone = new Phaser.Geom.Rectangle(932,418,60,50);
            this.setInteractive(); // { pixelPerfect: true } // not needed anymore with rendertexture apparently
            this.on('pointerdown', this.handleClick.bind(this));
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
        if(this.offZone.contains(pointer.x,pointer.y)) return;
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

    addPin: function(x,y,name,frame,bg){
        var location = this.computeMapLocation(x,y);
        // console.log(x,y,location);
        var pin = this.getNextPin();
        pin.setUp(x,y,location.x,location.y,name,frame,bg);
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
        this.setScale(1);
        this.zoom();
        this.getZoomBtn('in').disable();
        this.getZoomBtn('out').enable();
    },

    zoomOut: function(){
        this.setScale(0.5);
        this.zoom();
        this.getZoomBtn('in').enable();
        this.getZoomBtn('out').disable();
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
        this.setDisplayOrigin(
            Utils.clamp(o.x,(this.minOrigin.x+this.minOrigin.xOffset)/(this.scaleX*2),this.maxOrigin.x+this.maxOrigin.xOffset),
            Utils.clamp(o.y,this.minOrigin.y/(this.scaleY*2),this.maxOrigin.y)
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
        function Pt(x,y){
            this.x = x;
            this.y = y;
            this.c = 1; // count
            this.nbors = [];
        }

        Pt.prototype.link = function(pt){
            this.nbors.push(pt);
        };

        Pt.prototype.unlink = function(pt){
            var idx = this.nbors.findIndex(function(e){
                return (e.x == pt.x && e.y == pt.y);
            });
            this.nbors.splice(idx,1);
        };

        Pt.prototype.equal = function(pt){
            if(pt === null) return false;
            return (this.x == pt.x && this.y == pt.y);
        };

        Pt.prototype.ts = function(){
            return "("+this.x+","+this.y+")";
        };

        Pt.prototype.debug = function(){
            console.log(this.ts(),"has",this.nbors.length,"neighbors and a count of",this.c);
        };

        function link(pts){ // link together all points in list
            for(var i = 0; i < pts.length; i++){
                for(var j = i; j < pts.length; j++){
                    var a = pts[i];
                    var b = pts[j];
                    var dx = Math.abs(a.x-b.x);
                    var dy = Math.abs(a.y-b.y);
                    if( dx ? !dy : dy ) { // xor, equivalent to avoiding diagonals
                        //console.log("Linking",a.ts(),"to",b.ts());
                        a.link(b);
                        b.link(a);
                    }
                }
            }
        }

        function unlink(pt){ // unlink a point from all its neighbors
            pt.nbors.forEach(function(nb){
                nb.unlink(pt);
            });
        }

        function lint(pts){ // remove side-by-side duplicate neighbors
            for(var i = pts.length-2; i >= 0; i--){
                if(i == pts.length-1) continue; // needed when there are 4 duplicates in a row
                if(pts[i].equal(pts[i+1])){
                    pts.splice(i+1,1);
                    pts.splice(i,1);
                }
            }
        }

        var aois = [341,389,390,391,438,439,440,490];
        var space = new SpaceMap();
        aois.forEach(function(aoi){
            var corners = Utils.getAOIcorners(aoi);
            var pts = [];
            corners.forEach(function(corner){
                var pt = space.get(corner.x,corner.y);
                if(pt){
                    pt.c++;
                }else{
                    pt = new Pt(corner.x,corner.y);
                    space.add(pt.x,pt.y,pt);
                }
                pts.push(pt);
            });
            link(pts);
        });

        /*space.toList().forEach(function(pt){
            pt.v.debug();
        });*/

        space.toList().forEach(function(entry){
            var pt = entry.v;
            if(pt.c%2 == 0){ // redundant points have the property of having even counts
                unlink(pt);
                link(pt.nbors);
                space.delete(pt.x,pt.y);
            }
        });

        var l = space.toList();
        l.forEach(function(entry){
            var pt = entry.v;
            lint(pt.nbors);
        });

        var s = space.getFirst();
        var path = [s];
        var i = 0;
        while(true){
            if(i > 10000) break; //TODO: remove
            var pt = path[0];
            var pv = null;
            if(path.length > 1) pv = path[1];
            var nt = null;
            for(var j = 0; j < pt.nbors.length; j++){ // Find next neighbor to travel to
                var nb = pt.nbors[j];
                if(!nb.equal(pv)){
                    nt = nb;
                    break;
                }
            }
            //if(nt === null) console.warn('no next for pt',pt.x,pt.y);
            if(nt.equal(s)) break;
            path.unshift(nt);
            i++;
        }

        console.warn(path);

        path = path.map(function(pt){
            return this.computeMapLocation(pt.x,pt.y);
        },this);

        console.warn(path);

        this.fow = UI.scene.add.polygon(0,0,path,0xffffff,1);
        this.fow.setOrigin(0);
        this.fow.setDepth(this.depth+1);
        this.fow.setScrollFactor(0);

        /*var gl = UI.scene.sys.game.renderer.gl;
        var renderer = UI.scene.sys.game.renderer;

        var modeIndex = renderer.addBlendMode([ gl.ZERO, gl.SRC_COLOR ], gl.FUNC_ADD);
        this.setBlendMode(modeIndex);*/

        // this.erase('tileset',500,500);


        //this.fow.setVisible(false);
        //this.setMask(new Phaser.Display.Masks.BitmapMask(UI.scene,this.fow));

        /*console.log(this);
        var msk = this.mask.bitmapMask;
        //this.fog = UI.scene.add.rectangle(this.x,this.y,msk.width,msk.height,0x000000,0.7);
        this.fog = UI.scene.add.render
        this.fog.setDepth(this.depth+2);
        this.fog.setScrollFactor(0);*/
    },

    display: function(){
        this.centerMap(Engine.player.getTilePosition());
        // this.setInputArea();
        this.positionToponyms();
        this.computeDragLimits();
        // if(!this.minimap) this.applyFogOfWar();

        this.displayPins();
        this.setVisible(true);
        if(!this.minimap) this.getZoomBtn('out').disable();
    },

    displayPins: function(){
        var tile = Engine.player.getTilePosition();
        this.positionCross = this.addPin(tile.x,tile.y,'Your position','x');
        Engine.player.buildingMarkers.forEach(function(data){
            this.addPin(data.x,data.y,
                Engine.buildingsData[data.type].name,
                'bld'
                // Engine.buildingsData[data.type].mapicon,
                // Engine.buildingsData[data.type].mapbg
            );
        },this);
        Engine.player.resourceMarkers.forEach(function(data){
            this.addPin(data[0],data[1],
                Engine.itemsData[data[2]].name,
                'herb'
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
        if(this.fog) this.fog.destroy();
    },

    hidePins: function(){
        this.resetCounter();
        this.pins.forEach(function(p){
            p.setVisible(false);
        });
    }
});

var Pin = new Phaser.Class({

    Extends: CustomSprite,
    // Extends: Phaser.GameObjects.RenderTexture,

    initialize: function Pin (map,mask) {
        CustomSprite.call(this, UI.scene, 0, 0, 'mapicons');
        // Phaser.GameObjects.RenderTexture.call(this, UI.scene, 0, 0, 16,16);
        // UI.scene.add.displayList.add(this);
        //UI.scene.add.updateList.add(this);

        this.setDepth(2);
        this.setScrollFactor(0);
        this.setVisible(false);
        this.setInteractive();
        /*if(mask) this.mask = (Boot.WEBGL
                ? new Phaser.Display.Masks.BitmapMask(UI.scene,mask)
                : new Phaser.Display.Masks.GeometryMask(UI.scene,mask)
        );*/
        this.parentMap = map;
        // this.setMask(this.parentMap.mask);
        //this.parentMap.container.add(this);
        this.on('pointerover',this.handleOver.bind(this));
        this.on('pointerout',this.handleOut.bind(this));
    },

    setUp: function(tileX,tileY,x,y,name,frame,bgframe){
        this.setOrigin(0.5);

        // Phaser 3.12:
        // var bg = bgframe ? 'bg'+bgframe : 'bg';
        // if(frame != 'x') this.drawFrame('mapicons',bg,0,0);

        // this.drawFrame('mapicons',frame,0,0);
        this.setFrame(frame);

        // Phaser 3.11:
        /*var icon = Engine.scene.add.sprite(0,0,'mapicons',frame);
        var bg = bgframe ? 'bg'+bgframe : 'bg';
        var bg = Engine.scene.add.sprite(0,0,'mapicons',bg);
        if(frame != 'x') this.draw(bg.texture,bg.frame,0,0);
        this.draw(icon.texture,icon.frame,0,0);*/

        this.tileX = tileX;
        this.tileY = tileY;
        this.setDepth(this.depth + this.tileY/1000); // /1000 to avoid appearing above tooltip
        this.setPosition(x,y);
        this.name = name;
        this.setVisibility();
    },

    setVisibility: function(){
        this.setVisible(this.parentMap.viewRect.contains(this.x,this.y));
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
        UI.tooltip.updateInfo(this.name);
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