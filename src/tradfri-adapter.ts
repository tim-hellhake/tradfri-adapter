/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter, Device, Property } from 'gateway-addon';
import { TradfriClient, Accessory, AccessoryTypes, Light } from 'node-tradfri-client';

class OnOffProperty extends Property {
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

class BrightnessProperty extends Property {
  constructor(private device: Device, private set: (value: number) => Promise<void>) {
    super(device, 'brightness', {
      '@type': 'BrightnessProperty',
      type: 'integer',
      title: 'Brightness',
      description: 'The brightness of the bulb'
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

class LightBulb extends Device {
  private onOffProperty: OnOffProperty;
  private brightnessProperty: BrightnessProperty;

  constructor(adapter: Adapter, accessory: Accessory, light: Light, tradfri: TradfriClient) {
    super(adapter, `${accessory.instanceId}`);
    this['@context'] = 'https://iot.mozilla.org/schemas/';
    this['@type'] = ['Light'];
    this.name = accessory.name;

    this.onOffProperty = new OnOffProperty(this, async value => {
      await tradfri.operateLight(accessory, {
        onOff: value,
      }, true);
    });

    this.addProperty(this.onOffProperty);

    this.brightnessProperty = new BrightnessProperty(this, async value => {
      await light.setBrightness(value);
    });

    this.addProperty(this.brightnessProperty);
  }

  addProperty(property: Property) {
    this.properties.set(property.name, property);
  }

  public update(accessory: Accessory) {
    if (accessory.lightList && accessory.lightList.length > 0) {
      let light = accessory.lightList[0];

      this.onOffProperty.setCachedValue(light.onOff);
      this.notifyPropertyChanged(this.onOffProperty);
      console.log(`${accessory.name} (${accessory.instanceId}) / ${light.onOff}`);

      this.brightnessProperty.setCachedValue(light.dimmer);
      this.notifyPropertyChanged(this.brightnessProperty);
      console.log(`${accessory.name} (${accessory.instanceId}) / ${light.dimmer}`);
    }
  }
}

export class TradfriAdapter extends Adapter {
  private devices: { [key: string]: LightBulb } = {};

  constructor(addonManager: any, manifest: any, name: string, tradfri: TradfriClient) {
    super(addonManager, name, manifest.id);
    addonManager.addAdapter(this);

    tradfri
      .on('device updated', accessory => {
        console.log(`Received update for ${accessory.name} (${accessory.instanceId})`)
        let device = this.devices[accessory.instanceId];

        if (!device) {
          if (accessory.type == AccessoryTypes.lightbulb) {
            if (accessory.lightList && accessory.lightList.length > 0) {
              let light = accessory.lightList[0];
              console.log(`Creating device for ${accessory.name} (${accessory.instanceId})`);
              device = new LightBulb(this, accessory, light, tradfri);
              this.devices[accessory.instanceId] = device;
              this.handleDeviceAdded(device);
            }
          }
        }

        if (device) {
          device.update(accessory);
        }
      })
      .observeDevices();
  }
}
