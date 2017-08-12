/**
 * Created by Jerome on 26-06-17.
 */
var Engine = {
    viewWidth: 30,
    viewHeight: 16,
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
     * Draw dirt
     * Scatter trees and stuff
    *-----
    * Load more chunks upon zoom
    * Clean code
    * Save to chunks
    * Edit chunks in tiled?
    * Disable hulls
    * Undo*/

    Engine.renderer = PIXI.autoDetectRenderer(
        Engine.viewWidth*Engine.tileWidth,
        Engine.viewHeight*Engine.tileHeight,
        {
            antialias: false,
            view: document.getElementById('game'),
            preserveDrawingBuffer: true // to allow image captures from canvas
        }
    );

    Engine.setAction('move');
    Engine.showGrid = Utils.getPreference('showGrid',false);
    Engine.showHero = Utils.getPreference('showHero',true);
    Engine.selectionEnabled = Utils.getPreference('selectionEnabled',false);
    Engine.debug = true;

    Engine.AOIs = {}; // holds references to the Containers containing the chunks
    Engine.displayedAOIs = [];
    Engine.mapDataCache = {};

    Engine.computeStageLocation();

    Engine.stage = new PIXI.Container();
    Engine.blackBoard = new PIXI.Container(); // Stores all the graphics objects used for debugging (hulls, points...)
    Engine.blackBoard.z = 999;
    Engine.stage.addChild(Engine.blackBoard);

    Engine.drawSelection();
    Engine.renderer.view.addEventListener('mousedown', Engine.handleClick, false);
    if(Engine.debug) {
        Engine.renderer.view.addEventListener('mouseup', Engine.handleMouseUp, false);
        Engine.renderer.view.addEventListener('mousemove', Engine.trackPosition, false);
    }

    Engine.mapDataLocation = 'assets/maps/demochunks';
    //Engine.mapDataLocation = 'assets/maps/chunks';
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
    Engine.AOIwidth = masterData.AOIwidth;
    Engine.AOIheight = masterData.AOIheight;
    Engine.nbAOIhorizontal = masterData.nbAOIhoriz;
    Engine.nbAOIvertical = masterData.nbAOIvert;
    Engine.worldWidth = Engine.nbAOIhorizontal*Engine.AOIwidth;
    Engine.worldHeight = Engine.nbAOIvertical*Engine.AOIheight;
    Engine.lastAOI = (Engine.nbAOIhorizontal*Engine.nbAOIvertical)-1;
    //console.log('Master file read, setting up world of size '+Engine.worldWidth+' x '+Engine.worldHeight);
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
    var startx = randomInt(0,77);
    var starty = randomInt(0,Engine.worldHeight);
    startx = 10;//35;
    starty = 10;//30;
    Engine.player = Engine.addSprite('hero',startx,starty);
    Engine.player.visible = Engine.showHero;
    Engine.updateChunks();
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

Engine.displayChunk = function(aoi){
    if(Engine.mapDataCache[aoi]){
        // Chunks are deletes and redrawn rather than having their visibility toggled on/off, to avoid accumulating in memory
        Engine.makeChunk(Engine.mapDataCache[aoi]);
    }else {
        Engine.loadJSON(Engine.mapDataLocation+'/chunk' + aoi + '.json', Engine.makeChunk);
    }
};

Engine.displayMap = function(path){
    Engine.loadJSON(path,Engine.makeMap);
};

Engine.makeChunk = function(mapData){
    var chunk = new AOI(mapData);
    Engine.AOIs[chunk.id] = chunk;
    if(!Engine.mapDataCache[chunk.id]) Engine.mapDataCache[chunk.id] = mapData;
    for(var i = 0; i < mapData.layers.length; i++){
        Engine.addLayer(mapData.layers[i].data,mapData.width,mapData.height,chunk.id,chunk);
    }
    chunk.z = 1;
    Engine.displayedAOIs.push(chunk.id);
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

Engine.toggleGrid = function(){
    Engine.showGrid = !Engine.showGrid;
    localStorage.setItem('showGrid',Engine.showGrid);
    for(var i = 0; i < Engine.displayedAOIs.length; i++){
        var AOI = Engine.AOIs[Engine.displayedAOIs[i]];
        if(Engine.showGrid){
            Engine.drawGrid(AOI);
        }else{
            Engine.removeGrid(AOI);
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
        gr.lineStyle(4, 0xffffff, 1);
        gr.drawRect(origin.x * Engine.tileWidth, origin.y * Engine.tileHeight, Engine.AOIwidth * Engine.tileWidth, Engine.AOIheight * Engine.tileHeight);
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

Engine.addLayer = function(data,width,height,aoi,chunk){
    var origin = Utils.AOItoTile(aoi);
    for(var i = 0; i < data.length; i++){
        var tile = data[i];
        if(tile == 0) continue;
        var x = origin.x + i%width;
        var y = origin.y + Math.floor(i/width);
        Engine.addTile(x,y,tile,chunk);
    }
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

Engine.addTile = function(x,y,tile){
    if(x < 0 || y < 0) return;
    var chunk = Engine.AOIs[Utils.tileToAOI({x:x,y:y})];
    var tilesetID = Engine.getTilesetFromTile(tile);
    var tileset = Engine.tilesets[tilesetID];
    tile -= tileset.firstgid;
    var wdth = Math.floor(tileset.imagewidth/Engine.tileWidth);
    var tx = tile%wdth;
    var ty = Math.floor(tile/wdth);
    var texture = new PIXI.Texture(Engine.resources[tileset.name].texture, new PIXI.Rectangle(tx*Engine.tileWidth, ty*Engine.tileHeight, Engine.tileWidth, Engine.tileHeight));
    var sprite = new PIXI.Sprite(texture);
    sprite.position.set(x*Engine.tileWidth,y*Engine.tileHeight);
    chunk.addChild(sprite);
};

Engine.removeChunk = function(aoi){
    Engine.stage.removeChild(Engine.AOIs[aoi]);
    Engine.displayedAOIs.splice(Engine.displayedAOIs.indexOf(aoi),1);
};

Engine.update = function(){
    Engine.renderer.render(Engine.stage);
    requestAnimationFrame(Engine.update);
    //console.log(Engine.stage.children.length+' children');
};

Engine.zoom = function(coef){
    var increment = 0.25*coef;
    Engine.stage.scale.x += increment;
    Engine.stage.scale.y += increment;
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
        Engine.selection.graphicsData[0].shape.x,
        Engine.selection.graphicsData[0].shape.y,
        Engine.selection.graphicsData[0].shape.width,
        Engine.selection.graphicsData[0].shape.height
    );
    Engine.selection.graphicsData[0].shape.width = 0;
    Engine.selection.graphicsData[0].shape.height = 0;
    Engine.selection.visible = false;
};

Engine.updateCamera = function(){
    Engine.camera.x = coordinatesToCell(Engine.player.x,Engine.tileWidth) - Engine.viewWidth*0.5;
    Engine.camera.y = coordinatesToCell(Engine.player.y,Engine.tileHeight) - Engine.viewHeight*0.5;
    Engine.camera.x = clamp(Engine.camera.x,0,Engine.worldWidth*Engine.tileWidth);
    Engine.camera.y = clamp(Engine.camera.y,0,Engine.worldHeight*Engine.tileHeight);
    Engine.stage.pivot.set(Engine.camera.x*Engine.tileWidth,Engine.camera.y*Engine.tileHeight);
};

Engine.updateChunks = function(){
    Engine.player.previousAOI = Engine.player.AOI;
    Engine.player.AOI = Utils.tileToAOI(Engine.player.tilePosition);
    if(Engine.player.AOI == Engine.player.previousAOI) return;
    var AOIs = Engine.listAdjacentAOIs(Engine.player.AOI);
    var newAOIs = AOIs.diff(Engine.displayedAOIs);
    var oldAOIs = Engine.displayedAOIs.diff(AOIs);

    for(var i = 0; i < oldAOIs.length; i++){
        Engine.removeChunk(oldAOIs[i]);
    }

    for(var j = 0; j < newAOIs.length; j++){
        Engine.displayChunk(newAOIs[j]);
    }
};

Engine.move = function(x,y){
    Engine.setPosition(Engine.player,x,y);
    Engine.updateChunks();
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

Engine.trackPosition = function(e){
    if(!Engine.debug && !Engine.selectionEnabled) return;
    var canvasPxCoord = Engine.getCanvasCoordinates(e);
    var gamePxCoord = {
        x: canvasPxCoord.x + Engine.camera.getPixelX(),
        y: canvasPxCoord.y + Engine.camera.getPixelY()
    };
    var gameTileCoord = {
        x: coordinatesToCell(gamePxCoord.x,Engine.tileWidth),
        y: coordinatesToCell(gamePxCoord.y,Engine.tileHeight)
    };
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
    var coordinates = Engine.getCanvasCoordinates(e);
    if(Engine.selectionEnabled){
        Engine.updateSelection(
            Engine.camera.x*Engine.tileWidth + coordinates.x,
            Engine.camera.y*Engine.tileHeight + coordinates.y,
            null,null);
        Engine.selection.visible = true;
        return;
    }
    if(!Engine.clickAction) return;
    var worldx = Engine.camera.x + coordinatesToCell(coordinates.x,Engine.tileWidth);
    var worldy = Engine.camera.y + coordinatesToCell(coordinates.y,Engine.tileHeight);
    worldx = clamp(worldx,0,Engine.worldWidth);
    worldy = clamp(worldy,0,Engine.worldHeight);
    Engine[Engine.clickAction](worldx,worldy);
};

Engine.listAdjacentAOIs = function(current){
    var AOIs = [];
    var isAtTop = (current < Engine.nbAOIhorizontal);
    var isAtBottom = (current > Engine.lastAOI - Engine.nbAOIhorizontal);
    var isAtLeft = (current%Engine.nbAOIhorizontal == 0);
    var isAtRight = (current%Engine.nbAOIhorizontal == Engine.nbAOIhorizontal-1);
    AOIs.push(current);
    if(!isAtTop) AOIs.push(current - Engine.nbAOIhorizontal);
    if(!isAtBottom) AOIs.push(current + Engine.nbAOIhorizontal);
    if(!isAtLeft) AOIs.push(current-1);
    if(!isAtRight) AOIs.push(current+1);
    if(!isAtTop && !isAtLeft) AOIs.push(current-1-Engine.nbAOIhorizontal);
    if(!isAtTop && !isAtRight) AOIs.push(current+1-Engine.nbAOIhorizontal);
    if(!isAtBottom && !isAtLeft) AOIs.push(current-1+Engine.nbAOIhorizontal);
    if(!isAtBottom && !isAtRight) AOIs.push(current+1+Engine.nbAOIhorizontal);
    return AOIs;
};

Engine.boot();

Engine.addMound = function(worldx,worldy){
    Engine.drawCliff(Geometry.makePolyrect(worldx,worldy));
};

function deform(pts){
    for(var i = 0; i < pts.length; i++){
        var a = pts[i];
        var b = (i+1 < pts.length? pts[i+1] : pts[0]);
        var dx = Math.abs(a.x- b.x)/Engine.tileWidth;
        var dy = Math.abs(a.y- b.y)/Engine.tileHeight;
        if(dx < 3 && dy < 3) continue;
        if(dx == dy){
            console.log('diagonal');
            continue;
        }
        /*var newpts = makePath(a,b);
        pts.splice(i+1,0,...newpts);
        i += newpts.length;*/
    }
}

function makePath(a,b){
    console.log('Finding path between ('+a.x+','+a.y+') and ('+b.x+','+b.y+')');
    var newpts = [];
    var vertical = (a.x == b.x);
    console.log(vertical);
    var start = new PIXI.Point(a.x, a.y);
    var angle = -1;

    var j = 0;
    while(true) {
        var dx = start.x - b.x;
        var dy = start.y - b.y;
        if(distToDest(vertical,dx,dy) == 1){
            console.log('close enough');
            break;
        }
        var candidates = [];
        var xIncrement = -(dx / Math.abs(dx)) * Engine.tileWidth;
        var yIncrement = -(dy / Math.abs(dy)) * Engine.tileWidth;
        for (var i = -1; i <= 1; i++) {
            var pt = new PIXI.Point(start.x + (vertical ? i * Engine.tileWidth : xIncrement), (start.y + (vertical ? yIncrement : i * Engine.tileWidth)));
            var ndx = Math.abs(pt.x - b.x);
            var ndy = Math.abs(pt.y - b.y);
            console.log(JSON.stringify(pt));
            var ng = computeAngle(start,pt,true);
            var isFlat = (ng%90 == 0 || ng == angle);
            var lim = (isFlat ? ndx : ndx-32);
            /*if ((vertical && ndx >= ndy) || (!vertical && ndy > lim)){
                console.log('going too far ('+ndx+', '+ndy+')');
                continue; // don't go too far
            }*/
            if(ng == -1*angle){
                console.log('angle');
                continue;
            }
            candidates.push(pt);
        }
        var newpt = randomElement(candidates);
        newpts.push(newpt);
        angle = computeAngle(start,newpt,true);
        start.x = newpt.x;
        start.y = newpt.y;
        console.log('angle = '+angle+', x = '+newpt.x+', y = '+newpt.y+', dx = '+(start.x- b.x)+', dy = '+(start.y- b.y));
        console.log('-----');
        if(j > 100) break;
        j++;
    }
    printArray(newpts);
    return newpts;
}

function distToDest(vertical,dx,dy){
    return (vertical ? Math.abs(dy)/Engine.tileHeight : Math.abs(dx)/Engine.tileWidth);
    //if((vertical && Math.abs(dy) == Engine.tileHeight) || (!vertical && Math.abs(dx) == Engine.tileWidth)) break;
}

function swapElements(pts,b,c){
    var tmp = pts[b];
    pts[b] = pts[c];
    pts[c] = tmp;
}

Engine.colors = {
    0: 0xff0000,
    1: 0x00ff00,
    2: 0x0000ff,
    3: 0xffff00
};

function Rect(x,y,w,h){
    this.id = Geometry.lastrectID++;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.points = [];
    this.points.push(new PIXI.Point(x,y));
    this.points.push(new PIXI.Point(x+w,y));
    this.points.push(new PIXI.Point(x+w,y+h));
    this.points.push(new PIXI.Point(x,y+h));
    for(var i = 0; i < this.points.length; i++){
        this.points[i].i = i;
        this.points[i].rectID = this.id;
        Engine.drawCircle(this.points[i].x,this.points[i].y,5,Engine.colors[this.id]);
    }
}

function removeDuplicates(pts){
    return pts.reduce(function (p, c) {

        // create an identifying id from the object values
        var id = [c.x, c.y].join('|');

        // if the id is not found in the temp array
        // add the object to the output array
        // and add the key to the temp array
        if (p.temp.indexOf(id) === -1) {
            p.out.push(c);
            p.temp.push(id);
        }
        return p;

        // return the deduped array
    }, { temp: [], out: [] }).out;
}

Engine.drawHull = function(hull){
    var g = new PIXI.Graphics();
    g.lineStyle(5,0xffffff);
    g.moveTo(hull[0].x,hull[0].y);
    for(var i = 1; i < hull.length; i++){
        g.lineTo(hull[i].x,hull[i].y);
    }
    g.lineTo(hull[0].x,hull[0].y);
    Engine.stage.addChild(g);
};

Engine.drawCircle = function(x,y,radius,color){
    var g = new PIXI.Graphics();
    g.lineStyle(2,color);
    g.drawCircle(x,y,radius);
    Engine.blackBoard.addChild(g);
};


function removeEntry(v,arr){
    var idx = arr.indexOf(v);
    if(idx > -1) arr.splice(idx,1);
}

function findIntersects(pt,rect){
    var sect = [];
    var k = pt.i;
    if(k === undefined) return sect;
    if(k == 0){ // top left corner
        sect.push(projectRight(rect,pt)); // project on right side
        sect.push(projectDown(rect,pt)); // project on bottom
    }else if(k == 1){ // top right corner
        sect.push(projectLeft(rect,pt)); // project on left side
        sect.push(projectDown(rect,pt)); // project on bottom
    }else if(k == 2){ // bottom right corner
        sect.push(projectLeft(rect,pt)); // project on left side
        sect.push(projectUp(rect,pt)); // project on left side
    }else if(k == 3){ // bottom left corner
        sect.push(projectRight(rect,pt)); // project on right side
        sect.push(projectUp(rect,pt)); // project on left side
    }
    return sect;
}

function projectUp(ref,pt){
    return new PIXI.Point(pt.x,ref.y);
}

function projectRight(ref,pt){
    return new PIXI.Point(ref.x+ref.w,pt.y);
}

function projectDown(ref,pt){
    return new PIXI.Point(pt.x,ref.y+ref.h);
}

function projectLeft(ref,pt){
    return new PIXI.Point(ref.x,pt.y);
}

function isInRect(pt,rect){
    //return (rect.x <= pt.x && pt.x <= rect.x+rect.w && rect.y <= pt.y && pt.y <= rect.y+rect.h);
    return (rect.x < pt.x && pt.x < rect.x+rect.w && rect.y < pt.y && pt.y < rect.y+rect.h);
}

function sortAngle(a,b){
    var origin = {x:0,y:0};
    var aa = computeAngle(a, origin,true);
    var bb = computeAngle(b, origin,true);
    //return (aa >= bb);
    if(aa > bb) return 1;
    if(aa < bb) return -1;
    var ea = euclidean(a,origin);
    var eb = euclidean(b,origin);
    var sign = aa/Math.abs(aa);
    if(aa == -90) sign = 1;
    if(aa == 0) sign = -1;
    if(ea > eb) return 1*sign;
    if(ea < eb) return -1*sign;
    return 0;
}
// Leftward rect: 1, -1, -1, 1
// rightward: 1, -1, 1, -1

function euclidean(a,b){
    return Math.pow(a.x-b.x,2)+Math.pow(a.y- b.y,2);
}

function computeAngle(a,b,degrees){ // return angle between points a and b
    //console.log('('+a.x+','+ a.y+'), ('+ b.x+','+b.y+')');
    var angle = -(Math.atan2(b.y- a.y, b.x- a.x));
    /*if(a.x == b.x && a.y < b.y) angle = Math.PI/2;
    if(a.x == b.x && a.y > b.y) angle = -Math.PI/2;
    if(a.y == b.y && a.x > b.x) angle = -Math.PI;
    if(a.y == b.y && a.x < b.x) angle = Math.PI;*/
    if(degrees) {
        angle *= (180/Math.PI);
        if(angle == -180) angle*= -1;
    }
    return angle;
}

Engine.objToArr = function(pts){
    var p = [];
    for(var i = 0; i < pts.length; i++){
        p.push([pts[i].x,pts[i].y]);
    }
    return p;
};

/*function vertslice(worldx,worldy,chunk){
    for(var i = 0; i < 3; i++){ // bottom
        Engine.addTile(worldx-1,worldy+(i+1),1343+(i*20),chunk);
        Engine.addTile(worldx,worldy+(i+1),1344+(i*20),chunk);
        Engine.addTile(worldx+1,worldy+(i+1),1345+(i*20),chunk);
    }
    for(var i = 0; i < 2; i++){ // up
        Engine.addTile(worldx,worldy-(-i+2),1224+(i*20),chunk);
        Engine.addTile(worldx+1,worldy-(-i+2),1227+(i*20),chunk);
    }
    Engine.addTile(worldx-2,worldy,1281,chunk);
    Engine.addTile(worldx-1,worldy,1282,chunk);
    Engine.addTile(worldx-1,worldy,1282,chunk);
}*/

function insert(a1,a2,pos){
    a1.splice.apply(a1, [pos, 0].concat(a2));
}



Engine.drawCliff = function(pts){
    Engine.drawHull(pts);
    Geometry.interpolatePoints(pts);

    var last = null;
    for(var i = 0; i < pts.length; i++){
        var next = (i == pts.length-1 ? 0 : i+1);
        var prev = (i == 0 ? pts.length-1 : i-1);
        var id = findTileID(pts[prev],pts[i],pts[next]);
        var tile = ptToTile(pts[i]);

        // Prevent issues with double corners
        if((id == 1 && last == 3) && (ptToTile(pts[prev]).x - tile.x == 1)) id = 9; // top left after bottom right
        if((id == 3 && last == 1) && (ptToTile(pts[prev]).y - tile.y == -1)){
            id = 6;
            tile.x--;
        }
        if((id == 0 && last == 2) && (ptToTile(pts[prev]).y - tile.y == 1)){ // top right after bottom left
            id = 6;
            tile.x--;
        }

        switch(id){
            case 0: // top right outer
                var ref = {
                    x: tile.x-1,
                    y: tile.y
                };
                Engine.addTile(ref.x,ref.y-1,6);
                Engine.addTile(ref.x,ref.y,21);
                Engine.addTile(ref.x+1,ref.y,22);
                //&&
                if(last != 2 || (ptToTile(pts[prev]).y - tile.y > 2)) Engine.addTile(ref.x+1,ref.y+1,37);  // Prevent issues with double corners
                //console.log(JSON.stringify(tile));
                //console.log(JSON.stringify(ptToTile(pts[prev])));
                break;
            case 1: // top left outer
                var ref = {
                    x: tile.x,
                    y: tile.y
                };
                Engine.addTile(ref.x,ref.y-1,3);
                Engine.addTile(ref.x-1,ref.y,17);
                Engine.addTile(ref.x,ref.y,18);
                break;
            case 2: // bottom left outer
                Engine.addTile(tile.x,tile.y-2,6);
                Engine.addTile(tile.x,tile.y-1,21);
                break;
            case 3: // bottom right outer
                Engine.addTile(tile.x-2,tile.y-1,17);
                Engine.addTile(tile.x-1,tile.y-1,18);
                break;
            case 4: // bottom left inner
                var ref = {
                    x: tile.x-1,
                    y: tile.y
                };
                Engine.addTile(ref.x,ref.y-1,62);
                Engine.addTile(ref.x+1,ref.y-1,63);
                Engine.addTile(ref.x,ref.y,77);
                Engine.addTile(ref.x+1,ref.y,78);
                Engine.addTile(ref.x,ref.y+1,92);
                Engine.addTile(ref.x+1,ref.y+1,93);
                break;
            case 5: // bottom right inner
                var ref = {
                    x: tile.x,
                    y: tile.y
                };
                Engine.addTile(ref.x-1,ref.y-1,66);
                Engine.addTile(ref.x,ref.y-1,67);
                Engine.addTile(ref.x-1,ref.y,81);
                Engine.addTile(ref.x,ref.y,82);
                Engine.addTile(ref.x-1,ref.y+1,96);
                break;
            case 6: // top
                Engine.addTile(tile.x,tile.y-1,randomInt(4,6));
                break;
            case 7: // right
                Engine.addTile(tile.x,tile.y,52);
                break;
            case 8: // bottom
                var actualID = randomInt(79,81);
                Engine.addTile(tile.x,tile.y-1,actualID-15);
                Engine.addTile(tile.x,tile.y,actualID);
                Engine.addTile(tile.x,tile.y+1,actualID+15);
                break;
            case 9: // left
                Engine.addTile(tile.x-1,tile.y,randomElement([32,47]));
                break;
            case 10: // top right inner
                Engine.addTile(tile.x-1,tile.y,69);
                Engine.addTile(tile.x-1,tile.y+1,84);
                break;
            case 11: // top left inner
                var ref = {
                    x: tile.x,
                    y: tile.y+1
                };
                Engine.addTile(ref.x,ref.y,39);
                Engine.addTile(ref.x,ref.y-1,24);
                Engine.addTile(ref.x,ref.y+1,54);
        }
        var last = id;
    }
};

function ptToTile(pt){
    return {
        x: pt.x/Engine.tileWidth,
        y: pt.y/Engine.tileHeight
    };
}

function findTileID(prev,pt,next){
    var inAngle = computeAngle(prev,pt,true);
    var outAngle = computeAngle(pt,next,true);
    if(inAngle == 90 && outAngle == 180){
        //console.log('top right outer');
        return 0;
    }else if(inAngle == 180 && outAngle == 90){
        //console.log('bottom left outer');
        return 2;
    }else if(inAngle == -90 && outAngle == 0){
        //console.log('bottom left inner');
        return 4;
    }else if(inAngle == 180 && outAngle == -90){
        //console.log('top left outer');
        return 1;
    }else if(inAngle == -90 && outAngle == 180){
        return 3;
    }else if(inAngle == 0 && outAngle == 90){
        //console.log('bottom right inner');
        return 5;
    }else if(inAngle == 180 && outAngle == 180){
        //console.log('top');
        return 6;
    }else if(inAngle == 90 && outAngle == 90){
        //console.log('right');
        return 7;
    }else if(inAngle == 0 && outAngle == 0){
        //console.log('bottom');
        return 8;
    }else if(inAngle == -90 && outAngle == -90){
        //console.log('left');
        return 9;
    }else if(inAngle == 0 && outAngle == -90) {
        //console.log('top right inner');
        return 10;
    }else if(inAngle == 90 && outAngle == 0){
        //console.log('top left inner');
        return 11;
    }
}

Engine.addShell = function(worldx,worldy){
    var chunk = Engine.AOIs[Utils.tileToAOI({x:worldx,y:worldy})];
    Engine.addTile(worldx,worldy,1846);
};

Engine.capture = function(x,y,w,h){
    x -= Engine.camera.getPixelX();
    y -= Engine.camera.getPixelY();
    var patternCanvas=document.createElement("canvas");
    patternCanvas.width = w;
    patternCanvas.height = h;
    var patternCtx=patternCanvas.getContext("2d");
    patternCtx.drawImage(Engine.renderer.view,x,y,w,h,0,0,w,h);

    var capture=document.createElement("img");
    capture.src = patternCanvas.toDataURL("image/png");
    document.getElementById("captures").appendChild(capture);
};