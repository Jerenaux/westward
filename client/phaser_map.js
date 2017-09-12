/**
 * Created by Jerome on 12-09-17.
 */

var config = {
    type: Phaser.WEBGL,
    width: 34*32,
    height: 20*32,
    parent: 'game',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload(){
    this.load.json('chunk','assets/maps/pqchunks/chunk0.json');
    this.load.image('tileset','assets/tilesets/tilesheet.png');
}

function create(){
    console.log(this.cache.json.get('chunk'));
    var layerData = this.cache.json.get('chunk').layers;
    for(var i = 0; i < layerData.length; i++){
        if(!layerData[i].data) continue;
        var mapConfig = {
            map: {
                data: layerData[i].data.map(function(x){
                    return x-1;
                }),
                width: 34,
                height: 20
            },
            tile: {
                width: 32,
                height: 32,
                texture: 'tileset'
            }
        };
        game.map = this.make.tilemap(mapConfig);
    }
    //this.cameras.main.setBounds(0,0,34*32,20*32);
}

function update(){

}