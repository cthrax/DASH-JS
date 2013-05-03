/*
 * adaptationlogic.js
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

AdaptationLogic.prototype.constructor = AdaptationLogic;
function AdaptationLogic(mpd, video) {
    this.mpd = mpd;
    this.findBestRepresentation();
    this.identifier = 1;
    this.resolutionSwitch = 0;
    this.mediaElement = video;

    this.observers = new Array();
    this.observer_num = 0;
}

AdaptationLogic.prototype.findBestRepresentation = function() {
    var i = 0;
    var n = parseInt(this.mpd.period[0].group[0].representation[0].bandwidth);
    var m = 0;
    this.mpd.period[0].group[0].representation.forEach(function(_rel) {

        if (parseInt(_rel.bandwidth) < n) {
            m = i;
            n = parseInt(_rel.bandwidth);
        }
        i++;

    });
    
    console.log("DASH JS prototype [basic] adaptation selecting representation "
                    + m + " with bandwidth: " + n);

    this.representationID = m;
    this.lowestRepresentation = this.mpd.period[0].group[0].representation[m];
    this.currentRepresentation = this.mpd.period[0].group[0].representation[m];
    
    if (this.currentRepresentation.baseURL == false) {
        this.currentRepresentation.baseURL = this.mpd.baseURL;
    }
    
    if (this.lowestRepresentation.baseURL == false) {
        this.lowestRepresentation.baseURL = this.mpd.baseURL;
    }
    this.currentRepresentation.curSegment = 0;
};

AdaptationLogic.prototype.setMpd = function(mpd) {
    this.mpd = mpd;
    this.findBestRepresentation();
};

AdaptationLogic.prototype.addObserver = function(_obj) {
    this.observers[this.observer_num++] = _obj;

};

AdaptationLogic.prototype.notify = function() {
    if (this.observers.length > 0) {
        for ( var i = 0; i < this.observers.length; i++) {
            if (this.observers[i] != undefined && this.observers[i].update != undefined) {
                this.observers[i].update(parseInt(this.currentRepresentation.bandwidth), this.identifier);
            }
        }
    }
};

AdaptationLogic.prototype._getNextChunk = function(count) {
    var segmentURL = {};
    
    if (this.currentRepresentation.segmentList) {
        segmentUrl = this.currentRepresentation.segmentList.segment[count];
    } else if (this.currentRepresentation.segmentTemplate) {
        segmentURL.src = this.currentRepresentation.segmentTemplate.media.replace("$Number%03$", count);
    }
    return segmentURL;
};

AdaptationLogic.prototype.getInitialChunk = function(presentation) {
    var segmentURL = {};
    if (presentation.segmentTemplate) {
        segementURL.src = presentation.segmentTemplate.initialization;
    } else {
        segmentURL = presentation.initializationSegment;
    }
    return segmentURL;
};

AdaptationLogic.prototype._getNextChunkP = function(presentation, count) {
    var segmentURL = {};
    if (presentation.segmentList) {
        segmentURL = presentation.segmentList.segment[count];
    } else if (presentation.segmentTemplate) {
        segmentURL.src = presentation.segmentTemplate.media.replace("$Number%03$", count);
    }
    return presentation.segmentList.segment[count];
};
