var menuIcon = function(x,y,icon,menu,tox,toy){
    this.fromx = x;
    this.fromy = y;
    this.tox = tox;
    this.toy = toy;
    this.bg = UI.scene.add.sprite(x,y,'UI','holder').setScrollFactor(0).setDepth(2).setInteractive();
    this.icon = UI.scene.add.sprite(x,y,'items2',icon).setScrollFactor(0).setDepth(2); // bubble down to bg
    this.bg.setDepth(4);
    this.icon.setDepth(5);
    this.bg.on('pointerup',function(){
        menu.toggle();
        if(Engine.bldRect) Engine.bldUnclick(true);
    });
    var bg_ = this.bg;
    this.bg.on('pointerover',function(){
        UI.tooltip.updateInfo('free',{title:menu.name});
        UI.tooltip.display();
        bg_.setFrame('holder_over');
    });
    //this.bg.on('pointerout',UI.tooltip.hide.bind(UI.tooltip));
    this.bg.on('pointerout',function(){
        UI.tooltip.hide();
        bg_.setFrame('holder');
    });
    this.displayed = true;
};

menuIcon.prototype.toggle = function(){
    if(this.displayed){
        if(Engine.inBuilding || (Engine.currentMenu && Engine.currentMenu.fullHide)){
            this.fullhide();
        }else {
            this.hide();
        }
    }else{
        this.display();
    }
};

menuIcon.prototype.display = function(){
    this.bg.setVisible(true);
    this.icon.setVisible(true);
    UI.scene.tweens.add(
        {
            targets: [this.bg,this.icon],
            x: this.fromx,
            y: this.fromy,
            duration: 200
        }
    );
    this.displayed = true;
};

menuIcon.prototype.hide = function(){
    this.displayed = false;
    UI.scene.tweens.add(
        {
            targets: [this.bg,this.icon],
            x: this.tox,
            y: this.toy,
            duration: 300
        }
    );
};

menuIcon.prototype.fullhide = function(){
    this.bg.setVisible(false);
    this.icon.setVisible(false);
    this.displayed = false;
};

export default menuIcon;