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
                if(res.status == 200){
                    $scope[category] = res.data;
                }
            },function(err){});
        };

        getAllData = function(){
            getData('events');
            getData('screenshots');
            //getData('buildings');
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

app.filter('eventFilter',function(){
    return function(event,scope){
        var t = new Date(event.time);
        var dateStr = "["+t.getDate()+"/"+(t.getMonth()+1)+" "+t.getHours()+":"+t.getMinutes()+":"+t.getSeconds()+"]";
        switch(event.action){
            case 'buy':
                return dateStr+" A player bought "+event.nb+ " "+scope.data.items[event.item].name+" for "+event.price+" each at "+Data.buildingsData[event.building].name;
            case 'sell':
                return dateStr+" A player sold "+event.nb+ " "+scope.data.items[event.item].name+" for "+event.price+" each "+Data.buildingsData[event.building].name;
            case 'connect':
                return dateStr+" A player has connected in settlement "+event.stl;
            case 'disconnect':
                return dateStr+" A player has disconnected";
            case 'explore':
                return dateStr+" A player has explored AOI "+event.aoi;
            case 'building':
                //return dateStr+" A player has enterd building "+Data.buildingsData[event.building].name;
            case 'server-start':
                return dateStr+" SERVER RESTART";
            default:
                return 'Undefined event';
        }
    }
});