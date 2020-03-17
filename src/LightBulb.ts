/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter } from 'gateway-addon';
import { TradfriClient, Accessory } from 'node-tradfri-client';
import { TradfriDevice } from './TradfriDevice';
import { OnOffProperty } from './OnOffProperty';

export class LightBulb extends TradfriDevice {
    private onOffProperty: OnOffProperty;

    constructor(adapter: Adapter, accessory: Accessory, tradfri: TradfriClient) {
        super(adapter, accessory);
        this['@type'] = ['Light'];

        this.onOffProperty = new OnOffProperty(this, async value => {
            await tradfri.operateLight(accessory, {
                onOff: value,
            }, true);
        });

        this.addProperty(this.onOffProperty);
    }

    public update(accessory: Accessory) {
        if (accessory.lightList && accessory.lightList.length > 0) {
            let light = accessory.lightList[0];

            this.onOffProperty.setCachedValue(light.onOff);
            this.notifyPropertyChanged(this.onOffProperty);
            console.log(`${accessory.name} (${accessory.instanceId}) / ${light.onOff}`);
        }
    }
}
