/**
 * Created by Jerome on 06-10-17.
 */
function Panel(x,y,width,height,title,slots){
    this.container = [];
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.makeBody();
    if(title) this.makeCapsule(title);
    if(slots) this.addSlots(slots);
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

Panel.prototype.addSlots = function(dimensions){
    //var padding = 20;
    /*var horizontalSpace = this.width - 2*padding;
    var verticalSpace = this.height - 2*padding;
    var nbHorizontal = Math.floor((horizontalSpace - 2*38)/36) + 2;
    var nbVertical = Math.floor((verticalSpace - 2*38)/36) + 2;*/
    var nbHorizontal = dimensions[0];
    var nbVertical = dimensions[1];
    var paddingX = (this.width - ((nbHorizontal-2)*36+(2*38)))/2;
    var paddingY = (this.height - ((nbVertical-2)*36+(2*38)))/2;
    var offsetx = 0;
    var offsety = 0;

    for(var x = 0; x < nbHorizontal; x++){
        for(var y = 0; y < nbVertical; y++){
            var frame = 'slots-';
            var center = 0;
            switch(y){
                case 0:
                    frame += 'top';
                    break;
                case nbVertical-1:
                    frame += 'bottom';
                    break;
                default:
                    center++;
                    break;
            }
            switch(x){
                case 0:
                    frame += 'left';
                    break;
                case nbHorizontal-1:
                    frame += 'right';
                    break;
                default:
                    center++;
                    break;
            }
            if(center == 2) frame += 'middle';
            offsetx = (x > 0 ? 2 : 0);
            offsety = (y > 0 ? 2 : 0);
            this.container.push(Engine.scene.add.sprite(this.x+paddingX+(x*36)+offsetx,this.y+paddingY+(y*36)+offsety,'UI',frame));
        }
    }
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
