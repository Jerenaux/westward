/**
 * Created by Jerome on 19-11-17.
 */

function Bubble(x,y,isNotification){
    this.container = [];
    this.x = x;
    this.y = y;
    this.isNotificiation = isNotification || false;
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
    var scene = (this.isNotificiation ? UI.scene : Engine.scene);
    this.container.push(scene.add.sprite(x,y,'bubble',0));
    x += 5;
    this.container.push(scene.add.tileSprite(x,y,w,5,'bubble',1));
    x += w;
    this.container.push(scene.add.sprite(x,y,'bubble',2));
    x = startx;
    y += 5;
    this.container.push(scene.add.tileSprite(x,y,5,h,'bubble',3));
    x += 5;
    this.container.push(scene.add.tileSprite(x,y,w,h,'bubble',4));
    x += w;
    this.container.push(scene.add.tileSprite(x,y,5,h,'bubble',5));
    y += h;
    x = startx;
    this.container.push(scene.add.sprite(x,y,'bubble',6));
    x += 5;
    this.container.push(scene.add.tileSprite(x,y,w,5,'bubble',7));
    x += w;
    this.container.push(scene.add.sprite(x,y,'bubble',8));
    y += 5;
    x -= 0.25*w;
    if(!this.isNotificiation) this.container.push(scene.add.sprite(x,y,'tail'));
    var textx = startx + 5;
    var texty = starty + 5;
    this.text = scene.add.text(textx, texty, "Hello world I'm new in Westward",
        { font: '12px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3,
            align: 'center',
            wordWrap: {width: w, useAdvancedWrap: true}
        }
    );
    this.container.push(this.text);
    this.width = w;
    this.height = h;
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
        e.setDepth(10);
        //e.depth = Engine.bubbleDepth;
        //if(this.isNotificiation) e.depth += 20;
        e.setDisplayOrigin(0,0);
        e.setVisible(false);
        if(this.isNotificiation) e.setScrollFactor(0);
        if(!isText) e.alpha = 0.7;
    }
};

Bubble.prototype.update = function(text){
    this.text.setText(text);
    this.resize(this.text.width,this.text.height);
};

Bubble.prototype.resize = function(width,height){
    var newWidth = Math.max(width,30);
    var newHeight = Math.max(height, 20);
    var dw = this.width - newWidth;
    var dh = this.height - newHeight;

    var last = this.container.length-1;
    var resizeWidthList = [1,4,7];
    var resizeHeightList = [3,4,5];
    var moveXList = [0,1,3,4,6,7,last];
    var moveYList = [0,1,2,3,4,5,last];

    var _slices = this.container;
    resizeWidthList.forEach(function(i){
        _slices[i].width -= dw;
    });
    resizeHeightList.forEach(function(i){
        _slices[i].height -= dh;
    });
    moveXList.forEach(function(i){
        _slices[i].x += dw;
    });
    moveYList.forEach(function(i){
        _slices[i].y += dh;
    });

    this.width = newWidth;
    this.height = newHeight;
};

Bubble.prototype.getWidth = function(){
    return (this.container[2].x+this.container[2].width)-this.container[0].x;
};

Bubble.prototype.getHeight = function(){
    return (this.container[8].y+this.container[8].height)-this.container[2].y;
};

Bubble.prototype.getOrigin = function(){
    return this.container[0].x;
};

Bubble.prototype.getCenter = function(){
    return this.container[1].x+(this.container[1].width/2);
};

Bubble.prototype.display = function(){
    this.container.forEach(function(e){
        e.setVisible(true);
    });
    if(this.timer) clearTimeout(this.timer);
    var _bubble = this;
    var duration = this.isNotificiation ? Engine.notificationDuration : 5000;
    this.timer = setTimeout(function(){
            _bubble.hide();
    },duration);
};

Bubble.prototype.hide = function(){
    this.container.forEach(function(e){
        e.setVisible(false);
    });
};