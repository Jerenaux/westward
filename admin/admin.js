/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-03-18.
 */

Client = {};
Admin = {};

Client.socket = io.connect();
Client.socket.emit('admin');

Admin.generateOptions = function(file,select){
    $.getJSON( "/assets/data/"+file+".json", function(data) {
        console.log(data);
        for(var key in data){
            if(!data.hasOwnProperty(key)) continue;
            $('#'+select).append($('<option>', {
                value: key,
                text: data[key].name
            }));
        }
    });
};

Admin.formatFormData = function(raw){
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

Admin.extractHeaders = function(data){
    var headers = new Set();
    data.forEach(function(e){
        for(var field in e){
            if(!e.hasOwnProperty(field)) continue;
            headers.add(field);
        }
    });
    console.log(headers);
};

Admin.generateOptions('buildings','buildTypeSelect');
Admin.generateOptions('settlements','settlementSelect');

$("#newbuildbtn").click(function() {
    $("#newbuildform").toggle( "clip", 100 );
});

$("#newbuildform").submit(function(e) {
    e.preventDefault();
    Client.send('newbuilding',Admin.formatFormData($(this).serializeArray()));
    $("#newbuildform").toggle( "clip", 100 );
});

Client.requestBuildings = function(){
    Client.socket.emit('listbuildings');
};

Client.send = function(msg,data){
    console.log(msg,data);
    Client.socket.emit('admin_'+msg,data);
};

Client.socket.on('buildingslist',function(list){
    Admin.extractHeaders(list);
});