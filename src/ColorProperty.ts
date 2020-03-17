/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Device, Property } from 'gateway-addon';

export class ColorProperty extends Property {
    constructor(private device: Device, private set: (value: string) => Promise<void>) {
        super(device, 'color', {
            '@type': 'ColorProperty',
            type: 'string',
            title: 'Color',
            description: 'Color of the lightbulb'
        });
    }

    async setValue(value: string) {
        try {
            console.log(`Set value of ${this.device.name} / ${this.title} to ${value}`);
            await super.setValue(value);
            this.set(value);
        } catch (e) {
            console.log(`Could not set value: ${e}`);
        }
    }
}
