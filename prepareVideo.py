#!/usr/bin/python

import sys
import os
import shutil
import argparse
import subprocess

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-f', '--filename', required=True, help='Name of the file for MP4Box to split.')
    parser.add_argument('-n', '--segmentName', default="segment", help='Prefix for each segement created')
    parser.add_argument('-m', '--mp4boxpath', default='/usr/local/bin/MP4Box', help='Override the location of mp4box, defaults to /usr/local/bin/MP4Box')
    parser.add_argument('-s', '--segmentDuration', default=2000, help='Segement duration in ms, defaults to 2000ms')
    args = parser.parse_args()
    runMp4Box(args)

def runMp4Box(args):
    newFile = args.filename.replace('.mp4', '_mp4box.mp4')
    newFolder = args.filename.replace('.mp4', '')
    try:
        os.mkdir(newFolder)
    except:
        print 'Directory exists, deleting content.'
        shutil.rmtree(newFolder, True)
        os.mkdir(newFolder)

    cmd = '{0.mp4boxpath} -add {0.filename} -new {1}/{2}'.format(args, newFolder, newFile)
    subprocess.call(cmd, shell=True)
    print 'Executing ', cmd,
    cmd = '{0.mp4boxpath} -frag 1000 -dash {0.segmentDuration} -segment-name {1}/{0.segmentName}  -out {1}/video.mpd {1}/{2}'.format(args, newFolder, newFile)
    print 'Executing ', cmd,
    subprocess.call(cmd, shell=True)

if __name__ == "__main__":
    main();
