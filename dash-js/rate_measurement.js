/*
 * rate_measurement.js
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

RateMeasurement.prototype.constructor = RateMeasurement;
function RateMeasurement() {
    this.measurement = new Object();
    this.measurement.startTimeMeasure = 0;
    this.measurement.endTimeMeasure = 0;
    this.id = new Array();
}

RateMeasurement.prototype.beginBitrateMeasurement = function() {
    this.measurement.startTimeMeasure = new Date().getTime();
};

RateMeasurement.prototype.endBitrateMeasurement = function(lengthInBytes) {
    this.measurement.endTimeMeasure = new Date().getTime();
    // return bps
    return ((lengthInBytes * 8) / (this.measurement.endTimeMeasure - this.measurement.startTimeMeasure)) * 1000;
};

RateMeasurement.prototype.beginBitrateMeasurementByID = function (id) {
    this.id[id] = new Date().getTime();
};

RateMeasurement.prototype.endBitrateMeasurementByID = function (id, lengthInBytes) {
    var end = new Date().getTime();

    // return bps
    // console.log("END id: " + id + " time: " +end);
    // console.log("Start: " + __id[id]);
    var calc =  ((lengthInBytes * 8) / (end - this.id[id])) * 1000;
    if (calc == Number.POSITIVE_INFINITY || calc == Number.NEGATIVE_INFINITY) {
        return Bandwidth.MAX_BANDWIDTH;
    } else {
        return calc;
    }
};