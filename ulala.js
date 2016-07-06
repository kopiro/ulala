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
			preloadIn: 1,
			visibilityIn: 0,
			useSuffixes: true,
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

	Ulala._loadImage = function($this) {
		var file = $this.data('image');

		if (Ulala.config.useSuffixes && ($this.data('nosuffix') == null)){
			file = file.replace(/(\..+$)/, function(match, $1, $2, offset, original) {
				return Ulala.suffix + $1;
			});
		}

		var img = new Image();
		img.src = file;

		img.addEventListener('load', function() {
			if ($this.prop('tagName') === 'DIV') {
				$this.attr('style', 'background-image: url("' + file + '")');
			} else if ($this.prop('tagName') === 'IMG') {
				$this.attr('src', file);
			} else {
				console.error('Ulala: unrecognized tag', $this.prop('tagName'));
			}

			$this.attr(Ulala.domPrefix + 'loaded', true);
			if ($this.attr(Ulala.domPrefix + 'shown')) {
				Ulala._showImage($this);
			}
		}, false);

		img.addEventListener('error', function() {
			console.error('Ulala: error loading', file);
		}, false);
	};

	Ulala._showImage = function($this) {
		$this.attr(Ulala.domPrefix + 'shown', true);

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

			if ($this.attr('data-image') != null) {
				if (!$this.attr(Ulala.domPrefix + 'loading') && (offset < offsets.loading)) {
					$this.attr(Ulala.domPrefix + 'loading', true);
					Ulala._loadImage($this);
				}
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

			if ($this.attr(Ulala.domPrefix + 'loading') != true) {
				$this.attr(Ulala.domPrefix + 'loaded', $this.data('image') ? false : true);
			}
		});
	};

	Ulala.init = function(config) {
		$.extend(Ulala.config, config || {});

		Ulala.$elements = $('[data-waypoint],[data-image]');
		Ulala._calcOffsets();
		Ulala._calc();

		if (Ulala.onResize == null) {
			Ulala.onResize = true;
			Ulala.$window.on('resize', function() {
				clearTimeout(Ulala._resizeTimeout);
				Ulala._resizeTimeout = setTimeout(function() {
					Ulala._calcSuffix();
					Ulala._calcOffsets();
				}, 250);
			});
		}

		if (Ulala.onScroll == null) {
			Ulala.onScroll = true;
			Ulala.$document.on('scroll', function(e) {
				requestAnimationFrame(Ulala._calc);
			});
		}
	};

	return Ulala;

}));