/**
 * Created by Jerome on 26-06-17.
 */
var Engine = {
    baseViewWidth: 32,
    baseViewHeight: 18,
    tileWidth: 32,
    tileHeight: 32
};

Engine.camera = {
    x: 0,
    y: 0,
    getPixelX: function(){
        return Engine.camera.x*Engine.tileWidth;
    },
    getPixelY: function(){
        return Engine.camera.y*Engine.tileHeight;
    }
};

Engine.boot = function(){
    /*TODO:
    * Procedural world:
    - Fix rivers
    - Forests
    - Dirt
    * Network
    - Two repositories, for production and development, with node scripts taking care
    of copying what is needed from one to the other (+ uglifying and compressing etc.)
    -> Possible to programmatically push?  http://radek.io/2015/10/27/nodegit/
    - Somehow remove/disable debug components automatically
    - Desktop app a simple terminal that gets everything from server (= exact same
    appearance and behaviour, reduced code visibility, and possibly *no* node-modules)
    - Scripts to group what is needed for the app, ugligy/compress and build
    - In any case, migrate Geometry to server to hide it
    * History & design document
    -----
    * Tools:
    - Load more chunks upon zoom
    - Top-down visibility optimization (create a lookup table of transparency)
    - Prune map files more
    - Testing (make part of the pipeline)
    */

    Engine.renderer = PIXI.autoDetectRenderer(
        Engine.baseViewWidth*Engine.tileWidth,
        Engine.baseViewHeight*Engine.tileHeight,
        {
            antialias: false,
            view: document.getElementById('game'),
            preserveDrawingBuffer: true // to allow image captures from canvas
        }
    );
    Engine.viewWidth = Engine.baseViewWidth;
    Engine.viewHeight = Engine.baseViewHeight;

    //Engine.setAction('move');
    Engine.setAction('addLake');
    Engine.showGrid = Utils.getPreference('showGrid',false);
    Engine.showHero = Utils.getPreference('showHero',true);
    Engine.showHulls = Utils.getPreference('showHulls',false);
    Engine.selectionEnabled = Utils.getPreference('selectionEnabled',false);
    Engine.debug = true;
    Engine.zoomScale = 1;

    Engine.chunks = {}; // holds references to the Containers containing the chunks
    Engine.displayedChunks = [];
    Engine.mapDataCache = {};

    Engine.computeStageLocation();

    Engine.stage = new PIXI.Container();
    Engine.blackBoard = new PIXI.Container(); // Stores all the graphics objects used for debugging (hulls, points...)
    Engine.blackBoard.z = 999;
    Engine.blackBoard.visible = Engine.showHulls;
    Engine.stage.addChild(Engine.blackBoard);
    Engine.editHistory = [];

    Engine.drawSelection();
    Engine.renderer.view.addEventListener('mousedown', Engine.handleClick, false);
    if(Engine.debug) {
        Engine.renderer.view.addEventListener('mouseup', Engine.handleMouseUp, false);
        Engine.renderer.view.addEventListener('mousemove', Engine.trackPosition, false);
    }

    Engine.mapDataLocation = 'assets/maps/chunks';
    Engine.loadJSON(Engine.mapDataLocation+'/master.json',Engine.readMaster);
};

Engine.drawSelection = function(){
    Engine.selection = new PIXI.Graphics();
    Engine.selection.lineStyle(2, 0xffffff, 1);
    Engine.selection.drawRect(0,0,0,0);
    Engine.selection.z = 999;
    Engine.selection.visible = false;
    Engine.stage.addChild(Engine.selection);
};

Engine.computeStageLocation = function(){
    Engine.location = {};
    Engine.location.offsetX = 0;
    Engine.location.offsetY = 0;
    var element = Engine.renderer.view;
    if (element.offsetParent !== undefined) {
        do {
            Engine.location.offsetX += element.offsetLeft;
            Engine.location.offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }
    var stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(Engine.renderer.view, null)['paddingLeft'], 10)      || 0;
    var stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(Engine.renderer.view, null)['paddingTop'], 10)       || 0;
    var styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(Engine.renderer.view, null)['borderLeftWidth'], 10)  || 0;
    var styleBorderTop   = parseInt(document.defaultView.getComputedStyle(Engine.renderer.view, null)['borderTopWidth'], 10)   || 0;
    var html = document.body.parentNode;
    Engine.location.offsetX += stylePaddingLeft +  styleBorderLeft + html.offsetLeft;
    Engine.location.offsetY += stylePaddingTop +  styleBorderTop + html.offsetTop;
};

Engine.readMaster = function(masterData){
    Engine.tileWidth = masterData.tilesets[0].tilewidth;
    Engine.tileHeight = masterData.tilesets[0].tileheight;
    Engine.chunkWidth = masterData.chunkWidth;
    Engine.chunkHeight = masterData.chunkHeight;
    Engine.nbChunksHorizontal = masterData.nbChunksHoriz;
    Engine.nbChunksVertical = masterData.nbChunksVert;
    Engine.worldWidth = Engine.nbChunksHorizontal*Engine.chunkWidth;
    Engine.worldHeight = Engine.nbChunksVertical*Engine.chunkHeight;
    Engine.lastChunkID = (Engine.nbChunksHorizontal*Engine.nbChunksVertical)-1;
    Engine.nbLayers = masterData.nbLayers;
    console.log('Master file read, setting up world of size '+Engine.worldWidth+' x '+Engine.worldHeight+' with '+Engine.nbLayers+' layers');
    Engine.tilesets = masterData.tilesets;

    PIXI.loader.add('hero','assets/sprites/hero.png');

    for(var i = 0; i < masterData.tilesets.length; i++){
        var tileset = masterData.tilesets[i];
        var path = 'assets/'+tileset.image.slice(2);// The paths in the master file are relative to the assets/maps directory
        PIXI.loader.add(tileset.name,path);
    }

    Engine.tilesetMap = {}; // maps tiles to tilesets;

    PIXI.loader.load(Engine.start);
};

Engine.loadJSON = function(path,callback,info){
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(JSON.parse(xobj.responseText),info);
        }
    };
    xobj.send(null);
};

Engine.start = function(loader, resources){
    Engine.resources = resources;
    Engine.addHero();
    requestAnimationFrame(Engine.update);
};

Engine.addHero = function(){
    startx = 71; //35
    starty = 22;//30;
    Engine.player = Engine.addSprite('hero',startx,starty);
    Engine.player.visible = Engine.showHero;
    Engine.player.chunk = Utils.tileToAOI({x:startx,y:starty});
    Engine.updateEnvironment();
    Engine.updateCamera();
};

Engine.addSprite = function(key,x,y){
    var sprite = new PIXI.Sprite(Engine.resources[key].texture);
    Engine.setPosition(sprite,x,y);
    sprite.z = 2;
    Engine.addToStage(sprite);
    return sprite;
};

Engine.addToStage = function(sprite){
    Engine.stage.addChild(sprite);
    Engine.orderStage();
};

Engine.orderStage = function(){
    Engine.stage.children.sort(function(a,b){
        return a.z > b.z;
    });
};

Engine.displayChunk = function(id){
    if(Engine.mapDataCache[id]){
        // Chunks are deleted and redrawn rather than having their visibility toggled on/off, to avoid accumulating in memory
        Engine.drawChunk(Engine.mapDataCache[id],id);
    }else {
        Engine.loadJSON(Engine.mapDataLocation+'/chunk' + id + '.json', Engine.drawChunk, id);
    }
};

Engine.displayMap = function(path){
    Engine.loadJSON(path,Engine.makeMap);
};

Engine.drawChunk = function(mapData,id){
    var chunk = new Chunk(mapData,1);
    chunk.id = id;
    Engine.chunks[chunk.id] = chunk;
    if(!Engine.mapDataCache[chunk.id]) Engine.mapDataCache[chunk.id] = mapData;
    chunk.drawLayers();
    Engine.displayedChunks.push(chunk.id);
    if(Engine.showGrid) Engine.drawGrid(chunk);
    Engine.addToStage(chunk);
};

Engine.toggleSelection = function(){
    Engine.selectionEnabled = !Engine.selectionEnabled;
    if(Engine.selectionEnabled){
        Engine.renderer.view.style.cursor = 'crosshair';
    }else{
        Engine.renderer.view.style.cursor = 'default';
    }
};

Engine.toggleHulls= function(){
    Engine.showHulls = !Engine.showHulls;
    Engine.blackBoard.visible = Engine.showHulls;
    localStorage.setItem('showHulls',Engine.showHulls);
};

Engine.toggleGrid = function(){
    Engine.showGrid = !Engine.showGrid;
    localStorage.setItem('showGrid',Engine.showGrid);
    for(var i = 0; i < Engine.displayedChunks.length; i++){
        var chunk = Engine.chunks[Engine.displayedChunks[i]];
        if(Engine.showGrid){
            Engine.drawGrid(chunk);
        }else{
            Engine.removeGrid(chunk);
        }
    }
};

Engine.toggleHero = function() {
    Engine.showHero = !Engine.showHero;
    localStorage.setItem('showHero',Engine.showHero);
    Engine.player.visible = Engine.showHero;
};

Engine.drawGrid = function(chunk){
    if(chunk.grid === undefined) {
        var gr = new PIXI.Graphics();
        var origin = Utils.AOItoTile(chunk.id);
        gr.lineStyle(10, 0xffffff, 1);
        gr.drawRect(origin.x * Engine.tileWidth, origin.y * Engine.tileHeight, Engine.chunkWidth * Engine.tileWidth, Engine.chunkHeight * Engine.tileHeight);
        gr.z = 999;
        chunk.addChild(gr);
        chunk.grid = gr;
    }else{
        chunk.grid.visible = true;
    }
};

Engine.removeGrid = function(chunk){
    chunk.grid.visible = false;
};

Engine.getTilesetFromTile = function(tile){
    if(Engine.tilesetMap.hasOwnProperty(tile)) return Engine.tilesetMap[tile];
    for(var i = 0; i < Engine.tilesets.length; i++){
        if(tile < Engine.tilesets[i].firstgid){
            Engine.tilesetMap[tile] = i-1;
            return i-1;
        }
    }
    return Engine.tilesets.length-1;
};

/*Engine.addTile = function(x,y,tile,chunk,layer){
    if(x < 0 || y < 0) return;
    var chunk = chunk || Engine.chunks[Utils.tileToAOI({x:x,y:y})];
    if(chunk === undefined) return;
    var tilesetID = Engine.getTilesetFromTile(tile);
    var tileset = Engine.tilesets[tilesetID];
    tile -= tileset.firstgid;
    var wdth = Math.floor(tileset.imagewidth/Engine.tileWidth);
    var tx = tile%wdth;
    var ty = Math.floor(tile/wdth);
    var texture = new PIXI.Texture(Engine.resources[tileset.name].texture, new PIXI.Rectangle(tx*Engine.tileWidth, ty*Engine.tileHeight, Engine.tileWidth, Engine.tileHeight));
    var sprite = new PIXI.Sprite(texture);
    // save some properties inside the object:
    if(layer) chunk.layers[layer].add(x,y,tile);
    sprite.tile = tile;
    sprite.layer = layer;
    sprite.tileX = x;
    sprite.tileY = y;
    sprite.position.set(x*Engine.tileWidth,y*Engine.tileHeight);
    chunk.addChild(sprite);
};*/

Engine.removeChunk = function(id){
    Engine.stage.removeChild(Engine.chunks[id]);
    Engine.displayedChunks.splice(Engine.displayedChunks.indexOf(id),1);
};

Engine.update = function(){
    Engine.renderer.render(Engine.stage);
    requestAnimationFrame(Engine.update);
    document.getElementById('visible').innerHTML = Engine.displayedChunks.length;
    //console.log(Engine.stage.children.length+' children');
};

Engine.zoom = function(coef){
    var increment;
    if(coef == -1){
        if(Engine.zoomScale > 0.25) {
            increment = 0.25;
        }else{
            increment = 0.15;
        }
    }else if (coef == 1){
        if(Engine.zoomScale >= 0.25) {
            increment = 0.25;
        }else{
            increment = 0.15;
        }
    }

    Engine.zoomScale += increment * coef;
    Engine.stage.scale.x = Engine.zoomScale;
    Engine.stage.scale.y = Engine.zoomScale;
    Engine.viewWidth = Math.floor(Engine.baseViewWidth*(1/Engine.zoomScale));
    Engine.viewHeight = Math.floor(Engine.baseViewHeight*(1/Engine.zoomScale));
    Engine.updateCamera();
    Engine.updateEnvironment();
    document.getElementById('zx').innerHTML = Engine.stage.scale.x;
    document.getElementById('zy').innerHTML = Engine.stage.scale.y;
};

Engine.updateSelection = function(x,y,wx,hy){
    if(x !== null) Engine.selection.graphicsData[0].shape.x = x;
    if(y!== null) Engine.selection.graphicsData[0].shape.y = y;
    if(wx !== null) Engine.selection.graphicsData[0].shape.width = wx - Engine.selection.graphicsData[0].shape.x;
    if(hy !== null) Engine.selection.graphicsData[0].shape.height = hy - Engine.selection.graphicsData[0].shape.y;
    Engine.selection.dirty++;
    Engine.selection.clearDirty++;
};

Engine.resetSelection = function(){
    Engine.capture(
        Engine.selection.graphicsData[0].shape.x*Engine.zoomScale,
        Engine.selection.graphicsData[0].shape.y*Engine.zoomScale,
        Engine.selection.graphicsData[0].shape.width*Engine.zoomScale,
        Engine.selection.graphicsData[0].shape.height*Engine.zoomScale
    );
    Engine.selection.graphicsData[0].shape.width = 0;
    Engine.selection.graphicsData[0].shape.height = 0;
    Engine.selection.visible = false;
};

Engine.capture = function(x,y,w,h){
    x -= Engine.camera.getPixelX();
    y -= Engine.camera.getPixelY();
    var patternCanvas=document.createElement("canvas");
    patternCanvas.width = w;
    patternCanvas.height = h;
    var patternCtx = patternCanvas.getContext("2d");
    patternCtx.drawImage(Engine.renderer.view,x,y,w,h,0,0,w,h);

    var capture = document.createElement("img");
    capture.src = patternCanvas.toDataURL("image/png");
    document.getElementById("captures").appendChild(capture);
};

Engine.updateCamera = function(){
    Engine.camera.x = Engine.player.tilePosition.x - Math.floor(Engine.viewWidth*0.5);
    Engine.camera.y = Engine.player.tilePosition.y - Math.floor(Engine.viewHeight*0.5);
    // Clamp in tile units
    Engine.camera.x = clamp(Engine.camera.x,0,Engine.worldWidth-Engine.viewWidth);
    Engine.camera.y = clamp(Engine.camera.y,0,Engine.worldHeight-Engine.viewHeight);
    Engine.stage.pivot.set(Engine.camera.x*Engine.tileWidth,Engine.camera.y*Engine.tileHeight);
    document.getElementById('cx').innerHTML = Engine.camera.x;
    document.getElementById('cy').innerHTML = Engine.camera.y;
};

Engine.updateEnvironment = function(){
    var chunks = Utils.listVisibleAOIs(Engine.player.chunk);
    var newChunks = chunks.diff(Engine.displayedChunks);
    var oldChunks = Engine.displayedChunks.diff(chunks);

    if(!Engine.debug) {
        for (var i = 0; i < oldChunks.length; i++) {
            //console.log('removing '+oldChunks[i]);
            Engine.removeChunk(oldChunks[i]);
        }
    }

    for(var j = 0; j < newChunks.length; j++){
        //console.log('adding '+newChunks[j]);
        Engine.displayChunk(newChunks[j]);
    }
};

Engine.move = function(x,y){
    Engine.setPosition(Engine.player,x,y);
    Engine.player.chunk = Utils.tileToAOI(Engine.player.tilePosition);
    if(Engine.player.chunk != Engine.player.previousChunk) Engine.updateEnvironment();
    Engine.player.previousChunk = Engine.player.chunk;
    Engine.updateCamera();
};

Engine.setPosition = function(sprite,x,y){
    sprite.position.set(x*Engine.tileWidth,y*Engine.tileHeight);
    if(sprite.tilePosition){
        sprite.tilePosition.set(x,y);
    }else {
        sprite.tilePosition = new PIXI.Point(x, y);
    }
};

Engine.setAction = function(action){
    if(Engine.selectionEnabled) Engine.toggleSelection();
    Engine.clickAction = action;
    document.getElementById('action').innerHTML = action;
};

Engine.getCanvasCoordinates = function(e){
    var x = e.pageX - Engine.location.offsetX;
    var y = e.pageY - Engine.location.offsetY;
    return {x:x,y:y};
};

Engine.getMouseCoordinates = function(e){
    var canvasPxCoord = Engine.getCanvasCoordinates(e);
    var gamePxCoord = {
        x: Math.round(canvasPxCoord.x*(1/Engine.zoomScale) + Engine.camera.getPixelX()),
        y: Math.round(canvasPxCoord.y*(1/Engine.zoomScale) + Engine.camera.getPixelY())
    };
    var gameTileCoord = {
        x: coordinatesToCell(gamePxCoord.x,Engine.tileWidth),
        y: coordinatesToCell(gamePxCoord.y,Engine.tileHeight)
    };
    return {
        px: gamePxCoord,
        tile: gameTileCoord
    }
};

Engine.trackPosition = function(e){
    if(!Engine.debug && !Engine.selectionEnabled) return;
    var c = Engine.getMouseCoordinates(e);
    var gamePxCoord = c.px;
    var gameTileCoord = c.tile;
    if(Engine.debug) {
        document.getElementById('pxx').innerHTML = gamePxCoord.x;
        document.getElementById('pxy').innerHTML = gamePxCoord.y;
        document.getElementById('tx').innerHTML = gameTileCoord.x;
        document.getElementById('ty').innerHTML = gameTileCoord.y;
        document.getElementById('aoi').innerHTML = Utils.tileToAOI(gameTileCoord);
    }
    if(Engine.selectionEnabled && Engine.selection.visible) Engine.updateSelection(null,null,gamePxCoord.x,gamePxCoord.y);
};

Engine.handleMouseUp = function(e) {
    if(Engine.selectionEnabled) Engine.resetSelection();
};

Engine.handleClick = function(e){
    //var coordinates = Engine.getCanvasCoordinates(e);
    var c = Engine.getMouseCoordinates(e);
    if(Engine.selectionEnabled){
        Engine.updateSelection(
            //Engine.camera.x*Engine.tileWidth + coordinates.x,
            //Engine.camera.y*Engine.tileHeight + coordinates.y,
            c.px.x,
            c.px.y,
            null,null);
        Engine.selection.visible = true;
        return;
    }
    if(!Engine.clickAction) return;
    var c = Engine.getMouseCoordinates(e);
    var worldx = c.tile.x;
    var worldy = c.tile.y;
    worldx = clamp(worldx,0,Engine.worldWidth);
    worldy = clamp(worldy,0,Engine.worldHeight);
    Engine[Engine.clickAction](worldx,worldy);
    Engine.lastWorldX = worldx;
    Engine.lastWorldY = worldy;
};

Engine.undo = function(){
    if(Engine.editHistory.length == 0) return;
    var last = Engine.editHistory.pop();
    if(last.hull) last.hull.destroy();
    last.destroy();
};

Engine.redo = function(){
    Engine.undo();
    Engine[Engine.clickAction](Engine.lastWorldX,Engine.lastWorldY);
};

Engine.addToLandscape = function(element){
    element.drawLayers();
    Engine.addToStage(element);
    Engine.editHistory.push(element);
};

Engine.addShore = function(x,y){
    if(Geometry.shoreBox.flag == 0){
        Geometry.shoreBox.flag++;
        Geometry.shoreBox.x = x;
        Geometry.shoreBox.y = y;
    }else if(Geometry.shoreBox.flag == 1){
        Geometry.shoreBox.flag = 0;
        var shore = Engine.drawShore(Geometry.addCorners(Geometry.straightLine(Geometry.shoreBox,{x: x,y: y})),false);
        //shore.drawLayers();
        Engine.addToLandscape(shore);
    }
    Engine.drawCircle(x*Engine.tileWidth+16,y*Engine.tileHeight+16,10,0x0000ff);
};

Engine.addMound = function(x,y){
    Engine.addToLandscape(Engine.drawCliff(Geometry.interpolatePoints(Geometry.makeCorona(x,y))));
    return;
    //var test = '[{"x":71,"y":11},{"x":69,"y":11},{"x":69,"y":12},{"x":66,"y":12},{"x":66,"y":16},{"x":66,"y":19},{"x":69,"y":19},{"x":69,"y":21},{"x":71,"y":21},{"x":73,"y":21},{"x":73,"y":20},{"x":76,"y":20},{"x":76,"y":16},{"x":76,"y":15},{"x":74,"y":15},{"x":74,"y":11},{"x":71,"y":11}]';
    //var test ='[{"x":70,"y":9},{"x":68,"y":9},{"x":68,"y":10},{"x":65,"y":10},{"x":65,"y":14},{"x":65,"y":17},{"x":66,"y":17},{"x":66,"y":19},{"x":70,"y":19},{"x":72,"y":19},{"x":72,"y":16},{"x":75,"y":16},{"x":75,"y":14},{"x":75,"y":11},{"x":74,"y":11},{"x":74,"y":9},{"x":70,"y":9}]';
    //var test = '[{"x":72,"y":9},{"x":70,"y":9},{"x":70,"y":10},{"x":67,"y":10},{"x":67,"y":14},{"x":67,"y":15},{"x":68,"y":15},{"x":68,"y":19},{"x":72,"y":19},{"x":73,"y":19},{"x":73,"y":16},{"x":77,"y":16},{"x":77,"y":14},{"x":77,"y":13},{"x":76,"y":13},{"x":76,"y":9},{"x":72,"y":9}]';
    //var test = '[{"x":69,"y":7},{"x":67,"y":7},{"x":67,"y":11},{"x":65,"y":11},{"x":65,"y":13},{"x":59,"y":13},{"x":59,"y":17},{"x":59,"y":20},{"x":61,"y":20},{"x":61,"y":23},{"x":62,"y":23},{"x":62,"y":27},{"x":69,"y":27},{"x":73,"y":27},{"x":73,"y":26},{"x":76,"y":26},{"x":76,"y":23},{"x":77,"y":23},{"x":77,"y":20},{"x":79,"y":20},{"x":79,"y":17},{"x":79,"y":16},{"x":78,"y":16},{"x":78,"y":13},{"x":73,"y":13},{"x":73,"y":7},{"x":69,"y":7}]';
    //var test = '[{"x":66,"y":9},{"x":62,"y":9},{"x":62,"y":16},{"x":58,"y":16},{"x":58,"y":17},{"x":56,"y":17},{"x":56,"y":19},{"x":56,"y":26},{"x":61,"y":26},{"x":61,"y":27},{"x":64,"y":27},{"x":64,"y":29},{"x":66,"y":29},{"x":72,"y":29},{"x":72,"y":23},{"x":74,"y":23},{"x":74,"y":22},{"x":76,"y":22},{"x":76,"y":19},{"x":76,"y":12},{"x":70,"y":12},{"x":70,"y":11},{"x":68,"y":11},{"x":68,"y":9},{"x":66,"y":9}]';
    var test = '[{"x":68,"y":5},{"x":64,"y":5},{"x":64,"y":8},{"x":58,"y":8},{"x":58,"y":15},{"x":58,"y":21},{"x":60,"y":21},{"x":60,"y":22},{"x":65,"y":22},{"x":65,"y":23},{"x":66,"y":23},{"x":66,"y":25},{"x":68,"y":25},{"x":73,"y":25},{"x":73,"y":19},{"x":75,"y":19},{"x":75,"y":18},{"x":76,"y":18},{"x":76,"y":17},{"x":78,"y":17},{"x":78,"y":15},{"x":78,"y":10},{"x":76,"y":10},{"x":76,"y":8},{"x":74,"y":8},{"x":74,"y":5},{"x":68,"y":5}]';
    var arr = JSON.parse(test);
    arr.pop();
    Engine.addToLandscape(Engine.drawCliff(Geometry.interpolatePoints(arr)));
};

Engine.addLake = function(x,y){
    var shore = Engine.drawShore(Geometry.interpolatePoints(Geometry.makeCorona(x,y)),true); // true = lake
    /*var test = '[{"x":68,"y":14},{"x":65,"y":14},{"x":65,"y":17},{"x":63,"y":17},{"x":63,"y":19},{"x":63,"y":22},{"x":65,"y":22},{"x":65,"y":24},{"x":68,"y":24},{"x":69,"y":24},{"x":69,"y":21},{"x":73,"y":21},{"x":73,"y":19},{"x":73,"y":18},{"x":72,"y":18},{"x":72,"y":17},{"x":70,"y":17},{"x":70,"y":14},{"x":68,"y":14}]';
    var arr = JSON.parse(test);
    arr.pop();
    var shore = Engine.drawShore(Geometry.interpolatePoints(arr),true);*/
    //var shore = Engine.drawShore(Geometry.interpolatePoints(Geometry.makePolyrect(x,y)),true); // true = lake
    Engine.fillWaterWrapper(true,shore);
    //shore.drawLayers();
    Engine.addToLandscape(shore);
};

Engine.drawHull = function(hull){
    var g = new PIXI.Graphics();
    g.lineStyle(5,0xffffff);
    g.moveTo(hull[0].x,hull[0].y);
    for(var i = 0; i < hull.length; i++){
        g.lineTo(hull[i].x,hull[i].y);
    }
    g.lineTo(hull[0].x,hull[0].y);
    Engine.blackBoard.addChild(g);
    return g;
};

Engine.drawCircle = function(x,y,radius,color){
    var g = new PIXI.Graphics();
    g.lineStyle(2,color);
    g.drawCircle(x,y,radius);
    Engine.blackBoard.addChild(g);
};

Engine.findTileID = function(prev,pt,next){
    var inAngle = Geometry.computeAngle(prev,pt,true);
    var outAngle = Geometry.computeAngle(pt,next,true);
    //console.log(inAngle+', '+outAngle);
    if(inAngle == 90 && outAngle == 180){
        return W.topRightOut;
    }else if(inAngle == 180 && outAngle == -90){
        return W.topLeftOut;
    }else if(inAngle == 180 && outAngle == 90){
        return W.bottomLeftOut;
    }else if(inAngle == -90 && outAngle == 180){
        return W.bottomRightOut;
    }else if(inAngle == -90 && outAngle == 0){
        return W.bottomLeftIn;
    }else if(inAngle == 0 && outAngle == 90){
        return W.bottomRightIn;
    }else if(inAngle == 180 && outAngle == 180){
        return W.top;
    }else if(inAngle == 90 && outAngle == 90){
        return W.right;
    }else if(inAngle == 0 && outAngle == 0){
        return W.bottom;
    }else if(inAngle == -90 && outAngle == -90){
        return W.left;
    }else if(inAngle == 0 && outAngle == -90) {
        return W.topRightIn;
    }else if(inAngle == 90 && outAngle == 0){
        return W.topLeftIn;
    }
};

Engine.drawShore = function(tiles,lake){
    var shore = new Chunk(null,3);
    var dx = tiles[0].x - tiles[tiles.length-1].x;
    var dy = tiles[0].y - tiles[tiles.length-1].y;
    var coastline; // 1 = N, 2 = W, 3 = S, 4 = E
    if(Math.abs(dx) > Math.abs(dy)){ // N or S
        coastline = (dx > 0 ? 1 : 3);
    }else{ // E or W
        coastline = (dy > 0 ? 4 : 2);
    }
    Geometry.shoreBox.shoreType = coastline;
    for(var i = 0; i < tiles.length; i++){
        var id;
        if(lake){
            var next = (i == tiles.length-1 ? 0 : i+1);
            var prev = (i == 0 ? tiles.length-1 : i-1);
            var id = Engine.findTileID(tiles[prev],tiles[i],tiles[next]);
        }else{
            if (i == 0 || i == tiles.length - 1) {
                if (coastline == 1) id = 6;
                if (coastline == 2) id = 9;
                if (coastline == 3) id = 8;
                if (coastline == 4) id = 7;
            } else {
                var prev = tiles[i - 1];
                var next = tiles[i + 1];
                id = Engine.findTileID(prev, tiles[i], next);
            }
        }

        var ref = {
            x: tiles[i].x,
            y: tiles[i].y
        };
        //console.log(id+' at '+ref.x+', '+ref.y);
        Geometry.shoreBox.registerTile(ref,id);
        switch(id){
            case W.topRightOut:
                shore.addTile(ref.x,ref.y,Shore.topRight,1);
                break;
            case W.top:
                shore.addTile(ref.x,ref.y,Shore.top,1);
                break;
            case W.topLeftOut:
                shore.addTile(ref.x,ref.y,Shore.topLeft,1);
                break;
            case W.left:
                shore.addTile(ref.x,ref.y,Shore.left,1);
                break;
            case W.right:
                shore.addTile(ref.x,ref.y,Shore.right,1);
                break;
            case W.bottomRightIn:
                shore.addTile(ref.x,ref.y,Shore.bottomRight,1);
                break;
            case W.bottomLeftOut:
                shore.addTile(ref.x,ref.y,Shore.topRightOut,1);
                break;
            case W.bottomLeftIn:
                shore.addTile(ref.x,ref.y,Shore.bottomLeft,1);
                break;
            case W.bottom:
                shore.addTile(ref.x,ref.y,Shore.bottom,1);
                break;
            case W.bottomRightOut:
                shore.addTile(ref.x,ref.y,Shore.topLeftOut,1);
                break;
            case W.topRightIn:
                shore.addTile(ref.x,ref.y,Shore.bottomLeftOut,1);
                break;
            case W.topLeftIn:
                shore.addTile(ref.x,ref.y,Shore.bottomRightOut,1);
                break;
        }
    }
    shore.hull = Engine.drawHull(tiles.map(Geometry.makePxCoords));
    return shore;
};

Engine.fillWaterWrapper = function(lake,chunk){
    var water = Engine.fillWater(lake,chunk,1);
    if(!chunk) Engine.addToLandscape(water);
    Geometry.shoreBox.north = {};
    Geometry.shoreBox.east = {};
    Geometry.shoreBox.south = {};
    Geometry.shoreBox.west = {};
};

Engine.fillWater = function(lake,chunk,type){
    var water = chunk || new Chunk(null,2);
    //var type = (lake ? 1 : Geometry.shoreBox.shoreType); // type of shore: north, east, south or west
    var coef = (type > 2 ? -1 : 1);
    var oppositeType = type + 2*coef; // maps 1 to 3, 2 to 4 and vice versa
    var map = Geometry.shoreBox.getMap(type);
    var oppositeMap = Geometry.shoreBox.getMap(oppositeType);
    var limit = {
        1: (Engine.nbChunksVertical*Engine.chunkHeight)-1,
        2: (Engine.nbChunksHorizontal*Engine.chunkWidth)-1,
        3: 0,
        4: 0
    };
    console.log(map);
    for(var coord in map){
        if(!map.hasOwnProperty(coord)) continue;
        var start = map[coord];
        var end = oppositeMap[coord] || limit[type];
        console.log('('+coord+','+start+') - ('+coord+','+end+')');
        var inc = (end-start)/Math.abs(end-start);
        for(var coordBis = start; coordBis != end+inc; coordBis+=inc ){
            var x = (type == 1 || type == 3 ? coord : coordBis);
            var y = (type == 1 || type == 3 ? coordBis : coord);
            water.addTile(x,y,Shore.water,0);
        }
    }
    return water;
};

Engine.drawCliff = function(pts){
    var cliff = new Chunk(null,3);
    var last;
    var history = [];
    for(var i = 0; i < pts.length; i++){
        var next = (i == pts.length-1 ? 0 : i+1);
        var prev = (i == 0 ? pts.length-1 : i-1);
        var id = Engine.findTileID(pts[prev],pts[i],pts[next]);
        var tile = {
            x: pts[i].x,
            y: pts[i].y
        };
        var previousTile = pts[prev];
        //console.log(id+' at '+tile.x+', '+tile.y);

        // Prevent issues with double corners
        if((id == W.topLeftOut && last == W.bottomRightOut) && (previousTile.x - tile.x == 1)) id = W.left;
        if(id == W.top && (last == W.bottomRightOut || last == W.topRightOut)) {
            last = W.top;
            continue;
        }
        if((id == W.bottomRightOut && last == W.topLeftOut) && (previousTile.y - tile.y == -1)){
            id = W.top;
            tile.x--;
        }
        if((id == W.topRightOut && last == W.bottomLeftOut) && (previousTile.y - tile.y == 1)){
            id = W.top;
            tile.x--;
        }
        if(id == W.bottomLeftOut && last == W.topRightOut) {
            id = W.right;
            tile.y--;
        }
        if(id == W.topLeftIn && last == W.bottomRightIn) id = W.bottom;

        var ref = {
            x: tile.x,
            y: tile.y
        };

        switch(id){
            case W.topRightOut: // top right outer
                ref.x -= 1;
                cliff.addTile(ref.x,ref.y-1,Cliff.topRightOut_top,0);
                cliff.addTile(ref.x,ref.y,Cliff.topRightOut,0);
                cliff.addTile(ref.x+1,ref.y,Cliff.topRightOut_right,0);
                var t = (history[1] == W.bottomLeftOut ? Cliff.topRightOut : Cliff.topRightOut_btmright); // Prevent issues with double corners
                cliff.addTile(ref.x+1,ref.y+1,t,0);
                break;
            case W.topLeftOut: // top left outer
                cliff.addTile(ref.x,ref.y-1,Cliff.topLeftOut_top,0);
                cliff.addTile(ref.x-1,ref.y,Cliff.topLeftOut_left,0);
                cliff.addTile(ref.x,ref.y,Cliff.topLeftOut,0);
                break;
            case W.bottomLeftOut: // bottom left outer
                cliff.addTile(ref.x,ref.y-2,Cliff.topRightOut_top,0);
                cliff.addTile(ref.x,ref.y-1,Cliff.topRightOut,0);
                break;
            case W.bottomRightOut: // bottom right outer
                cliff.addTile(ref.x-2,ref.y-1,Cliff.topLeftOut_left,0);
                cliff.addTile(ref.x-1,ref.y-1,Cliff.topLeftOut,0);
                break;
            case W.bottomLeftIn: // bottom left inner
                ref.x -= 1;
                cliff.addTile(ref.x,ref.y-1,Cliff.bottomLeftIn_up,0);
                cliff.addTile(ref.x+1,ref.y-1,Cliff.bottomLeftIn_upright,0);
                cliff.addTile(ref.x,ref.y,Cliff.bottomLeftIn,0);
                cliff.addTile(ref.x+1,ref.y,Cliff.bottomLeftIn_right,0);
                cliff.addTile(ref.x,ref.y+1,Cliff.bottomLeftIn_btm,0);
                cliff.addTile(ref.x+1,ref.y+1,Cliff.bottomLeftIn_btmright,0);
                break;
            case W.bottomRightIn: // bottom right inner
                cliff.addTile(ref.x-1,ref.y-1,Cliff.bottomRightIn_topLeft,0);
                cliff.addTile(ref.x,ref.y-1,Cliff.bottomRightIn_top,0);
                cliff.addTile(ref.x,ref.y,Cliff.bottomRightIn,0);
                /*if(history[3] == W.bottomRightIn) {
                    console.log('oops');
                }*/
                cliff.addTile(ref.x-1,ref.y,Cliff.bottomRIghtIn_left,0);
                cliff.addTile(ref.x-1,ref.y+1,Cliff.bottomRightIn_btmleft,0);
                break;
            case W.top: // top
                cliff.addTile(ref.x,ref.y-1,randomInt(Cliff.top1,Cliff.top2+1),0);
                break;
            case W.right: // right
                var l = 0;
                if(!cliff.children[l].data.get(ref.x,ref.y) || last == W.topRightOut || history[1] == W.bottomLeftOut) cliff.addTile(ref.x,ref.y,Cliff.right,l);
                break;
            case W.bottom: // bottom
                var actualID = randomInt(Cliff.bottom1,Cliff.bottom2);
                cliff.addTile(tile.x,tile.y-1,actualID-15,0);
                cliff.addTile(tile.x,tile.y,actualID,0);
                cliff.addTile(tile.x,tile.y+1,actualID+15,0);
                break;
            case W.left: // left
                cliff.addTile(tile.x-1,tile.y,randomElement([Cliff.left1,Cliff.left2]),0);
                break;
            case W.topRightIn: // top right inner
                cliff.addTile(tile.x-1,tile.y,Cliff.topRightIn,0);
                cliff.addTile(tile.x-1,tile.y+1,Cliff.topRightIn_btm,1);
                if(last == W.bottomLeftIn) cliff.children[0].data.delete(tile.x-1,tile.y-1);
                break;
            case W.topLeftIn: // top left inner
                ref.y += 1;
                cliff.addTile(ref.x,ref.y,Cliff.topLeftIn_altbtm,0);
                cliff.addTile(ref.x,ref.y-1,Cliff.topLeftIn_top,0);
                //cliff.addTile(ref.x,ref.y+1,Cliff.topLeftIn_btm,0);
                if(last == W.bottomRightIn && history[1] == W.topLeftIn){
                    cliff.children[l].data.delete(ref.x-1,ref.y-1);
                    cliff.addTile(ref.x-1,ref.y,Cliff.topLeftIn_alt,0);
                    cliff.addTile(ref.x-1,ref.y+1,Cliff.topLeftIn_altbtm,0);
                    cliff.addTile(ref.x-1,ref.y+2,Cliff.right,0);
                }
        }
        history.unshift(id);
        last = history[0];
    }

    //cliff.drawLayers();
    cliff.hull = Engine.drawHull(pts.map(Geometry.makePxCoords));
    return cliff;
};

Engine.save = function(){
    var dirtyFiles = new Set();
    for(var i = 0; i < Engine.editHistory.length; i++){
        var element = Engine.editHistory[i];
        for(var j = 0; j < element.children.length; j++) {
            var layer = element.children[j];
            var tiles = layer.data.toList();
            for(var k = 0; k < tiles.length; k++){
                var tile = tiles[k];
                //console.log(tile);
                var chunkID = Utils.tileToAOI({x:tile.x,y:tile.y});
                console.log('chunk = '+chunkID);
                var mapData = Engine.mapDataCache[chunkID];
                dirtyFiles.add(chunkID);
                var origin = Utils.AOItoTile(chunkID);
                var x = tile.x - origin.x;
                var y = tile.y - origin.y;
                mapData.layers[j].data[(Engine.chunkWidth*y)+x] = tile.v;
            }
        }
        /*for(var j = 0; j < element.children.length; j++){
            var tile = element.children[j];
            var chunkID = Utils.tileToAOI({x:tile.tileX,y:tile.tileY});
            var mapData = Engine.mapDataCache[chunkID];
            dirtyFiles.add(chunkID);
            console.log('writing '+(tile.tile+1));
            var origin = Utils.AOItoTile(chunkID);
            var x = tile.tileX - origin.x;
            var y = tile.tileY - origin.y;
            mapData.layers[tile.layer].data[(Engine.chunkWidth*y)+x] = tile.tile+1;
        }*/
    }
    dirtyFiles.forEach(function(file){
        Client.sendMapData(file,Engine.mapDataCache[file]);
    });
    Engine.editHistory = [];
};

Engine.boot();
