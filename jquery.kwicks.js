/*!
 *  Kwicks: Sexy Sliding Panels for jQuery - v2.1.0
 *  http://devsmash.com/projects/kwicks
 *
 *  Copyright 2013 Jeremy Martin (jmar777)
 *  Contributors: Duke Speer (Duke3D), Guillermo Guerrero (gguerrero)
 *  Released under the MIT license
 *  http://www.opensource.org/licenses/mit-license.php
 */

(function($) {

	/**
	 *  API methods for the plugin
	 */
	var methods = {
		init: function(opts) {
			var defaults = {
				// general options:
				maxSize: -1,
				minSize: -1,
				spacing: 5,
				duration: 500,
				isVertical: false,
				easing: undefined,
				autoResize: true,
				behavior: null,
				//slideshow options:
				interval: 2500
			};
			var o = $.extend(defaults, opts);

			// validate and normalize options
			if (o.minSize !== -1 && o.maxSize !== -1)
				throw new Error('Kwicks options minSize and maxSize may not both be set');
			if (o.behavior && o.behavior !== 'menu' && o.behavior !== 'slideshow')
				throw new Error('Unrecognized Kwicks behavior specified: ' + o.behavior);
			$.each(['minSize', 'maxSize'], function(i, prop) {
				var val = o[prop];
				switch (typeof val) {
					case 'number':
						o[prop + 'Units'] = 'px';
						break;
					case 'string':
						if (val.slice(-1) === '%') {
							o[prop + 'Units'] = '%';
							o[prop] = +val.slice(0, -1) / 100;
						} else if (val.slice(-2) === 'px') {
							o[prop + 'Units'] = 'px';
							o[prop] = +val.slice(0, -2);	
						} else {
							throw new Error('Invalid value for Kwicks option ' + prop + ': ' + val);
						}
						break;
					default:
						throw new Error('Invalid value for Kwicks option ' + prop + ': ' + val);
				}
			});
						
			return this.each(function() {
				$(this).data('kwicks', new Kwick(this, o));
			});
		},
		expand: function(index) {
			return this.each(function() {
				var $this = $(this),
					$panel;

				// if this is a container, then we require a panel index
				if ($this.is('.kwicks-processed')) {
					if (typeof index !== 'number')
						throw new Error('Kwicks method "expand" requires an index');
					// protect against jquery's eq(-index) feature
					if (index >= 0) $panel = $this.children().eq(index);
				}
				// otherwise `this` should be a panel already
				else if ($this.parent().is('.kwicks-processed')) {
					// don't need panel in this scenario
					$panel = $this;
					index = $panel.index();
				}
				// if it's not a container or a panel, then this was an erroneous method call
				else {
					throw new Error('Cannot call "expand" method on a non-Kwicks element');
				}

				// try to trigger on panel, but default to container if panel doesn't exist
				var $target = ($panel && $panel.length) ? $panel : $this;
				$target.trigger('expand.kwicks', { index: index });				
			});
		},
		expanded: function() {
			var kwick = this.first().data('kwicks');
			if (!kwick) throw new Error('Cannot called "expanded" method on a non-Kwicks element');
			return kwick.expandedIndex;
		},
		select: function(index) {
			return this.each(function() {
				var $this = $(this),
					$panel;

				// if this is a container, then we require a panel index
				if ($this.is('.kwicks-processed')) {
					if (typeof index !== 'number')
						throw new Error('Kwicks method "select" requires an index');
					// protect against jquery's eq(-index) feature
					if (index >= 0) $panel = $this.children().eq(index);
				}
				// otherwise `this` should be a panel already
				else if ($this.parent().is('.kwicks-processed')) {
					// don't need panel in this scenario
					$panel = $this;
					index = $panel.index();
				}
				// if it's not a container or a panel, then this was an erroneous method call
				else {
					throw new Error('Cannot call "expand" method on a non-Kwicks element');
				}

				// try to trigger on panel, but default to container if panel doesn't exist
				var $target = ($panel && $panel.length) ? $panel : $this;
				$target.trigger('select.kwicks', { index: index });				
			});
		},
		selected: function() {
			var kwick = this.first().data('kwicks');
			if (!kwick) throw new Error('Cannot called "selected" method on a non-Kwicks element');
			return kwick.selectedIndex;
		},
		resize: function(index) {
			return this.each(function() {
				var $this = $(this),
					kwick = $this.data('kwicks');

				if (!kwick) {
					throw new Error('Cannot called "resize" method on a non-Kwicks element');
				}

				kwick.resize();			
			});
		}
	};

	/**
	 *  Expose the actual plugin
	 */
	$.fn.kwicks = function(opts) {
		if (methods[opts]) {
			return methods[opts].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof opts === 'object' || !opts) {
			return methods.init.apply(this, arguments);
		} else {
			throw new Error('Unrecognized kwicks method: ' + opts);
		}
	};

	/**
	 *  Special event for triggering default behavior on 'expand.kwicks' events
	 */
	$.event.special.expand = {
		_default: function(e, data) {
			if (e.namespace !== 'kwicks') return;
			var $el = $(e.target);
			var kwick = $el.data('kwicks') || $el.parent().data('kwicks');
			// should we throw here?
			if (!kwick) return;
			kwick.expand(data.index);
		}
	};

	/**
	 *  Special event for triggering default behavior on 'select.kwicks' events
	 */
	$.event.special.select = {
		_default: function(e, data) {
			if (e.namespace !== 'kwicks') return;
			var $el = $(e.target);
			var kwick = $el.data('kwicks') || $el.parent().data('kwicks');
			// should we throw here?
			if (!kwick) return;
			kwick.select(data.index);
		}
	};

	/**
	 *  Instantiates a new Kwick instance using the provided container and options.
	 */
	var Kwick = function Kwick(container, opts) {
		this.opts = opts;

		// references to our DOM elements
		var orientation = opts.isVertical ? 'vertical' : 'horizontal';
		this.$container = $(container).addClass('kwicks').addClass('kwicks-' + orientation);
		this.$panels = this.$container.children();

		// zero-based, -1 for "none"
		this.selectedIndex = this.$panels.filter('.kwicks-selected').index();
		this.expandedIndex = this.selectedIndex;

		// each instance has a primary and a secondary dimension (primary is the animated dimension)
		this.primaryDimension = opts.isVertical ? 'height' : 'width';
		this.secondaryDimension = opts.isVertical ? 'width' : 'height';

		// initialize panel sizes
		this.calculatePanelSizes();

		// likewise, we have primary and secondary alignments (all panels but the last use primary,
		// which uses the secondary alignment). this is to allow the first and last panels to have
		// fixed offsets. this reduces jittering, which is much more noticeable on the last item.
		this.primaryAlignment = opts.isVertical ? 'top' : 'left';
		this.secondaryAlignment = opts.isVertical ? 'bottom' : 'right';

		// object for creating a "master" animation loop for all panel animations
		this.$timer = $({ progress : 0 });

		// the current offsets for each panel
		this.offsets = this.getOffsetsForExpanded();

		this.initStyles();
		this.initBehavior();
		this.initWindowResizeHandler();
	};

	/**
	 * Calculates size, minSize, and maxSize based on the current size of the container and the
	 * user-provided options.  The results will be stored on this.panelSize, this.panelMinSize, and
	 * this.panelMaxSize.  This should be run on initialization and whenever the container's
	 * primary dimension may have changed in size.
	 */
	Kwick.prototype.calculatePanelSizes = function() {
		var opts = this.opts,
			numPanels = this.$panels.length,
			containerSize = this.getContainerSize(true),
			sumSpacing = opts.spacing * (numPanels - 1),
			sumPanelSize = containerSize - sumSpacing;

		this.panelSize = sumPanelSize / numPanels;

		if (opts.minSize === -1) {
			if (opts.maxSize === -1) {
				// if neither minSize or maxSize or set, then we try to pick a sensible default
				if (numPanels < 5) {
					this.panelMaxSize = containerSize / 3 * 2;
				} else {
					this.panelMaxSize = containerSize / 3;
				}
			} else if (opts.maxSizeUnits === '%') {
				this.panelMaxSize = sumPanelSize * opts.maxSize;
			} else {
				this.panelMaxSize = opts.maxSize;
			}

			// at this point we know that this.panelMaxSize is set
			this.panelMinSize = (sumPanelSize - this.panelMaxSize) / (numPanels - 1);
		} else if (opts.maxSize === -1) {
			// at this point we know that opts.minSize is set
			if (opts.minSizeUnits === '%') {
				this.panelMinSize = sumPanelSize * opts.minSize;
			} else {
				this.panelMinSize = opts.minSize;
			}

			// at this point we know that this.panelMinSize is set
			this.panelMaxSize = sumPanelSize - (this.panelMinSize * (numPanels - 1));
		}
	};

	/**
	 *  Returns the calculated panel offsets based on the currently expanded panel.
	 */
	Kwick.prototype.getOffsetsForExpanded = function() {
		// todo: cache the offset values
		var expandedIndex = this.expandedIndex,
			numPanels = this.$panels.length,
			spacing = this.opts.spacing,
			size = this.panelSize,
			minSize = this.panelMinSize,
			maxSize = this.panelMaxSize;

		//first panel is always offset by 0
		var offsets = [0];

		for (var i = 1; i < numPanels; i++) {
			// no panel is expanded
			if (expandedIndex === -1) {
				offsets[i] = i * (size + spacing);
			}
			// this panel is before or is the expanded panel
			else if (i <= expandedIndex) {
				offsets[i] = i * (minSize + spacing);
			}
			// this panel is after the expanded panel
			else {
				offsets[i] = maxSize + (minSize * (i - 1)) + (i * spacing);
			}
		}

		return offsets;
	};

	/**
	 *  Sets the style attribute on the specified element using the provided value.  This probably
	 *  doesn't belong on Kwick.prototype, but here it is...
	 */
	Kwick.prototype.setStyle = (function() {
		if ($.support.style) {
			return function(el, style) { el.setAttribute('style', style); };
		} else {
			return function (el, style) { el.style.cssText = style; };
		}
	})();

	/**
	 *  Updates the offset and size styling of each panel based on the current values in
	 *  `this.offsets`.  Also does some special handling to convert panels to absolute positioning
	 *  the first time this is invoked.
	 */
	Kwick.prototype.updatePanelStyles = function() {
		var offsets = this.offsets,
			$panels = this.$panels,
			pDim = this.primaryDimension,
			pAlign = this.primaryAlignment,
			sAlign = this.secondaryAlignment,
			spacing = this.opts.spacing,
			containerSize = this.getContainerSize();

		// the kwicks-processed class ensures that panels are absolutely positioned, but on our
		// first pass we need to set offsets, width|length, and positioning atomically to prevent
		// mid-update repaints
		var stylePrefix = !!this._stylesInited ? '' : 'position:absolute;',
			offset, size, prevOffset, style;

		// loop through remaining panels
		for (var i = $panels.length; i--;) {
			prevOffset = offset;
			// todo: maybe we do one last pass at the end and round offsets, rather than on every
			// update
			offset = Math.round(offsets[i]);
			if (i === $panels.length - 1) {
				size = containerSize - offset;
				style = sAlign + ':0;' + pDim + ':' + size + 'px;';
			} else {
				size = prevOffset - offset - spacing;
				style = pAlign + ':' + offset + 'px;' + pDim + ':' + size + 'px;';
			}
			this.setStyle($panels[i], stylePrefix + style);
		}

		if (!this._stylesInited) {
			this.$container.addClass('kwicks-processed');
			this._stylesInited = true;
		}
	};

	/**
	 *  Sets initial styles on the container element and panels
	 */
	Kwick.prototype.initStyles = function() {
		var opts = this.opts,
			$container = this.$container,
			$panels = this.$panels,
			numPanels = $panels.length,
			pDim = this.primaryDimension,
			sDim = this.secondaryDimension;

		this.updatePanelStyles();
	};

	/**
	 *  Assuming for a moment that out-of-the-box behaviors aren't a horrible idea, this method
	 *  encapsulates the initialization logic thereof.
	 */
	Kwick.prototype.initBehavior = function() {
		if (!this.opts.behavior) return;

		switch (this.opts.behavior) {
			case 'menu':
				this.initMenuBehavior();
				break;
			case 'slideshow':
				this.initSlideshowBehavior();
				break;
			default:
				throw new Error('Unrecognized behavior option: ' + this.opts.behavior);
		}
	};

	/**
	 * Initializes the menu behavior.
	 */
	Kwick.prototype.initMenuBehavior = function() {
		var self = this;
		this.$container.on('mouseleave', function() {
			self.$container.kwicks('expand', -1);
		}).children().on('mouseover', function() {
			$(this).kwicks('expand');
		}).click(function() {
			$(this).kwicks('select');
		});
	};

	/**
	 * Initializes the slideshow behavior.
	 */
	Kwick.prototype.initSlideshowBehavior = function() {
		var self = this,
			numSlides = this.$panels.length,
			curSlide = 0,
			// flag to handle weird corner cases
			running = false,
			intervalId;

		var start = function() {
			if (running) return;
			intervalId = setInterval(function() {
				self.$container.kwicks('expand', ++curSlide % numSlides);
			}, self.opts.interval);
			running = true;
		};

		var pause = function() {
			clearInterval(intervalId);
			running = false;
		};

		this.$container.hover(pause, start)
			.children().on('mouseover', function() {
				curSlide = $(this).kwicks('expand').index();
			});

		start();
	};

	/**
	 * Sets up a throttled window resize handler that triggers resize logic for the panels
	 * todo: hideous code, needs refactor for the eye bleeds
	 */
	Kwick.prototype.initWindowResizeHandler = function() {
		if (!this.opts.autoResize) return;

		var self = this,
			prevTime = 0,
			execScheduled = false;

		var onResize = function(e) {
			// if there's no event, then this is a scheduled from our setTimeout
			if (!e) { execScheduled = false; }

			// if we've already run in the last 20ms, then delay execution
			var now = +new Date();
			if (now - prevTime < 20) {
				// if we already scheduled a run, don't do it again
				if (execScheduled) return;
				setTimeout(onResize, 20 - (now - prevTime));
				execScheduled = true;
				return;
			}

			// throttle rate is satisfied, go ahead and run
			prevTime = now;
			self.resize();			
		}
		$(window).on('resize', onResize);
	};

	/**
	 * Returns the size in pixels of the container's primary dimension. This value is cached as it
	 * is used repeatedly during animation loops, but the cache can be cleared by passing `true`.
	 * todo: benchmark to see if this caching business is even at all necessary.
	 */
	Kwick.prototype.getContainerSize = function(clearCache) {
		var containerSize = this._containerSize;
		if (clearCache || !containerSize) {
			containerSize = this._containerSize = this.$container[this.primaryDimension]();
		}
		return containerSize;
	};

	/**
	 *  Gets a reference to the currently expanded panel (if there is one)
	 */
	Kwick.prototype.getExpandedPanel = function() {
		return this.expandedIndex === -1 ? $([]) : this.$panels.eq(this.expandedIndex);
	};

	/**
	 *  Gets a reference to the currently collapsed panels (if there is any)
	 */
	Kwick.prototype.getCollapsedPanels = function() {
		return this.expandedIndex === -1 ? $([]) : this.$panels.not(this.getExpandedPanel());
	};

	/**
	 *  Gets a reference to the currently selected panel (if there is one)
	 */
	Kwick.prototype.getSelectedPanel = function() {
		return this.selectedIndex === -1 ? $([]) : this.$panels.eq(this.selectedIndex);
	};

	/**
	 *  Forces the panels to be updated in response to the container being resized.
	 */
	Kwick.prototype.resize = function(index) {
		// bail out if container size hasn't changed
		if (this.getContainerSize() === this.getContainerSize(true)) return;

		this.calculatePanelSizes();
		this.offsets = this.getOffsetsForExpanded();

		// if the panels are currently being animated, we'll just set a flag that can be detected
		// during the next animation step
		if (this.isAnimated) {
			this._dirtyOffsets = true;
		} else {
			// otherwise update the styles immediately
			this.updatePanelStyles();
		}
	};

	/**
	 *  Selects (and expands) the panel with the specified index (use -1 to select none)
	 */
	Kwick.prototype.select = function(index) {
		// make sure the panel isn't already selected
		if (index === this.selectedIndex) {
			// it's possible through the API to have a panel already selected but not expanded,
			// so ensure that the panel really is expanded
			return this.expand(index);
		}

		this.getSelectedPanel().removeClass('kwicks-selected');
		this.selectedIndex = index;
		this.getSelectedPanel().addClass('kwicks-selected');
		this.expand(index);
	};

	/**
	 *  Expands the panel with the specified index (use -1 to expand none)
	 */
	Kwick.prototype.expand = function(index) {
		var self = this;

		// if the index is -1, then default it to the currently selected index (which will also be
		// -1 if no panels are currently selected)
		if (index === -1) index = this.selectedIndex;

		// make sure the panel isn't already expanded
		if (index === this.expandedIndex) return;

		this.getExpandedPanel().removeClass('kwicks-expanded');
		this.getCollapsedPanels().removeClass('kwicks-collapsed');
		this.expandedIndex = index;
		this.getExpandedPanel().addClass('kwicks-expanded');
		this.getCollapsedPanels().addClass('kwicks-collapsed');

		// handle panel animation
		var $timer = this.$timer,
			numPanels = this.$panels.length,
			startOffsets = this.offsets.slice(),
			offsets = this.offsets,
			targetOffsets = this.getOffsetsForExpanded();

		$timer.stop()[0].progress = 0;
		this.isAnimated = true;
		$timer.animate({ progress: 1 }, {
			duration: this.opts.duration,
			easing: this.opts.easing,
			step: function(progress) {
				if (self._dirtyOffsets) {
					offsets = self.offsets;
					targetOffsets = self.getOffsetsForExpanded();
					self._dirtyOffsets = false;
				}
				offsets.length = 0;
				for (var i = 0; i < numPanels; i++) {
					var targetOffset = targetOffsets[i],
						newOffset = targetOffset - ((targetOffset - startOffsets[i]) * (1 - progress));
					offsets[i] = newOffset;
				}
				self.updatePanelStyles();
			},
			complete:  function() {
				self.isAnimated = false;
			}
		});
	};

})(jQuery);
