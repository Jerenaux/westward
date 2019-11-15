/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 31-08-19.
 */
function Capsule(scene,x,y,iconAtlas,iconFrame,container){
    this.scene = scene;
    this.slices = [];
    this.icon = null;
    this.width = 1;
    this.width_ = this.width;  // previous width
    var capsuleDepth = 2;
    var contentDepth = 3;

    if(iconFrame) {
        this.icon = this.scene.add.sprite(x+8,y+6,iconAtlas,iconFrame);
        this.icon.setDepth(contentDepth);
        this.icon.setScrollFactor(0);
        this.icon.setDisplayOrigin(0,0);
        this.icon.setVisible(false);
    }
    var textX = (this.icon ? x + this.icon.width : x) + 10;
    var textY = (this.icon ? y +1: y+2);

    this.text = this.scene.add.text(textX, textY, '',
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );

    this.slices.push(this.scene.add.sprite(x,y,'UI','capsule-left'));
    x += 24;
    this.slices.push(this.scene.add.tileSprite(x,y,this.width,24,'UI','capsule-middle'));
    x += this.width;
    this.slices.push(this.scene.add.sprite(x,y,'UI','capsule-right'));

    this.slices.forEach(function(e){
        e.setDepth(capsuleDepth);
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setVisible(false);
        if(container) container.push(e); // don't use concat
    });

    this.text.setDepth(contentDepth);
    this.text.setScrollFactor(0);
    this.text.setDisplayOrigin(0,0);
    this.text.setVisible(false);

    if(container) {
        container.push(this.text);
        if (this.icon) container.push(this.icon);
    }
}

Capsule.prototype.setHoverText = function(tooltip,title,text){
    var w = this.slices[0].width + this.slices[1].width + this.slices[2].width;
    var zone = this.scene.add.zone(this.slices[0].x,this.slices[0].y,w,this.slices[1].height);
    zone.setDepth(10);
    zone.setOrigin(0);
    zone.setScrollFactor(0);
    zone.setInteractive();
    zone.setVisible(false);
    zone.on('pointerover',function(){
        tooltip.updateInfo('free',{title:title,body:text});
        tooltip.display();
    });
    zone.on('pointerout',function(){
        tooltip.hide();
    });
    this.zone = zone;
};

Capsule.prototype.setText = function(text){
    this.text.setText(text);
    this.width = this.text.width -25;
    if(this.icon) this.width += this.icon.width;

    this.slices[1].width = this.width;
    if(this.extraW) this.slices[1].width += this.extraW;
    this.slices[2].x += (this.width-this.width_);

    this.width_ = this.width;

    if(this.zone){
        var w = this.slices[0].width + this.slices[1].width + this.slices[2].width;
        this.zone.setSize(w,this.zone.height,true);
    }
};

Capsule.prototype.removeLeft = function(){
    //var w = this.slices[0].width;
    //console.warn(w);
    this.extraW = 17;
    this.slices[0].destroy();
    this.slices[1].x -= this.extraW;
};

Capsule.prototype.display = function(){
    this.slices.forEach(function(e){
        e.setVisible(true);
    });
    this.text.setVisible(true);
    if(this.zone) this.zone.setVisible(true);
    if(this.icon) this.icon.setVisible(true);
};

Capsule.prototype.hide = function(){
    this.slices.forEach(function(e){
        e.setVisible(false);
    });
    this.text.setVisible(false);
    if(this.zone) this.zone.setVisible(false);
    if(this.icon) this.icon.setVisible(false);
};

Capsule.prototype.move = function(dx,dy){
    this.slices.forEach(function(e){
        e.x += dx;
        e.y += dy;
    });
    this.text.x += dx;
    this.text.y += dy;
    if(this.icon) {
        this.icon.x += dx;
        this.icon.y += dy;
    }
};

export default Capsule