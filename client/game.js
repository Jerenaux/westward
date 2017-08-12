/**
 * Created by Jerome on 03-03-16.
 */
/*
 * Author: Jerome Renaux
 * E-mail: jerome.renaux@gmail.com
 */

var Game = {};

Game.preload = function() {
    var lastChunk = 95;
    game.load.spritesheet('tileset', 'assets/tilesets/tilesheet.png',32,32);
    console.time("preload");
    for(var i = 0; i <= lastChunk; i++) {
        game.load.tilemap('chunk'+i, 'assets/maps/chunks/chunk'+i+'.json', null, Phaser.Tilemap.TILED_JSON);
    }
    console.timeEnd("preload");
    game.load.image('sprite', 'assets/sprites/phaser_0.png');
};

Game.create = function(){
    var AOIwidth = 34; // 6 AOIs horizontally
    var AOIheight = 20; // 16 AOIs vertically
    var nbAOIhoriz = 6;
    /*
    * TODO:
    * - Create chunks at and around start pos
    * - Upon moving, create new chunks
    * - Upon moving, erase old chunks
    * - Maintain fixed world size?
    * - Load chunks on the fly instead of preload
    * - http://evilmousestudios.com/optimizing-javascript-games/
    * - Flatten tiles in one single sprite per chunk/one per chunk per layer?
    * Check PartileContainers, culling, ...
    * - Disable antialiasing?
    * - Enable mipmap?
    * */

    var startx = 0;
    var starty = 0;

    console.time("create");
    var currentAOI = Game.coordinatesToAOI(startx,starty);
    console.log('current AOI : '+currentAOI);
    /*Game.map = game.add.tilemap('chunk47',32,32);
    Game.map.addTilesetImage('tilesheet', 'tileset');
    for(var i = 0; i < Game.map.layers.length; i++) {
        Game.map.createLayer(Game.map.layers[i].name,0,0);
    }*/
    Game.map = game.add.tilemap(null,32,32);
    Game.map.addTilesetImage('tilesheet', 'tileset');
    Game.map.gameLayers = [];

    var nblayers = 5;
    var chunksw = 1;
    var chunksh = 1;

    for(var i = 0; i < nblayers; i++) {
        Game.map.gameLayers[i] = Game.map.createBlankLayer('layer'+i,34*chunksw,20*chunksh,Game.map.tileWidth,Game.map.tileHeight);
        //Game.map.gameLayers[i].fixedToCamera = false;
        //Game.map.layers[Game.map.getLayer(Game.map.gameLayers[i])].width = 34*2;
    }
    //game.world.resize(34*32*chunksw,20*32*chunksh); // important
    game.world.setBounds(0,0,34*32*chunksw,20*32*chunksh);

    Game.displayChunk(0);

    chunksw = 2;
    console.log(Game.map.layers[Game.map.getLayer(Game.map.gameLayers[0])]);
    for(var i = 0; i < nblayers; i++) {
        Game.map.layers[Game.map.getLayer(Game.map.gameLayers[i])].width = 34*1; // important too!
        //Game.map.layers[i].x = 34*20*32;
    }
    //game.world.resize(34*32*chunksw,20*32*chunksh); // important
    game.world.setBounds(20*32,0,34*32*1,20*32*1);

    Game.displayChunk(1);

    console.timeEnd("create");
    //game.world.resize(34*32*chunksw,20*32*chunksh); // important

    Game.hero = game.add.sprite(30*32,2*32,'sprite'); // game.world.width/2,game.world.height/2
    Game.hero.mapX = startx;
    Game.hero.mapY = starty;
    Game.hero.anchor.set(0.5);
    game.camera.follow(Game.hero);
};

Game.displayChunk = function(aoi){
    var AOIwidth = 34; // 6 AOIs horizontally
    var AOIheight = 20; // 16 AOIs vertically
    var nbAOIhoriz = 6;
    var aoiX = (aoi%nbAOIhoriz)*AOIwidth;
    var aoiY = Math.floor(aoi/nbAOIhoriz)*AOIheight;
    console.log('Chunk at '+aoiX+', '+aoiY);

    var buff = game.cache.getTilemapData('chunk'+aoi);
    //console.log(buff);
    console.log(buff.data.layers.length+' layers');
    //if(Game.map.tilesets[0].tileProperties === undefined) Game.map.tilesets[0].tileProperties = buff.data.tilesets[0].tileproperties;
    for (var l = 0; l < buff.data.layers.length; l++) {
        var dataLayer = buff.data.layers[l];
        var mapLayer = Game.map.gameLayers[l];
        for(var i = 0; i < dataLayer.data.length; i++){
            var tile = dataLayer.data[i]-1;
            if(tile) {
                var x = aoiX + (i%AOIwidth);
                var y = aoiY + Math.floor(i/AOIwidth);
                //var x = -17 + (i%AOIwidth);
                //var y = -10 + Math.floor(i/AOIwidth);
                Game.map.putTile(tile,x,y, mapLayer);
            }
        }
        mapLayer.position.x = -1000;
    }
};

Game.coordinatesToAOI = function(x,y){
    var AOIwidth = 34; // 6 AOIs horizontally
    var AOIheight = 20; // 16 AOIs vertically
    var nbAOIhoriz = 6;
    var nbAOIvert = 16;
    var top = Math.floor(y/AOIheight);
    var left = Math.floor(x/AOIwidth);
    return (top*nbAOIhoriz)+left;
};

Game.update = function(){

};

Game.shutdown = function(){

};