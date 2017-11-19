/**
 * Created by Jerome on 19-11-17.
 */

function Bubble(){
    this.container = [];
    this.makeBubble();
    this.finalize();
}

Bubble.prototype.makeBubble = function(){
    var startx = Engine.player.x - 100;
    var starty = Engine.player.y - 100;
    var y = starty;
    var x = startx;
    var w = 100;
    var h = 50;
    this.container.push(Engine.scene.add.sprite(x,y,'bubble',0));
    x += 5;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,5,'bubble',1));
    x += w;
    this.container.push(Engine.scene.add.sprite(x,y,'bubble',2));
    x = startx;
    y += 5;
    this.container.push(Engine.scene.add.tileSprite(x,y,5,h,'bubble',3));
    x += 5;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,h,'bubble',4));
    x += w;
    this.container.push(Engine.scene.add.tileSprite(x,y,5,h,'bubble',5));
    y += h;
    x = startx;
    this.container.push(Engine.scene.add.sprite(x,y,'bubble',6));
    x += 5;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,5,'bubble',7));
    x += w;
    this.container.push(Engine.scene.add.sprite(x,y,'bubble',8));
    y += 5;
    x -= 0.25*w;
    this.container.push(Engine.scene.add.sprite(x,y,'tail'));
    var textx = startx + 5;
    var texty = starty + 5;
    var text = Engine.scene.add.text(textx, texty, "Hello world, this is a test",
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.container.push(text);
};

Bubble.prototype.finalize = function(){
    for(var i = 0; i < this.container.length; i++){
        var e = this.container[i];
        var isText = (e.constructor.name == 'Text');
        e.depth = Engine.UIDepth;
        e.setDisplayOrigin(0,0);
        if(!isText) e.alpha = 0.7;
    }
};