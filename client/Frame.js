/**
 * Created by jeren on 30-12-17.
 */

function Frame(x,y,w,h,invisible){
    this.slices = [];
    this.content = [];
    this.x = x;
    this.y = y;
    this.x_ = x; // previous x and y coordinates
    this.y_ = y;
    this.width = w;
    this.height = h;
    this.showTween = null;
    this.hideTween = null;
    this.displayed = false;
    if(!invisible) this.makeFrame();
}

// CONTENT

Frame.prototype.makeFrame = function(){
    var sideWidth = 32;

    var w = this.width - 2*sideWidth;
    var h = this.height - 2*sideWidth;

    var x = this.x;
    var y = this.y;
    this.slices.push(UI.scene.add.sprite(x,y,'UI','panel-topleft'));
    x += sideWidth;
    this.slices.push(UI.scene.add.tileSprite(x,y,w,sideWidth,'UI','panel-top'));
    x += w;
    this.slices.push(UI.scene.add.sprite(x,y,'UI','panel-topright'));
    x = this.x;
    y += sideWidth;
    this.slices.push(UI.scene.add.tileSprite(x,y,sideWidth,h,'UI','panel-left'));
    x += sideWidth;

    var center = UI.scene.add.tileSprite(x,y,w,h,'UI','panel-center');
    this.slices.push(center);
    x += w;
    this.slices.push(UI.scene.add.tileSprite(x,y,sideWidth,h,'UI','panel-right'));
    x = this.x;
    y += h;
    this.slices.push(UI.scene.add.sprite(x,y,'UI','panel-bottomleft'));
    x += sideWidth;
    this.slices.push(UI.scene.add.tileSprite(x,y,w,sideWidth,'UI','panel-bottom'));
    x += w;
    this.slices.push(UI.scene.add.sprite(x,y,'UI','panel-bottomright'));

    this.finalize();
};

// BEHAVIOR

Frame.prototype.setTweens = function(sx,sy,ex,ey,duration){
    var _this = this;
    this.showTween = Engine.scene.tweens.add({
        targets: this,
        x: ex,
        y: ey,
        ease: 'Bounce.easeOut',
        paused: true,
        onStart: function(){
            //console.log('show start');
        },
        onUpdate: function(){
            _this.updatePosition();
        },
        duration: duration
    });
    this.hideTween = Engine.scene.tweens.add({
        targets: this,
        x: sx,
        y: sy,
        paused: true,
        onStart: function(){
            //console.log('hide start');
        },
        onUpdate: function(){
            _this.updatePosition();
        },
        onComplete: function(){
            _this.hideFrame();
        },
        duration: 200
    });
};

Frame.prototype.setPosition = function(x,y){
    this.x_ = x;
    this.y_ = y;
    console.log('positioning at',x,y);
    this.updatePosition();
};

Frame.prototype.updatePosition = function(){
    var dx = this.x - this.x_;
    var dy = this.y - this.y_;
    console.log(dx,dy);
    if(dx == 0 && dy == 0) return;
    this.slices.forEach(function(e){
        e.x += dx;
        e.y += dy;
    });
    this.content.forEach(function(e){
        e.x += dx;
        e.y += dy;
    });
    this.x_ = this.x;
    this.y_ = this.y;
};

Frame.prototype.toggle = function(){
    if(this.displayed){
        this.hide();
    }else{
        this.display();
    }
};

Frame.prototype.display = function(){
    this.slices.forEach(function(e){
        e.setVisible(true);
    });
    if(this.showTween) this.showTween.play();
    this.displayed = true;
};

Frame.prototype.hide = function(){
    if(this.hideTween){
        this.hideTween.play();
    }else{
        this.hideFrame();
    }
};

Frame.prototype.hideFrame = function(){
    this.slices.forEach(function(e){
        e.setVisible(false);
    });
    this.content.forEach(function(e){
        e.setVisible(false);
    });
    this.displayed = false;
};

Frame.prototype.finalize = function(){
    this.slices.forEach(function(e){
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setVisible(false);
    });
};

Frame.prototype.moveUp = function(nb){
    this.slices.forEach(function(e){
        e.setDepth(e.depth+nb);
    });
    this.content.forEach(function(e){
        e.setDepth(e.depth+nb);
    });
    if(this.button) this.button.moveUp(nb);
};