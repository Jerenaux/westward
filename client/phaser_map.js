/**
 * Created by Jerome on 12-09-17.
 */

var config = {
    type: Phaser.WEBGL,
    width: 33*32,
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
    this.load.json('chunk0','assets/maps/pqchunks_flat/chunk0.json');
    this.load.json('chunk1','assets/maps/pqchunks_flat/chunk1.json');
    this.load.image('tileset','assets/tilesets/tilesheet.png');
}

function create(){
    game.sx = 0;
    game.layers = [];
    var layerData = this.cache.json.get('chunk0').layers;
    game.nextData = this.cache.json.get('chunk1').layers;
    console.log(game.nextData);
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
        game.layers[i] = this.make.tilemap(mapConfig);
    }
    game.dist = -1;

    //this.cameras.main.setBounds(0,0,5*32,5*32);
    //setInterval(step,500);
    //setTimeout(step,500);
}

function step(){
    game.sx += 32;
    if(game.sx == 32){
        game.dist++;
        for (var x = 0; x < 34; x++)
        {
            for (var y = 0; y < 20; y++)
            {
                for(var l = 0; l < game.layers.length; l++) {
                    var tile = game.layers[l].getTileAt(x, y);
                    if(x == 33){
                        var v = (y*34)+(game.dist%34);
                        var id = game.nextData[l].data[v];
                        //if(id > 0) tile.setId(id-1);
                        tile.setId(id > 0 ? id-1 : 473);
                    }else{
                        var next = game.layers[l].getTileAt((x+1)%34, y);
                        if(next.id > 0) tile.setId(next.id);
                    }
                }
            }
        }
        game.sx = 0;
    }

}

function update(){
    game.sx += 2;
    if(game.sx == 32){
        game.dist++;
        for (var x = 0; x < 34; x++)
        {
            for (var y = 0; y < 20; y++)
            {
                for(var l = 0; l < game.layers.length; l++) {
                    var tile = game.layers[l].getTileAt(x, y);
                    if(x == 33){
                        var v = (y*34)+(game.dist%34);
                        var id = game.nextData[l].data[v];
                        //if(id > 0) tile.setId(id-1);
                        tile.setId(id > 0 ? id-1 : 473);
                    }else{
                        var next = game.layers[l].getTileAt((x+1)%34, y);
                        if(next.id > 0) tile.setId(next.id);
                    }
                }
            }
        }
        game.sx = 0;
    }
    this.cameras.main.scrollX = game.sx;
}