#!/usr/bin/python

import subprocess

sixteenNineRes = ["128x72", "256x144", "384x216", "512x288", "640x360", "768x432", "896x504", "1024x576", "1152x648", "1280x720", "1408x792", "1536x864", "1664x936", "1920x1080"]

otherRes = ["352x288", "704x576", "640x480", "960x640"]

profiles = ["baseline", "main", "high"]

resolutions = sixteenNineRes + otherRes

framerates = ["2", "10", "12", "15", "20", "24", "30"]

def main():
    for resolution in resolutions:
        for profile in profiles:
            for framerate in framerates:
                ffmpeg = "ffmpeg -i test1080pF.mp4 -s {0} -b:v 1000000 -vcodec libx264 -profile:v {1} -r {2} output.mp4".format(resolution, profile, framerate)
                proc = subprocess.Popen(ffmpeg, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                while proc.poll() == None:
                    time.sleep(1)

                def chromeDone(line):
                    return line.rfind('') != -1
                
                chromeTester = ChromeTester(chromeDone);


if __name__ == "__main__":
    main()
