	
	"use strict";

	var	trackerIP = '192.168.105.65',
		peer = new Peer(
			'victor',
			{
				host: trackerIP
			}
		);

	chrome.tabs.onUpdated.addListener(function( tabID, changeInfo, tabObject )
	{
		console.log( "--Updated--", tabID, changeInfo, tabObject );
	});