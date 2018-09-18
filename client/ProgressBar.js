/**
 * Created by jeren on 25-01-18.
 */

function ProgressBar(x,y,w,mask){
    this.displayed = false;
    this.max = 100;
    this.level = 0;
    this.body = [];
    this.x = x;
    this.y = y;
    this.w = w;
    this.hasHead = false;
    this.hasTail = false;
    this.mask = mask;
}

ProgressBar.prototype.setUpZone = function(zone){
    zone.setDepth(10);
    zone.setScrollFactor(0);
    zone.setInteractive();
    zone.setVisible(false);
    var _bar = this;
    zone.on('pointerover',function(){
        UI.tooltip.updateInfo(_bar.level+'/'+_bar.max);
        UI.tooltip.display();
    });
    zone.on('pointerout',UI.tooltip.hide.bind(UI.tooltip));
    return zone;
};

ProgressBar.prototype.finalize = function(){
    this.body.forEach(function(e){
        e.setDepth(1);
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setVisible(false);
        if(this.mask) e.mask = this.mask;
    },this);
    this.body[2].setDepth(2);
};

ProgressBar.prototype.move = function(dx,dy){
    this.body.forEach(function(b){
        b.x += dx;
        b.y += dy;
    })
};

ProgressBar.prototype.reset = function(){
    if(this.bodyTween) this.bodyTween.stop();
    if(this.headTween) this.headTween.stop();
    this.level = this.max;
    this.barBody.width = this.maxLength;
    if(this.head) {
        this.head.x = this.fullX;
        this.head.setVisible(true);
    }
    if(this.tail) this.tail.setVisible(true);
};

ProgressBar.prototype.setCallback = function(callback){
    this.completionCallback = callback;
};

ProgressBar.prototype.setLevel = function(level,max,duration){
    if(max) this.max = max;
    var direction = Math.sign(this.level-level);
    var delta = Math.abs(this.level-level)/this.max; // Used to compute duration of tween
    this.level = Utils.clamp(level,0,this.max); // TODO: Tween this.level?
    var pct = this.level/this.max;
    var newLength = Math.round(this.maxLength*pct);
    var dw = this.barBody.width - newLength;

    if(dw == 0) return;
    if(this.displayed){
        var duration = duration || Math.max((delta * 2000),1);
        var _head = this.head;
        var _tail = this.tail;
        var _lvl = this.level;
        var _bar = this;
        if(this.bodyTween) this.bodyTween.stop();
        this.bodyTween = UI.scene.tweens.add(
            {
                targets: this.barBody,
                width: newLength,
                duration: duration,
                onStart: function(){
                    if(!_bar.displayed) return;
                    if(_head) _head.setVisible(true);
                    if(_tail) _tail.setVisible(true);
                },
                onComplete: function(){
                    if(!_bar.displayed) return;
                    // Deal with cases where the bar drops to 0, need to hide head and tail
                    if(_head && _head.visible) _head.setVisible(!(_lvl == 0));
                    if(_tail && _tail.visible) _tail.setVisible(!(_lvl == 0));
                    if(_bar.completionCallback) _bar.completionCallback();
                }
            });
        if(_head) {
            if(this.headTween) this.headTween.stop();
            this.headTween = Engine.scene.tweens.add(
                {
                    targets: this.head,
                    x: this.zeroX + newLength,
                    duration: duration,
                    delay: (direction == 1 ? 0 : 30)
                });
        }
    }else {
        this.barBody.width = newLength;
        if(this.head) this.head.x -= dw;
    }
};

ProgressBar.prototype.getPct = function(){
    return Math.floor((this.level/this.max)*100);
};

ProgressBar.prototype.display = function(){
    this.body.forEach(function(e){
        e.setVisible(true);
    });
    if(this.level == 0 && this.hasHead) this.head.setVisible(false);
    if(this.level == 0 && this.hasTail) this.tail.setVisible(false);
    if(this.zone) this.zone.setVisible(true);
    this.displayed = true;
};

ProgressBar.prototype.hide = function(){
    this.body.forEach(function(e){
        e.setVisible(false);
    });
    if(this.hasHead) this.head.setVisible(false);
    if(this.hasTail) this.tail.setVisible(false);
    if(this.zone) this.zone.setVisible(false);
    this.displayed = false;
};

// #######################

function MiniProgressBar(x,y,w,color,mask){
    ProgressBar.call(this,x,y,w,mask);

    this.maxLength = w;
    this.body.push(UI.scene.add.sprite(x,y,'UI','minibar_left'));
    x += 6;
    this.body.push(UI.scene.add.tileSprite(x,y,w-1,12,'UI','minibar_middle'));
    this.zeroX = x-2;
    x += w;
    this.body.push(UI.scene.add.sprite(x-1,y,'UI','minibar_right'));
    this.fullX = x-1;

    color = color || 'gold';
    x -= w;
    x -= 5;
    y += 2;
    this.tail = UI.scene.add.sprite(x,y,'UI','miniprogress_gold_left');
    this.body.push(this.tail);
    x += 4;
    this.barBody = UI.scene.add.tileSprite(x,y,1,8,'UI','miniprogress_gold_middle');
    this.body.push(this.barBody);
    x += 1;
    this.head = UI.scene.add.sprite(x,y,'UI','miniprogress_gold_right');
    this.body.push(this.head);
    this.setColor(color);

    this.hasHead = true;
    this.hasTail = true;

    this.finalize();
}

MiniProgressBar.prototype = Object.create(ProgressBar.prototype);
MiniProgressBar.prototype.constructor = MiniProgressBar;

MiniProgressBar.prototype.setColor = function(color){
    this.tail.setFrame('miniprogress_'+color+'_left');
    this.barBody.initWidth = this.barBody.width;
    this.barBody.initHeight = this.barBody.height;
    this.barBody.setFrame('miniprogress_'+color+'_middle');
    this.barBody.setSize(this.barBody.initWidth,this.barBody.initHeight);
    this.head.setFrame('miniprogress_'+color+'_right');
};

// #######################

function BigProgressBar(x,y,w,color,hasZone){
    ProgressBar.call(this,x,y,w);
    w -= 32;
    this.maxLength = w+9;

    this.body.push(UI.scene.add.sprite(x,y,'UI','healthbar_left'));
    x += 24;
    this.body.push(UI.scene.add.tileSprite(x,y,w,20,'UI','healthbar_middle'));
    this.zeroX = x-15;
    x += w;
    this.body.push(UI.scene.add.sprite(x,y,'UI','healthbar_right'));
    this.fullX = x;

    color = color || 'red';
    x -= w;
    x -= 15;
    y += 3;
    this.barBody = UI.scene.add.tileSprite(x,y,50,14,'UI','progress_'+color+'_middle');
    this.body.push(this.barBody);
    x += 50;
    this.head = UI.scene.add.sprite(x,y,'UI','progress_'+color+'_top');
    this.body.push(this.head);
    this.finalize();

    this.hasHead = true;
    if(hasZone) this.zone = this.createZone();
}

BigProgressBar.prototype = Object.create(ProgressBar.prototype);
BigProgressBar.prototype.constructor = BigProgressBar;

BigProgressBar.prototype.createZone = function(){
    var zone = UI.scene.add.zone(this.x,this.y,this.maxLength,20);
    this.setUpZone(zone);
    return zone;
};
