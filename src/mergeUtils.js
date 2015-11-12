'use strict';

import merge from 'merge';
import _ from 'underscore';

export default function mergeConfig(baseConfig, overrideConfig) {
    if (!baseConfig) {
        return;
    }

    var mergedConfig = _.clone(baseConfig);

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
            var baseElements = baseConfig[key];
            var overrideElements = overrideConfig[key];

            var newElements = [];

            for (var i = 0; i < baseElements.length; i++) {
                let currentElement = baseElements[i];

                var matchingElement = _.find(overrideElements, (element) => {
                    return currentElement.name === element.name;
                });

                if (matchingElement) {
                    newElements.push(mergeConfig(currentElement, matchingElement));
                } else {
                    newElements.push(currentElement);
                }
            }

            mergedConfig[key] = newElements;
        } else if (_.isObject(baseConfig[key])) {
            mergedConfig[key] = mergeConfig(baseConfig[key], overrideConfig[key]);
        } else {
            mergedConfig[key] = overrideConfig[key];
        }
    }

    return mergedConfig;
};