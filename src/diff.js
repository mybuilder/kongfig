const isValueSameOneArrayElement = (a, b) => {
    return typeof a === 'string'
        && Array.isArray(b)
        && b.length === 1
        && !isValueDifferent(a, b[0]);
};

const isValueDifferent = (a, b) => {
    if (Array.isArray(a)) {
        return !Array.isArray(b)
            || a.length != b.length
            || a.filter(x => b.indexOf(x) === -1).length > 0;
    }

    return JSON.stringify(a) !== JSON.stringify(b);
}

export default (defined = {}, server = {}) => {
    const keys = Object.keys(defined);

    return keys.reduce((changed, key) => {
        if (key === 'redirect_uri') {
            // hack for >=0.8.2 that allows multiple redirect_uris,
            // but accepts a string as well
            if (isValueSameOneArrayElement(defined[key], server[key])) {
                return changed;
            }
        }

        if (isValueDifferent(defined[key], server[key])) {
            return [...changed, key];
        }

        return changed;
    }, []);
};
