/*
	Kwicks for jQuery
	Copyright (c) 2008 Jeremy Martin
	http://www.jeremymartin.name/projects.php?project=kwicks
	
	 Dual licensed under the MIT and GPL licenses:
		 http://www.opensource.org/licenses/mit-license.php
		 http://www.gnu.org/licenses/gpl.html
  */

(function($){
	$.fn.kwicks = function(options) {
		var defaults = {
			duration: 200,
			spacing: 0
		};
		var o = $.extend(defaults, options);
	
		return this.each(function() {
			obj = $(this);
			var kwicks = obj.children('li');
			var normWidth = (kwicks.eq(0).css('width')).replace(/px/,'');
			var minWidth = ((normWidth * kwicks.size()) - o.maxWidth) / (kwicks.size() - 1);
			obj.css({
				width : (normWidth * kwicks.size()) + (o.spacing * (kwicks.size() - 1)) + 'px',
				height : kwicks.eq(0).css('height')
			});
			
			// pre calculate left values for all kwicks but the first and last
			var preCalcLefts = new Array();
			for(i = 0; i < kwicks.size(); i++) {
				preCalcLefts[i] = new Array();
				for(j = 1; j < kwicks.size() - 1; j++) {
					if(j < kwicks.size() - 1) {
						if(i == j) {
							preCalcLefts[i][j] = j * minWidth + (j * o.spacing);
						} else {
							preCalcLefts[i][j] = (j <= i ? (j * minWidth) : (j-1) * minWidth + o.maxWidth) + (j * o.spacing);
						}
					}
				}
			}
			
			// loop through all kwick elements
			kwicks.each(function(i) {
				var kwick = $(this);
				if(i == 0) {
					kwick.css('left', '0px');
				} else if(i == kwicks.size() - 1) {
					kwick.css('right', '0px');
				} else {
					kwick.css('left', (i * normWidth) + (i * o.spacing));
				}
				kwick.css({
					margin: 0,
					position: 'absolute'
				});
				
				kwick.mouseover(function() {
					// calculate previous width and left values
					var prevWidths = new Array();
					var prevLefts = new Array();
					for(j = 0; j < kwicks.size(); j++) {
						prevWidths[j] = kwicks.eq(j).css('width').replace(/px/, '');
						prevLefts[j] = kwicks.eq(j).css('left').replace(/px/, '');
					}
					kwicks.stop().removeClass('active');;
					kwick.addClass('active').animate({width: o.maxWidth}, {
						step: function(now) {
							// calculate animation completeness as percentage
							var percentage = (now - prevWidths[i])/(o.maxWidth - prevWidths[i])
							// adjsut other elements based on percentage
							kwicks.each(function(j) {
								if(j > 0 && j < kwicks.size() - 1) { // if not the first or last kwick
									kwicks.eq(j).css('left', prevLefts[j] - ((prevLefts[j] - preCalcLefts[i][j]) * percentage) + 'px');
								}
								if(j != i) {
									kwicks.eq(j).css('width', prevWidths[j] - ((prevWidths[j] - minWidth) * percentage) + 'px');
								}
							});
						},
						duration: o.duration,
						easing: o.easing
					});
				});
			});
			obj.bind("mouseleave", function() {
				var prevWidths = new Array();
				var prevLefts = new Array();
				for(i = 0; i < kwicks.size(); i++) {
					prevWidths[i] = kwicks.eq(i).css('width').replace(/px/, '');
					prevLefts[i] = kwicks.eq(i).css('left').replace(/px/, '');
				}
				kwicks.removeClass('active').stop().eq(0).animate({width: normWidth}, {
					step: function(now) {
						var percentage = (now - prevWidths[0])/(normWidth - prevWidths[0]);
						for(i = 1; i < kwicks.size(); i++) {
							kwicks.eq(i).css('width', prevWidths[i] - ((prevWidths[i] - normWidth) * percentage) + 'px');
							if(i < kwicks.size() - 1) {
								kwicks.eq(i).css('left', prevLefts[i] - ((prevLefts[i] - ((i * normWidth) + (i * o.spacing))) * percentage) + 'px');
							}
						}
					},
					duration: o.duration,
					easing: o.easing
				});
			});
		});
	};
	
})(jQuery);