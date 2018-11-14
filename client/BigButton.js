/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 14-02-18.
 */

function BigButton(x,y,text,callback,bigger){
    this.slices = [];
    var sideWidth = 22;

    this.bt = 'bigbutton';
    var txtSize = 14;
    var h = 28;
    if(bigger){
        this.bt = 'biggerbutton';
        txtSize = 28;
        h = 46;
        sideWidth = 31;
    }

    this.slices.push(UI.scene.add.sprite(x-sideWidth,y,'UI',this.bt+'_left'));
    this.slices.push(UI.scene.add.tileSprite(x,y,4,h,'UI',this.bt+'_middle'));
    this.slices.push(UI.scene.add.sprite(x+sideWidth,y,'UI',this.bt+'_right'));
    this.text = UI.scene.add.text(x, y, '', { font: txtSize+'px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    this.text.setOrigin(0.5);

    this.callback = callback;
    this.text.handleDown = this.handleDown.bind(this);
    this.text.handleClick = this.handleClick.bind(this);
    this.enabled = true;
    this.setText(text);

    this.slices.forEach(function(e){
        e.setDepth(1);
        e.setScrollFactor(0);
        e.setVisible(false);
        this.attachCallbacks(e);
    },this);

    this.text.setDepth(2);
    this.text.setScrollFactor(0);
    this.text.setVisible(false);
    this.attachCallbacks(this.text);

    this.lastClick = 0;
    this.enabled = true;
}

BigButton.prototype.attachCallbacks = function(element){
    element.setInteractive();
    element.on('pointerdown',this.handleDown.bind(this));
    element.on('pointerup',this.handleClick.bind(this));
    element.on('pointerover',this.handleOver.bind(this));
    element.on('pointerout',this.handleOut.bind(this));
};

BigButton.prototype.setText = function(text){
    this.text.setText(text);

    var left = this.slices[0];
    var body = this.slices[1];
    var right = this.slices[2];

    var currentw = body.width;
    var neww = this.text.width - 45;
    var dw = neww - currentw;

    body.width = neww;
    left.x -= dw/2;
    right.x += dw/2;

    body.setInteractive();
    body.refWidth = body.width;
    body.refHeight = body.height;
};

BigButton.prototype.handleDown = function(){
    if(!this.enabled) return;
    UI.scene.sound.add('click').play();
    this.slices[0].setFrame(this.bt+'_left_pressed');
    this.slices[1].setFrame(this.bt+'_middle_pressed');
    this.slices[2].setFrame(this.bt+'_right_pressed');
    this.resetSize();
};

BigButton.prototype.handleClick = function(){
    if(!this.enabled) return;
    if(Date.now() - this.lastClick > 500){
        this.callback();
        this.lastClick = Date.now();
    }
    this.handleOver();
};

BigButton.prototype.handleOver = function(){
    if(!this.enabled) return;
    this.slices[0].setFrame(this.bt+'_left_lit');
    this.slices[1].setFrame(this.bt+'_middle_lit');
    this.slices[2].setFrame(this.bt+'_right_lit');
    this.resetSize();
};

BigButton.prototype.handleOut = function(){
    if(!this.enabled) return;
    this.slices[0].setFrame(this.bt+'_left');
    this.slices[1].setFrame(this.bt+'_middle');
    this.slices[2].setFrame(this.bt+'_right');
    this.resetSize();
};

BigButton.prototype.disable = function(){
    this.slices[0].setFrame(this.bt+'_left_gray');
    this.slices[1].setFrame(this.bt+'_middle_gray');
    this.slices[2].setFrame(this.bt+'_right_gray');
    this.resetSize();
    this.enabled = false;
    /*this.slices.forEach(function(s){
        s.removeAllListeners();
        s.off('pointerover');
        //s.setInteractive(false);
    });*/
};

BigButton.prototype.resetSize = function(){
    var body = this.slices[1];
    body.setSize(body.refWidth,body.refHeight);
};

BigButton.prototype.display = function(){
    this.slices.forEach(function(e){
        e.setVisible(true);
    });
    this.text.setVisible(true);
};

BigButton.prototype.hide = function(){
    this.slices.forEach(function(e){
        e.setVisible(false);
    });
    this.text.setVisible(false);
};