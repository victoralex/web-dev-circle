	
	"use strict";

	chrome.app.runtime.onLaunched.addListener( function()
	{
		console.log('x');
		
		//
		// P2P Client / Server
		//

		var config = {
				proxyHost: '127.0.0.1',
				proxyPort: 21000
			};

		//
		// Local TCP Server for Proxy
		//

		var socket = chrome.socket;

		socket.create( "tcp", {}, function( socketInfo )
		{
			var _onAccept = function( acceptInfo )
			{
				console.log( "ACCEPT ", acceptInfo );

				if( typeof acceptInfo.socketId == "undefined" )
				{
					socket.accept( socketInfo.socketId, _onAccept );

					return;
				}

				// This is a request that the system is processing. 
				// Read the data.
				socket.read( acceptInfo.socketId, function( readInfo )
				{
					console.log( "READ ", readInfo );

					// Parse the request.
					var data = arrayBufferToString( readInfo.data );

					if( data.length == 0 )
					{
						// got an empty request

						socket.destroy( acceptInfo.socketId );
						socket.accept( socketInfo.socketId, _onAccept );

						return;
					}
				});
			}

			socket.listen( socketInfo.socketId, config.proxyHost, config.proxyPort, 50, function( result )
			{
				console.log( "Proxy Server Listening on " + config.proxyHost + ":" + config.proxyPort );

				// handle accepted connections
				socket.accept( socketInfo.socketId, _onAccept );
			});
		});
	});