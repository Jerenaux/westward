/**
 * Created by Jerome on 29-11-17.
 */

function Tooltip(){
    this.x = 100;
    this.y = 100;
    this.width = 50;
    this.height = 50;
    this.container = [];
    this.displayed = false;
    this.text = Engine.scene.add.text(this.x+13,this.y+4, 'Lorem ipsum',
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.makeBody();
    this.container.push(this.text);
    this.finalize();
}

Tooltip.prototype.makeBody = function(){
    var sideWidth = 13;
    var x = this.x;
    var y = this.y;
    var w = this.width;
    var h = this.height;
    this.container.push(Engine.scene.add.sprite(x,y,'tooltip',0));
    x += sideWidth;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,sideWidth,'tooltip',1));
    x += w;
    this.container.push(Engine.scene.add.sprite(x,y,'tooltip',2));
    x = this.x;
    y += sideWidth;
    this.container.push(Engine.scene.add.tileSprite(x,y,sideWidth,h,'tooltip',3));
    x += sideWidth;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,h,'tooltip',4));
    x += w;
    this.container.push(Engine.scene.add.tileSprite(x,y,sideWidth,h,'tooltip',5));
    x = this.x;
    y += h;
    this.container.push(Engine.scene.add.sprite(x,y,'tooltip',6));
    x += sideWidth;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,sideWidth,'tooltip',7));
    x += w;
    this.container.push(Engine.scene.add.sprite(x,y,'tooltip',8));
};

Tooltip.prototype.display = function(x,y,text){
    var dx = x - this.x;
    var dy = y - this.y;
    this.updatePosition(dx,dy);

    this.container.forEach(function(e){
        e.visible = true;
    });

    if(text) {
        this.text.setText(text);
        this.updateSize();
    }

    this.displayed = true;
};

Tooltip.prototype.updatePosition = function(dx,dy){
    if(dx == 0 && dy == 0) return;
    this.container.forEach(function(e){
        e.x += dx;
        e.y += dy;
    });

    this.x += dx;
    this.y += dy;
};

Tooltip.prototype.updateSize = function(){
    var dw = this.width - this.text.width;
    var dh = this.height - (this.text.height);
    this.width = this.text.width;
    this.height = this.text.height;
    //console.log(this.text.width,this.text.height);

    this.container[1].width = this.text.width;
    this.container[2].x -= dw;
    this.container[3].height = this.text.height;
    this.container[4].width = this.text.width;
    this.container[4].height = this.text.height;
    this.container[5].x -= dw;
    this.container[5].height = this.text.height;
    this.container[6].y -= dh;
    this.container[7].y -= dh;
    this.container[7].width = this.text.width;
    this.container[8].x -= dw;
    this.container[8].y -= dh;
};

Tooltip.prototype.hide = function(){
    this.container.forEach(function(e){
        e.visible = false;
    });
    this.displayed = false;
};

Tooltip.prototype.finalize = function(){
    this.container.forEach(function(e){
        var isText = (e.constructor.name == 'Text');
        if(e.depth == 1 || !e.depth) e.depth = Engine.tooltipDepth;
        if(isText) e.depth++;
        e.setScrollFactor(0);
        //if(e.constructor.name == 'TileSprite') e.setDisplayOrigin(0,0);
        if(!e.centered) e.setDisplayOrigin(0,0);
        if(!e.notInteractive) e.setInteractive();
        e.visible = false;
    });
};

