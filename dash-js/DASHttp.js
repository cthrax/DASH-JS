/*
 * DASHttp.js
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

function DASHttp(cacheControl, adaptation, bandwidth, dashPlayer) {
    this._timeID = 0;
    this._cacheControl = cacheControl;
    this.dashPlayer = dashPlayer;
    this.adaptation = adaptation;
    this.myBandwidth = bandwidth;
}

// this method is used by the mediaSourceBuffer to push segments in
DASHttp.prototype._push_segment_to_media_source_api = function (buffer, data) {
    console.log("DASH-JS client: appending data of length: " + data.length
            + " to the Media Source Buffer with id: " + buffer.id);
    sourceBufferAppend(this.dashPlayer.mse, buffer.id, data, this.dashPlayer);

};

DASHttp.prototype._fetch_segment = function(presentation, url, video, range, buffer) {
    console.log('DASH JS Client fetching segment: ' + url);
    var instance = this;
    var xhr = new XMLHttpRequest();
    xhr.timeID = this._timeID;
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Cache-Control', this._cacheControl);
    if (range != null) {
        xhr.setRequestHeader('Range', 'bytes=' + range);
        console.log('DASH JS Client fetching byte range: ' + range);
    }

    xhr.responseType = 'arraybuffer';

    // _tmpvideo = video;
    xhr.onload = function(e) {

        var data = new Uint8Array(this.response);
        var mybps = endBitrateMeasurementByID(this.timeID, data.length);
        instance.myBandwidth.calcWeightedBandwidth(parseInt(mybps));
        instance.adaptation.switchRepresentation();

        instance._push_segment_to_media_source_api(buffer, data);

        if (presentation.curSegment >= presentation.segmentList.segments - 1
                && video.webkitSourceEndOfStream != undefined) {
            video.webkitSourceEndOfStream(HTMLMediaElement.EOS_NO_ERROR);
        } else if (presentation.curSegment >= presentation.segmentList.segments - 1){
            video.ended = true;
        }

    };

    beginBitrateMeasurementByID(this._timeID);
    this._timeID++;
    xhr.send();
};

DASHttp.prototype._fetch_segment_for_buffer = function(presentation, url, video, range, buffer) {
    console.log('DASH JS Client fetching segment: ' + url);
    var instance = this;
    var xhr = new XMLHttpRequest();
    xhr.timeID = this._timeID;
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Cache-Control', this._cacheControl);
    if (range != null) {
        xhr.setRequestHeader('Range', 'bytes=' + range);
        console.log('DASH JS Client fetching byte range: ' + range);
    }

    xhr.responseType = 'arraybuffer';
    xhr.buffer = buffer;
    // _tmpvideo = video;
    xhr.onload = function(e) {

        var data = new Uint8Array(this.response);
        var mybps = endBitrateMeasurementByID(this.timeID, data.length);
        instance.myBandwidth.calcWeightedBandwidth(parseInt(mybps));

        instance.adaptation.switchRepresentation(); // <--- mod this, if you wanna
                                            // change the adaptation behavior
                                            // ... (e. g., include buffer state,
                                            // ...)

        // push the data into our buffer
        buffer.push(data, 2);

        if (presentation.curSegment >= presentation.segmentList.segments - 1)
            buffer.streamEnded = true;

        buffer.callback();

    };

    beginBitrateMeasurementByID(this._timeID);
    this._timeID++;
    xhr.send();
};

DASHttp.prototype._dashSourceOpen = function(buffer, presentation, video, mediaSource) {
    // check the parsed mpd
    // fetch a representation and check whether selfinitialized or ...

    video.width = presentation.width;
    video.height = presentation.height;

    console.log("DASJ-JS: content type: " + presentation.mimeType
            + '; codecs="' + presentation.codecs + '"');
    addSourceBuffer(mediaSource, buffer.id, presentation.mimeType
            + '; codecs="' + presentation.codecs + '"');

    var baseURL = presentation.baseURL != undefined ? presentation.baseURL : '';
    if (presentation.hasInitialSegment == false) {
        var nextChunkSrc = this.adaptation._getNextChunkP(presentation, presentation.curSegment).src;
        var nextChunkRange = this.adaptation._getNextChunk(presentation.curSegment).range;
        this._fetch_segment(presentation, baseURL + nextChunkSrc, video, nextChunkRange, buffer);

        if (presentation.curSegment > 0) {
            presentation.curSegment = 1;
        }
        
        presentation.curSegment++;

    } else {
        var nextChunk = this.adaptation.getInitialChunk(presentation);
        this._fetch_segment(presentation, baseURL + nextChunk.src, video, nextChunk.range, buffer);
        
    }

};

DASHttp.prototype._dashFetchSegmentBuffer = function(presentation, video, buffer) {
    if (presentation.curSegment >= presentation.segmentList.segments - 1) {
        return;
    }
    var baseURL = presentation.baseURL != undefined ? presentation.baseURL : '';
    var nextChunkSrc = this.adaptation._getNextChunkP(presentation, presentation.curSegment).src;
    var nextChunkRange = this.adaptation._getNextChunk(presentation.curSegment).range;
    this._fetch_segment_for_buffer(presentation, baseURL + nextChunkSrc, video, nextChunkRange, buffer);
    presentation.curSegment++;

};

DASHttp.prototype._dashFetchSegmentAsynchron = function(buffer, callback) {
    this._dashFetchSegmentBuffer(this.adaptation.currentRepresentation, this.adaptation.mediaElement, buffer);
};
