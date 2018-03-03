/**
 * Created by Jerome on 12-12-17.
 */

var onServer = (typeof window === 'undefined');

var Equipment = {
    dict: {
        meleew:{
            nb: 1,
            x: 100,
            y: 115,
            shade: 'sword',
            name: 'Melee weapon',
            conflict: 'rangedw',
            showInBattle: true,
            battlex: 10,
            battley: 10
        },
        rangedw:{
            nb: 1,
            x: 100,
            y: 65,
            shade: 'gun',
            name: 'Ranged weapon',
            conflict: 'meleew',
            showInBattle: true,
            battlex: 10,
            battley: 50
        },
        shield:{
            nb: 1,
            x: 200,
            y: 65,
            shade: 'shield',
            name: 'Shield'
        },
        armor:{
            nb: 1,
            x: 150,
            y: 50,
            shade: 'armor',
            name: 'Armor'
        },
        belt:{
            nb: 1,
            x: 150,
            y: 100,
            shade: 'belt',
            name: 'Belt'
        },
        boots:{
            nb: 1,
            x: 150,
            y: 150,
            shade: 'boots',
            name: 'Boots'
        },
        necklace:{
            nb: 1,
            x: 200,
            y: 15,
            shade: 'necklace',
            name: 'Necklace'
        },
        acc:{
            nb: 2,
            x: 270,
            y: 150,
            shade: 'ring',
            xincrement: 40,
            name: 'Accessory'
        },
        quiver:{
            nb: 1,
            x: 270,
            y: 50,
            shade: 'quiver',
            name: 'Quiver',
            container: true,
            contains: 'arrows',
            showInBattle: true,
            battlex: 60,
            battley: 10
        },
        ammo_pouch:{
            nb: 1,
            x: 270,
            y: 100,
            shade: 'ammo-pouch',
            name: 'Bullets pouch',
            container: true,
            contains: 'bullets',
            showInBattle: true,
            battlex: 60,
            battley: 50
        },
        arrows:{
            nb: 1,
            x: 310,
            y: 50,
            shade: 'arrow',
            name: 'Arrows',
            containedIn: 'quiver',
            showInBattle: true,
            battlex: 100,
            battley: 10
        },
        bullets:{
            nb: 1,
            x: 310,
            y: 100,
            shade: 'bullets',
            name: 'Bullets',
            containedIn: 'ammo_pouch',
            showInBattle: true,
            battlex: 100,
            battley: 50
        }
    }
};

// Returns a data structure to store data related to equipment
Equipment.getSkeleton = function(){
    var skeleton = {
        containers: {}
    };
    for(var equip in Equipment.dict){
        if(!Equipment.dict.hasOwnProperty(equip)) continue;
        var sl = [];
        for(var i = 0; i < Equipment.dict[equip].nb; i++){
            sl.push(-1);
        }
        skeleton[equip] = sl;
        if(Equipment.dict[equip].container){
            skeleton.containers[equip] = 0;
        }
    }
    return skeleton;
};

if (onServer) module.exports.Equipment = Equipment;