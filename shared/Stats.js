/**
 * Created by jeren on 10-12-17.
 */

var onServer = (typeof window === 'undefined');

Stats = {
    list: [
        {
            'key': 'hp',
            'name': 'Health',
            'min': 0,
            'max': 100,
            'start': 100,
            'icon': 'heart-plus'
        },
        {
            'key': 'fat',
            'name': 'Fatigue',
            'min': 0,
            'max': 100,
            'start': 0,
            'icon': 'despair'
        },
        {
            'key': 'acc',
            'name': 'Accuracy',
            'min': 0,
            'max': 100,
            'start': 50,
            'icon': 'bullseye'
        },
        {
            'key': 'def',
            'name': 'Defense',
            'min': 0,
            'max': 100,
            'start': 10,
            'icon': 'chest-armor'
        },
        {
            'key': 'mdmg',
            'name': 'Melee Damage',
            'min': 0,
            'max': 100,
            'start': 10,
            'icon': 'pointy-sword'
        },
        {
            'key': 'rdmg',
            'name': 'Ranged Damage',
            'min': 0,
            'max': 100,
            'start': 10,
            'icon': 'pocket-bow'
        }
    ]
};

Stats.getSkeleton = function(){
    var skeleton = {};
    for(var i = 0; i < Stats.list.length; i++){
        var s = Stats.list[i];
        skeleton[s.key] = 0;
    }
    return skeleton;
};

if (onServer) module.exports.Stats = Stats;