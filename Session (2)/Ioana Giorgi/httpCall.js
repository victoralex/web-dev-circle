var http = require('http');
var xml2js = require('xml2js');
var xpath = require('xml2js-xpath');
var express = require('express');

var app = express();

app.use(express.static('./'));
app.get('/quote', function (req, res) {
	var options = {
	  host: '195.28.176.74',
	  path: '/BVBDelayedWS/Intraday.asmx/TradingDataPerSymbol?symbol=' + req.query.symbol
	};

	http.request(options, function(response) {
		  var xmlData = '';

		  response.on('data', function (chunk) {
		    xmlData += chunk;
		  });

		  response.on('end', function () {
		    console.log(xmlData);
			xml2js.parseString(xmlData, function(err, result){
					extractedData = result.ArrayOfTypeLevel1.TypeLevel1[0].Closeprice[0];
					res.send(extractedData);
				});
		  	})
	}).end();
});

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});