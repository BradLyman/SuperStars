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
      pointFadeOutStepTime : 100,
      pointFateOutRate : 0.05
    },

    stateMap = {
      points     : {},
      userColor  : [255, 255, 255],
      pointIndex : 0,
      socket     : {},
      myp5       : {},
      jqueryMap  : {
        $timer : {}
      },
    },

    initModule,
    p5Sketch,
    createPoint, getRandomInt, fadeOutPoint, addPoint, drawStar,
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

  // Begin Utility method /createPoint/
  //
  createPoint = function( x, y ){
    return {
      x           : x,
      y           : y,
      points      : getRandomInt( 3, 8 ),
      color       : stateMap.userColor,
      scale       : 1.0,
      innerRadius : getRandomInt(
        configMap.outerStarRadius * 0.2, configMap.outerStarRadius * 0.5
      ),
      outerRadius : getRandomInt(
        configMap.outerStarRadius * 0.6, configMap.outerStarRadius
      )
    };
  };
  // End Utility method /createPoint/

  // Begin Utility method /fadeOutPoint/
  // Shrinks a point to a single dot then removes it.
  //
  fadeOutPoint = function( indexToFade ){
    var point = stateMap.points[ indexToFade ];
    if ( !point ) {
      return;
    }

    point.scale -= configMap.pointFateOutRate;

    if ( point.scale <= 0 ) {
      stateMap.points[ indexToFade ] = null;
    }

    setTimeout( function() {
      fadeOutPoint( indexToFade );
    }, configMap.pointFadeOutStepTime );
  };
  // End Utility method /fadeOutPoint/

  // Begin Utility method /addPoint/
  // Purpose : Adds a point to the stateMap.points array.
  //
  addPoint = function( point ){
    var index = stateMap.pointIndex;

    stateMap.points[ index ] = point;

    setTimeout( function(){
      fadeOutPoint( index );
    }, 2000 );

    stateMap.pointIndex += 1;
  };
  // End Utility method /addPoint/

  // Begin Utility method /drawStar/
  // Purpose : use p5 to render a star under the cursor
  //
  drawStar = function( sketch, point ){
    var
      a, sx, sy,
      angle = sketch.TWO_PI / point.points,
      halfAngle = angle / 2.0;

    sketch.push();
    sketch.translate( point.x * sketch.windowWidth, point.y * sketch.windowHeight );
    sketch.scale( point.scale, point.scale );
    sketch.fill( point.color[0], point.color[1], point.color[2] );

    sketch.beginShape();
    for ( a = 0; a < sketch.TWO_PI; a += angle ) {
      sx = sketch.cos( a ) * point.outerRadius;
      sy = sketch.sin( a ) * point.outerRadius;
      sketch.vertex( sx, sy );

      sx = sketch.cos( a + halfAngle ) * point.innerRadius;
      sy = sketch.sin( a + halfAngle ) * point.innerRadius;
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

    socket.on( 'newPoint', function( point ){
      addPoint( point, false );
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

      Object.keys( stateMap.points ).forEach( function( key ){
        var point = stateMap.points[ key ];

        if ( point !== null ){
          drawStar( sketch, point );
        }
      });
    };

    sketch.mousePressed = function() {
      var
        coords = getNormalizedMouseCoords(),
        point  = createPoint( coords.x, coords.y );

      stateMap.socket.emit( 'newPoint', point );
      addPoint( point );
      return false;
    };

    sketch.touchStarted = function() {
      var
        coords = getNormalizedTouchCoords(),
        point  = createPoint( coords.x, coords.y );

      stateMap.socket.emit( 'newPoint', point );
      addPoint( point );
      return false;
    };
  };
  // End Public method /p5Sketch/
  // --------------------- END PUBLIC METHODS -----------------------

  return { initModule : initModule };
}());
