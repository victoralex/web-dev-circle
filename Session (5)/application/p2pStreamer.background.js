	
	"use strict";

	chrome.app.runtime.onLaunched.addListener( function()
	{
		//
		// P2P Client / Server
		//

		var config = {
				peerTrackerHost: '162.13.178.208',
				peerTrackerPort: 9000,
				peersPeriodicConnectionInterval: 5000,

				proxyHost: '127.0.0.1',
				proxyPort: 21000,
				ipcChannel: "obidosIPC"
			},
			peerConnections = {},
			peer = new Peer(
						uuid.v4().replace( /-/g, '').substring( 0, 16 ),
						{
							host: config.peerTrackerHost,
							port: config.peerTrackerPort,
							debug: false
						}
					);

		var arrayBufferToString = function(buffer)
		{
			var str = '',
				uArrayVal = new Uint8Array(buffer);

			for(var s = 0; s < uArrayVal.length; s++)
			{
				str += String.fromCharCode(uArrayVal[s]);
			}

			return str;
		};

		function str2ab(str)
		{
			var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
			var bufView = new Uint16Array(buf);
			
			for (var i=0, strLen=str.length; i<strLen; i++)
			{
				bufView[i] = str.charCodeAt(i);
			}

			return buf;
		}

		function string2ArrayBuffer(string, callback)
		{
			var blob = null,
				BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder;

			var f = new FileReader();
			f.onload = function(e)
			{
				callback(e.target.result);
			}
			if (typeof(BlobBuilder) !== 'undefined')
			{
				var bb = new BlobBuilder();
				bb.append(string);
				blob = bb.getBlob();

				f.readAsArrayBuffer(bb.getBlob());
			}
			else
			{
				f.readAsArrayBuffer( new Blob([string]) );
			}
		}

		//
		// Treat this peer
		//

		peer.on('open', function( id )
		{
			console.log( "Connected to " + config.peerTrackerHost + " with ID " + id );
		});

		peer.on('connection', function( conn )
		{
			console.log( "Accepted connection to [" + conn.peer + "]" );

			conn.on( 'data', function( data )
			{
				var	uriString = data.split( "\n" )[ 0 ].split( / /g )[ 1 ];

				( uriString.indexOf( '//' ) == -1 ) ? ( uriString = '//' + uriString ) : null;

				var uri = new URI( uriString ),
					hostname = uri.hostname(),
					port = uri.port();

				port = ( port.length > 0 ) ? parseInt( port ) : 80;

				console.log( "Connecting to <" + hostname + ":" + port + ">" );

				if( hostname.length == 0 )
				{
					console.log( uriString );
					
					conn.close();

					return;
				}

				//
				// Process the data
				//

				socket.create( "tcp", {}, function( socketInfo )
				{
					socket.connect( socketInfo.socketId, hostname, port, function( result )
					{
						if( result < 0 )
						{
							console.log( uriString );

							conn.close();

							// we're done with this request
							socket.destroy( socketInfo.socketId );

							return;
						}

						string2ArrayBuffer( data, function( ab )
						{
							socket.write( socketInfo.socketId, ab, function( writeInfo )
							{
								if( writeInfo < 0 )
								{
									conn.close();

									// we're done with this request
									socket.destroy( socketInfo.socketId );

									return;
								}

								socket.read( socketInfo.socketId, function( readInfo )
								{
									if( arrayBufferToString( readInfo.data ).length == 0 )
									{
										// empty file

										conn.close();

										// we're done with this request
										socket.destroy( socketInfo.socketId );

										return;
									}

									console.log( "Sending " + uriString, arrayBufferToString( readInfo.data ) );

									conn.send( readInfo.data );

									// we're done with this request
									socket.destroy( socketInfo.socketId );
								});
							});
						});
					});
				});

				//console.log( "R [" + conn.peer + "]", data );
			});

			conn.on( 'error', function( e )
			{
				console.error( e );
			});
		});

		//
		// IPC
		//

		//var ipcRequestsChannel = chrome.runtime.connect( { name: config.ipcRequestsChannel } );

		//
		// Local TCP Server for Proxy
		//

		var socket = chrome.socket;

		socket.create( "tcp", {}, function( socketInfo )
		{
			var _onAccept = function( acceptInfo )
			{
				//console.log( "ACCEPT ", acceptInfo );

				if( typeof acceptInfo.socketId == "undefined" )
				{
					socket.accept( socketInfo.socketId, _onAccept );

					return;
				}

				// This is a request that the system is processing. 
				// Read the data.
				socket.read( acceptInfo.socketId, function( readInfo )
				{
					//console.log( "READ ", readInfo );

					// Parse the request.
					var data = arrayBufferToString( readInfo.data );

					if( data.length == 0 )
					{
						// got an empty request

						socket.destroy( acceptInfo.socketId );
						socket.accept( socketInfo.socketId, _onAccept );

						return;
					}

					/*
					// forward the request to all connected peers
					Object.keys( peerConnections ).forEach( function( connectedPeer )
					{
						peerConnections[ connectedPeer ].send( data );
					});
					*/

					var _connectToPeers = function()
					{
						$.ajax(
						{
							dataType: "json",
							url: "http://" + config.peerTrackerHost + ":" + config.peerTrackerPort + "/peerjs/peers",
							success: function( jsonEl )
							{
								jsonEl.forEach( function( peerID )
								{
									( function( peerID )
									{
										if( peer.id == peerID )
										{
											//return false;
										}

										//console.log( "[" + peer.id + "] connecting to " + peerID );

										//
										// Connect to outgoing peer
										//

										var conn = peer.connect( peerID );

										conn.on( 'open', function()
										{
											// got connected to outgoing console

											console.log( "Sending " + data.length + "b to " + peerID );

											( peerConnections[ peerID ] = conn ).send( data );
										});

										conn.on( 'error', function( e )
										{
											console.log( "[" + peer.id + "] error with [" + peerID + "]" );

											conn.close();

											socket.destroy( acceptInfo.socketId );
											socket.accept( socketInfo.socketId, _onAccept );
										});

										var _closeFunction = function()
										{
											console.log( "[" + peer.id + "] closed [" + peerID + "]" );

											conn.close();

											socket.destroy( acceptInfo.socketId );
											socket.accept( socketInfo.socketId, _onAccept );
										}

										conn.on( 'close', _closeFunction );

										conn.on( 'data', function( data )
										{
											// here comes the response

											//console.log( acceptInfo.socketId, arrayBufferToString( data ) );

											socket.write( acceptInfo.socketId, data, function( writeInfo )
											{
												console.log( "Sent " + arrayBufferToString( data ).length + "b to browser" );

												socket.destroy( acceptInfo.socketId );
												socket.accept( socketInfo.socketId, _onAccept );

												conn.close();
											});

											conn.removeListener( "close", _closeFunction );
										});

										return true;
									}( peerID ) );
								});

								//setTimeout( _connectToPeers, config.peersPeriodicConnectionInterval );
							}
						});
					}

					_connectToPeers();

					// we're done with this request
					//socket.destroy( acceptInfo.socketId );
					//socket.accept( socketInfo.socketId, _onAccept );
				});
				
				//socket.accept( socketInfo.socketId, _onAccept );
			}

			socket.listen( socketInfo.socketId, config.proxyHost, config.proxyPort, 50, function( result )
			{
				console.log( "Proxy Server Listening on " + config.proxyHost + ":" + config.proxyPort );

				// handle accepted connections
				socket.accept( socketInfo.socketId, _onAccept );
			});
		});

		//
		// Proxy Changer
		//

		/*
		chrome.proxy.settings.set(
			{
				value:
				{
					mode: "fixed_servers",
					rules:
					{
						proxyForHttp:
						{
							scheme: "http",
							host: config.proxyHost + ":" + config.proxyPort
						}
					}
				},
				scope: 'regular'
			},
			function()
			{

			}
		);
		*/
	});