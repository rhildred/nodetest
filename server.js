var express = require('express');
var ejs = require('./lib/ejs-locals');
var fs = require('fs');
var url=require('url');
var i18n = require('i18n-abide');
var emailjs   = require("emailjs");

var ipaddr = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || parseInt(process.argv.pop()) || 8080;

var app = express();
app.configure(function() {
	app.use(express.bodyParser());
	app.use(app.router);
	try{
		var aSupported = fs.readdirSync("i18n");
		aSupported.push("en-US");
		app.use(i18n.abide({
		  supported_languages: aSupported,
		  default_lang: 'en-US',
		  translation_directory: 'i18n',
		  translation_type: 'key-value-json'
		}));
	}catch(e){
		console.log("no i18n support " + e.toString());
	}
});

app.post("/emailjs", function(req, res){
	var oParams = null;
	try{
		// get connection params from json file and connect to server (probably gmail). Be careful that you don't commit these to a public repository!
		oParams = require("./emailjs.json");
		var server  = emailjs.server.connect(oParams);
		
		// make message, primarily from form variables, text, from and subject. These need to be coded exactly like this on the form to work
		var oMessage = {
				text:    req.param("text"), 
				from:    req.param("from"), 
				to:      oParams.to,
				subject: req.param("subject")
		};

		// send the message and get a callback with an error or details of the message that was sent
		server.send(oMessage, function(err, message) {
			if(err){
				throw err;
			}
			// need to do redirect
			res.writeHead(302, {
				'Location': "../" + oParams.success
				//add other headers here...
			});
			res.end();
			return;
		});

	} catch(e) {
		console.log(e);
		// need to do redirect
		res.writeHead(302, {
			'Location': "../" + oParams.failure
			//add other headers here...
		});
		res.end();
		return;
	}
});

app.use(function(req, res) {
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
			var slang_dir = "ltr";
			try
			{
				slang_dir = req.gettext("ltr");
			}
			catch(e)
			{
				//ignore this exception since we already set lang_dir
			}
			var options = {
				settings : {
					'view engine' : 'js.html'
				},
				locals : {
					'page' : sUrl.replace(/.*\//, '')
							.replace('.js.html', ''),
					'q' : 'Search'
				},
				gettext : req.gettext,
				lang : req.lang,
				lang_dir : slang_dir,
				"__" : req.gettext
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
