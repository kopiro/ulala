(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('jquery'));
	} else {
		root.returnExports = factory(root.jQuery);
	}
}(this, function ($) {

	var Ulala = {

		$document: $(document),
		$window: $(window),

		_resizeTimeout: null,

		$elements: null,
		suffix: null,

		config: {
			preload_window_ratio: 1.5,
			visibility_window_ratio: 0
		}
	};

	Ulala._detectSuffix = function() {
		if (window.innerWidth >= 768) {
			if ((window.devicePixelRatio || 1) > 1) {
				return "-desktop@2x";
			} else {
				return "-desktop";
			}
		} else {
			if ((window.devicePixelRatio || 1) > 2) {
				return "-mobile@3x";
			} else {
				return "-mobile@2x";
			}
		}
	};

	Ulala._loadImage = function($this) {
		var file = $this.data('image');

		if ($this.data('nosuffix') == null) {
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
			}

			$this.attr('data-ulala-loaded', true);
			if ($this.attr('data-ulala-shown')) {
				exports.showImage($this);
			}
		}, false);

		img.addEventListener('error', function() {
			console.error('Ulala: error loading', file);
		}, false);
	};

	Ulala._showImage = function($this) {
		$this.attr('data-ulala-shown', true);

		if ($this.attr('data-ulala-loaded')) {
			$this.addClass('-visible');
		}
	};

	Ulala._calc = function(e) {
		var cs = Ulala.$document.scrollTop();
		var wh = Ulala.$window.height();

		var offsets = {
			loading: cs + wh + (wh * config.preload_window_ratio),
			waypoint: cs + wh + (wh * config.visibility_window_ratio)
		};

		Ulala.$elements.each(function() {
			var $this = $(this);
			var offset = $this.attr('data-ulala-offsettop');

			if ($this.attr('data-image') != null) {
				if (!$this.attr('data-ulala-loading') && (offset < offsets.loading)) {
					$this.attr('data-ulala-loading', true);
					Ulala._loadImage($this);
				}
			}

			if ($this.attr('data-waypoint') != null) {
				if (!$this.attr('data-ulala-waypointing') && (offset < offsets.waypoint)) {
					$this.attr('data-ulala-waypointing', true);
					Ulala._showImage($this);
				}
			}
		});
	};

	Ulala._calcOffsetsOfElements = function() {
		Ulala.$elements.each(function() {
			var $this = $(this);

			$this.attr('data-ulala-offsettop', $this.offset().top);

			if ($this.attr('data-ulala-loading') != true) {
				$this.attr('data-ulala-loaded', $this.data('image') ? false : true);
			}
		});
	};

	Ulala._setElements = function() {
		Ulala.$elements = $('[data-waypoint],[data-image]');
		Ulala._calcOffsetsOfElements();
	};

	Ulala.init = function(config) {
		$.extend(Ulala.config, config || {});

		Ulala._setElements();

		Ulala.$window.on('resize', function() {
			clearTimeout(Ulala._resizeTimeout);
			Ulala._resizeTimeout = setTimeout(Ulala._calcOffsetsOfElements, 250);
		});

		Ulala.$document.on('scroll', function(e) {
			requestAnimationFrame(Ulala._calc);
		});
	};

	return Ulala;

}));