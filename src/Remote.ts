/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter, Property } from 'gateway-addon';
import { Accessory } from 'node-tradfri-client';
import { TradfriDevice } from './TradfriDevice';
export class Remote extends TradfriDevice {
    private batteryProperty: Property;

    constructor(adapter: Adapter, accessory: Accessory) {
        super(adapter, accessory);

        this['@type'] = ['MultiLevelSensor'];

        this.batteryProperty = new Property(this, 'level', {
            '@type': 'LevelProperty',
            type: 'number',
            unit: '%',
            min: 0,
            max: 100,
            title: 'Level',
            description: 'The battery level of the remote'
        });

        this.addProperty(this.batteryProperty);
    }

    public update(accessory: Accessory) {
        this.batteryProperty.setCachedValue(accessory.deviceInfo.battery);
        this.notifyPropertyChanged(this.batteryProperty);
        console.log(`${accessory.name} (${accessory.instanceId}) / ${accessory.deviceInfo.battery}`);
    }
}
