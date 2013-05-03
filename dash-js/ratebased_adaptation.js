/*
 * adaptationlogic.js
 *****************************************************************************
 * Copyright (C) 2012 - 2013 Alpen-Adria-Universit�t Klagenfurt
 *
 * Created on: March 19, 2013
 * Authors: Myles Bostwick <dashjs@zithora.com>
 *
 * Taken from adaptationlogic.js by:
 *          Benjamin Rainer <benjamin.rainer@itec.aau.at>
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

RateBasedAdaptation.prototype = Object.create(AdaptationLogic.prototype);
RateBasedAdaptation.prototype.constructor = RateBasedAdaptation;
function RateBasedAdaptation(mpd, video, bandwidth) {
    AdaptationLogic.call(this, mpd, video);
    this.bandwidth = bandwidth;
    console.log("DASH JS using adaptation: Rate Based Adaptation");
}

RateBasedAdaptation.prototype.switchRepresentation = function() {

    // select a matching bandwidth ...
    var i = 0;
    var n = parseInt(this.lowestRepresentation.bandwidth);
    var m = this.representationID;
    var _mybps = this.bandwidth.getBps();

    this.mpd.period[0].group[0].representation.forEach(function(_rel) {
        if (parseInt(_rel.bandwidth) < _mybps && n <= parseInt(_rel.bandwidth)) {
            console.log("n: " + n + ", m:" + m);
            n = parseInt(_rel.bandwidth);
            m = i;
        }
        i++;

    });

    // return the segment
    if (m != this.representationID) {
        // check if we should perform a resolution switch
        if (parseInt(this.currentRepresentation.width) != parseInt(this.mpd.period[0].group[0].representation[m].width)
                || parseInt(this.currentRepresentation.height) != parseInt(this.mpd.period[0].group[0].representation[m].height)) {
            if (this.resolutionSwitch != 0)
                console.log("Doing nothing because a resolution switch is already ongoing");
            else {
                console.log("Resolution switch NYI");
                // force a new media source with the new resolution but
                // don't hook it in, wait until enough data has been
                // downloaded

            }
        } else {
            // well, switching the bitrate is not that problem ...
            console.log("DASH rate based adaptation: SWITCHING STREAM TO BITRATE = "
                            + this.mpd.period[0].group[0].representation[m].bandwidth);
            this.representationID = m;
            this.mpd.period[0].group[0].representation[m].curSegment = this.currentRepresentation.curSegment;
            this.currentRepresentation = this.mpd.period[0].group[0].representation[m];
            if (this.currentRepresentation.baseURL == false) {
                this.currentRepresentation.baseURL = mpd.baseURL;
            }
        }
    }
    this.notify();
};
