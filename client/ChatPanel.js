/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 16-02-18.
 */
import Panel from './Panel'
import UI from './UI'

function ChatPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
    this.lastToggle = Date.now();
}

ChatPanel.prototype = Object.create(Panel.prototype);
ChatPanel.prototype.constructor = ChatPanel;

ChatPanel.prototype.addInterface = function(){
    this.input = this.addInput(180,10,20);
    this.input.background = 'transparent';
    this.input.id = 'chat';
};

ChatPanel.prototype.handleInput = function(){
    if(this.input.value != ""){
        var text = this.input.value.substring(0,41);
        Engine.player.talk(text);
        Client.sendChat(text);
    }
};

ChatPanel.prototype.toggle = function(){
    if(Date.now() - this.lastToggle < 200) return;
    if(this.displayed){
        this.handleInput();
        this.hide();
    }else{
        this.display();
    }
    this.lastToggle = Date.now();
};

ChatPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    UI.inPanel = false;
    this.input.style.display = "inline";
    this.input.focus();
};

ChatPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.input.style.display = "none";
    this.input.value = "";
};

export default ChatPanel