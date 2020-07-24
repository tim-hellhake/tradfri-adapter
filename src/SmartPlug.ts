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

export class SmartPlug extends TradfriDevice {
    private onOffProperty: OnOffProperty;

    constructor(adapter: Adapter, accessory: Accessory, tradfri: TradfriClient) {
        super(adapter, accessory);
        this['@type'] = ['SmartPlug'];

        this.onOffProperty = new OnOffProperty(this, async value => {
            await tradfri.operatePlug(accessory, {
                onOff: value,
            }, true);
        });

        this.addProperty(this.onOffProperty);

    }

    public update(accessory: Accessory) {
        super.update(accessory);

        if (accessory.plugList && accessory.plugList.length > 0) {
            let plug = accessory.plugList[0];

            this.onOffProperty.setCachedValue(plug.onOff);
            this.notifyPropertyChanged(this.onOffProperty);
            console.log(`${accessory.name} (${accessory.instanceId}) / ${plug.onOff}`);
        }
    }
}
