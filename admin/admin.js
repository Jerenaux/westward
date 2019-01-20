/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 04-12-18.
 */

var app = angular.module('admin',[]);

var Data = {
    counter: 0,
    categories: ['buildings']
};

app.controller("mainCtrl", [
    '$scope','$http',
    function($scope,$http) {

        getJSON = function(category){
            $http.get("/assets/data/"+category+".json").then(function(res) {
                if(res.status == 200){
                    Data[category+'Data'] = res.data;
                    /*$scope.data[category+'List'] = [];
                    for(var key in res.data){
                        if(!res.data.hasOwnProperty(key)) continue;
                        var entry = res.data[key];
                        entry.id = key;
                        $scope.data[category+'List'].push(entry);
                    }
                    $scope.data[category] = Data[category+'Data'];*/
                    Data.counter++;
                    if(Data.counter == Data.categories.length) getAllData();
                }
            },function(err){});
        };


        getData = function(category){
            $scope[category] = [];
            $http.get("/admin/"+category+"/").then(function(res) {
                if(res.status == 200) $scope[category] = res.data;
            },function(err){});
        };

        getAllData = function(){
            getData('events');
            getData('screenshots');
            //getData('buildings');
            console.log(Data.buildingsData);
        };

        Data.categories.forEach(function(category){
            getJSON(category);
        });
    }
    ]);

app.filter('processImg',function(){
    return function(img){
        return img.split(",")[1];
    }
});

function prefix(txt,time,name){
    var t = new Date(time);
    var dateStr = "["+t.getDate()+"/"+(t.getMonth()+1)+" "+t.getHours()+":"+t.getMinutes()+":"+t.getSeconds()+"]"; 
    var tokens = [dateStr,txt];
    if(name) tokens.splice(1,0,'['+name+']');
    return tokens.join(" ");
}

app.filter('eventFilter',function(){
    return function(event,scope){
        
        switch(event.action){
            case 'buy':
                return prefix("Bought "+event.nb+ " "+scope.data.items[event.item].name+" for "+event.price+" each at "+Data.buildingsData[event.building].name,event.time,event.pname);
            case 'sell':
                return prefix("Sold "+event.nb+ " "+scope.data.items[event.item].name+" for "+event.price+" each "+Data.buildingsData[event.building].name,event.time,event.pname);
            case 'connect':
                return prefix("Connected in settlement "+event.stl, event.time,event.pname);
            case 'disconnect':
                return prefix("Disconnected", event.time,event.pname);
            case 'explore':
                return prefix("Explored AOI "+event.aoi, event.time,event.pname);
            case 'building':
                return prefix("Entered building "+Data.buildingsData[event.building].name,event.time,event.pname);
            case 'newbuilding':
                return prefix("Built "+Data.buildingsData[event.building].name+" at "+event.x+", "+event.y,event.time,event.pname);
            case 'server-start':
                return prefix(" SERVER RESTART",event.time);
            default:
                return 'Undefined event';
        }
    }
});