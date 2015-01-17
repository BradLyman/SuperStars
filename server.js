var
  path    = require( 'path' ),
  express = require( 'express' ),
  app     = express(),
  http    = require( 'http' ).Server( app ),
  io      = require( 'socket.io' )( http ),
  port    = process.argv[2] || 8080;
console.log(port);

app.use( '/', express.static( __dirname ) );

app.get( '/', function( req, res ){
  res.sendFile( path.join( __dirname, 'index.html' ) );
});

io.on( 'connection', function( socket ){
  console.log( 'user connected' );
  socket.on( 'newPoint', function( point ){
    socket.broadcast.emit( 'newPoint', point );
  });
});

http.listen( port, function(){
  console.log( 'listening on localhost: ' + port );
});

