( function() {
	MenuItem = Model.extend( {
	} );
	
	MenuItemView = View.extend( {
		template: "menu-item",
		tagName: 'li',
		init: function( options ) {
			this.parent = options.parent;
			var that = this;
			//this.$el.click( function() {
				//that.parent.select( that.model );
			//} );
		},
		initEvent: function() {
			this.model.bind( 'change', this.render, this );
		},
		render: function() {
			if ( this.model.get( 'active' ) ) {
				this.$el.addClass( 'active' );
			} else {
				this.$el.removeClass( 'active' );
			}
			return this;
		}
	} );

	Menu = Collection.extend( {
		model: MenuItem,
		initialize: function() {
			this.bind( 'reset', this.onChanged );
			this.bind( 'change', this.onChanged );
			this.bind( 'add', this.onChanged );
		},
		fetch: function() {
		},
		getSelection: function() {
			return this.selected;
		},
		select: function( name ) {
			if ( this.selected ) {
				this.selected.set( 'active', false );
			}

			this.selected = this.find( function( item ) {
				return item.get( 'name' ) == name;
			} );
			if ( this.selected ) {
				this.selected.set( 'active', true );
				var action = this.selected.get( 'action' );
				if ( action ) {
					action.run();
				}
			}
		},
		onChanged: function() {
			if ( null == this.selected ) {
				this.select( this.at( 0 ) );
			}

		}
	} );

	MenuView = View.extend( {
		template: "menu",
		fields: [ "menu" ],
		init: function( options ) {
			this.collection.each( function( model ) {
				this.$menu.append( this.createChildView( model ).render().$el );
			}, this );
		},
		createChildView: function( model ) {
			if ( model instanceof MenuItem ) {
				return new MenuItemView( { parent: this, model: model } );
			}
		}
	} );
	
	LoginForm = View.extend( {
		template: 'login',
		fields: [ 'open', 'signup', 'signin', 'loginform', 'username', 'password', 'userform', 'loginname', 'logout' ],
		initEvent: function() {
			var that = this;
			this.$open.click( function() {
				that.$username.focus();
			} );
			this.$signup.click( new MoveToSignUp().run );
			this.$signin.click( this.login );
			this.$logout.click( this.logout );
		},

		init: function() {
			this.model.bind( 'change', this.changeMode, this );
		},

		login: function( e ) {
			var that = this;
			baros.login(
				this.$username.val(),
				this.$password.val(),
				function( data ) {
					if ( data.success() ) {
						that.model.set( 'username', data.username );
					} else {
						alert( "Log-in failed. Check your username or password!" );
					}
				}
			);
			e.preventDefault();
		},

		logout: function() {
			var that = this;
			request( '/authentication', 'DELETE', {
			} ).done( function( data ) {
				that.model.set( 'username', data.username );
				app.refresh();
			} );
		},
		changeMode: function() {
			console.log( 'mode changed' );
			if ( this.model.hasChanged( 'username' ) ) {
				var username = this.model.get( 'username' );
				if ( username ) {
					this.$loginform.addClass( 'invisible' );
					this.$loginname.text( username );
					this.$userform.removeClass( 'invisible' );
				} else {
					this.$loginform.removeClass( 'invisible' );
					this.$userform.addClass( 'invisible' );
				}
			}
		}
	} );
} )();

