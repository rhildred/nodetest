var express = require('express');
require('./lib/ejs');
var ejs = require('ejs-locals');
var fs = require('fs');
var url=require('url');

var ipaddr = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || parseInt(process.argv.pop()) || 8080;

var app = express();
app.configure(function() {
	app.use(express.bodyParser());
	app.use(app.router);
});

app.use(function(req, res) {
	var sOriginal = req.url;
	var sUrl = "public" + req._parsedUrl.pathname;
	if(fs.existsSync(sUrl) && fs.statSync(sUrl).isDirectory())
	{
		if(sUrl.charAt(sUrl.length-1) != "/" )
		{
			// need to do redirect
			res.writeHead(302, {
				  'Location': req._parsedUrl.pathname + "/"
				  //add other headers here...
				});
			res.end();
			return;
		}
		if (fs.existsSync(sUrl + "index.js.html")) {
			sUrl += "index.js.html";
		}
		else
		{
			sUrl += "index.html";
		}
	}
	if (sUrl.search("/_") != -1) {
		// don't serve things that start with an undersore
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
