/* *
	Client application 
*/

// Run the client und connect it to the server
var socket = io.connect('http://school-project:8080/');


// Run the application
function runGame() {
	playerName = $( '#playerNameInput' ).val().replace( '/(<([^>]+)>)/ig' , '' );
	playerName = playerName.substring( 0, 12 ); // Cutting the string to 12 letters only
	// Sending the command 'joinGame' to the application.js
	socket.emit( 'joinGame', { playerName: playerName , oldRoom: _getRoom(), room: _getRoom(), password: _getPassword() } );
}

// If the playerName is secure
function secureNick() {
	var regex = /^\w*$/;
	return regex.exec($( '#playerNameInput' ).val()) !== null;
}

// Joins in a new room
function _joinNewRoom(){
	oldRoom = _getRoom();
	_setRoom();
	socket.emit('changeRoom', { oldRoom: oldRoom, room: _getRoom(), playerName: _getPlayerName(), password: _getPassword() });
}

// Returns the playerName
function _getPlayerName(){
	return playerName;
}

// Returns the Room
function _getRoom(){
	return room;
}

// Returns the passwprd
function _getPassword(){
	_setPassword();
	return password;
}

// Returns the state
function _getState(){
	return gameStart;
}

// Set room
function _setRoom(){
	window.location.hash.substring(1) ? room = window.location.hash.substring(1) : room = 'hauptraum';
	room = room.split('#')[0];
}

// Set password
function _setPassword(){
	window.location.hash.substring(1) ? password = window.location.hash.substring(1) : password = '';
	password = password.split('#')[1];
	password ? password = password : password = '';
}

// Wait until the document is ready
$(document).ready( function(){

// jQuery function
	// If you push the 'play' button
	$( "#startButton" ).click(function() {
		if (secureNick()) {
			$('#startMenu .input-error').fadeTo( "fast" , 0.0 );
			$('#startMenu .input-error1').fadeTo( "fast" , 0.0 );
			runGame();
		} else {
			$('#startMenu .input-error').fadeTo( "fast" , 1.0 );
			$('#startMenu .input-error1').fadeTo( "fast" , 0.0 );
		}
	});
	
	// If you send 'enter' key from #playerNameInput
	$( '#playerNameInput' ).keypress( function (e) {
        var key = e.which || e.keyCode;
		if (key === 13) {
            if (secureNick()) {
                $('#startMenu .input-error').fadeTo( "fast" , 0.0 );
				$('#startMenu .input-error1').fadeTo( "fast" , 0.0 );
				runGame();
            } else {
                $('#startMenu .input-error').fadeTo( "fast" , 1.0 );
				$('#startMenu .input-error1').fadeTo( "fast" , 0.0 );
            }
        }
    });


// Socket.io function

	// Sets playerName to 'new' if the same exist
	socket.on( 'newPlayerName' , function ( ) {
		$('#startMenu .input-error1').fadeTo( "fast" , 1.0 );
    });

	socket.on( 'joinNow', function() {
		$( '#startMenu' ).remove();
		$( '#gameAreaWrapper' ).removeClass('hidden');
		$( '#gameAreaWrapper' ).fadeTo( "slow" , 1.0 );
		gameStart = true;
	});

	// Wrong room password
	socket.on( 'wrongPassword', function() {
		$('#startMenu .input-error2').fadeTo( "fast" , 1.0 );
	});

	// Function change hash in the url
	socket.on( 'changeHash', function(data){
		window.location.hash = data;
	});

	// Adding the new room for the user who created it
	socket.on( 'showNewRoom', function(data){
		$( '#createRaum' ).removeClass('hidden');
		$('#chatRooms').append('' +
			'<a id="' + data.room + '" href="#' + data.room + '" class="list-group-item">' +
			'<i class="fa ' + (data.password ? 'fa-lock' : 'fa-users') + '"></i> ' + data.room +
			'<span class="pull-right text-muted small"><em><b class="' + data.room + '"></b> '+ data.owner +'</em></span>' +
			'</a>' +
			'');
	});

	// Deleting the room from the guy who own it
	socket.on( 'deleteCreatedRoom', function(data){
		$('#' + data).remove();
	});

	// Show the user all created rooms when he joines the chat
	socket.on( 'createAllRooms', function(data){
		$('#chatRooms').append('' +
			'<a id="' + data.room + '" href="#' + data.room + '" class="list-group-item">' +
			'<i class="fa ' + (data.password ? 'fa-lock' : 'fa-users') + '"></i> ' + data.room +
			'<span class="pull-right text-muted small"><em><b class="' + data.room + '"></b> '+ data.owner +'</em></span>' +
			'</a>' +
			'');
	});

	// Room exist so input-error3 popups
	socket.on( 'roomExist', function(data){
		$('#createRaum .input-error3').fadeTo( "fast" , 1.0 );
		window.location.hash = "hauptraum";
	});


// Event handler

	// If the # hash value is changed run function _joinNewRoom
	window.addEventListener("hashchange", _joinNewRoom, false);
	_setRoom();
});

// Run this function before user will leave the page
$(window).on('beforeunload', function(){
	if(_getPlayerName())
		socket.emit('leaveGame', { playerName: _getPlayerName(), room: _getRoom(), chatting: _getState() });
});
