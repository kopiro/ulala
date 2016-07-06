(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('jquery'));
	} else {
		root.Ulala = factory(root.jQuery);
	}
}(this, function ($) {

	var Ulala = {

		$document: $(document),
		$window: $(window),

		_resizeTimeout: null,
		domPrefix: 'data-ulala-',

		$elements: null,
		suffix: '',

		config: {
			debug: 0,
			preloadIn: 1,
			visibilityIn: 0,
			useSuffixes: true,
			loadedClass: '-loaded',
			visibleClass: '-visible'
		},

		cssPrefix: (function() {
			var styles = window.getComputedStyle(document.documentElement, ''),
			pre = (Array.prototype.slice
			.call(styles)
			.join('')
			.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
			)[1],
			dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
			return '-' + pre + '-';
		})()

	};


	Ulala.calcImageSuffix = function() {
		if (window.innerWidth >= 768) {
			if ((window.devicePixelRatio || 1) > 1) {
				Ulala.suffix = "-desktop@2x";
			} else {
				Ulala.suffix = "-desktop";
			}
		} else {
			if ((window.devicePixelRatio || 1) > 2) {
				Ulala.suffix = "-mobile@3x";
			} else {
				Ulala.suffix = "-mobile@2x";
			}
		}
	};

	Ulala._shouldBeWaitLoading = function($this) {
		return $this.data('image') != null || $this.prop('tagName') === 'IMG';
	};

	Ulala.elementLoadImage = function($this) {
		var onLoaded = function() {
			$this.attr(Ulala.domPrefix + 'loaded', true);
			$this.addClass(Ulala.config.loadedClass);

			if ($this.attr(Ulala.domPrefix + 'visible')) {
				Ulala.elementShowImage($this);
			}
		};

		if ($this.prop('complete')) {
			onLoaded();
		} else {
			$this.load(onLoaded);
		}

		if ($this.data('image') != null) {
			var file = $this.data('image');

			if (Ulala.config.useSuffixes && ($this.data('nosuffix') == null)) {
				file = file.replace(/(\..+$)/, function(match, $1, $2, offset, original) {
					return Ulala.suffix + $1;
				});
			}

			new Image(file).addEventListener('load', function() {
				if ($this.prop('tagName') === 'DIV') {
					$this.attr('style', 'background-image: url("' + file + '")');
				} else if ($this.prop('tagName') === 'IMG') {
					$this.attr('src', file);
				} else {
					console.error('Ulala: unrecognized tag for lazy loading', $this.prop('tagName'));
				}
			}, false);
		}
	};

	Ulala.elementShowImage = function($this) {
		$this.attr(Ulala.domPrefix + 'visible', true);

		if ($this.attr(Ulala.domPrefix + 'loaded')) {
			$this.addClass(Ulala.config.visibleClass);
		}
	};

	Ulala.elementParallax = function($this, cs, wh) {
		var $wrap = $this.parent();

		var onObjectLoaded = function() {
			var wrapOuterHeight = $wrap.outerHeight();
			var offsetTop = $this.attr(Ulala.domPrefix + 'offset-top');

			var imgNatHeight =  $this.prop('naturalHeight') / $this.prop('naturalWidth') * $wrap.outerWidth();
			var parallaxOffset = imgNatHeight - wrapOuterHeight;

			if (parallaxOffset > 0) {

				// Std case

				var translation = ((cs + wh) - offsetTop) / (wh + wrapOuterHeight);
				var cssTranslation = -1 * Math.min(Math.max(translation,0),1) * parallaxOffset;

				$this.css(
				Ulala.cssPrefix + 'transform', 
				'translate3d(0, ' + cssTranslation + 'px, 0)'
				)
				.css({
					position: 'absolute', 
					width: '100%', 
					height: 'auto', 
					top: 0, 
					left: 0,	
					right: 0, 
					opacity: 1
				});

			} else {

				// Limit case

				$this
				.css(Ulala.cssPrefix + 'transform', 'none')
				.css({
					height: wrapOuterHeight,
					position: 'absolute', 
					width: 'auto', 
					top: 0, 
					bottom: 0,
					left: '-9999px', 
					right: '-9999px', 
					margin: '0 auto', 
					opacity: 1
				});

			}
		};

		if ($this.prop('complete')) {
			onObjectLoaded();
		} else {
			$this.load(onObjectLoaded);
		}
	};

	Ulala.parse = function(e) {
		var cs = Ulala.$document.scrollTop();
		var wh = Ulala.$window.height();

		var offsets = {
			loading: cs + wh + (wh * Ulala.config.preloadIn),
			waypoint: cs + wh + (wh * Ulala.config.visibilityIn)
		};

		Ulala.$elements.each(function() {
			var $this = $(this);
			var offset = $this.attr(Ulala.domPrefix + 'offset-top');

			// Loading images

			if (Ulala._shouldBeWaitLoading($this)) {
				if (!$this.attr(Ulala.domPrefix + 'loading') && (offset < offsets.loading)) {
					$this.attr(Ulala.domPrefix + 'loading', true);
					Ulala.elementLoadImage($this, cs, wh);
				}
			} else {
				$this.attr(Ulala.domPrefix + 'loaded', true);
			}

			// Waypoint

			if ($this.attr('data-waypoint') != null) {
				if (!$this.attr(Ulala.domPrefix + 'waypointing') && (offset < offsets.waypoint)) {
					$this.attr(Ulala.domPrefix + 'waypointing', true);

					Ulala.elementShowImage($this, cs, wh);
				}
			}

			// Parallax
			if ($this.attr('data-parallax') != null) {
				Ulala.elementParallax($this, cs, wh);
			}

		});
	};

	Ulala.preParse = function() {
		Ulala.$elements.each(function() {
			var $this = $(this);
			$this.attr(Ulala.domPrefix + 'offset-top', $this.offset().top);
			$this.attr(Ulala.domPrefix + 'outer-height', $this.outerHeight());
		});
	};

	Ulala.init = function(config) {
		$.extend(Ulala.config, config || {});

		var style = '';
		style += '[data-parallax-wrapper] { overflow: hidden; position: relative; }';
		$('head').append('<style>' + style + '</style>');

		Ulala.$elements = $('[data-waypoint],[data-image],[data-parallax]');

		if (Ulala._onResizeHandlerAttached == null) {
			Ulala._onResizeHandlerAttached = true;

			Ulala.$window.on('resize', function() {
				clearTimeout(Ulala._resizeTimeout);
				Ulala._resizeTimeout = setTimeout(function() {
					Ulala.calcImageSuffix();
					Ulala.preParse();
				}, 250);
			});
		}

		if (Ulala._onScrollHandlerAttached == null) {
			Ulala._onScrollHandlerAttached = true;

			Ulala.$document.on('scroll', function(e) {
				requestAnimationFrame(Ulala.parse);
			});
		}

		Ulala.preParse();
		Ulala.parse();
	};

	return Ulala;

}));
