/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter } from 'gateway-addon';
import { TradfriClient, Accessory, Light } from 'node-tradfri-client';
import { DimmableLightBulb } from './DimmableLightBulb';
import { ColorTemperatureProperty } from './ColorTemperatureProperty';

export class WhiteSpectrumLightBulb extends DimmableLightBulb {
    private colorTemperatureProperty: ColorTemperatureProperty;

    constructor(adapter: Adapter, accessory: Accessory, light: Light, tradfri: TradfriClient) {
        super(adapter, accessory, light, tradfri);

        // Acording to ikea website
        // 'The colour temperature can be switched between 2200 Kelvin (warm glow), [...] and 4000 Kelvin (cool white).'
        // The mozila proposal recommand using Kelvin, but the node client use percentage.
        this.colorTemperatureProperty = new ColorTemperatureProperty(this, 2000, 4000, async value => {
            await light.setColorTemperature(kelvinToPercent(value));
        });

        this.addProperty(this.colorTemperatureProperty);
    }

    public update(accessory: Accessory) {
        super.update(accessory);
        if (accessory.lightList && accessory.lightList.length > 0) {
            let light = accessory.lightList[0];

            this.colorTemperatureProperty.setCachedValue(percentToKelvin(light.colorTemperature));
            this.notifyPropertyChanged(this.colorTemperatureProperty);
            console.log(`${accessory.name} (${accessory.instanceId}) / ${light.colorTemperature}`);
        }
    }
}

//See WhiteSpectrumLightBulb
function kelvinToPercent(value: number): number {
    return (value - 2000) / 2000 * 100;
}

//See WhiteSpectrumLightBulb
function percentToKelvin(value: number): number {
    return (value / 100) * 2000 + 2000;
}
