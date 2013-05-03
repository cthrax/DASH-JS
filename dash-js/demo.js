var mse;
var startIdx;
var idx = 0;
//var segmentTemplate = '/dashgen/Segments/DASH_MP4/rtpencoder/sarix.sdp.mp4-20130418-101853/';
var segmentTemplate = '/dashgen/Segments/DASH_MP4/mptslive/vlc-sarix.mp4-20130419-172833/';
var segmentTemplate = '/dashgen/Segments/DASH_TS/mptslive/vlc-sarix.ts-20130419-174042/';
var initData;
var video;
function startDemo() {
    video = createVideo();
    startIdx = parseInt(window.location.search.replace("?idx=", ""));
    mse = createMse(video);
}

function createVideo() {
    var base = document.getElementById('base');
    var div = document.createElement('div');
    div.setAttribute('style', 'background-color: black; height: 200px; width: 300px; border: solid 1px white; float: right');
    var video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.width = '200';
    video.height = '200';
    video.setAttribute('style', 'margin-right: auto; margin-left: auto; display: block;');
    video.src = '/output.mp4';
    div.appendChild(video);
    base.appendChild(div);
    return video;
}

function createMse(video) {
    var URL = overrideMediaSource();
    mse = new window.MediaSource();
    video.src = URL.createObjectURL(mse);

    mse.addEventListener('webkitsourceopen', videoOpen, false);
    mse.addEventListener('sourceopen', videoOpen, false);
    mse.addEventListener('addsourcebuffer', sourceBufferAdded, false);
    return mse;
}

function sourceBufferAdded(e) {
    console.log("Source buffer added event fired.");
}

function videoOpen(e) {
    //var initUrl = '/dashgen/Segments/DASH_MP4/rtpencoder/sarix.sdp.mp4-20130418-101853/init.m4s';
    /*var initUrl = segmentTemplate + 'init.m4s';
    console.log("Video open called, readystate: " + mse.readyState);
    var type = 'video/mp4; codecs=avc1.42a028';
    mse.addSourceBuffer(type);
    console.log("mse: " + mse.readyState + " video " + video.readyState);
    sendRequest(initUrl, function(e, xhr) {
        if (xhr.status == 404) {
            // TODO-LIVE seqNotAvailable = true;
            // TODO-LIVE requestDate = new Date();
            console.log("Received 404 for init.");
        }
        
        console.log("Appending initial buffer");
        var data = new Uint8Array(xhr.response);
        initData = data;
        fetchNextSegment();
    });*/
    var type = 'video/mp2t; codecs=avc1.64001e';
    mse.addSourceBuffer(type);
    fetchNextSegment();
}

function sendRequest(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
        callback(e, this);
    };
    xhr.send();
}

function fetchNextSegment() {
    if (idx == 0) {
        idx = startIdx;
        console.log("Duration: " + mse.duration);
        //mse.sourceBuffers[0].append(initData);
        console.log("mse: " + mse.readyState + " video " + video.readyState);
        console.log("Duration: " + mse.duration);
    }
    
    //var url = segmentTemplate + idx + ".m4s";
    var url = segmentTemplate + idx + '.ts?type=ts';
    sendRequest(url, function(e, xhr) {
        console.log("Fetched segment.");
        if (xhr.status == 404) {
            // doesn't exist yet, try again later
            window.setTimeout(fetchNextSegment, 100);
            return;
        }
        
        idx++;
        var data = new Uint8Array(xhr.response);
        if (mse.readyState != 'open') {
            console.log("mse not ready, readystate: " + mse.readyState);
            checkSourceError(video);
        }
        mse.sourceBuffers[0].append(data);
        fetchNextSegment();
    });
}