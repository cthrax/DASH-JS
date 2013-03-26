var DASHJS_VERSION = "0.6a";
var playbackTimePlot;

function DASHPlayer(videoTag, URLtoMPD, graphGetter) {
    console.log("DASH-JS Version: " + DASHJS_VERSION);
    this.videoTag = videoTag;
    this.dashHttp = new DASHttp('no-cache');
    var instance = this;
    this.mpdLoader = new MPDLoader(function() { instance.loaded(); });
    this.mpdLoader.loadMPD(URLtoMPD);
    this.getBps = function() { return MPDLoader.bps; };
    this.getGraph = graphGetter;
    //myBuffer = init_timeBuffer(2,10,0,video);
    //video.addEventListener('progress', function() {console.log("progress"); }, false);
}

DASHPlayer.prototype.updatePlaybackTime = function () {
    var instance = this;
    this.fplot.update(this.videoTag.currentTime, 2);
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
    var graph = this.getGraph();
    var duration = parsePT(mediaPresentationDuration);
    this.fplot = new fPlot(graph.getContext("2d"), duration, graph.width, graph.height);
    this.fplot.initNewFunction(0);
    this.fplot.initNewFunction(1);
    this.fplot.initNewFunction(2); // the current playback time
};

DASHPlayer.prototype._setupBuffer = function() {
    this.overlayBuffer = new MediaSourceBuffer("0", 2, 4, 0, this);
};

DASHPlayer.prototype._setupMediaSource = function() {
    var URL = overrideMediaSource();
    var handlers = new EventHandlers(this);
    this.mse = new window.MediaSource();
    this.videoTag.src = URL.createObjectURL(this.mse);

    this.mse.addEventListener('webkitsourceopen', handlers.getOpenHandler(), false);
    this.mse.addEventListener('sourceopen', handlers.getOpenHandler(), false);
    
    this.mse.addEventListener('webkitsourceended', handlers.getEndHandler());
    this.mse.addEventListener('sourceended', handlers.getEndHandler(), false);
};

DASHPlayer.prototype.loaded = function () {
    var instance = this;
    this._setupBandwidthMonitoring(this.getBps());
    this._setupAdaptation(this.mpdLoader.mpdparser.pmpd, this.videoTag, this.bandwidth);
    this._setupHttp(this.adaptation, this.bandwidth);
    this._setupPlotting(this.mpdLoader.mpdparser.pmpd.mediaPresentationDuration);
    this._setupBuffer();
    this._setupMediaSource();
    
    this.bandwidth.addObserver(this.fplot);
    this.adaptation.addObserver(this.fplot);
    this.adaptation.switchRepresentation(); // try to get a better representation at the beginning
    
    this.overlayBuffer.addEventHandler(function(fillpercent, fillinsecs, max) {
        console.log("Event got called from overlay buffer, fillstate(%) = "
                + fillpercent + ", fillstate(s) = " + fillinsecs
                + ", max(s) = " + max);
    });

    window.setTimeout(function() {
        instance.updatePlaybackTime();
    }, 100);
};

//TODO: Move somewhere more appropriate
function checkDate(str_startTime) {
    var startTime = new date(str_startTime).getTime();
    var nowTime = new Date().getTime();
    
    if (nowTime <= startTime) {
        return -1;
    } else {
        return Math.floor((nowTime-startTime)/1000);
    }
}
