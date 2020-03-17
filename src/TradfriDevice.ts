/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter, Device, Property } from 'gateway-addon';
import { Accessory } from 'node-tradfri-client';

export abstract class TradfriDevice extends Device {

    constructor(adapter: Adapter, accessory: Accessory) {
        super(adapter, `${accessory.instanceId}`);
        this['@context'] = 'https://iot.mozilla.org/schemas/';
        this.name = accessory.name;
    }

    addProperty(property: Property) {
        this.properties.set(property.name, property);
    }

    public abstract update(accessory: Accessory): void
}
