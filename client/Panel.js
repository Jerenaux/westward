/**
 * Created by Jerome on 06-10-17.
 */
function Panel(startx,starty,width,height){
    this.container = [];
    var w = width - 2*32;
    var h = height - 2*32;

    var x = startx;
    var y = starty;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-topleft'));
    x += 32 + (w/2);
    y += 16;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,32,'UI','panel-top'));
    y -= 16;
    x += (w/2);
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-topright'));
    x = startx + 16;
    y += 32 + (h/2);
    this.container.push(Engine.scene.add.tileSprite(x,y,32,h,'UI','panel-left'));
    x += 32 + (w/2) - 16;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,h,'UI','panel-center'));
    x += (w/2) + 16;
    this.container.push(Engine.scene.add.tileSprite(x,y,32,h,'UI','panel-right'));
    y -= (h/2);
    x = startx;
    y += h;
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-bottomleft'));
    x += 32 + (w/2);
    y += 16;
    this.container.push(Engine.scene.add.tileSprite(x,y,w,32,'UI','panel-bottom'));
    y -= 16;
    x += (w/2);
    this.container.push(Engine.scene.add.sprite(x,y,'UI','panel-bottomright'));

    this.container.forEach(function(e){
        e.depth = Engine.UIDepth;
        e.setScrollFactor(0);
        if(e.constructor.name == 'Sprite'){
            //e.setDisplayOrigin(0,0);
            e.displayOriginX = 0;
            e.displayOriginY = 0;
        }
        e.setInteractive();
        e.visible = false;
    });
}

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
