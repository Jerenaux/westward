    /**
 * Created by Jerome on 26-06-17.
 */
var Engine = {
    baseViewWidth: 32, //32,
    baseViewHeight: 18, //18,
    tileWidth: 32,
    tileHeight: 32
};

Engine.camera = {
    x: 0,
    y: 0,
    getPixelX: function(){
        return Engine.camera.x*World.tileWidth;
    },
    getPixelY: function(){
        return Engine.camera.y*World.tileHeight;
    }
};

Engine.boot = function(){
    Engine.renderer = PIXI.autoDetectRenderer(
        Engine.baseViewWidth*Engine.tileWidth,
        Engine.baseViewHeight*Engine.tileHeight,
        {
            antialias: false,
            view: document.getElementById('game'),
            //resolution: 0.5,
            preserveDrawingBuffer: true // to allow image captures from canvas
        }
    );
    Engine.viewWidth = Engine.baseViewWidth;
    Engine.viewHeight = Engine.baseViewHeight;

    console.log(Engine.renderer); // Engine.renderer.getParameter(Engine.renderer.MAX_TEXTURE_SIZE

    Engine.setAction('move');
    //Engine.setAction('addForest');
    Engine.showGrid = Engine.getPreference('showGrid',false);
    Engine.showHero = Engine.getPreference('showHero',true);
    Engine.showHulls = Engine.getPreference('showHulls',false);
    Engine.selectionEnabled = Engine.getPreference('selectionEnabled',false);
    Engine.debug = true;
    Engine.zoomScale = 1;
    Engine.zoomScales= [0.01,0.025,0.05,0.1,0.25,0.5,0.75,1];
    Engine.zoomIndex = Engine.zoomScales.length-1;

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
        document.getElementById('w').value = 20;
        document.getElementById('h').value = 20;
        document.getElementById('n').value = 10;
    }

    //Engine.mapDataLocation = 'assets/maps/chunks';
    Engine.mapDataLocation = '/maps';
    Engine.loadJSON(Engine.mapDataLocation+'/master.json',Engine.readMaster);

    Engine.textureCache = {};

    Engine.nbFilesToLoad = 0;
    Engine.nbFilesLoaded = 0;
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
    World.readMasterData(masterData);
    Engine.nbLayers = masterData.nbLayers;

    console.log('Master file read, setting up world of size '+World.worldWidth+' x '+World.worldHeight+' with '+Engine.nbLayers+' layers');
    Engine.tilesets = masterData.tilesets;

    PIXI.loader.add('hero','../assets/sprites/hero_.png');

    for(var i = 0; i < masterData.tilesets.length; i++){
        var tileset = masterData.tilesets[i];
        console.log(tileset.name,tileset.firstgid);
        var absolutePath = tileset.image;
        var tokens = absolutePath.split('\\');
        var img = tokens[tokens.length-1];
        var path = '../assets/tilesets/'+img;
        PIXI.loader.add(tileset.name,path);
    }

    Engine.tilesetMap = {}; // maps tiles to tilesets;

    PIXI.loader.load(Engine.start);
};

Engine.loadJSON = function(path,callback,id,callBack){
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(JSON.parse(xobj.responseText),id,callBack);
        }else{
            //console.log('ERROR for chunk '+id);
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
    var startx = localStorage.getItem('x') || 536; //536;//744;
    var starty = localStorage.getItem('y') || 694;//694;//130;
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
    if(Engine.captureStage){
        sprite.scale.set(Engine.captureScale);
        Engine.captureStage.addChild(sprite);
    }else{
        Engine.stage.addChild(sprite);
        Engine.orderStage();
    }
};

Engine.orderStage = function(){
    Engine.stage.children.sort(function(a,b){
        return a.z > b.z;
    });
};

Engine.displayChunk = function(id,callBack){
    //console.log('Displaying '+id);
    if(Engine.mapDataCache[id]){
        // Chunks are deleted and redrawn rather than having their visibility toggled on/off, to avoid accumulating in memory
        Engine.drawChunk(Engine.mapDataCache[id],id,callBack);
    }else {
        Engine.loadJSON(Engine.mapDataLocation+'/chunk' + id + '.json', Engine.drawChunk, id, callBack);
    }
};

Engine.displayMap = function(path){
    Engine.loadJSON(path,Engine.makeMap);
};

Engine.drawChunk = function(mapData,id,callBack){
    if(callBack) Engine.chunkCallback();
    if(Engine.displayedChunks.includes(id)) return;
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
        gr.drawRect(origin.x * World.tileWidth, origin.y * World.tileHeight, World.chunkWidth * World.tileWidth, World.chunkHeight * World.tileHeight);
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

Engine.removeChunk = function(id){
    Engine.chunks[id].destroy({
        children: true,
        texture: false,
        baseTexture: false
    });
    Engine.stage.removeChild(Engine.chunks[id]);
    Engine.displayedChunks.splice(Engine.displayedChunks.indexOf(id),1);
};


Engine.showAll = function(){
    /*var path = Engine.mapDataLocation+'/allData.json';
    console.log('fetching '+path);
    Engine.loadJSON(path,Engine.readAllData);*/
};

Engine.removeAll = function(){
    var chunks = Engine.displayedChunks;
    //console.log(chunks.sort(function(a,b){return a-b}));
    // Needs to go backwards because removeChunk remove elements from the Engine.displayedChunks array!
    for (var i = chunks.length-1; i >= 0; i--) {
        Engine.removeChunk(chunks[i]);
    }
};

Engine.update = function(){
    Engine.renderer.render(Engine.stage);
    requestAnimationFrame(Engine.update);
    document.getElementById('visible').innerHTML = Engine.displayedChunks.length;
    //console.log(Engine.stage.children.length+' children');
};

Engine.zoom = function(coef){
    Engine.zoomIndex += coef;
    if(Engine.zoomIndex < 0) Engine.zoomIndex = 0;
    if(Engine.zoomIndex > Engine.zoomScales.length-1) Engine.zoomIndex = Engine.zoomScales.length-1;
    Engine.zoomScale = Engine.zoomScales[Engine.zoomIndex];

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
    Engine.camera.x = Utils.clamp(Engine.camera.x,0,World.worldWidth-Engine.viewWidth);
    Engine.camera.y = Utils.clamp(Engine.camera.y,0,World.worldHeight-Engine.viewHeight);
    Engine.stage.pivot.set(Engine.camera.x*World.tileWidth,Engine.camera.y*World.tileHeight);
    document.getElementById('cx').innerHTML = Engine.camera.x;
    document.getElementById('cy').innerHTML = Engine.camera.y;
};

Engine.updateEnvironment = function(){
    var chunks = Engine.listVisibleAOIs(Engine.player.chunk);
    //console.log(chunks.sort(function(a,b){return a-b}));
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

Engine.listVisibleAOIs = function(start){ // List the visible chunks around the player based on zoom level
    var limit;
    switch(Engine.zoomScale){
        case 0.05:
            limit = 20;
            break;
        case 0.25:
            limit = 3;
            break;
        case 0.1:
            limit = 9;
            break;
        default:
            limit = 0;
            break;
    }
    var current = start;
    var AOIs= [start];
    for(var i = 0; i < AOIs.length; i++){
        var current = AOIs[i];
        if(Geometry.manhattan(Engine.getMacroCoordinates(start),Engine.getMacroCoordinates(current)) > limit) continue;
        var adjacent = Utils.listAdjacentAOIs(current);
        var n = adjacent.diff(AOIs);
        AOIs = AOIs.concat(n);
    }
    return AOIs;
};

// Returns the x and y offets of a chunk, in chunks, from the top left
Engine.getMacroCoordinates = function(chunk){
    return {
        x: chunk%World.nbChunksHorizontal,
        y: Math.floor(chunk/World.nbChunksHorizontal)
    }
};

Engine.move = function(x,y){
    Engine.setPosition(Engine.player,x,y);
    localStorage.setItem('x',x);
    localStorage.setItem('y',y);
    Engine.player.chunk = Utils.tileToAOI(Engine.player.tilePosition);
    if(Engine.player.chunk != Engine.player.previousChunk) Engine.updateEnvironment();
    Engine.player.previousChunk = Engine.player.chunk;
    Engine.updateCamera();
};

Engine.setPosition = function(sprite,x,y){
    sprite.position.set(x*World.tileWidth,y*World.tileHeight);
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
        x: Math.floor(gamePxCoord.x/World.tileWidth),
        y: Math.floor(gamePxCoord.y/World.tileHeight)
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
    var c = Engine.getMouseCoordinates(e);
    if(Engine.selectionEnabled){
        Engine.updateSelection(
            c.px.x,
            c.px.y,
            null,null);
        Engine.selection.visible = true;
        return;
    }
    if(!Engine.clickAction) return;
    var worldx = c.tile.x;
    var worldy = c.tile.y;
    worldx = Utils.clamp(worldx,0,World.worldWidth);
    worldy = Utils.clamp(worldy,0,World.worldHeight);
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

Engine.addToLandscape = function(element,order){
    element.drawLayers();
    if(order) element.orderTiles();
    Engine.addToStage(element);
    Engine.editHistory.push(element);
};

Engine.addMound = function(x,y){
    Engine.addToLandscape(Engine.drawCliff(Geometry.interpolatePoints(Geometry.makeCorona(x,y))));
};

Engine.addLake = function(x,y){
    var shore = Engine.drawShore(Geometry.interpolatePoints(Geometry.makeCorona(x,y)),true); // true = lake
    Engine.fillWaterWrapper(true,shore);
    Engine.addToLandscape(shore);
};

Engine.addForest = function(x,y){ var forest = Engine.drawForest(Geometry.cluster(x,y));
    Engine.addToLandscape(forest,false); // true/false : order tiles
};

Engine.drawHull = function(hull){ // Input are coordinates in pixels, not tiles!
    var g = new PIXI.Graphics();
    g.lineStyle(5,0xffffff);
    g.moveTo(hull[0].x,hull[0].y);
    for(var i = 1; i < hull.length; i++){
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

Engine.drawForest = function(pts){
    var forest = new Chunk(null,3);
    var types = [1,1,1,2,2,3];
    var startCoord = {
        1: 22,
        2: 5,
        3: 9
    };
    pts.sort(function(a,b){
        return a.y > b.y;
    });
    for(var i = 0; i < pts.length; i++){
        var type = randomElement(types);
        var ref = {
            x: pts[i].x,
            y: pts[i].y
        };
        var v = 681;
        var width = (type <= 2 ? 4 : 5);
        var height = (type == 1 ? 5 : 6);
        for(var j = 0; j < width; j++){
            for(var k = 0; k < height; k++){
                var x = ref.x+j;
                var y = ref.y+k;
                var layer = 1;
                while(forest.children[layer].data.get(x,y)) layer++;
                var tile = v+startCoord[type]+j+(k*21);
                forest.addTile(x,y,tile,layer);
            }
        }
    }
    return forest;
};

Engine.fillWaterWrapper = function(lake,chunk){
    var water = Engine.fillWater(lake,chunk,1);
    if(!chunk) Engine.addToLandscape(water);
    Geometry.shoreBox.north = {};
    Geometry.shoreBox.east = {};
    Geometry.shoreBox.south = {};
    Geometry.shoreBox.west = {};
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
                cliff.addTile(ref.x,ref.y-1,Cliff.bottomLeftIn_up,1);
                cliff.addTile(ref.x+1,ref.y-1,Cliff.bottomLeftIn_upright,0);
                cliff.addTile(ref.x,ref.y,Cliff.bottomLeftIn,1);
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
                cliff.addTile(tile.x-1,tile.y+1,Cliff.topRightIn_btm,0);
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
                var chunkID = Utils.tileToAOI({x:tile.x,y:tile.y});
                var mapData = Engine.mapDataCache[chunkID];
                dirtyFiles.add(chunkID);
                var origin = Utils.AOItoTile(chunkID);
                var x = tile.x - origin.x;
                var y = tile.y - origin.y;
                mapData.layers[j].data[(World.chunkWidth*y)+x] = tile.v;
            }
        }
    }
    dirtyFiles.forEach(function(file){
        Client.sendMapData(file,Engine.mapDataCache[file]);
    });
    Engine.editHistory = [];
};

Engine.captureMap = function(){
    Engine.renderer.extract.canvas(Engine.stage).toBlob(function(b){
        var a = document.createElement('a');
        document.body.append(a);
        a.download = 'fullMap';
        a.href = URL.createObjectURL(b);
        a.click();
        a.remove();
    }, 'image/png');
};

Engine.displayQuadrant = function(quad){
    Engine.removeAll();
    var quadW = 15;
    var quadH = 15;
    // Displays a quadrant of dimensions quadW, quadH with quad as top-left chunk
    for(var y = 0; y < quadH; y++){
        for(var x = 0; x < quadW; x ++){
            var c = quad + x + World.nbChunksHorizontal*y;
            Engine.displayChunk(c);
        }
    }
};

Engine.captureAll = function(){
    Engine.performCapture = true;
    Engine.captureStage = new PIXI.Container();
    Engine.captureScale = 0.05; // 0.025 for settlement selection map
    Engine.player.visible = false;
    Engine.captureCount = 0;
    Engine.quadW = 50;
    Engine.quadH = 57;
    Engine.firstCapture = true;
    Engine.quadSnapshot = {
        x: 0,
        y: 0
    };
    Engine.captureWrap();
};

Engine.captureWrap = function(){
    if(Engine.firstCapture) {
        Engine.firstCapture = false;
    }else{
        Engine.quadSnapshot.x += Engine.quadW;
        if(Engine.quadSnapshot.x > World.nbChunksHorizontal){
            Engine.quadSnapshot.x = 0;
            Engine.quadSnapshot.y += Engine.quadH;
            if(Engine.quadSnapshot.y > World.nbChunksVertical){
                console.log('Full capture done');
                return;
            }
        }
    }
    Engine.removeAll();
    Engine.displayQuadrantAndCapture();
};

Engine.displayQuadrantAndCapture = function(){
    console.log('Displaying next Q');
    Engine.chunkCounter = 0;
    var tl = Utils.gridToLine(Engine.quadSnapshot.x,Engine.quadSnapshot.y,World.nbChunksHorizontal);
    var right = World.nbChunksHorizontal - (tl%World.nbChunksHorizontal);
    var down = World.nbChunksVertical - Math.floor(tl/World.nbChunksHorizontal);
    console.log(tl,right,down);
    var horizLimit = Math.min(Engine.quadW,right);
    var vertLimit = Math.min(Engine.quadH,down);
    Engine.chunkTotal = (horizLimit*vertLimit);
    var cs = [];
    for(var y = 0; y < vertLimit; y++){
        for(var x = 0; x < horizLimit; x++){
            var c = Utils.gridToLine(Engine.quadSnapshot.x+x,Engine.quadSnapshot.y+y,World.nbChunksHorizontal);
            cs.push(c);
            //console.log('req '+c);
            Engine.displayChunk(c,true);
        }
    }
    console.log(cs);
};

Engine.chunkCallback = function(){
    Engine.chunkCounter++;
    //console.log('+');
    if(Engine.chunkCounter == Engine.chunkTotal) {
        console.log('All displayed');
        //Engine.captureAndNext();
        setTimeout(Engine.captureAndNext,100);
        //Engine.captureWrap();
    }
    //console.log(Engine.chunkCounter,Engine.chunkTotal);
};

Engine.captureAndNext = function(){
    Engine.renderer.extract.canvas(Engine.captureStage).toBlob(function(b){
    //Engine.renderer.extract.canvas(Engine.stage).toBlob(function(b){
        var a = document.createElement('a');
        document.body.append(a);
        a.download = 'map_'+(Engine.captureCount++)+'.png';
        a.href = URL.createObjectURL(b);
        a.click();
        a.remove();
        //Engine.captureWrap();
    }, 'image/png');
};


Engine.getPreference = function(parameter,defaultValue){ // Retrieve sorting preferences for localStorage or return a default value
    var pref = localStorage.getItem(parameter);
    if(pref === null) return defaultValue;
    // The following is needed because localStorage stores as text
    if(pref == 'true') return true;
    if(pref == 'false') return false;
    return parseInt(pref);
};

Engine.boot();

function getMaxTextureSize() {
    //var gl = document.getElementById( "my-canvas").getContext( "experimental-webgl" );
    var gl = Engine.renderer.view.getContext( "experimental-webgl" );
    if ( !gl )
        return;
    console.log(gl.getParameter(gl.MAX_TEXTURE_SIZE));
}

    