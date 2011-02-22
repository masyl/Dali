/**
 * This is a lightweight node.js server for static files.
 * Requires the 'node-static' package
 * Usage:  node server.js
 */
var port = 8011;
var sys = require('sys');
var static = require('node-static');

//
// Create a node-static server to serve the current directory
//
var file = new(static.Server)('.', { cache: 7200, headers: {'X-Hello':'World!'} });

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response, function (err, res) {
            if (err) { // An error as occured
                sys.error("> Error serving " + request.url + " - " + err.message);
                response.writeHead(err.status, err.headers);
                response.end();
            } else { // The file was served successfully
                sys.puts("> " + request.url + " - " + res.message);
            }
        });
    });
}).listen(port);

sys.puts("> node-static is listening on http://127.0.0.1:" + port);