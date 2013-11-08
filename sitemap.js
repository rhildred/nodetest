var fs = require('fs');

var nPages = 0;

var walk = function(dir) {
	var results = [];
	// get listing contents of directory
	var list = fs.readdirSync(dir);
	list.forEach(function(sFile) {
		file = dir + '/' + sFile;
		var stat = fs.statSync(file);
		debugger;
		if (stat && stat.isDirectory())
		{
			// then we have a subdirectory
			results = results.concat(walk(file));
		}
		if (sFile.charAt(0) != '_' && sFile.slice(-8) == '.js.html') {
			// then we have a file so we need to get date last modified
			var dDate = new Date(stat.mtime);
			var nMonth = dDate.getMonth() + 1;
			nMonth = nMonth < 10 ? '0' + nMonth : nMonth;
			var nDay = dDate.getDate();
			nDay = nDay < 10 ? '0' + nDay : nDay;
			nPages++;
			// write an entry for the file
			stream.write("<url><loc>http://syndicateme.net/" + sFile
					+ "</loc><lastmod>" + dDate.getFullYear() + '-' + nMonth
					+ '-' + nDay + "</lastmod></url>\n");
		}
	});
	return;
}

var stream = fs.createWriteStream("public/sitemap.xml");
// open the output file
stream.once('open',	function(fd) {
	// write header
	stream.write("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
	// search for content recursively
	walk('public');
	//write footer
	stream.write("</urlset>\n");
	//close the output file
	stream.end();
	console.log("created public/sitemap.xml with " + nPages + " pages.");
});

