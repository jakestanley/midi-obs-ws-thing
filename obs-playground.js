#!/usr/bin/env node

const {default: OBSWebSocket} = require('obs-websocket-js');

const obs = new OBSWebSocket();

try {
    obs
        .connect('ws://quorra.local:4455')
        .then(function() {
            console.log("Connected");

            // timeouts
            setTimeout(function() {
                obs.disconnect();
            }, 100);

            var sceneItems = [];
            var sceneItemId_NowPlaying = null;
            var sceneItemId_Video = null;

            // get scene items (useful for later)
            obs
                .call('GetSceneItemList', {
                    sceneName: "Tom Sawyer"
                })
                .then(function(data){
                    // for (var i = data.sceneItems.length - 1; i >= 0; i--) {
                    //     var sceneItem = data.sceneItems[i];
                    //     if (sceneItem.) {}
                    //     console.log(data.sceneItems[i]);
                    // }
                });

            // get inputs in current scene (media source, rtmp, text, etc) TODO set up next scene
            obs
                .call('GetInputList')
                .then(function(scenes){
                    console.log(scenes);
                });

            obs
                .call('GetInputSettings', {
                    inputName: "Media Source"
                })
                .then(function(settings){
                    console.log(settings);
                });

            obs
                .call('SetInputSettings', {
                    inputName: "Media Source",
                    inputSettings: {
                        // local_file: "/Volumes/Seagate 4TB/TV/An Idiot Abroad/Season 01/An Idiot Abroad - S01E01 - China.avi"
                        local_file: "/Volumes/Seagate 4TB/TV/Phoenix Nights/1/Phoenix Nights S01 E01.avi"
                    }
                });

            // updating (recentering not required if transform "Positional Alignment" is top center)
            obs
                .call('GetInputSettings', {
                    inputName: "Now Playing"
                })
                .then(function(settings){
                    console.log(settings);
                });

            obs
                .call('SetInputSettings', {
                    inputName: "Now Playing",
                    inputSettings: {
                        text: "Tom Sawyer"
                    }
                })

    })
} catch (error) {
    console.error('Failed to connect', error.code, error.message);
    exit(1);
}


