/**
 * Created by jeren on 06-02-18.
 */

function ListMap(){}

ListMap.prototype.add = function(key,object){
    if(!this.hasOwnProperty(key))this[key] = [];
    this[key].push(object);
};

ListMap.prototype.get = function(key){
    if(!this.hasOwnProperty(key)) return [];
    return this[key];
};

export default ListMap