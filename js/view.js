( function() {
	SpinnerView = View.extend( {
		className: 'spin',
		render: function() {
			this.$spin = new Spinner( this.model.toJSON() );
			this.$spin.spin();
			this.$curton = $( '<div class="curton"></div>' );
			$( 'body' ).append( this.$curton );
			this.$el.append( this.$spin.el );
			return this;
		},

		destroy: function() {
			this.$curton.remove();
			this.$el.remove();
		}
	} );

	SlidePageView = View.extend( {
		tagName: 'section',
		render: function() {
			this.$el.html( this.model.get( 'html' ) );
			this.$el.attr( 'id', this.model.get( 'id' ) );
			return this;
		}
	} );

	SlideShow = View.extend( {
		className: 'reveal',
		initialize: function( options ) {
			this.reveal = options.reveal || Reveal;
			this.model.on( 'load', this.render, this );
			this.$slides = $( '<div class="slides"></div>' );
			this.$el.html( this.$slides );
		},
		render: function() {
			document.title = this.model.get( 'id' );
			var contents = this.model.get( 'contents' );
			if ( !contents ) {
				return this;
			}
			for ( pid in contents ) {
				if ( !contents[pid].get( 'loaded' ) ) {
					if ( this.mode == 'wait' ) {
						return this;
					}
					this.spinner = new SpinnerView( { model: new SpinnerOption() } );
					this.$el.append( this.spinner.render().$el );
					this.mode = 'wait';
					return this;
				}
			}
			if ( this.spinner ) {
				this.spinner.destroy();
			}

			var pageIds = this.model.get( 'pages' );
			var that = this;
			_.each( pageIds, function( pid ) {
				var pageView = new SlidePageView( { model: contents[pid] } );

				that.$slides.append( pageView.render().$el );
			} );
			var revealOpts = this.model.toJSON();
			this.reveal.initialize( revealOpts );

			return this;
		}
	} );

	SlidePageEditor = View.extend( {
	} );
} ) ();
