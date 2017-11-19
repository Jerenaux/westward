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
    var y = Engine.player.y - 100;
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
};

Bubble.prototype.finalize = function(){
    for(var i = 0; i < this.container.length; i++){
        var e = this.container[i];
        e.depth = Engine.UIDepth;
        e.setDisplayOrigin(0,0);
    }
};