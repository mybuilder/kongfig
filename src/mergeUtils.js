'use strict';

import merge from 'merge';
import _ from 'underscore';

export default function mergeConfig(baseConfig, overrideConfig) {
    if (!baseConfig) {
        return;
    }

    var mergedConfig = merge.clone(baseConfig);

    for (var key in overrideConfig) {
        if (!overrideConfig.hasOwnProperty(key)) {
            continue;
        }

        // Direct copy since key does not exist in baseConfig
        if (!baseConfig.hasOwnProperty(key)) {
            mergedConfig[key] = overrideConfig[key];
            continue;
        }

        if (_.isArray(baseConfig[key])) {
            var elements = merge.clone(baseConfig[key]);
            var overrideElements = overrideConfig[key];

            for (var i = 0; i < overrideElements.length; i++) {
                let currentElement = overrideElements[i];

                var pos = -1;
                var matchingElement = null;

                for (var j = 0; j < baseConfig[key].length; j++) {
                    if (currentElement.name == baseConfig[key][j].name) {
                        pos = j;
                        matchingElement = baseConfig[key][j];
                        break;
                    }
                }

                if (pos != -1) {
                    elements[pos] = mergeConfig(matchingElement, currentElement);
                } else {
                    elements.push(currentElement);
                }
            }

            mergedConfig[key] = elements;
        } else if (_.isObject(baseConfig[key])) {
            mergedConfig[key] = mergeConfig(baseConfig[key], overrideConfig[key]);
        } else {
            mergedConfig[key] = overrideConfig[key];
        }
    }

    return mergedConfig;
};