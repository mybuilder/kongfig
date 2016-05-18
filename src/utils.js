export function normalize(attr) {
    if (attr === null || typeof attr !== 'object' || Object.prototype.toString.call(attr) === '[object Array]') {
        return attr;
    }

    let mutable = {};
    Object.keys(attr).forEach(key => {
        _setOnPath(mutable, key.split('.'), normalize(attr[key]));
    });

    return mutable;
}

function _setOnPath(obj, path, value){
    if (!path) {
      return obj;
    }

    var currentPath = path[0];
    if (path.length === 1) {
        var oldVal = obj[currentPath];

        if (oldVal === undefined) {
            obj[currentPath] = value;
        }

        return oldVal;
    }

    if (obj[currentPath] === undefined) {
        obj[currentPath] = {};
    }

    return _setOnPath(obj[currentPath], path.slice(1), value);
}
