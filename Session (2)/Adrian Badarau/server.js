var http = require('http');
var xml2js = require("xml2js");
var xpath = require("xml2js-xpath");
var express = require('express');
var app = express();
app.use(express.static('./'));
app.get('/stock/:company', function (req, res) {
  //The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
var options = {
  host: '195.28.176.74',
  path: '/BVBDelayedWS/Intraday.asmx/TradingDataPerSymbol?symbol='+req.params.company
};

callback = function(response) {
  var xml = '';

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    xml += chunk;
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    console.log(xml);
      console.log("------ ZE DATA ------");
      xml2js.parseString(xml, function(err, json) {
         var close = xpath.find(json, "//Closeprice");   
         var name = xpath.find(json, "//Symbolcode");   
         // console.log("ClosePrice:",matches[0]["_"]);
         res.send({
          price:close[0]["_"],
          name: name[0]["_"]
         });
      })
  });
}

 http.request(options, callback).end();

  
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});