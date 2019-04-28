/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 28-04-19.
 */

function RestPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title,false);

    this.face = UI.scene.add.sprite(this.x + this.width/2 - 50,this.y + this.height/2,'faces',1);
    this.face.setVisible(false);
    this.text = this.addText(this.face.x - this.x + 30, this.face.y - this.y - 10, 'Resting ...', null, 20);
}

RestPanel.prototype = Object.create(Panel.prototype);
RestPanel.prototype.constructor = RestPanel;

RestPanel.prototype.setCurrentStats = function(){
    this.currentVigor = Engine.player.getStatValue('vigor');
    this.currentHealth = Engine.player.getStatValue('hp');
};

RestPanel.prototype.tweenStat = function(stat, delta){
    var xoffset = (stat == 'vigor' ? -15 : 15);
    var yoffset = (stat == 'vigor' ? 0 : 5);
    var icon = UI.scene.add.sprite(this.face.x + xoffset,this.face.y + yoffset,'UI',(stat == 'vigor' ? 'goldenheart' : 'heart'));
    var txt = UI.scene.add.text(icon.x, icon.y, '+'+delta, {font:'14px '+Utils.fonts.fancy, fill: Utils.colors.white, stroke: '#000000', strokeThickness: 4 });
    txt.setDepth(10);
    icon.setDepth(10);
    UI.scene.tweens.add(
        {
            targets: [icon,txt],
            y: '-=50',
            duration: 1000,
            onComplete: function(){
                icon.destroy();
                txt.destroy();
            }
        });
};

RestPanel.prototype.update = function(){
    var dvigor = Engine.player.getStatValue('vigor') - this.currentVigor;
    var dhealth = Engine.player.getStatValue('hp') - this.currentHealth;

    if(dvigor) this.tweenStat('vigor',dvigor);
    if(dhealth) this.tweenStat('health',dhealth);

    this.setCurrentStats();
};

RestPanel.prototype.display = function(){
    Panel.prototype.display.call(this);

    this.setCurrentStats();

    this.face.setVisible(true);
    this.displayTexts();
};

RestPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.face.setVisible(false);
    this.hideTexts();
};