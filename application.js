/* *
	Created by Alexander Frank
	07.09.2015

	Socket.io & Node.js
	
	http://socket.io/docs/
	
	Server application to controll the commands the player is sending
*/

// This file needs 'express' installed
var express = require( 'express' );
var app = express();

// Current server player count
var playerCount = 0;

// Set generell variables
var chatCooldown = 5; // player can write every 5 seconds
var time = Date.now();
var current_socket_id;

// Using the www folder for the application
app.use( express.static( __dirname + '/www' ) );

// Server is listening to the port you choose
var server = app.listen( 8080, function () {
	var serverPort = server.address().port;
	console.log( 'Server successfully started on port [%s]' , serverPort );
});

function GameServer(){
	this.player = [];
	/* *
		id 		= socket ID 	(string)
		name 	= playerName 	(string)
		lastmsg	= Date.now() 	(string)
		room	= Raumname		(string)
	*/

	this.room = [];
	/* *
		name		= (string)
		owner		= (string)
		password	= (string)
	 	id 			= current_socket_id	(string)
	 */
}
GameServer.prototype = {
	addPlayer: function(data){
		this.player.push(data);
	},
	removePlayer: function(data){
		this.player = this.player.filter( function(t){return t.name != data} );
	},

	addRoom: function(data){
		this.room.push(data);
	},
	removeRoom: function(data){
		this.room = this.room.filter( function(t){return t.name != data});
	}
}
var game = new GameServer();

// This file needs 'socket.io' installed
var io = require( 'socket.io' )( server );

// Checks if the player exist
function playerNameExist( data ) {
	for(player in game.player) {
		if( data === game.player[player].name) {
			return false;
		}
	}
	return true;
}

// Checks if the player can join this room
function joinRoom(data, playerName, id) {
	for(room in game.room) {
		if( data.room === game.room[room].name ){
			// Room exist
			if(data.password === game.room[room].password ){
				return true; // Password was correct
			}else{
				return false; // Password was incorrect
			}
		}
	}
	if(data.room === 'hauptraum') {
		return true; // Everybody can join the hauptraum
	}else if(data.room === 'undefined'){
		return true;
	}else{
		game.addRoom( {name: data.room, owner: playerName, password: data.password, id: id} );
		return true;
	}
}

// Checks who leaves the Room
function leavesRoom(playerName){
	for(room in game.room) {
		if( playerName === game.room[room].owner ){
			// Playername who owns the room left
			return game.room[room].name;
		}
	}
	return false;
}

// Events for socket.io
io.on( 'connection' , function( client ) {
	current_socket_id = client.id;
	
	// If the user sends joinGame command
	client.on( 'joinGame' , function( data ) {
		var playerName = data.playerName.substring( 0, 12 );
		if(playerNameExist( playerName )) {
			if( joinRoom(data, playerName, current_socket_id) ){
				client.emit( 'serverMSG', 'Wilkommen ' + playerName ); // Sends only to the User
				client.emit( 'serverMSG', 'Du bist dem Raum ' + data.room + ' beigetreten' ); // Sends only to the User
				client.broadcast.to(data.room).emit( 'serverMSG', playerName + " joined." ); // Sends to all other that message

				game.addPlayer({ id: current_socket_id, name: playerName, lastmsg: time, room: data.room });

				client.join(data.room);
				client.emit( 'joinNow' ); // Joining the Chat

				for(room in game.room){
					client.emit( 'createAllRooms' ,{room: game.room[room].name, owner: game.room[room].owner, password: game.room[room].password }); // Creating all rooms to see which one is created
				}

				playerCount++;
			}else{
				client.emit('wrongPassword'); // Sended the User wrong password
			}
		}else{
			client.emit( 'newPlayerName' ); // Sends the user back to choose a new one
		}
	});
	
	// If the user sends leaveGame command
	client.on( 'leaveGame' , function ( data ) {
		// Sends to all other that message
		if(data.chatting){ // checks if the user is chatting or not
			client.broadcast.to(data.room).emit( 'serverMSG', data.playerName + " has closed the chat." );

			buff = leavesRoom(data.playerName);
			if(buff){
				client.broadcast.emit('deleteCreatedRoom', buff); // Deletes the room for everyone
				client.emit('deleteCreatedRoom', buff); // Deletes the room for the own client
				client.broadcast.to(buff).emit('kickedFromRoom', buff); // You got kicked, sends to the one from the room
				game.removeRoom(buff); // removes the room with the password
			}
			game.removePlayer(data.playerName);
			playerCount--;
		}
	});

	// On disconnect from the socket
	client.on( 'disconnect', function() {
		//console.log('Client: ' + current_socket_id + ' disconnected.');
	});

	// If the user changes the room
	client.on( 'changeRoom', function(data) {
		if(data.oldRoom === data.room){
			return true;
		}else{
			buff = leavesRoom(data.playerName);
			if(buff){
				client.broadcast.emit('deleteCreatedRoom', buff); // Deletes the room for everyone
				client.emit('deleteCreatedRoom', buff); // Deletes the room for the own client
				client.to(buff).emit('kickedFromRoom', buff); // You got kicked, sends to the one from the room
				game.removeRoom(buff); // removes the room with the password
			}
			if( joinRoom(data, data.playerName, current_socket_id) ) {
				client.emit('serverMSG', 'Wilkommen im ' + data.room);
				client.broadcast.to(data.room).emit('serverMSG', data.playerName + " joined."); // Sends to all other that message
				client.broadcast.to(data.oldRoom).emit('serverMSG', data.playerName + " has left this room."); // Sends to all that the player left the room
				client.leave(data.oldRoom); // Leaves the old room
				client.join(data.room); // Joins the new room
			}else{
				client.emit( 'changeHash', data.oldRoom);
				client.emit( 'serverMSG', 'Passwort ist ungültig' ); // Sends only to the User
			}
		}

	});

	// If the user sends playerChat command
	client.on( 'playerChat', function( data ) {
        var sender = data.sender.replace(/(<([^>]+)>)/ig, '');
        var message = data.msg.replace(/(<([^>]+)>)/ig, '');
		
		for(player in game.player) {
			if( sender === game.player[player].name) { // Search sender in player List
				if( Date.now() > ( game.player[player].lastmsg + chatCooldown*1000 ) ){ // 10 seconds 
					game.player[player].lastmsg = Date.now();
					client.broadcast.to(data.room).emit( 'serverSendPlayerChat', { sender: sender, msg: message, room: data.room } );
				}else{
					client.emit( 'serverMSG', 'please wait ' + chatCooldown + ' Seconds to send.' );
				}
			}
		}
    });

	client.on( 'roomCreated', function( data ) {

		for(room in game.room) {
			if( data.room === game.room[room].name){
				// Same room name exist
				client.emit( 'roomExist', data); // Sends him back to create a new room name
			}else{
				// Create this room
				client.emit('showNewRoom', data); // To the client
				client.broadcast.emit('showNewRoom' , data); // To all other
			}
		}


	});
	
	
});