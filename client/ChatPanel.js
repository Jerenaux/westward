/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 16-02-18.
 */

function ChatPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

ChatPanel.prototype = Object.create(Panel.prototype);
ChatPanel.prototype.constructor = ChatPanel;

ChatPanel.prototype.addInterface = function(){
    this.input = document.getElementById("chat");
    this.input.style.left = (this.x+20)+"px";
    this.input.style.top = (this.y+30)+"px";
};

ChatPanel.prototype.handleInput = function(){
    if(this.input.value != ""){
        var text = this.input.value.substring(0,41);
        Engine.player.talk(text);
        Client.sendChat(text);
    }
};

ChatPanel.prototype.toggle = function(){
    if(this.displayed){
        this.handleInput();
        this.hide();
    }else{
        this.display();
    }
};

ChatPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.input.style.display = "inline";
    this.input.focus();
};

ChatPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.input.style.display = "none";
    this.input.value = "";
};