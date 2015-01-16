var
  path    = require( 'path' ),
  express = require( 'express' ),
  app     = express(),
  http    = require( 'http' ).Server( app ),
  io      = require( 'socket.io' )( http ),
  game    = require( path.join( __dirname, 'gameLogic.js' ) ),
  port    = process.env.PORT || 8080;

game.initModule( io );

app.use( '/', express.static( __dirname ) );

app.get( '/', function( req, res ){
  res.sendFile( path.join( __dirname, 'index.html' ) );
});

http.listen( port, function(){
  console.log( 'listening on localhost: ' + port );
});

