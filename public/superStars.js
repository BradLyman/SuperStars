/*
 * superStars.js
 * Client-Side game logic for the SuperStars game.
 */

/*jslint        browser : true, continue : true,
  devel  : true, indent : 2,      maxerr : 50,
  newcap : true, nomen  : true, plusplus : true,
  regexp : true, sloppy : true,     vars : false,
  white  : true
*/
/*global $, p5, superStars */

// Modlue /superStars/
var superStars = (function() {
  // ----------------- BEGIN MODULE SCOPE VARIABLES -----------------
  var
    configMap = {
      outerStarRadius : window.innerWidth / 15,
      starFadeOutStepTime : 100,
      starFateOutRate : 0.05
    },

    stateMap = {
      enemyStars    : [],
      playerStars   : [],
      userColor     : [255, 255, 255],
      starIndex    : 0,
      socket        : {},
      myp5          : {},
      prevFrameTime : 0,
      jqueryMap  : {
        $timer : {}
      },
    },

    p5Sketch,
    createStar, getRandomInt, addPlayerStar, addEnemyStar,
    drawStar, updateStars,

    initModule,
    createTimer, hideIntermission, showIntermission,
    setSocketEventHandlers;
  // ------------------ END MODULE SCOPE VARIABLES ------------------


  // -------------------- BEGIN UTILITY METHODS ---------------------
  // Begin Utility method /getRandomInt/
  //
  getRandomInt = function( min, max ){
    return Math.floor( Math.random() * (max - min) ) + min;
  };
  // End Utility method /getRandomInt/

  // Begin Utility method /createStar/
  //
  createStar = function( x, y ){
    return {
      x           : x,
      y           : y,
      points      : getRandomInt( 3, 8 ),
      color       : stateMap.userColor,
      scale       : 1.0,
      life        : 4.0,
      innerRadius : getRandomInt(
        configMap.outerStarRadius * 0.2, configMap.outerStarRadius * 0.5
      ),
      outerRadius : getRandomInt(
        configMap.outerStarRadius * 0.6, configMap.outerStarRadius
      )
    };
  };
  // End Utility method /createStar/

  // Begin Utility method /addPlayerStar/
  //
  addPlayerStar = function( star ){
    var index = stateMap.starIndex;

    stateMap.playerStars[ index ] = star;

    stateMap.starIndex += 1;
  };
  // End Utility method /addPlayerStar/

  // Begin Utility method /addEnemyStar/
  //
  addEnemyStar = function( star ){
    var index = stateMap.starIndex;

    stateMap.enemyStars[ index ] = star;

    stateMap.starIndex += 1;
  };
  // End Utility method /addEnemyStar/

  // Begin Utility method /updateStars/
  // Update star animations and remove dead stars.
  //
  updateStars = function( sketch ) {
    var
      curTime = sketch.millis(),
      duration = (curTime - stateMap.prevFrameTime) / 1000;

    stateMap.prevFrameTime = curTime;

    Object.keys( stateMap.playerStars ).forEach( function( key ){
      var star = stateMap.playerStars[ key ];

      star.life -= duration;

      if ( star.life <= 2.0 ) {
        star.scale = (star.life / 2.0);
      }

      if ( star.life <= 0.0 ) {
        delete stateMap.playerStars[ key ];
      }
    });

    Object.keys( stateMap.enemyStars ).forEach( function( key ){
      var star = stateMap.enemyStars[ key ];

      star.life -= duration;

      if ( star.life <= 2.0 ) {
        star.scale = (star.life / 2.0);
      }

      if ( star.life <= 0.0 ) {
        delete stateMap.enemyStars[ key ];
      }
    });
  };
  // End Utility method /updateStars/

  // Begin Utility method /drawStar/
  // Purpose : use p5 to render a star under the cursor
  //
  drawStar = function( sketch, star ){
    var
      a, sx, sy,
      angle = sketch.TWO_PI / star.points,
      halfAngle = angle / 2.0;

    sketch.push();
    sketch.translate( star.x * sketch.windowWidth, star.y * sketch.windowHeight );
    sketch.scale( star.scale, star.scale );
    sketch.fill( star.color[0], star.color[1], star.color[2] );

    sketch.beginShape();
    for ( a = 0; a < sketch.TWO_PI; a += angle ) {
      sx = sketch.cos( a ) * star.outerRadius;
      sy = sketch.sin( a ) * star.outerRadius;
      sketch.vertex( sx, sy );

      sx = sketch.cos( a + halfAngle ) * star.innerRadius;
      sy = sketch.sin( a + halfAngle ) * star.innerRadius;
      sketch.vertex( sx, sy );
    }
    sketch.endShape( sketch.CLOSE );
    sketch.pop();
  };
  // End Utility method /drawStar/
  // --------------------- END UTILITY METHODS ----------------------


  // ---------------------- BEGIN DOM METHODS -----------------------
  // Begin DOM method /showIntermission/
  //
  showIntermission = function() {
    $('body').append( $('<div class="intermission">').text( 'intermission' ) );
  };
  // End DOM method /showIntermission/

  // Begin DOM method /hideIntermission/
  //
  hideIntermission = function() {
    $('.intermission').remove();
  };
  // End DOM method /hideIntermission/

  // Begin DOM method /createTimer/
  //
  createTimer = function() {
    $('body').append( $('<p class="timer"/>') );

    stateMap.jqueryMap.$timer = $('.timer');
  };
  // End DOM method /createTimer/
  // ----------------------- END DOM METHODS ------------------------


  // -------------------- BEGIN EVENT HANDLERS ----------------------
  setSocketEventHandlers = function( socket ){
    socket.on( 'setUserColor', function( color ){
      console.log( 'set user color: ' + color );
      stateMap.userColor = color;
    });

    socket.on( 'newStar', function( star ){
      addEnemyStar( star );
    });

    socket.on( 'timerUpdate', function( time ){
      stateMap.jqueryMap.$timer.text( time.toFixed(1) );
    });

    socket.on( 'intermission', function(){
      showIntermission();
    });

    socket.on( 'gameStart', function(){
      hideIntermission();
    });
  };
  // --------------------- END EVENT HANDLERS -----------------------


  // -------------------- BEGIN PUBLIC METHODS ----------------------
  // Begin Public method /initModule/
  // Purpose: Initializes the superStars game.
  // Arguments:
  //   socket - The socket used for communication with the game server.
  //
  initModule = function( socket ) {
    createTimer();

    setSocketEventHandlers( socket );
    stateMap.socket = socket;
    stateMap.myp5 = new p5( p5Sketch );
  };
  // End Public method /initModule/

  // Begin Public method /p5Sketch/
  // Purpose: p5.js application logic
  // Arguments:
  //   sketch - p5 sketch, provided when new p5( p5Sketch )
  //            is called.
  //
  p5Sketch = function( sketch ){
    var
      getNormalizedMouseCoords,
      getNormalizedTouchCoords;

    getNormalizedMouseCoords = function(){
      return {
        x : sketch.mouseX / sketch.windowWidth,
        y : sketch.mouseY / sketch.windowHeight
      };
    };

    getNormalizedTouchCoords = function(){
      return {
        x : sketch.touchX / sketch.windowWidth,
        y : sketch.touchY / sketch.windowHeight
      };
    };

    sketch.setup = function(){
      sketch.createCanvas( sketch.windowWidth, sketch.windowHeight );
    };

    sketch.draw = function(){
      sketch.background( 240 );

      updateStars( sketch );

      Object.keys( stateMap.playerStars ).forEach( function( key ){
        var star = stateMap.playerStars[ key ];

        drawStar( sketch, star );
      });

      Object.keys( stateMap.enemyStars ).forEach( function( key ){
        var star = stateMap.enemyStars[ key ];

        drawStar( sketch, star );
      });
    };

    sketch.mousePressed = function() {
      var
        coords = getNormalizedMouseCoords(),
        star  = createStar( coords.x, coords.y );

      stateMap.socket.emit( 'newStar', star );
      addPlayerStar( star );
      return false;
    };

    sketch.touchStarted = function() {
      var
        coords = getNormalizedTouchCoords(),
        star  = createStar( coords.x, coords.y );

      stateMap.socket.emit( 'newStar', star );
      addPlayerStar( star );
      return false;
    };
  };
  // End Public method /p5Sketch/
  // --------------------- END PUBLIC METHODS -----------------------

  return { initModule : initModule };
}());
