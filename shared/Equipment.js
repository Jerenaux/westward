/**
 * Created by Jerome on 12-12-17.
 */

var onServer = (typeof window === 'undefined');

var Equipment = {
    //nbAccessories: 3,
    //list: ['rangedw','meleew','shield','armor','belt','boots','necklace'],
    dict: {
        meleew:{
            nb: 1,
            x: 100,
            y: 115,
            shade: 'sword',
            name: 'Melee weapon'
        },
        rangedw:{
            nb: 1,
            x: 100,
            y: 65,
            shade: 'gun',
            name: 'Ranged weapon'
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
            nb: 3,
            x: 100,
            y: 200,
            shade: 'ring',
            xincrement: 50,
            name: 'Accessory'
        }

    }
};

Equipment.getSkeleton = function(){
    var skeleton = {};
    for(var equip in Equipment.dict){
        if(!Equipment.dict.hasOwnProperty(equip)) continue;
        var sl = [];
        for(var i = 0; i < Equipment.dict[equip].nb; i++){
            sl.push(-1);
        }
        skeleton[equip] = sl;
    }
    return skeleton;
};

if (onServer) module.exports.Equipment = Equipment;