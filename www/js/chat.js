/* *
	Client application for the chat commands
*/

// Starts the ChatClient in saved it into variable chat
var chat = new ChatClient();

// Normal functions

// Shows the player the help
function _showHelpCommands() {
	chat.addSystemLine('/help ' + ' :Zeigt die Hilfe.');
	chat.addSystemLine('/me ' + ' :Sendet ein Ausdruck.');
}

// Shows the player a system message
function _showPlayerMessage( cmd ) {
	var str = cmd.substring(cmd.indexOf(" ") +1);
	chat.addSystemLine( str );
}

// Normal Chat functions

// Variable for the commands
function ChatClient( config ) {
	this.commands = {};
}

// Message (is this from me or other player)
ChatClient.prototype.addChatLine = function ( name, message, room, me ) {
	var str = document.createElement( 'p' );
	str.className = (me) ? 'me' : 'friend';
	str.innerHTML = '<b>' + ( ( name.length < 1 ) ? 'A unnamed' : name ) + '</b>: ' + message;
	this.appendMessage( str );
};

// System message
ChatClient.prototype.addSystemLine = function ( msg ) {
	var str = document.createElement( 'p' );
	str.className = 'system';
	str.innerHTML = msg;
	this.appendMessage( str );
};

// This will show the message in the chatlist
ChatClient.prototype.appendMessage = function( node ) {
	var chatList = document.getElementById( 'chatList' );
	chatList.appendChild( node );
	chatList.scrollTop = chatList.scrollHeight;
};


// wait until the document is ready
$(document).ready( function() {

// jQuery function

	// If you send 'enter' key from #chatInput
	$( '#chatInput' ).keypress( function (e) {
		var key = e.which || e.keyCode;
		if (key === 13) {
			text = $( '#chatInput' ).val().replace( '/(<([^>]+)>)/ig' , '' );
			if( text !== '' ) {

				// Chat command
				if( text.indexOf( '/' ) === 0 ) {
					var str = text.substr(text.lastIndexOf('/') + 1);
					var str1 = str.substring(0, str.lastIndexOf(' '));
					switch ( (str1) ? str1 : str ) {
						case 'help':
							_showHelpCommands();
							break;
						case 'me':
							if(!str1){
								chat.addSystemLine('Der Befehl [me] kann nicht leer sein.');
							}else{
								_showPlayerMessage(str);	
							}
							break;
						default:
							chat.addSystemLine( 'Befehl [' + cmd[1] + '] kann nicht gefunden werden.' );
					}
				} else {
					$( '#chatInput' ).val('');
					socket.emit( 'playerChat', { "sender" :  playerName, "msg" : text, "room": _getRoom() } );

					chat.addChatLine( playerName, text, room, true ); // read the current room
				}
			}
		}
	});

	$( "#raumErstellen" ).click(function() {
		$( '#createRaum' ).removeClass('hidden');
		$( '#createRaum' ).fadeTo( "slow" , 1.0 );
	});

	$( "#btnRaumErstellen ").click(function() {
		var raumName = $('#createChannelRaum').val().replace(" ", "_");
		var raumPass = $('#createChannelPassword').val().replace(" ", "_");
		window.location.hash = raumName + (raumPass ? '#' + raumPass : '');

		$('#createRaum .input-error3').fadeTo( "fast" , 0.0 );
		socket.emit('roomCreated', {'room' : raumName, 'password' : raumPass, 'owner' : _getPlayerName()} ); // Sends to all other user that one created a new room , so they can see it

		$( '#createRaum' ).addClass('hidden');
		$('#createChannelRaum').val('');
		$('#createChannelPassword').val('');
	});

	$( "#btnRaumBetreten").click(function(){
		var raumName = $('#createChannelRaum').val().replace(" ", "_");
		var raumPass = $('#createChannelPassword').val().replace(" ", "_");
		window.location.hash = raumName + (raumPass ? '#' + raumPass : '');
	});
	
	
// Socket.io function

	// Send chat message
	socket.on( 'serverSendPlayerChat', function ( data ) {
        chat.addChatLine( data.sender, data.msg, data.room, false );
    });
	
	// Send server message
	socket.on( 'serverMSG', function ( data ) {
        chat.addSystemLine(data);
    });

	// You got kicked, so join hauptraum
	socket.on('kickedFromRoom', function(){
		window.location.hash = 'hauptraum';
		chat.addSystemLine('Channel wurde vom Besitzer gelöscht.');
	});

});