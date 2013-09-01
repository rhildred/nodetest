var express = require('express');
var ejs = require('ejs-locals');
var fs = require('fs');

var ipaddr = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || parseInt(process.argv.pop());

var app = express();
app.configure(function() {
	app.use(express.bodyParser());
	app.use(app.router);
});

app.use(function(req, res) {
	var sUrl = "views/index.js.html";
	if (req._parsedUrl.pathname == "/") {
		if (!fs.existsSync(sUrl)) {
			sUrl = "views/index.html";
		}
	} else {
		sUrl = "views" + req._parsedUrl.pathname;
	}
	if (sUrl.search("/_") != -1) {
		// we don't seem to be able to get a path below views
		res.send(403, 'Unauthorized.');
	} else if (fs.existsSync(sUrl)) {
		// serve file
		if (-1 == sUrl.search("js.html")) {
			// then it is sent without parsing
			res.sendfile(sUrl);
		} else {
			// then we want to parse this file as js.html with ejs
			var options = {
				settings : {
					'view engine' : 'js.html'
				}
			};
			ejs(sUrl, options, function(err, html) {
				if (err) {
					console.log(err);
				} else {
					res.setHeader("Content-Type", "text/html");
					res.end(html);
				}
			});
		}
	} else {
		res.send(404, 'File not Found.');
	}
});

app.listen(port, ipaddr);
console.log('node.js running at port ' + port);
