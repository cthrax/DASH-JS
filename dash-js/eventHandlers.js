/*
 * eventHandlers.js
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


EventHandlers.prototype.constructor = EventHandlers;
function EventHandlers(dashPlayer) {
    this.dashPlayer = dashPlayer;
}

EventHandlers.prototype.onOpenSource = function(e) {
    this.dashPlayer.dashHttp._dashSourceOpen(this.dashPlayer.overlayBuffer, this.dashPlayer.adaptation.currentRepresentation, this.dashPlayer.videoTag, e.target);
    var instance = this;
    this.dashPlayer.overlayBuffer.bufferStateListener();
    //FIXME: Should this time be configured based on MPD?
    window.setTimeout(function() { instance.dashPlayer.overlayBuffer.bufferStateListener();}, 1000);
};

EventHandlers.prototype.onProgress = function(e) {
    // TODO: This webkit API doesn't exist, what replaces it?
    if (!this.dashPlayer.adaptation.mediaElement.error) {
        console.log("[UPDATE] Progress.");
        this.dashPlayer.overlayBuffer.bufferStateListener();
    }
};

EventHandlers.prototype.onSourceEnded = function(e) {
    console.log('DASH JS Client got callback - video ended');
    if (this.dashPlayer.enable_fplot) {
        this.dashPlayer.fplot.plot();
    }
};

EventHandlers.prototype.getOpenHandler = function() {
    var instance = this;
    return function(e) { instance.onOpenSource(e); };
};

EventHandlers.prototype.getProgressHandler = function() {
    var instance = this;
    return function(e) { instance.onProgress(e); };
};

EventHandlers.prototype.getEndHandler = function() {
    var instance = this;
    return function(e) { instance.onSourceEnded(e); };
};