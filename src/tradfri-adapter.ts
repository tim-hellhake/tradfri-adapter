/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Adapter } from 'gateway-addon';
import { TradfriClient, AccessoryTypes, PowerSources } from 'node-tradfri-client';
import { TradfriDevice } from './TradfriDevice';
import { ColorLightBulb } from './ColorLightBulb';
import { WhiteSpectrumLightBulb } from './WhiteSpectrumLightBulb';
import { SmartPlug } from './SmartPlug';
import { DimmableLightBulb } from './DimmableLightBulb';

export class TradfriAdapter extends Adapter {
  private devices: { [key: string]: TradfriDevice } = {};
  private unsupportedDevices: { [key: string]: boolean } = {};

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
        let unsupported = this.unsupportedDevices[accessory.instanceId];

        if (!device && !unsupported) {
          let typeString = AccessoryTypes[accessory.type];

          let lights = accessory.lightList || [];
          let plugs = accessory.plugList || [];
          let sensors = accessory.sensorList || [];
          let switches = accessory.switchList || [];
          let repeater = accessory.repeaterList || [];
          let blinds = accessory.blindList || [];

          console.log(`Found new ${typeString} '${accessory.name}' (${accessory.instanceId}) with
                        ${lights.length} lights
                        ${plugs.length} plugs
                        ${sensors.length} sensors
                        ${switches.length} switches
                        ${repeater.length} repeater
                        ${blinds.length} blinds`);

          switch (accessory.type) {
            case AccessoryTypes.lightbulb:
              if (lights) {
                let light = lights[0];
                console.log(`Creating device for ${light.spectrum} ${typeString} '${accessory.name}' (${accessory.instanceId})`);

                switch (light.spectrum) {
                  case "rgb":
                    device = new ColorLightBulb(this, accessory, light, tradfri);
                    break;
                  case "white":
                    device = new WhiteSpectrumLightBulb(this, accessory, light, tradfri);
                    break;
                  default:
                    device = new DimmableLightBulb(this, accessory, light, tradfri);
                    break;
                }

                this.devices[accessory.instanceId] = device;
                this.handleDeviceAdded(device);
              } else {
                console.log(`Lightlist of ${typeString} '${accessory.name}' (${accessory.instanceId}) is empty, ignoring device`);
                this.unsupportedDevices[accessory.instanceId] = true;
              }
              break;
            case AccessoryTypes.plug:
              if (plugs) {
                console.log(`Creating device for ${typeString} ${accessory.name} (${accessory.instanceId})`);

                device = new SmartPlug(this, accessory, tradfri);

                this.devices[accessory.instanceId] = device;
                this.handleDeviceAdded(device);
              } else {
                console.log(`Pluglist of ${typeString} '${accessory.name}' (${accessory.instanceId}) is empty, ignoring device`);
                this.unsupportedDevices[accessory.instanceId] = true;
              }
              break;
            default:
              if (accessory.deviceInfo.power == PowerSources.Battery) {
                console.log(`Creating device for ${typeString} ${accessory.name} (${accessory.instanceId})`);
                device = new TradfriDevice(this, accessory);
                this.devices[accessory.instanceId] = device;
                this.handleDeviceAdded(device);
              } else {
                console.log(`Power type of ${typeString} ${accessory.name} (${accessory.instanceId}) is ${accessory.deviceInfo.power}, ignoring it`);
                this.unsupportedDevices[accessory.instanceId] = true;
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
