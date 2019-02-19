var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('volcano', 'assets/pics/the-end-by-iloe-and-made.jpg');
    this.load.image('hotdog', 'assets/sprites/hotdog.png');
}

function create ()
{
    var volcano = this.add.image(400, 300, 'volcano');
    var hd = this.add.image(250, 100, 'hotdog')

    var rt = this.add.renderTexture(0,0,800,600);
    rt.fill(0x000000);

    var circle = this.add.circle(100,100,100,0xffffff);
    rt.draw(circle,200,100);
    circle.destroy();


     var gl = this.sys.game.renderer.gl;
    var renderer = this.sys.game.renderer;

    var modeIndex = renderer.addBlendMode([ gl.ZERO, gl.SRC_COLOR ], gl.FUNC_ADD);
    rt.setBlendMode(modeIndex);
}

function update (time, delta)
{
}
