/**
 * Created by Jerome on 19-11-17.
 */

function Bubble(x,y){
    this.container = [];
    this.x = x;
    this.y = y;
    this.makeBubble(x,y);
    this.finalize();
}

Bubble.prototype.makeBubble = function(sx,sy){
    var startx = sx;
    var starty = sy;
    var y = starty;
    var x = startx;
    var w = 100;
    var h = 30;
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
    var text = Engine.scene.add.text(textx, texty, "Hello world",
        { font: '12px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3, wordWrap: 10}
    );
    this.container.push(text);
};

Bubble.prototype.updatePosition = function(nx,ny){
    var dx = nx - this.x;
    var dy = ny - this.y;
    if(dx == 0 && dy == 0) return;
    this.container.forEach(function(e){
        e.x += dx;
        e.y += dy;
    });
    this.x = nx;
    this.y = ny;
};

Bubble.prototype.finalize = function(){
    for(var i = 0; i < this.container.length; i++){
        var e = this.container[i];
        var isText = (e.constructor.name == 'Text');
        e.depth = Engine.bubbleDepth;
        e.setDisplayOrigin(0,0);
        if(!isText) e.alpha = 0.7;
    }
};