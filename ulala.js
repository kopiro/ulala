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
		}
	};

	Ulala._calcSuffix = function() {
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

	Ulala._loadImage = function($this) {
		var onLoaded = function() {
			$this.attr(Ulala.domPrefix + 'loaded', true);
			$this.addClass(Ulala.config.loadedClass);

			if ($this.attr(Ulala.domPrefix + 'visible')) {
				Ulala._showImage($this);
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

	Ulala._showImage = function($this) {
		$this.attr(Ulala.domPrefix + 'visible', true);

		if ($this.attr(Ulala.domPrefix + 'loaded')) {
			$this.addClass(Ulala.config.visibleClass);
		}
	};

	Ulala._calc = function(e) {
		var cs = Ulala.$document.scrollTop();
		var wh = Ulala.$window.height();

		var offsets = {
			loading: cs + wh + (wh * Ulala.config.preloadIn),
			waypoint: cs + wh + (wh * Ulala.config.visibilityIn)
		};

		Ulala.$elements.each(function() {
			var $this = $(this);
			var offset = $this.attr(Ulala.domPrefix + 'offsettop');

			if (Ulala._shouldBeWaitLoading($this)) {
				if (!$this.attr(Ulala.domPrefix + 'loading') && (offset < offsets.loading)) {
					$this.attr(Ulala.domPrefix + 'loading', true);
					
					Ulala._loadImage($this);
				}
			} else {
				$this.attr(Ulala.domPrefix + 'loaded', true);
			}

			if ($this.attr('data-waypoint') != null) {
				if (!$this.attr(Ulala.domPrefix + 'waypointing') && (offset < offsets.waypoint)) {
					$this.attr(Ulala.domPrefix + 'waypointing', true);

					Ulala._showImage($this);
				}
			}
		});
	};

	Ulala._calcOffsets = function() {
		Ulala.$elements.each(function() {
			var $this = $(this);
			$this.attr(Ulala.domPrefix + 'offsettop', $this.offset().top);
		});
	};

	Ulala.init = function(config) {
		$.extend(Ulala.config, config || {});

		Ulala.$elements = $('[data-waypoint],[data-image]');
		Ulala._calcOffsets();
		Ulala._calc();

		if (Ulala._onResizeHandlerAttached == null) {
			Ulala._onResizeHandlerAttached = true;

			Ulala.$window.on('resize', function() {
				clearTimeout(Ulala._resizeTimeout);
				Ulala._resizeTimeout = setTimeout(function() {
					Ulala._calcSuffix();
					Ulala._calcOffsets();
				}, 250);
			});
		}

		if (Ulala._onScrollHandlerAttached == null) {
			Ulala._onScrollHandlerAttached = true;

			Ulala.$document.on('scroll', function(e) {
				requestAnimationFrame(Ulala._calc);
			});
		}
	};

	return Ulala;

}));
