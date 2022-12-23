#!/usr/bin/env node

const args = require('args');
const log4js = require("log4js");
const fs = require('fs')
const midi = require('midi');
const {default: OBSWebSocket} = require('obs-websocket-js');
const { exit } = require('process');

// constants
const VIRTUAL_DEVICE_NAME = "Scene Control";

const SECOND = 1000;
const NOTE_ON_LOW = 144;
const NOTE_ON_HIGH = 159;

const WS_DEFAULT_HOST = "localhost"
const WS_DEFAULT_PORT = 4455;
const DEFAULT_LOGGING_LEVEL = "debug";

const CHANNEL_CLIPS = 1;
const CHANNEL_TEXT = 2;
const CHANNEL_EGGS = 3;
const CHANNEL_CONTROL = 4;

const C0 = 24;

args
    .option('timeout', 'how long in seconds should the app run before closing the midi and websocket connections and exiting')
    .option('host', 'web sockets host (usually the computer the target OBS is running on)', WS_DEFAULT_HOST)
    .option('port', 'web sockets port', WS_DEFAULT_PORT)
    .option('logging', 'logging level, supports [info, debug] at the moment', DEFAULT_LOGGING_LEVEL)
    .option('input', 'input file containing stage directions')

const flags = args.parse(process.argv);

// configure logging
log4js.configure({
    appenders: {
        console: { type: 'console' }
    },
    categories: {
        default: {
            appenders: ['console'],
            level: 'info'
        }
    }
});
const log = log4js.getLogger();
log.level = flags.logging.toLowerCase();

const timeoutMs = flags.timeout * SECOND;

if (!flags.timeout) {
    log.error("Missing \"--timeout/-t\" flag");
    args.showHelp();
    exit(1);
}

var directions = {};

if (flags.input) {
    // TODO might not be platform safe...
    directions = JSON.parse(fs.readFileSync(flags.input, 'utf-8'));
} else {
    log.warn("Missing \"--input/-i\" flag. I'll run but I won't do anything useful.")
    args.showHelp();
}

const input = new midi.Input();
const obs = new OBSWebSocket();

const initialiseScene = function(obs) {
    obs.call('SetInputSettings', {
        inputName: "Now Playing",
        inputSettings: {
            text: "Please wait..."
        }
    });
}

const parseChannel = function(command) {

    if (command < NOTE_ON_LOW || command > NOTE_ON_HIGH) {
        // currently only supports note on channels (by design)
        return null;
    }
    return command - (NOTE_ON_LOW - 1);
}

const parseMidi = function(data) {

    var channel = parseChannel(data[0]);
    if(channel == null) {
        return null;
    }
    
    // assuming the notes we get sent aren't silly numbers, but why should i care?
    var note = data[1];

    // unused
    var velocity = data[2];

    return {
        channel: channel,
        note: note
    };
}

const processCommand = function(obs, command) {
    var payload = directions[command.channel-1].data[command.note];
    switch (command.channel) {
        case CHANNEL_CLIPS:
            return
        case CHANNEL_TEXT:
            log.debug(`Writing text ${payload}`)
            return
        case CHANNEL_EGGS:
            return
        case CHANNEL_CONTROL:
            return
        default:
            return
    }
}

const connection_string = `ws://${flags.host}:${flags.port}`;

try {
    obs
        .connect(connection_string)
        .then(function(){
            log.info("Connected");

            // TODO dynamic. Currently assuming you have the layout of "media source (video), RTMP (streaming server), now playing (text)"
            // initialiseScene(obs, layout);
            initialiseScene(obs);

            input.openVirtualPort(VIRTUAL_DEVICE_NAME);

            log.info(`Timeout set to ${flags.timeout}s`);

            // timeouts
            setTimeout(function() {
                input.closePort();
                obs.disconnect();
            }, timeoutMs);

            // test call to get stats
            obs
                .call('GetStats')
                .then(function(stats){
                    log.info(stats);
                });

            obs
                .call('GetSceneList')
                .then(function(scenes){
                    log.info(scenes);
                });

            var i = 0;

            // handle midi messages
            input.on('message',(deltaTime, message) => {
                log.trace(`m: ${message} d: ${deltaTime}`);
                
                var parsed = parseMidi(message);
                if(!parsed) {
                    log.trace(`Ignoring unsupported message: ${message}`)
                } else {
                    processCommand(obs, parsed);
                }

                // obs
                //     .call('CreateScene', {
                //         sceneName: `balls ${++i}`
                //     })
                //     .then(function(stats){
                //         log.info(stats)
                //     });
            });

    })
} catch (error) {
    log.error('Failed to connect', error.code, error.message);
    exit(1);
}


