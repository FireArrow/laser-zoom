var udp_listen_port = 10001;
var current_state = "";
var sentEmpty = false;

var debug_mode = true;

var WebSocketServer = require("ws").Server
  , wss = new WebSocketServer({port: 9999})

// Listen for udp
var dgram = require("dgram");
var server = dgram.createSocket("udp4");
server.on( "listening",
    function () {
        var address = server.address();
        if(debug_mode)
        console.log("listening for udp datagrams on " + address.address + ":" + address.port);
});
console.log(server);

server.bind(udp_listen_port);

var ws_error_callback = function(err) {
    if(err != null)
        console.log("Error when broadcasting data: %s", err);
};
wss.broadcast = function(data) {
    for(var i in this.clients) {
        this.clients[i].send(data, ws_error_callback);
    }
};

server.on("message", function(msg, rinfo) {
    if(debug_mode) {
        console.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
    }
    if(msg != "ndd") {
        sentEmpty = false;
        current_state = ""+msg;
        wss.broadcast(current_state);
    } else {
        if( !sentEmpty ) {
            current_state = "";
            sentEmpty = true;
            wss.broadcast(current_state);
        }
    }
});

wss.on("connection", function(ws) {
    console.log("connection from: ", ws.upgradeReq.headers.origin);
    ws.on("close", function() {
        console.log("Connection from %s closed", ws.upgradeReq.headers.origin);
    });

    ws.on("message", function(data) {
        console.log("Got message: " + data);
        var parts = data.split(":");
        switch(parts[0]) {
            case "invadersHS":
                ws.send("hs:" + invadersHS);
                var score = parseInt(parts[1]);
                if(score > invadersHS) {
                    invadersHS = score;
                }
                break;
        }
    });

    ws.send(current_state, ws_error_callback);
});

// web server paste
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8888;
    var requesthandler = function( request, response ) {
        // if request.url is request from javascript app, 
        // parse current state to some sort of json and return it,
        // else just return the static html files:
        var pathname = url.parse( request.url ).pathname;

        console.log("Serving file " + pathname);
        var uri = "./www" + pathname;
        var filename = path.join(process.cwd(), uri);
        fs.exists(filename, function(exists) {
            if(!exists) {
                console.log("404: "+pathname);
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.write("404 Not Found\n");
                response.end();
                return;
            }

            if (fs.statSync(filename).isDirectory()) 
            filename += '/index.html';

        fs.readFile(filename, "binary", function(err, file) {
            if(err) {        
                console.log("500: "+pathname);
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write(err + "\n");
                response.end();
                return;
            }
            console.log("200: "+pathname);
            response.writeHead(200);
            response.write(file, "binary");
            response.end();
        });
        });
    };

http.createServer( requesthandler ).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
 current_state = chunk;
});
