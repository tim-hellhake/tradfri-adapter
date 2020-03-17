/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Device, Property } from 'gateway-addon';

export class OnOffProperty extends Property {
    constructor(private device: Device, private set: (value: boolean) => Promise<void>) {
        super(device, 'on', {
            '@type': 'OnOffProperty',
            type: 'boolean',
            title: 'On',
            description: 'Wether the device is on or off'
        });
    }

    async setValue(value: boolean) {
        try {
            console.log(`Set value of ${this.device.name} / ${this.title} to ${value}`);
            await super.setValue(value);
            this.set(value);
        } catch (e) {
            console.log(`Could not set value: ${e}`);
        }
    }
}
