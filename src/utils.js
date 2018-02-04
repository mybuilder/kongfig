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

function _setOnPath(obj, path, value) {
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

export function repeatableOptionCallback(val, result) {
    result.push(val);
    return result;
}

export function parseVersion(version) {
    if (!version.includes("enterprise-edition")) {
        // remove any postfix, i.e., 0.11.0-rc1 should be 0.11.0
        return version.split("-")[0];
    }

    // Kong EE versioning is X.Y(-Z)-enterprise-edition
    var vAry = version.split("-")

    if (vAry.length == 4) {
        version = vAry[0] + "." + vAry[1]
    } else {
        version = vAry[0];
    }

    // add .0 so that kong EE has a patch version, i.e, 0.29 should be 0.29.0
    if (version.split(".").length == 2) {
        version = version + ".0"
    }

    return version
}
