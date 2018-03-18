/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-03-18.
 */

Client = {};
Data = {
    counter: 0
};

var app = angular.module('admin',[]);

app.controller("mainCtrl", [
    '$scope','$http',
    function($scope,$http) {
        var categories = ['settlements'];
        var dataCategories = ['buildings','items'];
        $scope.data = {};

        getJSON = function(category){
            $http.get("/assets/data/"+category+".json").then(function(res) {
                if(res.status == 200){
                    Data[category+'Data'] = res.data;
                    $scope.data[category] = Data[category+'Data'];
                    Data.counter++;
                    if(Data.counter == dataCategories.length) getListings();
                }
            },function(err){});
        };

        getData = function(category){
            $http.get("/admin/"+category+"/").then(function(res) {
                if(res.status == 200){
                    console.log(res.data);
                    $scope[category] = res.data;
                }
            },function(err){});
        };

        getListings = function(){
            categories.forEach(function(cat){
                $scope[cat] = [];
                getData(cat);
            });

            $scope.buildingForms = {};
            $scope.settlements.forEach(function(settlement){
                $scope.buildingForms[settlement.id] = {
                    visible: false
                };
            });
        };

        dataCategories.forEach(function(cat){
            getJSON(cat);
        });

        $scope.addBuilding = function(id){
            var data = $scope.buildingForms[id];
            data.visible = undefined;
            $http.post("/admin/newbuilding/", data).then(function(res) {
                if(res.status == 201){
                    $scope.postForm.$setUntouched();
                    $scope.postForm.$setPristine();
                    getListings();
                }
            },function(err){});
            console.log(data);
        };

        setInterval(getListings,60*1000);
    }
]);

app.filter('pctFilter',function(){
    return function(pct,showPlus){
        if(showPlus && pct > 0) pct = '+'+pct;
        return pct+'%';
    }
});

app.filter('buildingTypeFilter',function(){
    return function(type){
        return Data.buildingsData[type].name;
    }
});

app.filter('shopFilter',function(){
    return function(entry,prices){
        var item = entry[0];
        var nb= entry[1];
        var string = Data.itemsData[item].name+' ('+nb+')';
        if(prices[item]){
            string += ' '+prices[item][0]+'/'+prices[item][1];
        }
        return string;
    }
});

app.filter('displayBuilding',function(){
    return function(raw){
        raw.buildings = undefined;
        raw.danger = undefined;
        return JSON.stringify(raw,null,2);
    }
});

//Client.socket = io.connect();
//Client.socket.emit('admin');


/*Admin.generateOptions = function(file,select){
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
    };*/

/*Admin.generateOptions('buildings','buildTypeSelect');
Admin.generateOptions('settlements','settlementSelect');
Client.requestBuildings();*/