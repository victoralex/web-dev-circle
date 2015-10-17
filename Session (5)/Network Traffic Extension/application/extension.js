	
	"use strict";

	chrome.tabs.onCreated.addListener(function( tabObject )
	{
		console.log( "--Created--", tabObject );
	});

	chrome.tabs.onUpdated.addListener(function( tabID, changeInfo, tabObject )
	{
		console.log( "--Updated--", tabID, changeInfo, tabObject );

		//chrome.tabs.create( { url: "home.ro", active: true } );
	});

	chrome.tabs.onRemoved.addListener(function( tabID, removeInfo )
	{
		console.log( "--Removed--", tabID, removeInfo );
	});