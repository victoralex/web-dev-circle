$.get( "http://localhost:3000/quote", { symbol: "brd"}, function( data ) {
	var screensContainerObject = document.querySelector( ".screensContainer" );
    var newScreenObject = document.createElement( "div" );
    newScreenObject.className = "screen";
    console.log(data);
    newScreenObject.innerHTML = data._;
    screensContainerObject.appendChild( newScreenObject);
});
