/**
 * Created by Jerome on 13-09-17.
 */

var config = {
    type: Phaser.WEBGL,
    width: 32*32,
    height: 18*32,
    parent: 'game',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload(){
    this.load.spritesheet('tileset','assets/tilesets/tilesheet.png',{frameWidth:32,frameHeight:32});
    /*this.load.spritesheet({
        key: 'tileset',
        texture: 'assets/tilesets/tilesheet.png',
        frameWidth: 32,
        frameHeight: 32
    });*/
    /*this.load.image({
        key: 'tileset',
        texture: 'assets/tilesets/tilesheet.png',
        frameWidth: 32,
        frameHeight: 32
    });*/
    //this.load.image({key:'tileset',texture:'assets/tilesets/tilesheet.png'});
    this.load.image('hero','assets/sprites/hero.png');

}

var Engine = {
    nbChunksHorizontal: 6,
    lastChunkID: 96
};

function create(){
    Game = game.scene.scenes[0];
    var start = new Phaser.Geom.Point(30,10);
    var aoi = getAOI(start.x,start.y);
    var adjacent = Utils.listAdjacentAOIs(aoi);
    adjacent.forEach(function(aoi){
        loadChunk(aoi,displayChunk);
    });
    //loadChunk(aoi,displayChunk);
    game.hero = this.add.sprite(start.x*32,start.y*32,'hero');
    game.hero.z = 1;
    var cam = this.cameras.main;
    console.log(cam);
    cam.zoom = 0.25;
    cam.setBounds(0,0,100*32,100*32);
    cam.startFollow(game.hero);
    Scene = this.scene.scene;
    console.log(Scene);
    this.input.events.on('MOUSE_DOWN_EVENT', function (event) {
        //var x = Math.floor((cam.scrollX + event.x)/32);
        game.hero.x = cam.scrollX+(event.x*cam.zoom);
        game.hero.y = cam.scrollY+(event.y*cam.zoom);
        var aoi = getAOI(Math.floor(game.hero.x/32),Math.floor(game.hero.y/32));
        console.log('aoi : '+aoi);
        var adjacent = Utils.listAdjacentAOIs(aoi);
        adjacent.forEach(function(aoi){
            loadChunk(aoi,displayChunk);
        });
    });

}

function update(){

}

function getAOI(x,y){
    var top = Math.floor(y/20);
    var left = Math.floor(x/34);
    if(left < 0) left = 0;
    if(top < 0) top = 0;
    var aoi = (top*6)+left;
    return aoi;
}

function loadChunk(id,callback){
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'assets/maps/pqchunks_flat/chunk'+id+'.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(JSON.parse(xobj.responseText),id);
        }
    };
    xobj.send(null);
}

function displayChunk(data,chunkID){
    console.log('displayin '+chunkID);
    var ox = (chunkID%6)*34;
    var oy = Math.floor(chunkID/6)*20;
    for (var l = 0; l < data.layers.length; l++) {
        for(var i = 0; i < data.layers[l].data.length; i++){
            var tile = data.layers[l].data[i] - 1;
            if(tile == -1) continue;
            var x = ox + i%34;
            var y = oy + Math.floor(i/34);
            Scene.add.image(x*32,y*32,'tileset',tile);
        }
    }
    //storeChunk(data,chunkID);
}