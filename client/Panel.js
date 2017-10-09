/**
 * Created by Jerome on 06-10-17.
 */
function Panel(x,y,width,height,title){
    this.container = [];
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.makeBody();
    if(title) this.makeCapsule(title);
    this.finalize();
}

Panel.prototype.makeBody = function(){
    var w = this.width - 2*32;
    var h = this.height - 2*32;

    var x = this.x;
    var y = this.y;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-topleft'));
    x += 32;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,32,'UI','panel-top'));
    x += w;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-topright'));
    x = this.x;
    y += 32;
    this.container.push(Engine.scene.add.tileSprite(x,y,32,h,'UI','panel-left'));
    x += 32;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,h,'UI','panel-center'));
    x += w;
    this.container.push(Engine.scene.add.tileSprite(x,y,32,h,'UI','panel-right'));
    x = this.x;
    y += h;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-bottomleft'));
    x += 32;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,32,'UI','panel-bottom'));
    x += w;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-bottomright'));
};

Panel.prototype.makeCapsule = function(title){
    var x = this.x + 20;
    var y = this.y - 9;

    var text = Engine.scene.add.text(x+10, y, title,
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    var w = text.width -25;
    this.container.push(text);
    this.container.push(Engine.scene.add.sprite(x,y,'UI','capsule-left'));
    x += 24;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,24,'UI','capsule-middle'));
    x += w;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','capsule-right'));
};

Panel.prototype.finalize = function(){
    this.container.forEach(function(e){
        var isText = (e.constructor.name == 'Text');
        e.depth = Engine.UIDepth;
        if(isText) e.depth++;
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setInteractive();
        e.visible = false;
    });
};

Panel.prototype.display = function(){
    for(var i = 0; i < this.container.length; i++){
        this.container[i].visible = true;
    }
};

Panel.prototype.hide = function(){
    for(var i = 0; i < this.container.length; i++){
        this.container[i].visible = false;
    }
};
