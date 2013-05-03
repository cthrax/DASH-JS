var DASHJS_VERSION = "0.6a";

function DASHPlayer(videoTag, URLtoMPD, graphGetter, enable_plot) {
    console.log("DASH-JS Version: " + DASHJS_VERSION);
    this.videoTag = videoTag;
    this.dashHttp = new DASHttp('no-cache');
    var instance = this;
    mpdLoader = new MPDLoader(function(response) { instance.loaded(response); });
    mpdLoader.loadMPD(URLtoMPD);
    this.mpdUrl = URLtoMPD;
    this.mpd = undefined;
    this.getBps = function() { return MPDLoader.bps; };
    this.getGraph = graphGetter;
    this.enable_plot = enable_plot;
    this.enable_dumb_buffer = false;
    this.lastTime = 0;
    this.mediaElementsBuffered = 0;
    //myBuffer = init_timeBuffer(2,10,0,video);
}

DASHPlayer.prototype.updatePlaybackTime = function () {
    var instance = this;
    if (this.enable_plot) {
        this.fplot.update(this.videoTag.currentTime, 2);
    }
    
    if (this.enable_dumb_buffer) {
        this.mediaElementsBuffered -= this.videoTag.currentTime - this.lastTime;
        var segmentList = this.adaptation.currentRepresentation.segmentList;
        var segmentSizeSec = (parseInt(segmentList.duration) / parseInt(segmentList.timescale)) / segmentList.segment.length;
        var bufferedSec = this.buffer.count * segmentSizeSec;
        
        // Can we push a buffer into the video tag
        if (bufferedSec >= this.minBuffer && this.mse.readyState == "open") {
            console.log("[Buffer] Have buffer, adding to media source.");
            this.dashHttp._push_segment_to_media_source_api(this.buffer, this.buffer.get());
        }
        
        // Do we need to fetch more buffers.
        if (bufferedSec < this.minBuffer) {
            console.log("[Buffer] Fetching next buffer.");
            this.dashHttp._dashFetchSegmentAsynchron(this.buffer);
        }
        
        this.lastTime = this.videoTag.currentTime;
    }
    
    window.setTimeout(function() {
        instance.updatePlaybackTime();
    }, 100);

};

DASHPlayer.prototype._setupBandwidthMonitoring = function(bps) {
    // bps is global set by UI
    this.bandwidth = new Bandwidth(bps, 1.1, 0.9);
};

DASHPlayer.prototype._setupHttp = function(adaptation, bandwidth) {
    this.dashHttp = new DASHttp('no-cache', adaptation, bandwidth, this);
};

DASHPlayer.prototype._setupAdaptation = function(pmpd, video, bandwidth) {
    this.adaptation = new RateBasedAdaptation(pmpd, video, bandwidth);
};

DASHPlayer.prototype._setupPlotting = function(mediaPresentationDuration) {
    if (this.enable_plot) {
        var graph = this.getGraph();
        var duration = parsePT(mediaPresentationDuration);
        this.fplot = new fPlot(graph.getContext("2d"), duration, graph.width, graph.height);
        this.fplot.initNewFunction(0);
        this.fplot.initNewFunction(1);
        this.fplot.initNewFunction(2); // the current playback time
    }
};

DASHPlayer.prototype._setupBuffer = function() {
    if (this.enable_dumb_buffer) {
        this.overlayBuffer = new DumbBuffer(8);
        this.minBuffer = parsePT(this.mpd.pmpd.minBufferTime);
    } else {
        this.overlayBuffer = new MediaSourceBuffer("0", 2, 8, 0, this);
    }
};

DASHPlayer.prototype._setupMediaSource = function() {
    var URL = overrideMediaSource();
    this.handlers = new EventHandlers(this);
    this.mse = new window.MediaSource();
    this.videoTag.src = URL.createObjectURL(this.mse);
    console.log("[STARTUP] Using url: " + this.videoTag.src);

    this.mse.addEventListener('webkitsourceopen', this.handlers.getOpenHandler(), false);
    this.mse.addEventListener('sourceopen', this.handlers.getOpenHandler(), false);
    
    this.mse.addEventListener('webkitsourceended', this.handlers.getEndHandler());
    this.mse.addEventListener('sourceended', this.handlers.getEndHandler(), false);
    this.videoTag.addEventListener('progress', this.handlers.getProgressHandler(), false);
};

DASHPlayer.prototype._parseMpd = function(rawMpd) {
    var parser = new MPDParser(rawMpd);
    this.mpd = parser.parse();
    
    if (this.adaptation) {
        this.adaptation.setMpd(this.mpd.pmpd);
    }
};

DASHPlayer.prototype.loaded = function (response) {
    var instance = this;
    this._parseMpd(response);
    this._setupBandwidthMonitoring(this.getBps());
    this._setupAdaptation(this.mpd.pmpd, this.videoTag, this.bandwidth);
    this._setupHttp(this.adaptation, this.bandwidth);
    if (this.enable_plot) {
        this._setupPlotting(this.mpd.pmpd.mediaPresentationDuration);
    }
    this._setupBuffer();
    this._setupMediaSource();
    
    if (this.enable_plot) {
        this.bandwidth.addObserver(this.fplot);
        this.adaptation.addObserver(this.fplot);
    }
    this.adaptation.switchRepresentation(); // try to get a better representation at the beginning
    
    this.overlayBuffer.addEventHandler(function(fillpercent, fillinsecs, max) {
        console.log("Event got called from overlay buffer, fillstate(%) = "
                + fillpercent + ", fillstate(s) = " + fillinsecs
                + ", max(s) = " + max);
    });
    
    // If dynamic, we need to update mpd periodically.
    if (this.mpd.pmpd.type == "dynamic") {
        var minBufferTimeSec = parsePT(this.mpd.pmpd.minUpdatePeriod);
        var safeBufferTimeMs = (minBufferTimeSec * 1000) * .8; // give 80% of the time to fetch the next MPD.
        window.setTimeout(function() {
            var mpdLoader = new MPDLoader(function(response) { instance._parseMpd(response); });
            mpdLoader.loadMPD(instance.mpdUrl);
        }, safeBufferTimeMs);
    }

    window.setTimeout(function() {
        instance.updatePlaybackTime();
    }, 100);
};
