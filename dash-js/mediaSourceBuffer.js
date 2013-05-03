/*
 * mediaSourceBuffer.js
 *****************************************************************************
 * Copyright (C) 2012 - 2013 Alpen-Adria-Universit�t Klagenfurt
 *
 * Created on: Feb 13, 2012
 * Authors: Benjamin Rainer <benjamin.rainer@itec.aau.at>
 *          Stefan Lederer  <stefan.lederer@itec.aau.at>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston MA 02110-1301, USA.
 *****************************************************************************/
var _mediaSourceBuffer;

MediaSourceBuffer.prototype = new BaseBuffer();
MediaSourceBuffer.prototype.constructor = MediaSourceBuffer;
function MediaSourceBuffer(id, criticalLevel, buffersize, mediaAPI, dashPlayer) {
    var instance = this;
    this._eventHandlers = new Object();
    this._eventHandlers.cnt = 0;
    this._eventHandlers.handlers = new Array();
    this.mediaElementBuffered = 0;
    this.lastTime = 0;
    this.fill = false;
    this.doRefill = false;
    this.id = id;
    this.isOverlayBuffer = true;
    this.criticalState.seconds = criticalLevel;
    this.bufferSize.maxseconds = buffersize;
    this.mediaAPI = mediaAPI;
    this.dashPlayer = dashPlayer;
    this.lastTime = 0;
    if (dashPlayer.enable_fplot) {
        this.playbackTimePlot = dashPlayer.fplot;
    }
    this.registerEventHandler("minimumLevel", function () { instance.signalRefill(); });
    
    this.minBuffer = parsePT(this.dashPlayer.mpd.pmpd.minBufferTime);
    //TODO: Pull from mpd
    this.initBufferArray("seconds", this.minBuffer);
}

MediaSourceBuffer.prototype.addEventHandler = function(fn) {
    // handlers will get the fillstate ...
    this._eventHandlers.handlers[this._eventHandlers.cnt] = new Object();
    this._eventHandlers.handlers[this._eventHandlers.cnt++].fn = fn;
};

MediaSourceBuffer.prototype.callEventHandlers = function() {
    for (var i = 0; i < this._eventHandlers.cnt; i++) {
        this._eventHandlers.handlers[i].fn(this.getFillLevel(), this.fillState.seconds, this.bufferSize.maxseconds);
    }
};

MediaSourceBuffer.prototype.bufferStateListener = function() {
    var instance = this;
    this.mediaElementBuffered -= this.dashPlayer.videoTag.currentTime - this.lastTime;
    //TODO: Determine which representation is in use, hardcode for now.
    var segmentList = this.dashPlayer.mpd.pmpd.period[0].group[0].representation[0].segmentList;
    var segmentSizeSec = (parseInt(segmentList.duration) / parseInt(segmentList.timescale)) / segmentList.segment.length;
    
    // TODO: Pull from mpd
    if (this.mediaElementBuffered < this.minBuffer) {

        // TODO: Pull from mpd
        console.log("Draining " + segmentSizeSec + " seconds");
        var rc = this.drain("seconds", segmentSizeSec);
        
        if (rc == -1 && this.dashPlayer.mpd.pmpd.type == "dynamic") {
            console.log("need to fetch next mpd for more segments.");
            this.streamEnded = false;
            
            // setup timeout, since we're breaking out early.
            window.setTimeout(function() {
                instance.bufferStateListener();
            }, 100);
            
            return;
        }

        if (rc == -1) {
            console.log("[BufferStateListener] - rc-1");
            // signal that we are done!
            if (this.dashPlayer.videoTag.webkitSourceEndOfStream != undefined) {
                this.dashPlayer.videoTag.webkitSourceEndOfStream(HTMLMediaElement.EOS_NO_ERROR);
            } else {
                this.dashPlayer.mse.endOfStream();
            }
            return;
        } else if (rc != 0 && rc != undefined) {
            console.log("[BufferStateListener] - rc!=0: " + this.mediaElementBuffered);
            this.dashPlayer.dashHttp._push_segment_to_media_source_api(this, rc); 

            // the new MediaAPI allows to have more than one source buffer for the
            // separate decoding chains (really nice) so we may support resolution
            // switching in the future
            // TODO: Pull from mpd
            this.mediaElementBuffered += segmentSizeSec;

        } else {
            console.log("[BufferStateListener] - Finished, no if.");
        }
        
    }
    this.lastTime = this.dashPlayer.videoTag.currentTime;

    window.setTimeout(function() {
        instance.bufferStateListener();
    }, 100);

};

// this is the callback method, called by the AJAX xmlhttp call
MediaSourceBuffer.prototype.callback = function() {
    var instance = this;
    window.setTimeout(function() {
        instance.refill();
    }, 100);

};

MediaSourceBuffer.prototype.signalRefill = function() {
    if (this.doRefill == false) {
        console.log("signaling refill");
        this.doRefill = true;
        // asynch ... we will only dive once into this method
        this.refill();
    } else {
        console.log("no refill.");
    }
};

MediaSourceBuffer.prototype.getFillLevel = function() {
    return this.state("seconds");
};

MediaSourceBuffer.prototype.push = function(data, segmentDuration) {
    this.fillState.seconds += segmentDuration;
    this.add(data);

};

MediaSourceBuffer.prototype.refill = function() {

    if (this.doRefill == true) {

        if (this.fillState.seconds < this.bufferSize.maxseconds) {

            console.log("Overlay buffer...");
            console.log(this);
            console.log("Fill state of overlay buffer: " + this.fillState.seconds);
            this.dashPlayer.dashHttp._dashFetchSegmentAsynchron(this);
            this.callEventHandlers();
        } else {
            console.log("Do refill set to false.");
            this.doRefill = false;
        }
    }
};
