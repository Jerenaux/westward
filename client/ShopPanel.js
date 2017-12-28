/**
 * Created by jeren on 28-12-17.
 */
function ShopPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.buttons = [];
    this.build();
}

ShopPanel.prototype = Object.create(Panel.prototype);
ShopPanel.prototype.constructor = ShopPanel;

ShopPanel.prototype.build = function(){
    var slot = currentScene.scene.add.sprite(this.x+20,this.y+30,'UI','equipment-slot');
    var gold = currentScene.scene.add.sprite(this.x+240,this.y+35,'items2','gold-pile').setScale(1.5);
    this.nameText = currentScene.scene.add.text(this.x+65, this.y+25, 'Item name',
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.countText = currentScene.scene.add.text(this.x+47, this.y+50, 0,
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.priceText = currentScene.scene.add.text(this.x+240, this.y+50, 0,
        { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    this.container.push(this.nameText);
    this.container.push(this.countText);
    this.container.push(this.priceText);
    this.container.push(slot);
    this.container.push(gold);

    var ringx = 65;
    var ringy = 50;
    this.buttons.push(this.addRing(ringx,ringy,'blue','minus',function(){console.log('-');}));
    this.buttons.push(this.addRing(ringx+25,ringy,'blue','plus',function(){console.log('+');}));
    this.buttons.push(this.addRing(ringx+60,ringy,'green','ok',function(){console.log('ok');}));

};