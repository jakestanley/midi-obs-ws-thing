#!/usr/bin/env node

const args = require('args');
const midi = require('midi');
const {default: OBSWebSocket} = require('obs-websocket-js');

args
    .option('timeout', 'how long in seconds should the app run before closing the midi and websocket connections and exiting')
    // doesn't work currently. needs code refactoring (already!?!)
    .option('noobs', 'run without obs client (debugging purposes)', false);

const flags = args.parse(process.argv);
const SECOND = 1000;
const timeoutMs = flags.timeout * SECOND;

if (!flags.timeout) {
    console.error("Missing 'timeout' flag");
    args.showHelp();
    exit(1);
}

if (flags.noobs) {
//    console.warn('Noobs flag set. OBS connectivity will be disabled');
}

const input = new midi.Input();
const obs = new OBSWebSocket();

input.on('message',(deltaTime, message) => {
    console.log(`m: ${message} d: ${deltaTime}`);
    console.debug(message);
});

try {
    obs
        .connect('ws://quorra.local:4455')
        .then(function(){
            console.log("Connected");
            input.openVirtualPort("Scene Control");

            console.warn(`Timeout set to ${flags.timeout}s`);

            // timeouts
            setTimeout(function() {
                input.closePort();
                obs.disconnect();
            }, timeoutMs);

            // test call to get stats
            obs
                .call('GetStats')
                .then(function(stats){
                    console.log(stats);
                });

            obs
                .call('GetSceneList')
                .then(function(scenes){
                    console.log(scenes);
                });

            var i = 0;

            // handle midi messages
            input.on('message',(deltaTime, message) => {
                console.log(`m: ${message} d: ${deltaTime}`);
                
                obs
                    .call('CreateScene', {
                        sceneName: `balls ${++i}`
                    })
                    .then(function(stats){
                        console.log(stats)
                    });
            });

    })
} catch (error) {
    console.error('Failed to connect', error.code, error.message);
    exit(1);
}


