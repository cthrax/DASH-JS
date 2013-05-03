
DumbBuffer.prototype.constructor = DumbBuffer;
function DumbBuffer(size) {
    // Circle buffer
    this.buffer = new Object;
    this.buffer.array = new Array();
    this.buffer.first = 0;
    this.buffer.last = 0;
    this.buffer.size = size;
    this.id = "0";
}

DumbBuffer.prototype.add = function(buf) {
    this.buffer[this.getLastIdx()] = buf;
    this.last++;
};

DumbBuffer.prototype.hasBuffers = function() {
    return this.last != this.first;
};

DumbBuffer.prototype.count = function() {
    return this.last - this.first;
};

// Keep consistent with existing buffer interface, disregards length.
DumbBuffer.prototype.push = function(buf, length) {
    this.add(buf);
};

// Keep consistent with existing buffer interface, not sure what this is supposed to do. so nothing.
DumbBuffer.prototype.callback = function() {
    // NO-OP
};

DumbBuffer.prototype.getLastIdx = function() {
    return this.last % this.buffer.size;
};

DumbBuffer.prototype.getFirstIdx = function() {
    return this.first % this.buffer.size;
};

DumbBuffer.prototype.incrementFirst = function() {
    if (this.first + 1 > this.last) {
        throw "Attempting to get buffer when there aren't any!";
    }
    
    this.first++;
};

DumbBuffer.prototype.incrementLast = function() {
    if ((this.last + 1) % this.size == this.getFirstIdx) {
        throw "Out of buffer space! Attempting to overwrite unused buffer!";
    }
    
    this.last++;
};

DumbBuffer.prototype.get = function() {
    var buf = this.buffer[this.getFirstIdx()];  
    this.first++;
    return buf;
};