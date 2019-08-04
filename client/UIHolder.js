/**
 * Created by jeren on 06-01-18.
 */
function UIHolder(x,y,align,style){
    this.slices = [];
    this.width = 1;
    this.width_ = this.width; // previous width
    this.align = align;

    if(!style) style = 'big';
    this.style = style;
    var sliceWidth, sliceHeight, fontSize, leftFrame, middleFrame, rightFrame, yOffset, xOffset;
    if(style == 'big'){
        sliceWidth = 32;
        sliceHeight = 64;
        fontSize = 32;
        yOffset = 5;
        xOffset = -5;
        leftFrame = 'title-left';
        middleFrame = 'title-center';
        rightFrame = 'title-right';
        this.depth = 3;
    }else if(style == 'small'){
        sliceWidth = 24;
        sliceHeight = 24;
        fontSize = 16;
        yOffset = 0;
        xOffset = 0;
        leftFrame = 'capsule-left';
        middleFrame = 'capsule-middle';
        rightFrame = 'capsule-right';
        this.depth = 4;
    }

    var xl, yl, xm, ym, xr, yr;
    yl = ym = yr = y;
    if(align == 'right'){
        xr = x - sliceWidth;
        xm = xr - this.width;
        xl = xm - sliceWidth;
    }else if(align == 'center'){
        xm = x;
        xl = xm - sliceWidth;
        xr = xm;
    }

    var textX = x + xOffset;
    var textY = y + yOffset;

    this.text = UI.scene.add.text(textX, textY, '', { font: fontSize+'px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });

    this.slices.push(UI.scene.add.sprite(xl,yl,'UI',leftFrame));
    this.slices.push(UI.scene.add.tileSprite(xm,ym,this.width,sliceHeight,'UI',middleFrame));
    this.slices.push(UI.scene.add.sprite(xr,yr,'UI',rightFrame));

    this.slices.forEach(function(e){
        e.setDepth(this.depth);
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setVisible(false);

        /*e.setInteractive();
        e.on('pointerover',function(){
            UI.manageCursor(1,'UI');
        });
        e.on('pointerout',function(){
            UI.manageCursor(0,'UI');
        });*/
    },this);

    this.text.setDepth(this.depth+1);
    this.text.setScrollFactor(0);
    if(this.align == 'right'){
        this.text.setOrigin(1,0);
    }else if(this.align == 'center'){
        this.text.setOrigin(0.5,0);
    }
    this.text.setVisible(false);
}

UIHolder.prototype.setText = function(text){
    this.text.setText(text);
    var w = (this.style == 'big' ? Math.max(this.text.width,150) : this.text.width);
    this.resize(w); // 170 to be long enough to allow displaying menu icons
};

UIHolder.prototype.resize = function(w){
    var left = this.slices[0];
    var middle = this.slices[1];
    var right = this.slices[2];
    var delta = this.width-w;

    if(this.align == 'right'){
        left.x += delta;
        middle.x += delta;
    }else if(this.align == 'center'){
        left.x += Math.floor(delta/2);
        middle.x += Math.floor(delta/2);
        right.x -= Math.floor(delta/2);
    }
    middle.width -= delta;

    this.width = w;
    this.width_ = this.width;
};

UIHolder.prototype.setButton = function(callback){
    var right = this.slices[2];
    var btn = new Button(right.x-2,right.y,'title-close',callback);
    right.destroy();
    this.slices[2] = btn;
    if(this.align == 'right') this.text.x -= 30;
    if(this.align == 'center') {
        this.slices.forEach(function (s) {
            s.x -= 15;
        });
        this.text.x -= 15;
    }
};

UIHolder.prototype.display = function(){
    this.slices.forEach(function(e){
        e.setVisible(true);
    });
    this.text.setVisible(true);
};

UIHolder.prototype.hide = function(){
    this.slices.forEach(function(e){
        e.setVisible(false);
    });
    this.text.setVisible(false);
};

UIHolder.prototype.getChildren = function(){
    return [this.text].concat(this.slices);
};