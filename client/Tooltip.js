/**
 * Created by Jerome on 29-11-17.
 */

function Tooltip(){
    this.x = 100;
    this.y = 100;
    this.xOffset = 20;
    this.yOffset = 10;
    this.width = 50;
    this.height = 10;
    this.MIN_WIDTH = 65;
    this.container = [];
    this.icons = [];
    this.iconsTexts = [];
    this.displayed = false;
    this.text = Engine.scene.add.text(this.x+13,this.y+4, '',
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.makeBody();
    this.makeStatsIcons();
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

Tooltip.prototype.makeStatsIcons = function(){
    for(var i = 0; i < Stats.list.length; i++) {
        var s = Stats.dict[Stats.list[i]];
        var x = this.x+15;
        var y = this.y+(30*(i+1));
        var icon = Engine.scene.add.sprite(x,y,'icons2', s.frame);
        var text = Engine.scene.add.text(x+30,y+2, '100',
            { font: '12px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
        );
        icon.dontDisplay = true;
        text.dontDisplay = true;
        this.icons.push(icon);
        this.iconsTexts.push(text);
        this.container.push(icon);
        this.container.push(text);
    }
};

Tooltip.prototype.updateInfo = function(name, effects){
    effects = effects || {};
    if(name) {
        this.text.setText(name);
        var nbEffects = Object.keys(effects).length;
        this.updateSize(nbEffects);
        for(var i = 0; i < Stats.list.length; i++){
            this.icons[i].setVisible((i < nbEffects));
            this.iconsTexts[i].setVisible((i < nbEffects));
            if(i < nbEffects){
                var key = Object.keys(effects)[i];
                var val = effects[key];
                var s = Stats.dict[key];
                if(val > 0) val = "+"+val;
                if(s.suffix) val = val+s.suffix;
                this.icons[i].setFrame(s.frame);
                this.iconsTexts[i].setText(val);
            }
        }
    }
};

// Called from Engine.trackMouse()
Tooltip.prototype.updatePosition = function(x,y){
    x += this.xOffset;
    y += this.yOffset;
    if(x > Engine.scene.game.config.width - this.width - 20) {
        x -= this.width;
        y += 20;
    }
    var dx = x - this.x;
    var dy = y - this.y;
    if(dx == 0 && dy == 0) return;
    this.container.forEach(function(e){
        e.x += dx;
        e.y += dy;
    });

    this.x += dx;
    this.y += dy;
};

Tooltip.prototype.updateSize = function(nbEffects){
    var w = Math.max(this.text.width,this.MIN_WIDTH);
    var h = this.text.height - 15 + (nbEffects*30);
    var dw = this.width - w;
    var dh = this.height - h;
    this.width = w;
    this.height = h;

    this.container[1].width = w;
    this.container[2].x -= dw;

    this.container[3].height = h;
    this.container[4].width = w;
    this.container[4].height = h;
    this.container[5].x -= dw;
    this.container[5].height = h;

    this.container[6].y -= dh;
    this.container[7].y -= dh;
    this.container[7].width = w;
    this.container[8].x -= dw;
    this.container[8].y -= dh;
};

Tooltip.prototype.display = function(){
    this.container.forEach(function(e){
        if(!e.dontDisplay) e.visible = true;
    });
    this.displayed = true;
};

Tooltip.prototype.hide = function(){
    this.text.setText("");
    this.container.forEach(function(e){
        e.setVisible(false);
    });
    this.icons.forEach(function(e){
        e.setVisible(false);
    });
    this.displayed = false;
};

Tooltip.prototype.finalize = function(){
    this.container.forEach(function(e){
        var isText = (e.constructor.name == 'Text');
        if(e.depth == 1 || !e.depth) e.setDepth(Engine.tooltipDepth);
        if(isText) e.depth++;
        e.setScrollFactor(0);
        if(!e.centered) e.setDisplayOrigin(0,0);
        if(!e.notInteractive) e.setInteractive();
        e.setVisible(false);
        if(e.lol) console.log(e);
    });
};

