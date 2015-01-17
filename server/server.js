var
  path       = require( 'path' ),
  express    = require( 'express' ),
  app        = express(),
  http       = require( 'http' ).Server( app ),
  io         = require( 'socket.io' )( http ),
  game       = require( path.join( __dirname, 'gameLogic.js' ) ),
  port       = process.argv[2] || 8080,
  publicDir  = path.join( __dirname, '../public' ),
  clientPath = path.join( __dirname, '../client/index.html' );

game.initModule( io );

app.use( '/', express.static( publicDir ) );

app.get( '/', function( req, res ){
  res.sendFile( clientPath );
});

http.listen( port, function(){
  console.log( 'listening on localhost: ' + port );
});

