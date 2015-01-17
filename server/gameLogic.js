var
  path        = require( 'path' ),
  randomColor = require( 'randomcolor' ),

  stateMap = {
    userIndex   : 0,
    users       : [],
    timeLeft    : 0,
    io          : {},
    activeStars : [],
    gameState   : 'running', // running or intermission
    scoreCard   : []
  },

  configMap = {
    roundInterval        : 35,
    intermissionInterval : 15,
    tickInterval         : 100
  },

  initModule,
  addUser, onGameTick, addStar,
  colorToRgb, createScoreListing;

// Begin Public method /initModule/
// Sets up the game.
//
initModule = function( io ) {
  stateMap.io = io;

  io.on( 'connection', function( socket ){
    var
      userId;

    userId = addUser( socket );

    if ( stateMap.gameState === 'intermission' ) {
      socket.emit( 'intermission', stateMap.scoreCard );
    }

    socket.on( 'newStar', function( starDesc ){
      stateMap.users[ userId ].score += starDesc.score;

      socket.emit( 'scoreUpdate', stateMap.users[ userId ].score );
      socket.broadcast.emit( 'newStar', starDesc.star );
    });

    socket.on( 'disconnect', function() {
      delete stateMap.users[ userId ];
      console.log( 'user with id: ' + userId + ' disconnected.' );
    });
  });

  setInterval( onGameTick, configMap.tickInterval );
};
// End Public method /initModule/


// Begin Priavte method /createScoreListing/
//
createScoreListing = function() {
  var
    listing = [];

  Object.keys( stateMap.users ).forEach( function( userId ){
    listing.push( {
      color : colorToRgb( stateMap.users[ userId ].color ),
      score : stateMap.users[ userId ].score
    });
  });
  console.log( listing );

  return listing;
};
// End Private method /createScoreListing/


// Begin Private method /colorToRgb/
//
colorToRgb = function( color ) {
  return 'rgb( ' + color[0] + ', ' + color[1] + ', ' + color[2] + ' )';
};
// End Private method /colorToRgb/


// Begin Private method /addUser/
// Arguments:
//   socket - websocket used to communicate with the user.
//
addUser = function( socket ) {
  var
    id = stateMap.userIndex;

  stateMap.userIndex += 1;

  stateMap.users[ id ] = {
    score : 0,
    color : randomColor({
      format     : 'rgbArray',
      luminosity : 'bright'
    })
  };

  socket.emit( 'setUserColor', stateMap.users[ id ].color );
  console.log(
    'user added, id: ' + id + ' and color ' + stateMap.users[ id ].color
  );

  return id;
};
// End Private method /addUser/


// Begin Private method /onGameTick/
//
onGameTick = function() {
  stateMap.timeLeft -= configMap.tickInterval / 1000.0;

  if ( stateMap.timeLeft <= 0 ) {
    switch ( stateMap.gameState ){
      case 'running':
        stateMap.scoreCard = createScoreListing();

        stateMap.gameState = 'intermission';
        stateMap.timeLeft  = configMap.intermissionInterval;
        stateMap.io.emit( 'intermission', stateMap.scoreCard );
        break;

      case 'intermission':
        stateMap.gameState = 'running';
        stateMap.timeLeft  = configMap.roundInterval;
        stateMap.io.emit( 'gameStart', {} );

        Object.keys( stateMap.users ).forEach( function( key ){
          stateMap.users[ key ].score = 0;
        });

        stateMap.io.emit( 'scoreUpdate', 0 );
        break;
    }
  }

  stateMap.io.emit( 'timerUpdate', stateMap.timeLeft );
};
// End Private method /onGameTick/


module.exports = {
  initModule : initModule
};

