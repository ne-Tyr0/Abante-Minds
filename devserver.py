"""Local preview server for Abante Minds.

The app has no build step, so any static server will do -- but the browser
caches aggressively and a service worker sits in front of it, which makes an
edit look like it did nothing. This server sends no-store on everything so a
reload always shows the file that is actually on disk.

    python devserver.py                 # http://localhost:5176 + LAN address
    python devserver.py 8080            # another port
    python devserver.py --local-only    # loopback only

It binds every interface by default and prints the LAN URL, so a phone on the
same Wi-Fi can open it. Note that a plain-HTTP LAN address is an insecure
origin: the service worker will not register and the browser will not offer
"Add to home screen". Everything else -- the whole practice loop, progress,
localStorage -- works exactly as it does on localhost.
"""
import socket
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


def lan_address():
    """The address this machine uses to reach the network, without sending
    anything -- connecting a UDP socket only picks a route."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    local_only = "--local-only" in sys.argv
    port = int(args[0]) if args else 5176

    host = "127.0.0.1" if local_only else "0.0.0.0"
    print("Abante Minds")
    print("  http://localhost:%d" % port)
    if not local_only:
        ip = lan_address()
        if ip:
            print("  http://%s:%d   (phone on the same Wi-Fi)" % (ip, port))
        print("  no service worker on the LAN address: plain HTTP is an insecure origin")
    ThreadingHTTPServer((host, port), NoCacheHandler).serve_forever()
