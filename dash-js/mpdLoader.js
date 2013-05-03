MPDLoader.bps = 1;

function MPDLoader(callback) {
    this.callback = callback;
    this.rateMeasure = new RateMeasurement();
}

MPDLoader.prototype._loadMPD = function() {
    if (this.xmlHttp.readyState != 4) {
        return;
    }
    
    MPDLoader.bps = this.rateMeasure.endBitrateMeasurement(this.xmlHttp.responseText.length);
    console.log("Bitrate:" + bps + " bps");
    this.callback(this.xmlHttp.responseText);
};

MPDLoader.prototype.loadMPD = function(mpdURL) {
    console.log(mpdURL);
    var instance = this;
    this.xmlHttp = new XMLHttpRequest();
    this.xmlHttp.onreadystatechange = function() { instance._loadMPD(); };
    this.xmlHttp.open("GET", mpdURL, true);
    this.xmlHttp.setRequestHeader('Cache-Control', 'no-cache');
    this.xmlHttp.send(null);

    this.rateMeasure.beginBitrateMeasurement();
};