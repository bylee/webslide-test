( function() {

	NewPageDialog = Popup.extend( {
	} );

	SlidePageEditor = View.extend( {
		init: function( options ) {
			var that = this;
			var model = this.model;
			var editor = this.editor = ace.edit( "editor" );
			this.editor.setBehavioursEnabled( true );
			this.editor.autoIndent = true;
			this.editor.autoComplete = true;
			this.editor.setTheme( "ace/theme/twilight" );
			this.editor.setFontSize( 16 );
			this.editor.moveCursorTo( 1, 1 );
			this.editor.getSession().setMode( "ace/mode/html" );
			this.editor.commands.addCommand( {
				name: 'Save file',
				bindKey: { win: 'Ctrl-s', mac: 'Command-s' },
				exec: function() { model.save( that.page, editor.getValue() ); that.render(); }
			} );
			this.editor.commands.addCommand( {
				name: 'Next Page',
				bindKey: { win: 'Ctrl-Down', mac: 'Command-Down' },
				exec: function() { options.parent.navigate( 1 ); }
			} );
			this.editor.commands.addCommand( {
				name: 'Previous Page',
				bindKey: { win: 'Ctrl-Up', mac: 'Command-Up' },
				exec: function() { options.parent.navigate( -1 ); }
			} );
			model.on( 'pageChange', this.onPageChange, this );
		},

		render: function() {
			var virtual = $( this.page.get( 'html' ) );
			var $candidate = virtual.filter( 'h1, h2, h3' );
			if ( $candidate ) {
				var total = this.model.get( 'pages' ).length;
				var index = this.model.get( 'pages' ).indexOf( this.page.get( 'id' ) );
				document.title = index + '/' + total + '-' + $candidate.text();
			}
			return this;
		},

		setContents: function( page ) {
			this.page = page;
			this.editor.setValue( page.get( 'html' ) );
			this.editor.clearSelection();
			this.editor.focus();
			this.render();
		},
		onPageChange: function( page ) {
			if ( this.page == page ) {
				this.setContents( page );
			}
		}
	} );

	SlidePageNavigator = View.extend( {
		template: 'navigator',
		fields: [ 'moveUp', 'moveDown', 'addPage', 'removePage' ],
		events: {
			'click #moveUp': 'moveUp',
			'click #moveDown': 'moveDown',
			'click #addPage': 'addPage',
			'click #removePage': 'removePage',
		},
		className: 'horizontal',
		init: function( options ) {
			this.editor = options.editor;	// SlideEditor
			this.model.on( 'load', this.renderThumbnail, this );
			this.model.on( 'selectionChange', this.onSelected, this );
			this.$( '.scroll-container' ).mousewheel( function( event, delta ) {
				this.scrollLeft -= (delta * 30);
				event.preventDefault();
			} );
		},
		createThumbnail: function( page, index ) {
			var thumbnail = new SlidePageThumbnail( { parent: this, model: page } );
			var $el = this.$el.find( '.scroll-contents' );
			if ( 0 <= index ) {
				this.$thumbnails[index].$el.after( thumbnail.render().$el );
				this.$thumbnails.splice( index + 1, 0, thumbnail );
			} else {
				this.$thumbnails.push( thumbnail );
				$el.append( thumbnail.render().$el );
			}
			thumbnail.show();
		},
		destroyThumbnail: function( page ) {
			var pages = this.model.get( 'pages' );
			var pid = page.get( 'id' );
			var index = pages.indexOf( pid );
			pages.splice( index, 1 );

			this.$thumbnails[index].$el.remove();
			this.$thumbnails.splice( index, 1 );
			this.model.get( 'contents' )[pid] = null;
			if ( this.selectedPage == page ) {
				var target = '';
				if ( index < pages.length ) {
					target = pages[index];
				} else if ( 0 < index ) {
					target = pages[index-1];
				} else {
				}
				controller.navigate( target, { trigger: true } );
			}
		},

		renderThumbnail: function() {
			var contents = this.model.get( 'contents' );	// SlidePage
			var $el = this.$el.find( '.scroll-contents' );
			var that = this;
			$el.empty();
			var $thumbnails = this.$thumbnails = [];
			_.each( this.model.get( 'pages' ), function( pid ) {
				that.createThumbnail( contents[pid] );
			} );
			this.onSelected( contents[this.model.selected] );
		},

		onSelected: function( selectedPage ) {
			if ( this.selectedPage == selectedPage ) {
				return ;
			}
			if ( this.selectedPage ) {
				this.selectedPage.set( 'selected', null );
				this.selectedPage.trigger( 'selectionStateChanged' );
			}
			if ( selectedPage ) {
				this.options.editor.setContents( selectedPage );
			}
			this.selectedPage = selectedPage;
			this.selectedPage.set( 'selected', true );
			this.selectedPage.trigger( 'selectionStateChanged' );
		},
		getSelection: function() {
			return this.selectedPage;
		},
		previous: function( id ) {
			if ( null == id ) {
				return null;
			}
			var prev = null;
			_.find( this.model.get( 'pages' ), function( pid ) {
				if ( id==pid ) {
					return true;
				}
				prev = pid;
				return false;
			} );
			return prev;
		},

		next: function( id ) {
			if ( null == id ) {
				return null;
			}
			var prev = null;
			return _.find( this.model.get( 'pages' ), function( pid ) {
				if ( prev ) {
					return true;
				}
				if ( id==pid ) {
					prev = pid;
				}
				return false;
			} );
		},
		moveUp: function() {
			var id = this.selectedPage.get( 'id' );
			var target = this.previous( this.previous( id ) );
			this.move( id, target );
		},
		moveDown: function() {
			var id = this.selectedPage.get( 'id' );
			var target = this.next( id );
			if ( null == target ) {
				return ;
			}
			this.move( id, target );
		},
		move: function( id, nextTo ) {
			console.log( "Move", id, "next to", nextTo );
			var taht = this;
			request( '/slides/' + this.get( 'slide' ) + '/' + id + '.html', 'PUT', { next: nextTo }, function() {
			} );
			var pages = that.model.get( 'pages' );
			var step = (nextTo)?0:1;
			var temp = id;
			var target = 0;
			_.find( pages, function( p, index ) {
				if ( 0 == step ) {
					if ( p == id ) {
						target = index;
						step = -1;
					} else if ( p == nextTo ) {
						target = index;
						step = 1;
					}
				} else {
					var t2 = page[index];
					page[index] = temp;
					temp = t2;
					if ( p == nextTo ) {
						return true;
					}
				}
				return false;
			} );
			target = id;
		},
		addPage: function() {
			var navigator = this;
			var popup = new NewPagePopup( {
				model: new Model( {
					value: this.selectedPage.get( 'id' ),
					title: 'New Page',
					pages: this.model.get( 'pages' ),
					buttonHandler: function( popup, id ) {
						if ( 'ok' == id ) {
							var selectedPageId = navigator.selectedPage.get( 'id' );
							var slide = navigator.model;
							var name = popup.body.$name.val();
							request( '/slides/' + slide.get( 'id' ) + '/' + name + '.html',
								'PUT',
								{ options: { after: selectedPageId } },
								function() {
									var pages = slide.get( 'pages' );
									var index = pages.indexOf( selectedPageId );
									pages.splice( index + 1, 0, name );
									var page = slide.get( 'contents' )[name] = new SlidePage( {
										id: name,
										slide: slide,
										loaded: true,
										html: ''
									} );
									navigator.createThumbnail( page, index );
									controller.navigate( name, { trigger: true } );
								}
							);
						}
					},
					afterOpen: function() {
					}
				} ),
				body: View.extend( {
					className: 'modal-body',
					template: 'popup-new-page',
					fields: ['name']
				} )
			} ).open();
		},
		removePage: function() {
			var that = this;
			var sid = this.model.get( 'id' );
			var selectedPage = this.selectedPage;
			var selectedPageId = selectedPage.get( 'id' );
			QuestionPopup.open(
				selectedPageId + '를 삭제하시겠습니까?',
				function( answer ) {
					if ( !answer ) {
						return ;
					}

					var url = '/slides/' + sid + '/' + selectedPageId + '.html';
					var navigator = that;
					var slide = navigator.model;

					request( url, 'DELETE', null, function() {
						navigator.destroyThumbnail( selectedPage );
					} );

				}
			);
		},
		onKeyinput: function( e ) {
			console.log( 'key', e.keyCode );
		},
	} );

	SlidePageThumbnail = View.extend( {
		tagName: 'a',
		template: 'thumbnail',
		events: {
			'click': 'onClick'
		},
		init: function() {
			var $el = this.$el
			this.model.on( 'contentChanged', this.contentChanged, this );

			this.model.on( 'selectionStateChanged', this.selectionStateChanged, this );
			this.$thumbnail = this.$( '.preview-thumbnail' );

			var slide = new Slide();
			slide.addPage( this.model );

			/*
			var iframe = this.$thumbnail[0];
			this.$thumbnail.load( function() {
				$( iframe.contentDocument.body ).append( '<script type="text/javascript" src="js/reveal.js"></script>' );
				$( iframe.contentDocument.body ).append( new SlideShow( { model: slide, reveal: iframe.contentDocument.Reveal } ).render().$el );
			} );
			
			*/
			this.$thumbnail.attr( 'src', '/preview.html?id=' + this.model.get( 'id' ) );
		},

		render: function() {
			this.selectionStateChanged();
			return this;
		},

		onClick: function() {
			controller.navigate( this.model.get( 'id' ), { trigger: true } );
		},

		selectionStateChanged: function() {
			if ( this.model.get( 'selected' ) ) {
				this.$el.addClass( 'selected' );
			} else {
				this.$el.removeClass( 'selected' );
			}
			this.show();
		},
		contentChanged: function() {
			this.$thumbnail.attr( 'src', '/preview.html?id=' + this.model.get( 'id' ) );
		},
		show: function() {
			if ( !this.model.get( 'selected' ) ) {
				return ;
			}
			var position = this.$el.position();
			var current = this.$el.parent().parent().scrollLeft();
			var left = position.left;
			var moveTo = current + left;

			var containerWidth = this.$el.parent().width();
			var width = this.$el.outerWidth( true );

			if ( position.left < 0 ) {
				this.$el.parent().parent().scrollLeft( moveTo );
			} else if ( containerWidth < position.left + width ) {
				this.$el.parent().parent().scrollLeft( moveTo - containerWidth + width );
			}
		}
	} );

	SlideEditor = View.extend( {
		initialize: function( options ) {
			this.editor = new SlidePageEditor( { parent: this, model: this.model } );
			this.navigator = new SlidePageNavigator( {
				el: options.$navigator,
				model: this.model,
				editor: this.editor
			} ).render();
			this.model.on( 'load', this.render, this );
			this.model.fetch();
		},
		render: function() {
			if ( !this.model.get( 'sid' ) ) {
				if ( this.mode == 'wait' ) {
					return this;
				}
				this.spinner = new SpinnerView( { model: new SpinnerOption() } );
				this.$el.append( this.spinner.render().$el );
				this.mode = 'wait';
				return this;
			}

			this.spinner.destroy();
			this.navigator.onSelected( this.model.get( 'contents' )[this.model.selected] );

			return this;
		},
		navigate: function( relativeIndex ) {
			var pages = this.model.get( 'pages' );
			var index = pages.indexOf( this.model.selected );
			var newIndex = Math.min( Math.max( 0, index + relativeIndex ), pages.length - 1 );

			controller.navigate( pages[newIndex], { trigger: true } );
		}
	} );


	NewPagePopup = Popup.extend( {
		events: {
			'keyup #name': 'checkDuplication'
		},
		popupOpened: function() {
			this.checkDuplication( { target: {value: this.model.get( 'value' ) } } );
		},
		checkDuplication: function( e ) {
			if ( 0 <= this.model.get( 'pages' ).indexOf( e.target.value ) ) {
				this.$el.find( '.btn-primary' ).attr( 'disabled', true );
			} else {
				this.$el.find( '.btn-primary' ).removeAttr( 'disabled' );
			}
		}
	} );

} ) ();
