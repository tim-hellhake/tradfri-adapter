/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

import { Database } from 'gateway-addon';
import { TradfriAdapter } from './tradfri-adapter';
import { discoverGateway, TradfriClient, TradfriErrorCodes, TradfriError } from "node-tradfri-client";

export = (addonManager: any, manifest: any) => {
    discover(addonManager, manifest);
};

interface Config {
    gateways: { [key: string]: Gateway }
}

interface Gateway {
    authentication?: Authentication
}

interface Authentication {
    identity: string,
    psk: string
}

async function discover(addonManager: any, manifest: any) {
    const {
        securityCode
    } = manifest.moziot.config;

    if (!securityCode) {
        console.log(`Please specifiy securityCode in the config`);
        return;
    }

    const result = await discoverGateway();

    if (result) {
        console.log(`Discovered gateway ${result.name} at ${result.host}`);
        let hosts: string[] = [];

        if (result.host) {
            hosts.push(result.host);
        }

        let addresses = [...hosts, ...result.addresses];

        for (const address of addresses) {
            try {
                console.log(`Trying to connect to ${address}`);
                await connect(addonManager, manifest, result.name, address, securityCode);
                console.log(`Connected to ${address}`);
                return;
            } catch (e) {
                if (e instanceof TradfriError) {
                    printTradfriError(e);
                } else {
                    console.log(`Could not connect to the gateway: ${e}`);
                }
            }
        }
    } else {
        console.log('No gateway found');
    }
}

async function connect(addonManager: any, manifest: any, name: string, address: string, securityCode: string) {
    const database = new Database(manifest.name);
    await database.open();
    const config = <Config>await database.loadConfig();

    if (!config.gateways) {
        config.gateways = {};
    }

    let gatewayConfig = config.gateways[name];

    if (!gatewayConfig) {
        console.log('Adding gateway to config');
        gatewayConfig = {};
        config.gateways[name] = gatewayConfig;
        console.log('Saving gateway');
        await database.saveConfig(config);
    }

    const tradfri = new TradfriClient(address);
    let authentication = gatewayConfig.authentication;

    if (!authentication) {
        console.log('Authenticating to the gateway');
        authentication = await tradfri.authenticate(securityCode);
        gatewayConfig.authentication = authentication;
        console.log('Saving authentication');
        await database.saveConfig(config);
    }

    const {
        identity,
        psk
    } = authentication;

    await tradfri.connect(identity, psk);
    new TradfriAdapter(addonManager, manifest, name, tradfri);

}

function printTradfriError(e: TradfriError) {
    switch (e.code) {
        case TradfriErrorCodes.ConnectionTimedOut: {
            console.log(`Could not reach gateway: ${e.message}`);
            break;
        }
        case TradfriErrorCodes.AuthenticationFailed: {
            console.log(`Could not authenticate: ${e.message}`);
            break;
        }
        case TradfriErrorCodes.ConnectionFailed: {
            console.log(`Could not connect to gateway: ${e.message}`);
            break;
        }
        default: {
            console.log(`Unknown error ${e.code}: ${e.message}`);
            break;
        }
    }
}
