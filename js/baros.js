( function() {
  if ( typeof baros != "undefined" && baros ) {
	return ;
  }
  baros = {
  };

  baros.Connector = function( sid ) {
	this.sid = sid;
	if ( 'WebSocket' in window ) {
		var ws = new WebSocket( 'ws://bravo:5000' );
		ws.onmessage = function() {
		  console.log( 'onmessage' );
		};
		ws.onopen = function() {
		  console.log( 'onopen' );
		};
		ws.onclose = function() {
		  console.log( 'onclose' );
		};
		this.send = function( message, handler ) {
		}
	}
  }
  baros.Connector.prototype.shakeHand = function() {
  }

  baros.init = function( sid ) {
	if ( baros.service ) {
		throw "Duplicated Initialization";
	}
	baros.service = sid;
	baros.connector = baros.Connector();
  }
  
  baros.login = function( username, password, handler ) {
    this.connector.send( { command: 'login', username: username, password: password }, handler );
  }
  
  baros.room = function( room ) {
  }
  
} ) ()
