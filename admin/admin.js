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
        // Indexed by settlement id
        $scope.newBuildingForms = {};
        $scope.deleteForms = {};
        // Indexed by building id
        $scope.editForms = {};
        $scope.inventoryForms = {};
        $scope.priceForms = {};
        $scope.goldForms = {};

        var dataCategories = ['buildings','items']; // Categories data (JSON), not instances
        $scope.data = {};

        $scope.toggleVisibility = function(f,id){
            var map = $scope[f];
            if(!map.hasOwnProperty(id)) map[id] = {};
            var oldvalue = map[id].visible || false;
            map[id].visible = !oldvalue;
        };

        getJSON = function(category){
            $http.get("/assets/data/"+category+".json").then(function(res) {
                if(res.status == 200){
                    Data[category+'Data'] = res.data;
                    $scope.data[category+'List'] = [];
                    for(var key in res.data){
                        if(!res.data.hasOwnProperty(key)) continue;
                        var entry = res.data[key];
                        entry.id = key;
                        $scope.data[category+'List'].push(entry);
                    }
                    $scope.data[category] = Data[category+'Data'];
                    Data.counter++;
                    if(Data.counter == dataCategories.length) getData();
                }
            },function(err){});
        };

        getData = function(){
            $http.get("/admin/settlements/").then(function(res) {
                if(res.status == 200){
                    console.log(res.data);
                    $scope.settlements = res.data;
                    $scope.buildings = {};

                    res.data.forEach(function(set){
                        set.buildings.forEach(function(build){
                            $scope.buildings[build.id] = build;
                            $scope.buildings[build.id].inv = [];
                            //for(var itm in build.inventory){
                            if(!build.inventory) return;
                            build.inventory.forEach(function(itmdata){
                                var itm = itmdata[0];
                                $scope.buildings[build.id].inv.push({
                                    id:itm,
                                    name: $scope.data.items[itm].name
                                });
                            });
                            console.log($scope.buildings[build.id].inv);
                        });
                    });
                    console.log($scope.buildings);
                }
            },function(err){});
        };


        dataCategories.forEach(function(cat){
            getJSON(cat);
        });

        getScreenshots = function(){
            $scope.screenshots = [];
            $http.get("/admin/screenshots/").then(function(res) {
                if(res.status == 200){
                    $scope.screenshots = res.data;
                    console.log($scope.screenshots);
                }
            },function(err){});
        };
        getScreenshots();

        getEvents = function(){
            $scope.events = [];
            $http.get("/admin/events/").then(function(res) {
                if(res.status == 200){
                    $scope.events = res.data;
                    console.log($scope.events);
                }
            },function(err){});
        };
        getEvents();

        $scope.addBuilding = function(id){
            var data = $scope.newBuildingForms[id];
            data.visible = undefined;
            $http.post("/admin/newbuilding/", data).then(function(res) {
                if(res.status == 201) setTimeout(getData,200);
            },function(err){});
            console.log(data);
        };

        $scope.deleteBuilding = function(id){
            var data = $scope.deleteForms[id];
            console.log('deleting',data);
            $http.post("/admin/deletebuilding/", data).then(function(res) {
                if(res.status == 201) setTimeout(getData,200);
            },function(err){});
        };

        $scope.setStock = function(id){
            var data = $scope.inventoryForms[id];
            data.building = id;
            console.log(data);
            $http.post("/admin/setitem/", data).then(function(res) {
                if(res.status == 201) setTimeout(getData,200);
            },function(err){});
        };

        $scope.setPrice = function(id){
            var data = $scope.priceForms[id];
            data.building = id;
            console.log(data);
            $http.post("/admin/setprice/", data).then(function(res) {
                if(res.status == 201) setTimeout(getData,200);
            },function(err){});
        };

        $scope.setGold = function(id){
            var data = {gold:$scope.goldForms[id]};
            data.building = id;
            console.log(data);
            $http.post("/admin/setgold/", data).then(function(res) {
                if(res.status == 201) setTimeout(getData,200);
            },function(err){});
        };

        $scope.toggleBuild = function(id){
            $http.post("/admin/togglebuild/", {id:id}).then(function(res) {
                if(res.status == 201) setTimeout(getData,200);
            },function(err){});
        };

        $scope.updatePrices = function(buildingID){
            var id = $scope.priceForms[buildingID].item;
            var prices = $scope.buildings[buildingID].prices;
            if(prices) {
                if(!prices.hasOwnProperty(id)) prices[id] = [];
                $scope.priceForms[buildingID].buy = prices[id][0];
                $scope.priceForms[buildingID].sell = prices[id][1];
            }
        };

        $scope.dump = function(){
            $http.post("/admin/dump/").then(
                function(res) {},
                function(err){}
                );
        };

        setInterval(getData,90*1000);
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
        if(prices[item]) string += ' '+prices[item][0]+'/'+prices[item][1];
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
            case 0:
                return dateStr+" A player bought "+event.nb+ " "+scope.data.items[event.item].name+" for "+event.price+" each";
                break;
            case 1:
                return dateStr+" A player sold "+event.nb+ " "+scope.data.items[event.item].name+" for "+event.price+" each";
                break;
            case 2:
                return dateStr+" A player has connected in settlement "+event.stl;
        }
    }
});