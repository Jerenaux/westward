/**
 * Created by jeren on 25-01-18.
 */

function LiquidBar(x,y,w,color){
    this.displayed = false;
    this.max = 100;
    this.level = 100;

    w -= 32;
    this.maxLength = w+9;

    this.body = [];
    this.body.push(Engine.scene.add.sprite(x,y,'UI','healthbar_left'));
    x += 24;
    this.body.push(Engine.scene.add.tileSprite(x,y,w,20,'UI','healthbar_middle'));
    x += w;
    this.body.push(Engine.scene.add.sprite(x,y,'UI','healthbar_right'));

    color = color || 'red';
    x -= w;
    x -= 15;
    y += 3;
    this.liquidBody = Engine.scene.add.tileSprite(x,y,50,14,'UI','progress_'+color+'_middle');
    this.body.push(this.liquidBody);
    x += 50;
    this.liquidHead = Engine.scene.add.sprite(x,y,'UI','progress_'+color+'_top');
    this.body.push(this.liquidHead);

    this.body.forEach(function(e){
        e.setDepth(Engine.UIDepth);
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setVisible(false);
    });
    this.body[2].setDepth(Engine.UIDepth+1);
};

LiquidBar.prototype.setLevel = function(level,max){
    if(max) this.max = max;
    var delta = Math.abs(this.level-level)/this.max;
    this.level = Utils.clamp(level,0,this.max);
    var pct = this.level/this.max;
    var newLength = Math.round(this.maxLength*pct);

    var dw = this.liquidBody.width - newLength;

    if(dw == 0) return;
    if(this.displayed){
        var duration = delta * 2000;
        var _head = this.liquidHead;
        var _lvl = this.level;
        Engine.scene.tweens.add(
            {
                targets: this.liquidBody,
                width: newLength,
                duration: duration,
                onStart: function(){
                    _head.setVisible(true);
                },
                onComplete: function(){
                    _head.setVisible(!(_lvl == 0));
                }
            });
        Engine.scene.tweens.add(
            {
                targets: this.liquidHead,
                x: '-='+dw,
                duration: duration
            });
    }else {
        this.liquidBody.width = newLength;
        this.liquidHead.x -= dw;
    }
};

LiquidBar.prototype.getPct = function(){
    return Math.floor((this.level/this.max)*100);
};

LiquidBar.prototype.display = function(){
    this.body.forEach(function(e){
        e.setVisible(true);
    });
    if(this.level == 0) this.liquidHead.setVisible(false);
    this.displayed = true;
};

LiquidBar.prototype.hide = function(){
    this.body.forEach(function(e){
        e.setVisible(false);
    });
    this.displayed = false;
};