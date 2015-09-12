
	var http = require('http'),
		xml2js = require("xml2js"),
		express = require('express'),
		app = express();

	// expose local folder to be used as a static file source
	app.use( express.static( './' ) );

	// the route to get a quote
	app.get('/quote', function( req, res )
	{
		http .request(
			{
				host: '195.28.176.74',
				path: '/BVBDelayedWS/Intraday.asmx/TradingDataPerSymbol?'
						+ 'symbol=' + process.argv[ 2 ]
			},
			function( response )
			{
				var stringifiedResponse = '';

				response.on('data', function (chunk)
				{
					stringifiedResponse += chunk;
				});

				//the whole response has been recieved, so we just print it out here
				response.on('end', function ()
				{
					console.log( stringifiedResponse );
					
					xml2js.parseString( stringifiedResponse, function( err, json )
					{
						if( err )
						{
							throw err;

							return;
						}

						res.send( json.ArrayOfTypeLevel1.TypeLevel1[ 0 ].Closeprice[ 0 ] );
					});
				});
			}
		).end();
	});

	// start listening
	var server = app.listen( 3000, function()
	{
		var host = server.address().address;
		var port = server.address().port;

		console.log('Example app listening at http://%s:%s', host, port);
	});