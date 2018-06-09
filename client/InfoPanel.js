/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 16-03-18.
 */

function InfoPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
}

InfoPanel.prototype = Object.create(Panel.prototype);
InfoPanel.prototype.constructor = InfoPanel;

InfoPanel.prototype.setWrap = function(wrap){
    this.wrap = wrap;
};

InfoPanel.prototype.addText = function(x,y,text,color,size,font){
    var txt = Panel.prototype.addText.call(this,x,y,text,color,size,font);
    txt.setWordWrapWidth(this.width-(this.wrap || 15),true);
    if(this.mask) txt.mask = this.mask;
    return txt;
};

InfoPanel.prototype.addBigButton = function(text){
    this.button = new BigButton(this.x+(this.width/2),this.y+this.height-35,text,this.hide.bind(this));
};

InfoPanel.prototype.addMask = function(){
    var shape = UI.scene.make.graphics();
    shape.fillStyle('#ffffff');
    shape.fillRect(this.x,this.y+15,this.width,this.height-25);
    this.mask = new Phaser.Display.Masks.GeometryMask(UI.scene, shape);
};

InfoPanel.prototype.addScroll = function(){
    this.setWrap(45);
    var x = this.x+this.width-18;
    var downY = this.y+this.height-20;
    var upY = this.y+30;
    var height = downY-upY-25;
    var up = UI.scene.add.sprite(x,upY,'UI','scroll_up');
    var mid = UI.scene.add.tileSprite(x,upY+13+(height/2),24,height,'UI','scroll');
    var down = UI.scene.add.sprite(x,downY,'UI','scroll_down');
    var pin = UI.scene.add.sprite(x,upY+25,'UI','scroll_pin');

    function scroll(y){
        y = Utils.clamp(y,upY+25,downY-25);
        var dy = pin.y - y;
        pin.y = y;
        _this.texts.forEach(function(t){
            t.y += dy;
        })
    }

    pin.setInteractive();
    UI.scene.input.setDraggable(pin);
    var _this = this;
    pin.on('drag',function(pointer,x,y){
        scroll(y);
    });

    this.addButton(this.width-30,15,'blue','up',function(){
        scroll(pin.y - 20);
    },'Scroll up');
    this.addButton(this.width-30,this.height-32,'blue','down',function(){
        scroll(pin.y + 20);
    },'Scroll down');

    up.setVisible(false);
    mid.setVisible(false);
    down.setVisible(false);
    pin.setVisible(false);
    this.scroll = [up,mid,down,pin];

    this.content.push(up);
    this.content.push(mid);
    this.content.push(down);
    this.content.push(pin);
};

InfoPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displayTexts();
    if(this.button) this.button.display();

    if(this.scroll){
        this.scroll.forEach(function(e){
            e.setVisible(true);
        })
    }
};

InfoPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.hideTexts();
    if(this.button) this.button.hide();
};