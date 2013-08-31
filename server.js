var express = require('express');
var fs = require('fs');
var mime = require('mime');
var engine = require('ejs-locals');

var ipaddr = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || parseInt(process.argv.pop());

var app = express();
app.configure(function() {
	app.use(express.bodyParser());
	app.use(app.router);
});

app.use(function(req, res) {
	var sUrl = "/index.js.html";
	if (req.url != "/")
		sUrl = req.url;
	if (-1 == sUrl.search("js.html")) {
		fs.readFile("views/" + sUrl, function(err, data) {
			if (err) {
				res.writeHead(404);
				return res.end("File not found.");
			}

			res.setHeader("Content-Type", mime.lookup(sUrl)); // Solution!
			res.writeHead(200);
			res.end(data);
		});
	} else {
		var sOut = "";
		var options = {
				settings:{
					'view engine': 'js.html'
				}
		};
		engine("views" + sUrl, options, function(err, html){
			if(err){
				console.log(err);
			}else{
				res.setHeader("Content-Type", "text/html");
				res.end(html);
			}
		});
	}
});

app.listen(port, ipaddr);
console.log('node.js running at port ' + port);
