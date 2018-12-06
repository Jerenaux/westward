/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 04-12-18.
 */

var app = angular.module('admin',[]);

app.controller("mainCtrl", [
    '$scope','$http',
    function($scope,$http) {

        getData = function(category){
            $scope[category] = [];
            $http.get("/admin/"+category+"/").then(function(res) {
                if(res.status == 200){
                    $scope[category] = res.data;
                }
            },function(err){});
        };

        //getEvents();
        //getScreenshots();
        getData('events');
        getData('screenshots');
    }
    ]);

app.filter('processImg',function(){
    return function(img){
        return img.split(",")[1];
    }
});

app.filter('eventFilter',function(){
    // TODO: sync event id's with Prism
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
                return dateStr+" A player has enterd building "+Data.buildingsData[event.building].name;
            case 'server-start':
                return dateStr+" SERVER RESTART";
            //default:
            //return event;
        }
    }
});