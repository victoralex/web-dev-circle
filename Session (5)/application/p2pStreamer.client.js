
	"use strict";

	//
	// Initialize
	//

	document.addEventListener( 'DOMContentLoaded', function()
	{
		var _peer1Object = document.querySelector( "#peer1" ),
			_peer2Object = document.querySelector( "#peer2" );

		_peer1Object.onclick = function()
		{
			window.localStorage[ 'peerID' ] = 'peer1';

			chrome.runtime.sendMessage(
				{
					myID: 'peer1',
					remoteID: 'peer2'
				},
				function(response)
				{

				}
			);
		}

		_peer2Object.onclick = function()
		{
			window.localStorage[ 'peerID' ] = 'peer2';
			
			chrome.runtime.sendMessage(
				{
					myID: 'peer2',
					remoteID: 'peer1'
				},
				function(response)
				{

				}
			);
		}

		// update the UI

		( window.localStorage[ 'peerID' ] == 'peer1' )
			? ( _peer1Object.checked = true )
			: (
				( window.localStorage[ 'peerID' ] == 'peer2' )
					? ( _peer2Object.checked = true )
					: null
			)
	});