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
    return headers;
};

Admin.deleteClick = function(id){
    console.log('deleting',id);
};

$("#newbuildbtn").click(function() {
    $("#newbuildform").toggle( "clip", 100 );
});

$("#newbuildform").submit(function(e) {
    e.preventDefault();
    Client.send('newbuilding',Admin.formatFormData($(this).serializeArray()));
    $("#newbuildform").toggle( "clip", 100 );
});

$('#buildings').on('click','a',function(event){
    event.preventDefault();
    var id = event.target.id;
    Client.send('deletebuilding',id);
});

Client.requestBuildings = function(){
    Client.send('listbuildings');
};

Client.send = function(msg,data){
    console.log(msg,data);
    Client.socket.emit('admin_'+msg,data);
};

Client.socket.on('buildings',function(list){
    var headers = Admin.extractHeaders(list);
    headers.forEach(function(header){
        $('#buildings > thead > tr').append("<th scope='col'>"+header+"</th>");
    });
    $('#buildings > thead > tr').append("<th scope='col'></th>");

    list.forEach(function(building){
        var line = "<th scope=\"row\">"+building.id+"</th>";
        for(var field in building){
            if(!building.hasOwnProperty(field)) continue;
            if(field == 'id') continue;
            line += "<td>"+building[field]+"</td>";
        }
        line += "<td><a href=''><img id='"+building.id+"' src='delete.png'/></a></td>";
        $('#buildings > tbody').append("<tr>"+line+"</tr>");
    });
});


Admin.generateOptions('buildings','buildTypeSelect');
Admin.generateOptions('settlements','settlementSelect');
Client.requestBuildings();