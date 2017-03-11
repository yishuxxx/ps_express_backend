module.exports.twoDToOneDArray = function twoDToOneDArray(twodarray,name_level1,name_level2=null){

  var onedarray = [];

  if(!name_level2){
    for(var i=0;i<twodarray.length;i++){
      onedarray.push(twodarray[i][name_level1]);
    }
  }else{
    for(var i=0;i<twodarray.length;i++){
      onedarray.push(twodarray[i][name_level1][name_level2]);
    }
  }
	return onedarray;
};

module.exports.checkExists = function checkExists (key, obj) {
    obj = obj || window;
    key = key.split(".");

    if (typeof obj !== "object") {
        return false;
    }

    while (key.length && (obj = obj[key.shift()]) && typeof obj == "object" && obj !== null) ;

    return (!key.length && typeof obj !== "undefined");
}

module.exports.serialize = function serialize (obj){
  var str = Object.keys(obj).map(function(key) {
    return key + '=' + encodeURIComponent(obj[key]);
  }).join('&');

  return str;
}

module.exports.serialize2Level = function(obj) {
    var pairs = [];
    for (var prop in obj) {
        if (!obj.hasOwnProperty(prop)) {
            continue;
        }
        pairs.push(prop + '=' + obj[prop]);
    }
    return pairs.join('&');
}

var serializeObject = function(obj) {
    var pairs = [];
    for (var prop in obj) {
        if (!obj.hasOwnProperty(prop)) {
            continue;
        }
        if (Object.prototype.toString.call(obj[prop]) == '[object Object]') {
            pairs.push(serializeObject(obj[prop]));
            continue;
        }
        pairs.push(prop + '=' + obj[prop]);
    }
    return pairs.join('&');
}

module.exports.serializeObject = serializeObject;

var getRandomInt = function (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
module.exports.getRandomInt = getRandomInt;

module.exports.passwdGen = function (length = 8, flag = 'ALPHANUMERIC'){
  
  var length = parseInt(length, 10);
  var str = '';

  if (length <= 0) {
      return false;
  }

  switch (flag) {
      case 'NUMERIC':
          str = '0123456789';
          break;
      case 'NO_NUMERIC':
          str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          break;
      case 'ALPHANUMERIC':
          $str = 'abcdefghijkmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          break;
      default:
          $str = 'abcdefghijkmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          break;
  }

  var position = 0;
  var result = '';

  for (var i = 0; i < length; i++) {
      position = (position + getRandomInt(0,1000)) % str.length;
      result = result + str[position];
  }

  return result;
}

var treeify = function (list, idAttr, parentAttr, childrenAttr) {
    if (!idAttr) idAttr = 'id';
    if (!parentAttr) parentAttr = 'parent';
    if (!childrenAttr) childrenAttr = 'children';

    var treeList = [];
    var lookup = {};
    list.forEach(function(obj) {
        lookup[obj[idAttr]] = obj;
        obj[childrenAttr] = [];
    });
    list.forEach(function(obj) {
        if (obj[parentAttr] != null) {
            lookup[obj[parentAttr]][childrenAttr].push(obj);
        } else {
            treeList.push(obj);
        }
    });
    return treeList;
};

module.exports.treeify = treeify;

var toCamelCase = function(input){
    console.log(input);
    return input.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
}

module.exports.toCamelCase = toCamelCase;

var toDelimitedLowerCase = function (input){
    return input.replace(/([a-z][A-Z])/g, function (g) { return g[0] + '-' + g[1].toLowerCase() });
}

module.exports.toDelimitedLowerCase = toDelimitedLowerCase;

var syDateFormat = function(str){
  var date = str.substring(0,10);
  var time = str.substring(11,19);

  return date + " " + time;
}

module.exports.syDateFormat = syDateFormat;