/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter } from 'gateway-addon';
import { TradfriClient, AccessoryTypes } from 'node-tradfri-client';
import { TradfriDevice } from './TradfriDevice';
import { ColorLightBulb } from './ColorLightBulb';
import { WhiteSpectrumLightBulb } from './WhiteSpectrumLightBulb';
import { LightBulb } from './LightBulb';
import { SmartPlug } from './SmartPlug';

export class TradfriAdapter extends Adapter {
  private devices: { [key: string]: TradfriDevice } = {};

  constructor(addonManager: any, manifest: any, name: string, tradfri: TradfriClient) {
    super(addonManager, name, manifest.id);
    addonManager.addAdapter(this);

    const {
      debug
    } = manifest.moziot.config;

    tradfri
      .on('device updated', accessory => {
        if (debug) {
          console.log(`Received update for ${accessory.type} ${accessory.name} (${accessory.instanceId})`);
        }

        let device = this.devices[accessory.instanceId];

        if (!device) {
          switch (accessory.type) {
            case AccessoryTypes.lightbulb:
              if (accessory.lightList && accessory.lightList.length > 0) {
                let light = accessory.lightList[0];
                console.log(`Creating device for ${light.spectrum} ${accessory.type} ${accessory.name} (${accessory.instanceId})`);

                switch (light.spectrum) {
                  case "rgb":
                    device = new ColorLightBulb(this, accessory, light, tradfri);
                    break;
                  case "white":
                    device = new WhiteSpectrumLightBulb(this, accessory, light, tradfri);
                    break;
                  default:
                    device = new LightBulb(this, accessory, tradfri);
                    break;
                }

                this.devices[accessory.instanceId] = device;
                this.handleDeviceAdded(device);
              } else {
                console.log(`Lightlist is empty`);
              }
              break;
            case AccessoryTypes.plug:
              if (accessory.plugList && accessory.plugList.length > 0) {
                console.log(`Creating device for ${accessory.type} ${accessory.name} (${accessory.instanceId})`);

                device = new SmartPlug(this, accessory, tradfri);

                this.devices[accessory.instanceId] = device;
                this.handleDeviceAdded(device);
              } else {
                console.log(`PlugList is empty`);
              }
              break;
          }
        }

        if (device) {
          device.update(accessory);
        }
      })
      .observeDevices();
  }
}
