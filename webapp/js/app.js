( function() {
	json = function( model ) {
		var ret = (model && model.toJSON)?model.toJSON():model;
		if ( ! ( typeof ret == "object" ) ) {
			return ret;
		}

		return ret;
	};
	request = function( url, type, data, success ) {
		return $.ajax( url, {
			type: type,
			Accept: "application/json",
			contentType: "application/json",
			dataType: 'json',
			data: JSON.stringify( data ),
			success: success
		} );
	};

	Router = Backbone.Router;
	Model = Backbone.Model;
	Collection = Backbone.Collection;
	View = Backbone.View.extend( {
		initialize: function( options ) {
			_.bindAll( this );
			this.initModel( options );

			this.initView( options );

			this.init( options );
		},
		initModel: function( options ) {
			var m = (this.modelClass)?new this.modelClass():new Model();
			if ( m instanceof Collection ) {
				this.collection = this.collection || m;
				this.model = this.model || new Model();
			} else if ( m instanceof Model ) {
				this.model = this.model || m;
			}
		},
		initView: function( options ) {
			this.$el.attr( 'view-cid', this.cid );
			var m = json( this.model );
			this.$el.html( _.template( $( '#tmpl-' + this.template ).html() )( m ) );
			if ( this.fields ) {
				for ( index in this.fields ) {
					var field = this.fields[index];
					this['$' + field] = this.$el.find( '#' + field );
				}
			}
			if ( this.model ) {
				this.model.on( 'destroy', this.destroy, this );
			}
		},

		init: function( options ) {
		},
		render: function() {
			return this;
		},
		addSubView: function( model ) {
		},
		destroy: function() {
		}
	} );


	PopupHeader = View.extend( {
		template: 'popup-header',
		className: 'modal-header'
	} );
	PopupFooter = View.extend( {
		template: 'popup-footer',
		className: 'modal-footer',
		events: {
			'click a': 'onClick'
		},
		onClick: function( e ) {
			var id = $( e.target ).attr( 'id' );
			if ( this.model.get( 'buttonHandler' ) ) {
				this.model.get( 'buttonHandler' )( this.options.popup, id );
			}
		}
	} );

	Popup = View.extend( {
		template: 'popup',
		events: {
			'keyup': 'onKeypress'
		},
		initModel: function( options ) {
			if ( options.events ) {

			}
			this.model = this.model || new Model( { title: 'Popup' } );
			this.headerType = options.header || this.headerType || PopupHeader;
			this.bodyType = options.body;
			this.footerType = options.footer || this.footerType || PopupFooter;

			this.header = new this.headerType( { model: this.model, popup: this } );
			this.body = new this.bodyType( { model: this.model, popup: this } );
			this.footer = new this.footerType( { model: this.model, popup: this } );
		},
		render: function() {
			this.$el.find( '.modal-content' ).append( this.header.render().$el );
			this.$el.find( '.modal-content' ).append( this.body.render().$el );
			this.$el.find( '.modal-content' ).append( this.footer.render().$el );
			return this;
		},
		open: function() {
			var that = this;
			this.render();
			this.$el.on( 'hidden.bs.modal', function() {
				that.$el.remove();
			} );
			this.$el.on( 'shown.bs.modal', function() {
				that.$el.find( '.initial-focus' ).focus();
				that.popupOpened();
			} );
			$( 'body' ).append( this.$el );
			this.$el.find( '.modal' ).modal( { backdrop: 'static' } );

		},

		close: function() {
			this.$el.find( '.modal' ).modal( 'hide' );
		},

		popupOpened: function() {
			if ( this.model.get( 'afterOpen' ) ) {
				this.model.get( 'afterOpen' )();
			}
		},
		
		onKeypress: function( e ) {
			if ( e.keyCode == 13 ) {
				if ( !this.$el.find( '.btn-primary' ).prop( 'disabled' ) ) {
					this.$el.find( '.btn-primary' ).click();
				}
			}
		}

	} );

	MessagePopup = Popup.extend( {
	} );


	QuestionPopup = {
		open: function( message, handler ) {
			new Popup( {
				model: new Model( {
					title: 'Question',
					message: message,
					buttonHandler: function( popup, id ) {
						handler( 'yes' == id );
					}
				} ),
				body: View.extend( {
					className: 'modal-body',
					template: 'popup-question',
					fields: ['name']
				} ),
				footer: PopupFooter.extend( {
					template: 'popup-question-footer'
				} )
			} ).open();
		}
	};

} ) ();
