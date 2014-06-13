function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

var makeDDClient = function( port ) {

    var pointList = new Array();
    var socketId;

    var onPoint = function( pointList ) {
        var point;
        for( i=0; i<pointList.length; ++i ) {
            point = pointList[i];
            console.log( point.x + "," + point.y );
        }
        console.log("----------------");
    }

    var ws;
    (function w_req() {
        if( !port ) {
            port = 9999;
        }
        ws = new WebSocket("ws://localhost:" + port)
        ws.onmessage = function(data){
            pointList = [];
            if(data.data !== "") {

                //This is (probably) a point string. They have format
                //
                //seqnr#xxx.xx,yyy.yy xx.xx,yyy.yy xxxx.xx,yy.yy
                //
                //where the integer part can be any number of digits and
                //the decimal part is allways two digits
                //console.log(data.data);
                var data = String(data.data).split("#");
                var strPoints = String(data[1]).split(" ");
                for(var i in strPoints) {
                    var coords = String(strPoints[i]).split(",");
                    var point = { x : parseFloat(coords[0]), y : parseFloat(coords[1]) };
                    pointList.push(point);
                }
                onPoint( pointList );
            }
        }
    ws.onerror = function() {console.log("WS ERROR");}
    ws.onopen = function() {console.log("WS CONNECTED");}
    })();

    return {
        getPoints: function() {
            return pointList;
        },

        setOnPoint: function( newOnPoint ) {
            onPoint = newOnPoint;
        }
    }
}

console.log( "String extension. pew pew!!" );

console.log( chrome );
var ddc = makeDDClient( 9999 );

var findElements = function( pointList) {
    var point;
    var element;
    for( i=0; i<pointList.length; ++i ) {
        point = pointList[i];
        console.log( point.x + "," + point.y );
        chrome.tabs.executeScript( {
            code: 
                  'var x = ' + point.x + ' * window.outerWidth / 640;' +
                  'var y = ' + point.y + ' * window.outerHeight / 480;' +
                  'var ddelement = document.elementFromPoint( x,y );' +
                  'if( ddelement && ddelement.tagName == "IMG" ) {\n' +
                     'ddelement.style.width = "120%";\n' +
                  '}\n' +
                  'else if( ddelement && ( ddelement.tagName == "INPUT" && ddelement.type == "button" || ddelement.tagName == "BUTTON" ) ) {\n' +
                      'console.log("pushing button" );\n' +
                      'ddelement.click();\n' +
                  '}\n'
//                  'else if( ddelement && ddelement.tagName == "A" && ddelement.href ) {\n' +
//                      'console.log("pushing link" );\n' +
//                      'ddelement.click();\n' +
//                  '}'
        });
    };
};

ddc.setOnPoint( findElements );

chrome.browserAction.onClicked.addListener(function(tab) {
        console.log("turning tab red" );
        chrome.tabs.executeScript( {
/*            code: 'for( i=0; i<pointList.length; ++i ) {' +
                    'point = pointList[i];'
                    'console.log( point.x + "," + point.y );'
                  '}';*/
            code: 'document.body.style.backgroundColor="red"; console.log("fisk");'
        });

});
