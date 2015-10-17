	
	"use strict";

	var	trackerIP = '192.168.105.65',
		peer = new Peer(
			'victor',
			{
				host: trackerIP
			}
		);

	var Member = function( memberID )
	{
		var _self = this;

		this.mid = memberID;

		this.remove = function()
		{
			delete Swarm.members[ this.mid ];
		}

		// initialize

		Swarm.members[ this.mid ] = this;
	}

	var Swarm = {

		members: {},

		broadcast: function( message )
		{
			for( var i in peer.connections )
			{
				peer.connections[ i ].forEach( function( connection )
				{
					if( !connection.open )
					{
						return;
					}

					connection.send( message );
				})
			}

			// hack into the local received commands
			Swarm._handleUpdate( message, null );
		},

		_handshake: function( peerObject )
		{
			peerObject.send(
			{
				mid: peer.id,
				c: "newMember"
			} );
		},

		_handleUpdate: function( updateCommand, sourcePeer )
		{
			switch( updateCommand.c )
			{
				case "newMember":

					if( Swarm.members[ updateCommand.mid ] )
					{
						// i already know

						console.error( "--Swarm-- I know " + updateCommand.mid + " already" );

						return;
					}

					console.log( "--Swarm-- New Member", updateCommand.mid );

					new Member( updateCommand.mid );

					if( sourcePeer )
					{
						Swarm._handshake( sourcePeer );
					}

				break;
				case "navigation":

					console.log( "--Swarm-- Member " + updateCommand.mid + ": " + updateCommand.d.status + " " + updateCommand.d.url );

				break;
				default:

					console.error( "--Swarm-- Unknown command", updateCommand );
			}
		}
	}

	var _handleData = function( conn )
	{
		conn.on( 'data', function( data )
		{
			// Will print 'hi!'
			//console.log( "--PeerJS-- Received from " + conn.peer, data );

			Swarm._handleUpdate( data, conn );
		});
	}

	//
	// Handle the connection with the tracker
	//

	peer.on( "open", function( myID )
	{
		console.log( "--PeerJS-- My ID is", myID );

		chrome.tabs.onUpdated.addListener(function( tabID, changeInfo, tabObject )
		{
			Swarm.broadcast( { c: "navigation", mid: myID, d: changeInfo } );
		});

		// handle the connection with one peer at a time
		var _handleConnection = function( peerID, onOpen )
		{
			var conn = peer.connect( peerID );

			conn.on( 'open', function()
			{
				console.log( "--PeerJS-- active connected to", peerID );

				// add my own character
				Swarm._handshake( conn );

				onOpen();
			});

			conn.on( 'close', function()
			{
				Swarm.members[ peerID ].remove();

				console.log( "--PeerJS-- active disconnected", peerID );
			});

			_handleData( conn );
		}

		var _discoverPeers = function()
		{
			$.get(
				'http://' + trackerIP + ':9000/peerjs/peers',
				function( response )
				{
					var _connectedPeersAmount = 0;

					// remove myself from the peers list
					response.splice( response.indexOf( myID ), 1 );

					for(var i=0;i<response.length;i++)
					{
						if( typeof peer.connections[ response[ i ] ] == "undefined" )
						{
							continue;
						}

						//console.log( "--PeerJS-- removed " + response[ i ] + " from the peers queue" );

						response.splice( i--, 1 );
					}

					if( response.length == 0 )
					{
						// re-iterate
						setTimeout( _discoverPeers, 1000 );

						return;
					}

					//
					// we have peers in the queue
					//
					
					response.forEach( function( peerID )
					{
						_handleConnection( peerID, function()
						{
							_connectedPeersAmount++;

							if( _connectedPeersAmount < response.length )
							{
								return;
							}

							// re-iterate
							setTimeout( _discoverPeers, 1000 );
						} );
					});
				}
			);
		}

		// connect to all the peers currently registered with the tracker
		_discoverPeers();
	});

	//
	// Handle incoming connections from other peers
	//

	peer.on( 'connection', function( conn )
	{
		console.log( "--PeerJS-- passive connected to", conn.peer );

		conn.on( "close", function()
		{
			Swarm.members[ conn.peer ].remove();

			console.log( "--PeerJS-- passive disconnected", conn.peer );
		});

		_handleData( conn );
	});

	//
	// Handle disconnection from the tracker
	//

	peer.on( 'disconnected', function()
	{
		console.error( "--PeerJS-- Oops" );
	});