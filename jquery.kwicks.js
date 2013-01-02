/*!
 *  Kwicks: Sexy Sliding Panels for jQuery - v2.0.0
 *  http://devsmash.com/projects/kwicks
 *
 *  Copyright 2012 Jeremy Martin (jmar777) 
 *  made responsive by Duke Speer (Duke3D)
 *  Released under the MIT license
 *  http://www.opensource.org/licenses/mit-license.php
 */

(function($) {

	/**
	 *  API methods for the plugin
	 */
	var methods = {
		init: function(opts) {
			var o = $.extend({ duration: 500, spacing: 5 }, opts);

			// validate options
			if (typeof o.size === 'undefined')
				throw new Error('Kwicks option "size" is required');
			if (typeof o.minSize === 'undefined' && typeof o.maxSize === 'undefined')
				throw new Error('One of Kwicks options "minSize" or "maxSize" is required');
			if (typeof o.minSize !== 'undefined' && typeof o.maxSize !== 'undefined' && o.units !== '%') 
				throw new Error('Kwicks options "minSize" and "maxSize" may not both be set'); // Both settings allowed for percentage-based
			if (o.units && o.units !== 'px' && o.units !== '%')
				throw new Error('Unrecognized units specified (not px or % ): ' + o.units);
			if (o.units && o.units === '%') {
				if (o.minSize > o.maxSize)
					throw new Error('Kwicks option "minSize" cannot be set greater than maxSize - image size at actual pixels');
				if (o.maxSize > o.size)
					throw new Error('Kwicks option "maxSize" of expanded image in pixels must be less than max-width "size" of container in pixels');
			} else {	
				if (o.minSize > o.size)
					throw new Error('Kwicks option "minSize" may not be greater than "size"');
				if (o.maxSize < o.size)
					throw new Error('Kwicks option "maxSize" may not be less than "size"');
			}
			if (o.behavior && o.behavior !== 'menu')
				throw new Error('Unrecognized Kwicks behavior specified: ' + o.behavior);
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

		// calculate minSize from maxSize or vice versa
		var numPanels = this.$panels.length;
		if (typeof opts.units === 'undefined') {
			opts.units = 'px';
		}
		if (opts.units === 'px') {
			if (typeof opts.minSize === 'undefined') {
				opts.minSize = ((opts.size * numPanels) - opts.maxSize) / (numPanels - 1);
			} else {
				opts.maxSize = (opts.size * numPanels) - (opts.minSize * (numPanels - 1));
			}
		} else {
			// units = pct, options are set for size as fully expanded container size (at max-width of layout) in pixels, and maxSize as image width in actual pixels
			if (typeof opts.minSize === 'undefined') {
				opts.maxSize = Math.round( 1000 * opts.maxSize / opts.size ) / 10; // expanded image size relative to 100% container
				opts.minSize = Math.round( ((100 - opts.maxSize - (numPanels - 1) * opts.spacing) / (numPanels - 1)) * 10 ) / 10; // contracted image size
				opts.size = Math.round( 1000 / numPanels - 1 ) / 10;
			} else {
				opts.minSize = Math.round( 10 * opts.minSize / opts.size ) / 10;  // options-specified minimum contracted image size relative to 100% container
				opts.maxSize = Math.round( 10 * (100 - (numPanels - 1) * (opts.minSize + opts.spacing))) / 10; // expanded image size relative to 100% container
			}
			opts.size = Math.round( 100 * ((100 - ((numPanels - 1) * opts.spacing)) / numPanels )) / 100; // default image size as percent of container
		}
		//console.log('Kwicks results - default size='+opts.size+' num panels='+numPanels+' spacing='+opts.spacing+' expanded='+opts.maxSize+' compressed='+opts.minSize);

		// zero-based, -1 for "none"
		this.selectedIndex = this.$panels.filter('.kwicks-selected').index();
		this.expandedIndex = this.selectedIndex;

		// each instance has a primary and a secondary dimension (primary is the animated dimension)
		this.primaryDimension = opts.isVertical ? 'height' : 'width';
		this.secondaryDimension = opts.isVertical ? 'width' : 'height';

		// likewise, we have primary and secondary alignments (all panels but the last use primary,
		// which uses the secondary alignment). this is to allow the first and last panels to have
		// fixed (0) offsets. this reduces jittering, which is much more noticeable on the ends.
		this.primaryAlignment = opts.isVertical ? 'top' : 'left';
		this.secondaryAlignment = opts.isVertical ? 'bottom' : 'right';

		// object for creating a "master" animation loop for all panel animations
		this.$timer = $({ progress : 0 });

		// the current offsets for each panel
		this.offsets = this.getOffsetsForExpanded();

		this.initStyles();
		this.initBehavior();
	};

	/**
	 *  Returns the calculated panel offsets based on the currently expanded panel.
	 */
	Kwick.prototype.getOffsetsForExpanded = function() {
		// todo: cache the offset values
		var expandedIndex = this.expandedIndex,
			numPanels = this.$panels.length,
			spacing = this.opts.spacing,
			size = this.opts.size,
			minSize = this.opts.minSize,
			maxSize = this.opts.maxSize;

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
			spacing = this.opts.spacing;
			$units = this.opts.units;
			
		// grab and cache the size of our container's primary dimension
		var containerSize = this._containerSize;
		if (!containerSize) {
			containerSize = this._containerSize = this.$container.css(pDim).replace('px', '').replace('%', '');
		}

		// the kwicks-processed class ensures that panels are absolutely positioned, but on our
		// first pass we need to set offsets, width, and positioning atomically to prevent
		// mid-update repaints
		var stylePrefix = !!this._stylesInited ? '' : 'position:absolute;',
			offset, size, prevOffset, style;

		// loop through panels
		for (var i = $panels.length; i--;) {
			prevOffset = offset;
			// todo: maybe we do one last pass at the end and round offsets, rather than on every
			// update
			if ($units === '%') {
				offset = Math.round(offsets[i]*1000)/1000;
				if (i === $panels.length - 1) {
					size = 100 - offset;
					style = sAlign + ':0;' + pDim + ':' + size + units + ";";
				} else {
					size = Math.round((prevOffset - offset - spacing)*1000)/1000;
					style = pAlign + ':' + offset + $units + ';' + pDim + ':' + size + $units + ';';
				}
			} else {
				offset = Math.round(offsets[i]);
				if (i === $panels.length - 1) {
					size = containerSize - offset;
					style = sAlign + ':0;' + pDim + ':' + size + units + ";";
				} else {
					size = Math.round(prevOffset - offset - spacing);
					style = pAlign + ':' + offset + $units + ';' + pDim + ':' + size + $units + ';';
				}
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

		// the primary side is the sum of all panels and their spacing
		$container.css(pDim, (opts.size * numPanels) + (opts.spacing * (numPanels - 1)));
		// the secondary side is the same as the child panel elements (assume they're all equal)
		$container.css(sDim, $panels.eq(0).css(sDim));	

		this.updatePanelStyles();
	};

	/**
	 *  Assuming for a moment that out-of-the-box behaviors aren't a horrible idea, this method
	 *  encapsulates the initialization logic thereof.
	 */
	Kwick.prototype.initBehavior = function() {
		if (!this.opts.behavior) return;

		var $container = this.$container;
		switch (this.opts.behavior) {
			case 'menu':
				this.$container.on('mouseleave', function() {
					$container.kwicks('expand', -1);
				}).children().on('mouseover', function() {
					$(this).kwicks('expand');
				}).click(function() {
					$(this).kwicks('select');
				});
				break;
			default:
				throw new Error('Unrecognized behavior option: ' + this.opts.behavior);
		}
	};

	/**
	 *  Gets a reference to the currently expanded panel (if there is one)
	 */
	Kwick.prototype.getExpandedPanel = function() {
		return this.expandedIndex === -1 ? $([]) : this.$panels.eq(this.expandedIndex);
	};

	/**
	 *  Gets a reference to the currently selected panel (if there is one)
	 */
	Kwick.prototype.getSelectedPanel = function() {
		return this.selectedIndex === -1 ? $([]) : this.$panels.eq(this.selectedIndex);
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
		this.expandedIndex = index;
		this.getExpandedPanel().addClass('kwicks-expanded');

		// handle panel animation
		var $timer = this.$timer,
			numPanels = this.$panels.length,
			startOffsets = this.offsets.slice(),
			offsets = this.offsets,
			targetOffsets = this.getOffsetsForExpanded();

		$timer.stop()[0].progress = 0;
		$timer.animate({ progress: 1 }, {
			duration: this.opts.duration,
			easing: this.opts.easing,
			step: function(progress) {
				offsets.length = 0;
				for (var i = 0; i < numPanels; i++) {
					var targetOffset = targetOffsets[i],
						newOffset = targetOffset - ((targetOffset - startOffsets[i]) * (1 - progress));
					offsets[i] = newOffset;
				}
				self.updatePanelStyles();
			}
		});
	};

})(jQuery);
