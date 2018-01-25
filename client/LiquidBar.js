/**
 * Created by jeren on 25-01-18.
 */

function LiquidBar(x,y,w){
    this.displayed = false;
    this.max = 100;
    this.level = 100;

    w -= 32;
    this.maxLength = w+9;
    //this.currentLength = this.maxLength;

    this.body = [];
    this.body.push(Engine.scene.add.sprite(x,y,'UI','healthbar_left'));
    x += 24;
    this.body.push(Engine.scene.add.tileSprite(x,y,w,20,'UI','healthbar_middle'));
    x += w;
    this.body.push(Engine.scene.add.sprite(x,y,'UI','healthbar_right'));

    x -= w;
    x -= 15;
    y += 3;
    this.liquidBody = Engine.scene.add.tileSprite(x,y,50,14,'UI','health_middle');
    this.body.push(this.liquidBody);
    x += 50;
    this.liquidHead = Engine.scene.add.sprite(x,y,'UI','health_top');
    this.body.push(this.liquidHead);

    this.body.forEach(function(e){
        e.setDepth(Engine.UIDepth);
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setVisible(false);
    });
    this.body[2].setDepth(Engine.UIDepth+1);

    this.bodyTween = Engine.scene.tweens.add(
        {
            targets: this.liquidBody,
            width: 0,
            x: 0,
            duration: 1000,
            paused: true
        });
};

LiquidBar.prototype.setLevel = function(level,max){
    if(max) this.max = max;
    this.level = Utils.clamp(level,0,this.max);
    var pct = this.level/this.max;
    var newLength = Math.round(this.maxLength*pct);

    var dw = this.liquidBody.width - newLength;

    if(this.displayed){
        console.log('aiming ',newLength);
        this.bodyTween.updateTo('width',newLength,true);
        this.bodyTween.updateTo('x',500,true);
        this.bodyTween.play();
    }else {
        this.liquidBody.width = newLength;
        this.liquidHead.x -= dw;
    }

    //this.currentLength = this.liquidBody.width;

    if(this.displayed) this.liquidHead.setVisible(!(this.level == 0));
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