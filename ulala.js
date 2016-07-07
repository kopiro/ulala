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
		cssPrefix: (function() {
			var styles = window.getComputedStyle(document.documentElement, ''),
			pre = (Array.prototype.slice
			.call(styles)
			.join('')
			.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
			)[1],
			dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
			return '-' + pre + '-';
		})(),

		domPrefix: 'data-ulala-',

		$elements: null,
		suffix: '',

		config: {
			preloadIn: 1,
			visibilityIn: 0,
			useSuffixes: true,
			loadedClass: '-loaded',
			visibleClass: '-visible'
		},

	};

	Ulala.attr = function($this, prop, newValue) {
		if (newValue != null) {
			return $this.attr(Ulala.domPrefix + '' + prop, newValue);
		} else {
			return $this.attr(Ulala.domPrefix + '' + prop);
		}
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
			Ulala.attr($this, 'loaded', true);
			$this.addClass(Ulala.config.loadedClass);

			if (Ulala.attr($this, 'visible')) {
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
				if ($this.prop('tagName') === 'IMG') {
					$this.attr('src', file);
				} else {
					$this.attr('style', 'background-image: url("' + file + '")');
				}
			}, false);
		}
	};

	Ulala.elementShowImage = function($this) {
		Ulala.attr($this, 'visible', true);

		if (Ulala.attr($this, 'loaded')) {
			$this.addClass(Ulala.config.visibleClass);
		}
	};

	Ulala.elementParallax = function($this, cs, wh) {
		var $wrapper = $this.parent();
		var offset = Ulala.attr($this, 'otop') << 0;
		var height = $wrapper.outerHeight() << 0;

		var translation = cs / ( offset + height );
		var cssTranslation = -1 * Math.min(Math.max(translation,0),1) * (Ulala.attr($this, 'pdelta') << 0);

		$this.css(Ulala.cssPrefix + 'transform', 'translate3d(0, ' + cssTranslation + 'px, 0)');
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
			var offset = Ulala.attr($this, 'otop');

			// Loading images

			if (Ulala._shouldBeWaitLoading($this)) {
				if (!Ulala.attr($this, 'loading') && (offset < offsets.loading)) {
					Ulala.attr($this, 'loading', true);
					Ulala.elementLoadImage($this, cs, wh);
				}
			} else {
				Ulala.attr($this, 'loaded', true);
			}

			// Waypoint

			if ($this.attr('data-waypoint') != null) {
				if (!Ulala.attr($this, 'waypointing') && (offset < offsets.waypoint)) {
					Ulala.attr($this, 'waypointing', true);

					Ulala.elementShowImage($this, cs, wh);
				}
			}

			// Parallax
			if ($this.attr('data-parallax') != null) {
				Ulala.elementParallax($this, cs, wh);
			}

		});
	};

	Ulala.elementParseParallax = function($this) {
		var $wrapper = $this.parent();
		var r = 1 + Number( $this.attr('data-parallax') || 0.25 );
		var wrapperHeightWithPR = (r * $wrapper.outerHeight());

		var onLoaded = function() {
			var RI = $this.prop('naturalWidth') / $this.prop('naturalHeight');
			var RW =  ($wrapper.outerWidth() / wrapperHeightWithPR);

			if (RI > RW) {
				$this.height( wrapperHeightWithPR );
				$this.width( wrapperHeightWithPR * RI );
			} else {
				$this.width( $wrapper.outerWidth() );
				$this.height( $wrapper.outerWidth() / RI );
			}

			var delta = $this.height() - $wrapper.outerHeight();
			Ulala.attr($this, 'pdelta', delta);

			$this.css({
				left: '-999px',
				right: '-999px',
				top: 0,
				margin: '0 auto'
			});
		};

		if ($this.prop('complete')) {
			onLoaded();
		} else {
			$this.load(onLoaded);
		}
	};

	Ulala.preParse = function() {
		Ulala.PARSING_TIME = Date.now();

		Ulala.calcImageSuffix();

		Ulala.$elements.each(function() {
			var $this = $(this);
			Ulala.attr($this, 'otop', $this.offset().top);

			if ($this.attr('data-parallax') != null) {
				Ulala.attr($this, 'otop', $this.parent().offset().top);
				if ((Ulala.attr($this, 'parallax-parsed')<<0) < Ulala.PARSING_TIME) {
					Ulala.attr($this, 'parallax-parsed', Ulala.PARSING_TIME);
					Ulala.elementParseParallax($this);
				}
			}
		});
	};

	Ulala.run = function() {
		Ulala.preParse();
		requestAnimationFrame(Ulala.parse);
	};

	Ulala.init = function(config) {
		$.extend(Ulala.config, config || {});
		Ulala.PARSING_TIME = Date.now();

		var style = '';
		style += '[data-parallax-wrapper] { overflow: hidden; position: relative; }';
		style += '[data-parallax] { position: absolute; }';
		$('head').append('<style>' + style + '</style>');

		Ulala.$elements = $('[data-waypoint], [data-image], [data-parallax]');

		if (Ulala._handlerAttached == null) {
			Ulala._handlerAttached = true;
			Ulala.$window.on('resize', Ulala.run);
			Ulala.$document.on('scroll', Ulala.run);
		}

		Ulala.$window.load(Ulala.run);
		Ulala.run();
	};

	return Ulala;

}));