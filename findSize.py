#!/usr/bin/python

import fcntl
import os
import select
import subprocess
import sys
from threading import Thread
import time

try:
    from Queue import Queue, Empty
except ImportError:
    from queue import Queue, Empty

ON_POSIX = 'posix' in sys.builtin_module_names

def enqueue_output(out, queue):
    for line in iter(out.readline, b''):
        queue.put(line)
    out.close()

class ChromeTester:
    def __init__(self, condition):
        #nothing
        self.something = "foo"
        self.condition = condition

    def main(self):

        for i in range(767, 2001):
            cmd = '/usr/bin/python /home/myles/workspace/dash-test/prepareVideo.py -f h264_gop30_baseline_constant.mp4 -s {0}'.format(i)
            proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            while proc.poll() == None:
                time.sleep(1)
            cmd = ['google-chrome', '--enable-logging=stderr', '--log-level=9','--v=9', 'http://localhost/dashtest.html?mpd=h264_gop30_baseline_constant/video.mpd']
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=1, close_fds=ON_POSIX)
            q = Queue()
            t = Thread(target=enqueue_output, args=(proc.stderr, q))
            t.daemon = True
            t.start()

            msg = ''
            errMsg = ''
            lineCount = 0
            line = ''
            attempts = 0
            while attempts < 100:
                try:
                    line += q.get(timeout=.1)
                except Empty:
                    attempts += 1
                    continue
                else:
                    if line == '' and proc.poll() != None:
                        break;

                    if (lineCount == 0 and line.rfind('segment2.m4s') != -1):
                        lineCount += 1
                    elif (lineCount > 50):
                        proc.terminate()
                        proc.kill()
                        break;
                    elif (lineCount != 0):
                        lineCount += 1
                        if (line.rfind('Media pipeline error: 3') != -1 or self.condition(line)):
                            proc.terminate()
                            proc.kill()
                            break;
                    elif (lineCount == 0):
                         line = ''

            if (attempts >= 100):
                print 'Failed attempts'

            t.join(1)
            if (line.rfind('Media pipeline error: 3') == -1 and attempts < 100):
                print 'Found! {0} {1}'.format(i, line)
                if (proc.poll() == None):
                    proc.terminate()
                    proc.kill()
                break;
            else:
                print 'Failed: {0}'.format(i)


if __name__ == "__main__":
    tester = ChromeTester()
    tester.main()
