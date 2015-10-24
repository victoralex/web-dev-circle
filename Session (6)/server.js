
	"use strict";
	
	//Lets require/import the HTTP module
	var http = require( 'http' ),
		util = require( 'util' ),
		app = require( 'express' )(),

		port = 8080;

	app.get( '/', function( req, res )
	{
		res.send( util.format( '%s hello', 'foo' ) );
	});

	app.get( '/2/:user', function( req, res )
	{
		res.send( util.inspect( req.params ) );
	});

	var server = app.listen( port, function()
	{
		console.log(
				'Example app listening at http://'
				+ server.address().address
				+ ':'
				+ server.address().port
			);
	});

	/*
	//Create a server
	var server = http.createServer( function( request, response )
	{   
	    response.end( 'It Works!! Path Hit: ' + request.url );
	});

	//Lets start our server
	server.listen( port, function()
	{
	    //Callback triggered when server is successfully listening. Hurray!
	    console.log( "Server listening on: http://localhost:%s", port );
	});
	*/