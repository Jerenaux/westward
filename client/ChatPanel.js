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
    if(this.displayed){
        this.handleInput();
        this.hide();
    }else{
        this.display();
    }
};

ChatPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    Engine.inPanel = false;
    this.input.style.display = "inline";
    this.input.focus();
};

ChatPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.input.style.display = "none";
    this.input.value = "";
};


function NamePanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.addInterface();
}

NamePanel.prototype = Object.create(Panel.prototype);
NamePanel.prototype.constructor = NamePanel;

NamePanel.prototype.addInterface = function(){
    this.input = this.addInput(130,40,50);
    this.input.background = 'transparent';
    this.input.id = 'name';
};

NamePanel.prototype.getValue = function(){
    return this.input.value;
};

NamePanel.prototype.toggle = function(){
    if(this.displayed){
        this.handleInput();
        this.hide();
    }else{
        this.display();
    }
};

NamePanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.input.style.display = "inline";
    this.input.focus();
    this.button.display();
    this.displayTexts();
};

NamePanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.input.style.display = "none";
    this.input.value = "";
    this.button.hide();
    this.hideTexts();
};

NamePanel.prototype.addBigButton = function(text,cb){
    var callback = cb || this.hide.bind(this);
    this.button = new BigButton(this.x+(this.width/2),this.y+this.height-20,text,callback);
};