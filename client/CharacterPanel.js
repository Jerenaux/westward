/**
 * Created by jeren on 07-01-18.
 */

function CharacterPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

CharacterPanel.prototype = Object.create(Panel.prototype);
CharacterPanel.prototype.constructor = CharacterPanel;