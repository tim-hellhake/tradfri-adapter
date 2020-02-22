/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter, Device, Property } from 'gateway-addon';
import { TradfriClient, Accessory, AccessoryTypes, Light } from 'node-tradfri-client';

//See WhiteSpectrumLightBulb
function kelvinToPercent(value: number): number {
  return (value - 2000) / 2000 * 100;
}

//See WhiteSpectrumLightBulb
function percentToKelvin(value: number): number {
  return (value / 100) * 2000 + 2000;
}

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

class ColorProperty extends Property {
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

class ColorTemperatureProperty extends Property {
  constructor(private device: Device, minimum: number, maximum: number, private set: (value: number) => Promise<void>) {
    super(device, 'colorTemperature', {
      '@type': 'ColorTemperatureProperty',
      type: 'integer',
      unit: "kelvin",
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

abstract class TradfriDevice extends Device {

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

class LightBulb extends TradfriDevice {
  private onOffProperty: OnOffProperty;
  private brightnessProperty: BrightnessProperty;

  constructor(adapter: Adapter, accessory: Accessory, light: Light, tradfri: TradfriClient) {
    super(adapter, accessory);
    this['@type'] = ['Light'];

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

class WhiteSpectrumLightBulb extends LightBulb {
  private colorTemperatureProperty: ColorTemperatureProperty;

  constructor(adapter: Adapter, accessory: Accessory, light: Light, tradfri: TradfriClient) {
    super(adapter, accessory, light, tradfri);

    // Acording to ikea website
    // "The colour temperature can be switched between 2200 Kelvin (warm glow), [...] and 4000 Kelvin (cool white)."
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

class ColorLightBulb extends LightBulb {
  private colorProperty: ColorProperty;

  constructor(adapter: Adapter, accessory: Accessory, light: Light, tradfri: TradfriClient) {
    super(adapter, accessory, light, tradfri);

    this.colorProperty = new ColorProperty(this, async value => {
      await light.setColor(value.slice(1));
    });
    this.addProperty(this.colorProperty);
  }

  public update(accessory: Accessory) {
    super.update(accessory);
    if (accessory.lightList && accessory.lightList.length > 0) {
      let light = accessory.lightList[0];

      this.colorProperty.setCachedValue("#" + light.color);
      this.notifyPropertyChanged(this.colorProperty);
      console.log(`${accessory.name} (${accessory.instanceId}) / ${light.color}`);
    }
  }
}

class SmartPlug extends TradfriDevice {
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
    if (accessory.plugList && accessory.plugList.length > 0) {
      let plug = accessory.plugList[0];

      this.onOffProperty.setCachedValue(plug.onOff);
      this.notifyPropertyChanged(this.onOffProperty);
      console.log(`${accessory.name} (${accessory.instanceId}) / ${plug.onOff}`);
    }
  }
}


export class TradfriAdapter extends Adapter {
  private devices: { [key: string]: TradfriDevice } = {};

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
              if (light.spectrum == "rgb") {
                device = new ColorLightBulb(this, accessory, light, tradfri);
              } else if (light.spectrum == "white") {
                device = new WhiteSpectrumLightBulb(this, accessory, light, tradfri);
              } else {
                device = new LightBulb(this, accessory, light, tradfri);
              }

              this.devices[accessory.instanceId] = device;
              this.handleDeviceAdded(device);
            }
          }
          if (accessory.type == AccessoryTypes.plug) {
            if (accessory.plugList && accessory.plugList.length > 0) {
              console.log(`Creating device for ${accessory.name} (${accessory.instanceId})`);

              device = new SmartPlug(this, accessory, tradfri);

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
