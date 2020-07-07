/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter } from 'gateway-addon';
import { TradfriClient, Accessory, Light } from 'node-tradfri-client';
import { LightBulb } from './LightBulb';
import { ColorProperty } from './ColorProperty';
import { BrightnessProperty } from './BrightnessProperty';

export class ColorLightBulb extends LightBulb {
    private colorProperty: ColorProperty;
    private brightnessProperty?: BrightnessProperty;

    constructor(adapter: Adapter, accessory: Accessory, light: Light, tradfri: TradfriClient, config: any) {
        super(adapter, accessory, tradfri);

        this.colorProperty = new ColorProperty(this, async value => {
            await light.setColor(value.slice(1));
        });
        this.addProperty(this.colorProperty);

        this.brightnessProperty = new BrightnessProperty(this, async value => {
            await light.setBrightness(value);
        });

        this.addProperty(this.brightnessProperty);
    }

    public update(accessory: Accessory) {
        super.update(accessory);
        if (accessory.lightList && accessory.lightList.length > 0) {
            let light = accessory.lightList[0];

            this.colorProperty.setCachedValue('#' + light.color);
            this.notifyPropertyChanged(this.colorProperty);
            console.log(`${accessory.name} (${accessory.instanceId}) / ${light.color}`);

            if (this.brightnessProperty) {
                this.brightnessProperty.setCachedValue(light.dimmer);
                this.notifyPropertyChanged(this.brightnessProperty);
                console.log(`${accessory.name} (${accessory.instanceId}) / ${light.dimmer}`);
            }
        }
    }
}
