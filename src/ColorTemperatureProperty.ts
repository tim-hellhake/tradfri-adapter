/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Device, Property } from 'gateway-addon';

export class ColorTemperatureProperty extends Property {
    constructor(private device: Device, minimum: number, maximum: number, private set: (value: number) => Promise<void>) {
        super(device, 'colorTemperature', {
            '@type': 'ColorTemperatureProperty',
            type: 'integer',
            unit: 'kelvin',
            title: 'ColorTemperature',
            minimum,
            maximum,
            description: 'Color temperature of the lightbulb'
        });
    }

    async setValue(value: number) {
        try {
            console.log(`Set value of ${this.device.name} / ${this.title} to ${value}`);
            await super.setValue(value);
            this.set(value);
        } catch (e) {
            console.log(`Could not set value: ${e}`);
        }
    }
}
