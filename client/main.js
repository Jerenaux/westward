
var VIEW_WIDTH = 32;
var VIEW_HEIGHT = 18;
var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;

var config = {
    type: Phaser.AUTO,
    width: VIEW_WIDTH*TILE_WIDTH,
    height: VIEW_HEIGHT*TILE_HEIGHT,
    parent: 'game',
    scene: [Boot, Engine]
};

var game = new Phaser.Game(config);