/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter } from 'gateway-addon';
import { TradfriClient, Accessory, Light } from 'node-tradfri-client';
import { LightBulb } from './LightBulb';
import { BrightnessProperty } from './BrightnessProperty';

export class DimmableLightBulb extends LightBulb {
    private brightnessProperty: BrightnessProperty;

    constructor(adapter: Adapter, accessory: Accessory, light: Light, tradfri: TradfriClient) {
        super(adapter, accessory, tradfri);

        this.brightnessProperty = new BrightnessProperty(this, async value => {
            await light.setBrightness(value);
        });

        this.addProperty(this.brightnessProperty);
    }

    public update(accessory: Accessory) {
        super.update(accessory);

        if (accessory.lightList && accessory.lightList.length > 0) {
            let light = accessory.lightList[0];

            this.brightnessProperty.setCachedValue(light.dimmer);
            this.notifyPropertyChanged(this.brightnessProperty);
            console.log(`${accessory.name} (${accessory.instanceId}) / ${light.dimmer}`);
        }
    }
}
