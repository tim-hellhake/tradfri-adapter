/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter, Device, Property } from 'gateway-addon';
import { Accessory } from 'node-tradfri-client';

export class TradfriDevice extends Device {
    private batteryProperty?: Property;

    constructor(adapter: Adapter, accessory: Accessory) {
        super(adapter, `${accessory.instanceId}`);
        this['@context'] = 'https://iot.mozilla.org/schemas/';
        this['@type'] = [];
        this.name = accessory.name;

        if (accessory.deviceInfo.battery) {
            this['@type'].push('MultiLevelSensor');

            this.batteryProperty = new Property(this, 'batteryLevel', {
                '@type': 'LevelProperty',
                type: 'number',
                unit: '%',
                min: 0,
                max: 100,
                title: 'Battery',
                description: 'The battery level'
            });

            this.addProperty(this.batteryProperty);
        }
    }

    addProperty(property: Property) {
        this.properties.set(property.name, property);
    }

    public update(accessory: Accessory) {
        if (this.batteryProperty) {
            this.batteryProperty.setCachedValue(accessory.deviceInfo.battery);
            this.notifyPropertyChanged(this.batteryProperty);
            console.log(`${accessory.name} (${accessory.instanceId}) / ${accessory.deviceInfo.battery}`);
        }
    }
}
