//npm modules that also need to be in the package.json file
var express = require('express');
var ejs = require('./lib/ejs-locals');
var fs = require('fs');
var url=require('url');
var i18n = require('i18n-abide');
var emailjs   = require("emailjs");

//set ipaddress from openshift, to command line or to localhost:8080
var ipaddr = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || parseInt(process.argv.pop()) || 8080;

//we use express to parse our http requests and to route in the namespace
var app = express();
app.configure(function() {
	// parse requests
	app.use(express.bodyParser());
	// route in namespace
	app.use(app.router);
	try{
		// find out what i18n directories we have and therefore what languages are supported
		var aSupported = fs.readdirSync("i18n");
		// en-US is alway supported
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

//route post requests for /emailjs to here
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
				"Reply-To":req.param("from"),
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

// route all other requests to here
app.use(function(req, res) {
	//serve out of public directory
	var sUrl = "public" + req._parsedUrl.pathname;
	// process a directory with no specific resource name
	if(fs.existsSync(sUrl) && fs.statSync(sUrl).isDirectory())
	{
		if(sUrl.charAt(sUrl.length-1) != "/" )
		{
			// no slash on end so need to do redirect
			res.writeHead(302, {
				  'Location': req._parsedUrl.pathname + "/"
				  //add other headers here...
				});
			res.end();
			return;
		}
		// put the welcome file on
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
			// set up internationalization for a .js.html resource
			var slang_dir = "ltr";
			try
			{
				// note that if we have a rtl language we need to set "ltr":"rtl" in messages.json (see ar for example)
				slang_dir = req.gettext("ltr");
			}
			catch(e)
			{
				//ignore this exception since we already set lang_dir
			}
			// parse options
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
			// then we want to parse this file as js.html with ejs
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

// start the server listening for requests
app.listen(port, ipaddr);
console.log('node.js running at port ' + port);