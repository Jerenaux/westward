/**
 * Created by Jerome on 06-10-17.
 */

function Panel(x,y,width,height,title,invisible){
    Frame.call(this,x,y,width,height,invisible);
    this.capsules = {};
    if(title) this.addCapsule('title',20,-9,title);
}

Panel.prototype = Object.create(Frame.prototype);
Panel.prototype.constructor = Panel;

Panel.prototype.addCapsule = function(name,x,y,text,icon){
    var capsule = new Capsule(this.x+x,this.y+y,icon,this.content);
    capsule.setText(text);
    this.capsules[name] = capsule;
};

Panel.prototype.updateCapsule = function(name,text){
    this.capsules[name].setText(text);
};

Panel.prototype.addButton = function(x,y,color,symbol,callback){
    x += this.x;
    y += this.y;
    var ring = Engine.scene.add.sprite(x,y,'UI','ring');
    ring.setDepth(Engine.UIDepth+2);
    ring.setScrollFactor(0);
    ring.setDisplayOrigin(0,0);
    ring.setVisible(false);
    this.content.push(ring);

    x += 5;
    y += 5;

    var btn = new Button(x,y,color,callback);
    this.content.push(btn);
    x += 3;
    y += 3;

    var s = Engine.scene.add.sprite(x,y,'UI',symbol);
    s.setDepth(Engine.UIDepth+3);
    s.setScrollFactor(0);
    s.setDisplayOrigin(0,0);
    s.setVisible(false);
    this.content.push(s);

    return {
        btn: btn,
        symbol: s,
        ring: ring
    };
};

Panel.prototype.display = function(){
    Frame.prototype.display.call(this);
    for(var capsule in this.capsules){
        this.capsules[capsule].display();
    }
};

function Capsule(x,y,icon,container){
    this.slices = [];
    this.icon = null;
    this.width = 1;
    this.width_ = this.width; // previous width
    
    if(icon) {
        this.icon = Engine.scene.add.sprite(x+8,y+6,'UI',icon);
        this.icon.setDepth(Engine.UIDepth+2);
        this.icon.setScrollFactor(0);
        this.icon.setDisplayOrigin(0,0);
        this.icon.setVisible(false);
    }
    var textX = (this.icon ? x + this.icon.width : x) + 10;
    var textY = (this.icon ? y - 1: y);

    this.text = Engine.scene.add.text(textX, textY, '',
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );

    this.slices.push(Engine.scene.add.sprite(x,y,'UI','capsule-left'));
    x += 24;
    this.slices.push(Engine.scene.add.tileSprite(x,y,this.width,24,'UI','capsule-middle'));
    x += this.width;
    this.slices.push(Engine.scene.add.sprite(x,y,'UI','capsule-right'));

    this.slices.forEach(function(e){
        e.setDepth(Engine.UIDepth+1);
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setVisible(false);
        container.push(e); // don't use concat
    });

    this.text.setDepth(Engine.UIDepth+2);
    this.text.setScrollFactor(0);
    this.text.setDisplayOrigin(0,0);
    this.text.setVisible(false);

    container.push(this.text);
    if(this.icon) container.push(this.icon);
}

Capsule.prototype.setText = function(text){
    this.text.setText(text);
    this.width = this.text.width -25;
    if(this.icon) this.width += this.icon.width;

    this.slices[1].width = this.width;
    this.slices[2].x += (this.width-this.width_);

    this.width_ = this.width;
};

Capsule.prototype.display = function(){
    this.slices.forEach(function(e){
        e.setVisible(true);
    });
    this.text.setVisible(true);
    if(this.icon) this.icon.setVisible(true);
};