/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-03-18.
 */

Client = {};

Client.socket = io.connect();
Client.socket.emit('admin');

$("#newbuildbtn").click(function() {
    $("#newbuildform").toggle( "clip", 100 );
});

$("#newbuildform").submit(function(e) {
    e.preventDefault();
    Client.send('newbuilding',Client.formatFormData($(this).serializeArray()));
    $("#newbuildform").toggle( "clip", 100 );
});

Client.formatFormData = function(raw){
    var obj = {};
    raw.forEach(function(data){
        var value = data.value;
        if(value == "") return;
        if(value == "on"){
            value = true;
        }else if(!isNaN(+value)){
            value = +value;
        }
        obj[data.name] = value;
    });
    return obj;
};

Client.send = function(msg,data){
    console.log(msg,data);
    Client.socket.emit('admin_'+msg,data);
};