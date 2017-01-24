(function (global, factory) {
         typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
         typeof define === 'function' && define.amd ? define(factory) :
         (global.ScrollReveal = factory());
}(this, (function () { 'use strict';

var defaults = {
	origin: 'bottom',
	distance: '0',
	duration: 300,
	delay: 0,
	rotate: {
		x: 0,
		y: 0,
		z: 0,
	},
	opacity: 0,
	scale: 1,
	easing: 'cubic-bezier(0.6, 0.2, 0.1, 1)',
	container: document.documentElement,
	desktop: true,
	mobile: true,
	reset: false,
	useDelay: 'always',
	viewFactor: 0.0,
	viewOffset: {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	beforeReveal: function beforeReveal () {},
	beforeReset: function beforeReset () {},
	afterReveal: function afterReveal () {},
	afterReset: function afterReset () {},
};

var noop = {
	noop: true,
	destroy: function destroy () { return this },
	reveal: function reveal () { return this },
	sync: function sync () { return this },
	watch: function watch () { return this },
};

function deepAssign (target) {
	var sources = [], len = arguments.length - 1;
	while ( len-- > 0 ) sources[ len ] = arguments[ len + 1 ];

	if (isObject(target)) {
		each(sources, function (source) {
			each(source, function (data, key) {
				if (isObject(data)) {
					if (!target[key] || !isObject(target[key])) {
						target[key] = {};
					}
					deepAssign(target[key], data);
				} else {
					target[key] = data;
				}
			});
		});
		return target
	} else {
		throw new TypeError('Expected an object literal.')
	}
}


function isObject (object) {
	return object !== null && typeof object === 'object'
		&& (object.constructor === Object || Object.prototype.toString.call(object) === '[object Object]')
}


function each (collection, callback) {
	if (isObject(collection)) {
		var keys = Object.keys(collection);
		for (var i = 0; i < keys.length; i++) {
			callback(collection[ keys[i] ], keys[i], collection);
		}
	} else if (Array.isArray(collection)) {
		for (var i$1 = 0; i$1 < collection.length; i$1++) {
			callback(collection[i$1], i$1, collection);
		}
	} else {
		throw new TypeError('Expected either an array or object literal.')
	}
}


var nextUniqueId = (function () {
	var uid = 0;
	return function () { return uid++; }
})();

function destroy () {
	var this$1 = this;


	/**
	 * Remove all generated styles.
	 */
	each(this.store.elements, function (element) {
		element.node.setAttribute('style', element.styles.inline);
	});

	/**
	 * Remove all event listeners.
	 */
	each(this.store.containers, function (container) {
		if (container.node === document.documentElement) {
			window.removeEventListener('scroll', this$1.delegate);
			window.removeEventListener('resize', this$1.delegate);
		} else {
			container.node.removeEventListener('scroll', this$1.delegate);
			container.node.removeEventListener('resize', this$1.delegate);
		}
	});

	return this
}

var getPrefixedStyleProperty = (function () {
	var properties = {};
	var style = document.documentElement.style;

	function getPrefixedStyleProperty (name, source) {
		if ( source === void 0 ) source = style;

		if (name && typeof name === 'string') {
			if (properties[name]) {
				return properties[name]
			}
			if (typeof source[name] === 'string') {
				return properties[name] = name
			}
			if (typeof source[("-webkit-" + name)] === 'string') {
				return properties[name] = "-webkit-" + name
			}
			throw new RangeError(("Unable to find \"" + name + "\" style property."))
		}
		throw new TypeError('Expected a string.')
	}

	getPrefixedStyleProperty.clearCache = function () { return properties = {}; };

	return getPrefixedStyleProperty
})();


function isMobile (agent) {
	if ( agent === void 0 ) agent = navigator.userAgent;

	return /Android|iPhone|iPad|iPod/i.test(agent)
}


function isNode (target) {
	return typeof window.Node === 'object'
		? target instanceof window.Node
		: target !== null
			&& typeof target === 'object'
			&& typeof target.nodeType === 'number'
			&& typeof target.nodeName === 'string'
}


function isNodeList (target) {
	var prototypeToString = Object.prototype.toString.call(target);
	var regex = /^\[object (HTMLCollection|NodeList|Object)\]$/;

	return typeof window.NodeList === 'object'
		? target instanceof window.NodeList
		: typeof target === 'object'
			&& typeof target.length === 'number'
			&& regex.test(prototypeToString)
			&& (target.length === 0 || isNode(target[0]))
}


function transformSupported () {
	var style = document.documentElement.style;
	return 'transform' in style || 'WebkitTransform' in style
}


function transitionSupported () {
	var style = document.documentElement.style;
	return 'transition' in style || 'WebkitTransition' in style
}

function isElementVisible (element) {
	var container = this.store.containers[element.containerId];
	var viewFactor = element.config.viewFactor;
	var viewOffset = element.config.viewOffset;

	var elementBounds = {
		top: element.geometry.bounds.top + element.geometry.height * viewFactor,
		right: element.geometry.bounds.right - element.geometry.width * viewFactor,
		bottom: element.geometry.bounds.bottom - element.geometry.height * viewFactor,
		left: element.geometry.bounds.left + element.geometry.width * viewFactor,
	};

	var containerBounds = {
		top: container.geometry.bounds.top + container.scroll.top + viewOffset.top,
		right: container.geometry.bounds.right + container.scroll.left + viewOffset.right,
		bottom: container.geometry.bounds.bottom + container.scroll.top + viewOffset.bottom,
		left: container.geometry.bounds.left + container.scroll.left + viewOffset.left,
	};

	return elementBounds.top < containerBounds.bottom
		&& elementBounds.right > containerBounds.left
		&& elementBounds.bottom > containerBounds.top
		&& elementBounds.left < containerBounds.right
		|| element.styles.position === 'fixed'
}


function getGeometry (target, isContainer) {
	/**
	 * We want to ignore padding and scrollbars for container elements.
	 * More information here: https://goo.gl/vOZpbz
	 */
	var height = (isContainer) ? target.node.clientHeight : target.node.offsetHeight;
	var width = (isContainer) ? target.node.clientWidth : target.node.offsetWidth;

	var offsetTop = 0;
	var offsetLeft = 0;
	var node = target.node;

	do {
		if (!isNaN(node.offsetTop)) {
			offsetTop += node.offsetTop;
		}
		if (!isNaN(node.offsetLeft)) {
			offsetLeft += node.offsetLeft;
		}
		node = node.offsetParent;
	} while (node)

	return {
		bounds: {
			top: offsetTop,
			right: offsetLeft + width,
			bottom: offsetTop + height,
			left: offsetLeft,
		},
		height: height,
		width: width,
	}
}


function getNode (target, container) {
	if ( container === void 0 ) container = document;

	var node = null;
	if (typeof target === 'string') {
		try {
			node = container.querySelector(target);
			if (!node) { logger(("Querying the selector \"" + target + "\" returned nothing.")); }
		} catch (err) {
			logger(("\"" + target + "\" is not a valid selector."));
		}
	}
	return isNode(target) ? target : node
}


function getNodes (target, container) {
	if ( container === void 0 ) container = document;

	if (isNode(target)) { return [target] }
	if (isNodeList(target)) { return Array.prototype.slice.call(target) }
	if (typeof target === 'string') {
		try {
			var query = container.querySelectorAll(target);
			var nodes = Array.prototype.slice.call(query);
			if (nodes.length) { return nodes }
			logger(("Querying the selector \"" + target + "\" returned nothing."));
		} catch (error) {
			logger(("\"" + target + "\" is not a valid selector."));
		}
	}
	return []
}


function getScrolled (container) {
	return (container.node === document.documentElement)
		? {
			top: window.pageYOffset,
			left: window.pageXOffset,
		} : {
			top: container.node.scrollTop,
			left: container.node.scrollLeft,
		}
}


function logger (message) {
	var details = [], len = arguments.length - 1;
	while ( len-- > 0 ) details[ len ] = arguments[ len + 1 ];

	if (console) {
		var report = "ScrollReveal: " + message;
		details.forEach(function (detail) { return report += "\n  - " + detail; });
		console.log(report); // eslint-disable-line no-console
	}
}

/**
* Transformation matrices in the browser come in two flavors:
*
*  - Long (3D) transformation matrix with 16 values
*  - Short (2D) transformation matrix with 6 values
*
*  This utility follows this conversion Guide: https://goo.gl/EJlUQ1
*  to expand short form matrices to their equivalent long form.
*
* @param  {array} source
* @return {array}
*/
function format (source) {
	if (source.constructor !== Array) { throw new TypeError('Expected array.') }
	if (source.length === 16) { return source }
	if (source.length === 6) {
		var matrix = identity();
		matrix[0] = source[0];
		matrix[1] = source[1];
		matrix[4] = source[2];
		matrix[5] = source[3];
		matrix[12] = source[4];
		matrix[13] = source[5];
		return matrix
	}
	throw new RangeError('Expected array with either 6 or 16 values.')
}


function identity () {
	var matrix = [];
	for (var i = 0; i < 16; i++) {
		i % 5 == 0 ? matrix.push(1) : matrix.push(0);
	}
	return matrix
}

function multiply (m, x) {
	if (m.length !== 16 || x.length !== 16) {
		throw new RangeError('Expected arrays with 16 values.')
	}
	var sum = [];
	for (var i = 0; i < 4; i++) {
		var row = [m[i], m[i + 4], m[i + 8], m[i + 12]];
		for (var j = 0; j < 4; j++) {
			var k = j * 4;
			var col = [x[k], x[k + 1], x[k + 2], x[k + 3]];
			var result = row[0] * col[0] + row[1] * col[1] + row[2] * col[2] + row[3] * col[3];
			sum[i + k] = parseFloat(result.toPrecision(6));
		}
	}
	return sum
}


function rotateX (theta) {
	var angle = Math.PI / 180 * theta;
	var matrix = identity();

	matrix[5] = matrix[10] = Math.cos(angle);
	matrix[6] = matrix[9] = Math.sin(angle);
	matrix[9] *= -1;

	return matrix
}


function rotateY (theta) {
	var angle = Math.PI / 180 * theta;
	var matrix = identity();

	matrix[0] = matrix[10] = Math.cos(angle);
	matrix[2] = matrix[8] = Math.sin(angle);
	matrix[2] *= -1;

	return matrix
}


function rotateZ (theta) {
	var angle = Math.PI / 180 * theta;
	var matrix = identity();

	matrix[0] = matrix[5] = Math.cos(angle);
	matrix[1] = matrix[4] = Math.sin(angle);
	matrix[4] *= -1;

	return matrix
}


function scale (scalar) {
	var matrix = identity();
	matrix[0] = matrix[5] = scalar;
	return matrix
}


function translateX (distance) {
	var matrix = identity();
	matrix[12] = distance;
	return matrix
}


function translateY (distance) {
	var matrix = identity();
	matrix[13] = distance;
	return matrix
}




var matrix = Object.freeze({
	format: format,
	identity: identity,
	multiply: multiply,
	rotateX: rotateX,
	rotateY: rotateY,
	rotateZ: rotateZ,
	scale: scale,
	translateX: translateX,
	translateY: translateY
});

function style (element) {
	var computed = window.getComputedStyle(element.node);
	var position = computed.position;
	var config = element.config;

	var inlineRegex = /.+[^;]/g;
	var inlineStyle = element.node.getAttribute('style') || '';
	var inlineMatch = inlineRegex.exec(inlineStyle);
	var inline = (inlineMatch) ? ((inlineMatch[0]) + "; visibility: visible;") : 'visibility: visible;';

	var computedOpacity = parseFloat(computed.opacity);
	var configOpacity = parseFloat(config.opacity);
	var opacity = {
		computed: (computedOpacity !== configOpacity) ? ("opacity: " + computedOpacity + "; ") : '',
		generated: (computedOpacity !== configOpacity) ? ("opacity: " + configOpacity + "; ") : '',
	};

	var transformations = [];

	if (parseFloat(config.distance)) {
		var axis = (config.origin === 'top' || config.origin === 'bottom') ? 'Y' : 'X';

		/**
		 * Let’s make sure our our pixel distances are negative for top and left.
		 * e.g. { origin: 'top', distance: '25px' } starts at `top: -25px` in CSS.
    	 */
		var distance = config.distance;
		if (config.origin === 'top' || config.origin === 'left') {
			distance = /^-/.test(distance)
				? distance.substr(1)
				: ("-" + distance);
		}

		var ref = distance.match(/(^-?\d+\.?\d?)|(em$|px$|\%$)/g);
		var value = ref[0];
		var unit = ref[1];

		switch (unit) {
			case 'em':
				distance = parseInt(computed.fontSize) * value;
				break
			case 'px':
				distance = value;
				break
			case '%':
				distance = (axis === 'Y')
					? element.node.getBoundingClientRect().height * value / 100
					: element.node.getBoundingClientRect().width * value / 100;
				break
			default:
				throw new RangeError('Unrecognized or missing distance unit.')
		}

		transformations.push(matrix[("translate" + axis)](distance));
	}

	if (config.rotate.x) { transformations.push(rotateX(config.rotate.x)); }
	if (config.rotate.y) { transformations.push(rotateY(config.rotate.y)); }
	if (config.rotate.z) { transformations.push(rotateZ(config.rotate.z)); }
	if (config.scale !== 1) { transformations.push(scale(config.scale)); }

	var transform;
	if (transformations.length) {

		var transformProperty = getPrefixedStyleProperty('transform');
		transform = {
			computed: {
				raw: computed[transformProperty],
			},
			property: transformProperty,
		};

		/**
		* The default computed transform value should be one of:
		* undefined || 'none' || 'matrix()' || 'matrix3d()'
		*/
		if (transform.computed.raw === 'none') {
			transform.computed.matrix = identity();
		} else {
			var match = transform.computed.raw.match(/\(([^)]+)\)/);
			if (match) {
				var values = match[1].split(', ').map(function (value) { return parseFloat(value); });
				transform.computed.matrix = format(values);
			} else {
				throw new RangeError('Unrecognized computed transform property value.')
			}
		}

		transformations.unshift(transform.computed.matrix);
		var product = transformations.reduce(function (m, x) { return multiply(m, x); });

		transform.generated = {
			initial: ((transform.property) + ": matrix3d(" + (product.join(', ')) + ");"),
			final: ((transform.property) + ": matrix3d(" + (transform.computed.matrix.join(', ')) + ");"),
		};
	}

	var transition;
	if (opacity.generated || transform.generated) {

		var transitionProperty = getPrefixedStyleProperty('transition');
		transition = {
			computed: computed[transitionProperty],
			fragments: [],
			property: transitionProperty,
		};

		var delay = config.delay;
		var duration = config.duration;
		var easing = config.easing;

		if (opacity) {
			transition.fragments.push({
				delayed: ("opacity " + (duration / 1000) + "s " + easing + " " + (delay / 1000) + "s"),
				instant: ("opacity " + (duration / 1000) + "s " + easing + " 0s"),
			});
		}

		if (transform) {
			transition.fragments.push({
				delayed: ((transform.property) + " " + (duration / 1000) + "s " + easing + " " + (delay / 1000) + "s"),
				instant: ((transform.property) + " " + (duration / 1000) + "s " + easing + " 0s"),
			});
		}

		/**
		 * The default computed transition property should be one of:
		 * undefined || '' || 'all 0s ease 0s' || 'all 0s 0s cubic-bezier()'
		 */
		if (transition.computed && !transition.computed.match(/all 0s/)) {
			transition.fragments.unshift({
				delayed: transition.computed,
				instant: transition.computed,
			});
		}

		var composed = transition.fragments.reduce(function (composition, fragment, i) {
			composition.delayed += (i === 0) ? fragment.delayed : (", " + (fragment.delayed));
			composition.instant += (i === 0) ? fragment.instant : (", " + (fragment.instant));
			return composition
		}, {
			delayed: '',
			instant: '',
		});

		transition.generated = {
			delayed: ((transition.property) + ": " + (composed.delayed) + ";"),
			instant: ((transition.property) + ": " + (composed.instant) + ";"),
		};
	}

	return {
		inline: inline,
		opacity: opacity,
		position: position,
		transform: transform,
		transition: transition,
	}
}

function initialize () {
	var this$1 = this;


	var activeContainerIds = [];
	var activeSequenceIds = [];

	each(this.store.elements, function (element) {
		if (activeContainerIds.indexOf(element.containerId) === -1) {
			activeContainerIds.push(element.containerId);
		}
		if (activeSequenceIds.indexOf(element.sequence.id) === -1) {
			activeSequenceIds.push(element.sequence.id);
		}

		/**
		 * Since we may be initializing elements that have
		 * already been revealed, e.g. invoking sync(),
		 * discern whether to use initial or final styles.
		 */
		var styles;

		if (element.visible) {
			styles = [
				element.styles.inline,
				element.styles.opacity.computed,
				element.styles.transform.generated.final ].join(' ');
		} else {
			styles = [
				element.styles.inline,
				element.styles.opacity.generated,
				element.styles.transform.generated.initial ].join(' ');
		}

		element.node.setAttribute('style', styles);
	});

	/**
	 * Remove unused sequences.
	 */
	each(this.store.sequences, function (sequence) {
		if (activeSequenceIds.indexOf(sequence.id) === -1) {
			delete this$1.store.sequences[sequence.id];
		}
	});

	each(this.store.containers, function (container) {

		/**
		 * Remove unused containers.
		 */
		if (activeContainerIds.indexOf(container.id) === -1) {
			container.node.removeEventListener('scroll', this$1.delegate);
			container.node.removeEventListener('resize', this$1.delegate);
			delete this$1.store.containers[container.id];

		/**
		 * Bind event listeners
		 */
		} else if (container.node === document.documentElement) {
			window.addEventListener('scroll', this$1.delegate);
			window.addEventListener('resize', this$1.delegate);
		} else {
			container.node.addEventListener('scroll', this$1.delegate);
			container.node.addEventListener('resize', this$1.delegate);
		}
	});

	/**
	 * Manually invoke delegate once to capture
	 * element and container dimensions, container
	 * scroll position, and trigger any valid reveals
	 */
	this.delegate();

	this.initTimeout = null;
	this.initialized = true;
}

function reveal (target, options, interval, sync) {
	var this$1 = this;


	/**
	 * The reveal method has an optional 2nd parameter,
	 * so here we just shuffle things around to accept
	 * the interval being passed as the 2nd argument.
	 */
	if (typeof options === 'number') {
		interval = parseInt(options);
		options = {};
	} else {
		options = options || {};
	}

	var config = deepAssign({}, this.defaults, options);
	var containers = this.store.containers;
	var container = getNode(config.container);
	var targets = getNodes(target, container);

	if (!targets.length) {
		logger('Reveal aborted.', 'Reveal cannot be performed on 0 elements.');
		return this
	}

	/**
	 * Verify our platform matches our platform configuration.
	 */
	if (!config.mobile && isMobile() || !config.desktop && !isMobile()) {
		logger('Reveal aborted.', 'This platform has been disabled.');
		return this
	}

	/**
	 * Sequence intervals must be at least 16ms (60fps)
	 * but can be negative for sequencing in reverse.
	 */
	var sequence;
	if (!isNaN(interval)) {
		if (Math.abs(interval) >= 16) {
			var sequenceId = nextUniqueId();
			sequence = {
				elementIds: [],
				firstActiveIndex: 0,
				id: sequenceId,
				interval: interval,
				lastActiveIndex: 0,
			};
		} else {
			logger('Reveal failed.', 'Sequence intervals can not be between -16 and 16.');
			return this
		}
	}

	var containerId;
	each(containers, function (storedContainer) {
		if (!containerId && storedContainer.node === container) {
			containerId = storedContainer.id;
		}
	});

	if (isNaN(containerId)) {
		containerId = nextUniqueId();
	}

	try {
		var elements = targets.map(function (node) {
			var element = {};
			var existingId = node.getAttribute('data-sr-id');

			if (existingId) {
				deepAssign(element, this$1.store.elements[existingId]);

				/**
				 * In order to prevent previously generated styles
				 * from throwing off the new styles, the style tag
				 * has to be reverted to it's pre-reveal state.
				 */
				element.node.setAttribute('style', element.styles.inline);

			} else {
				element.id = nextUniqueId();
				element.node = node;
				element.seen = false;
				element.visible = false;
			}

			element.config = config;
			element.containerId = containerId;
			element.styles = style(element);

			if (sequence) {
				element.sequence = {
					id: sequence.id,
					index: sequence.elementIds.length,
				};
				sequence.elementIds.push(element.id);
			}

			return element
		});

		/**
		* Modifying the DOM via setAttribute needs to be handled
		* separately from reading computed styles in the map above
		* for the browser to batch DOM changes (limiting reflows)
		*/
		each(elements, function (element) {
			this$1.store.elements[element.id] = element;
			element.node.setAttribute('data-sr-id', element.id);
		});

	} catch (error) {
		logger('Reveal failed.', error.message);
		return this
	}

	containers[containerId] = containers[containerId] || {
		id: containerId,
		node: container,
	};

	if (sequence) {
		this.store.sequences[sequence.id] = sequence;
	}

	/**
	* If reveal wasn't invoked by sync, we want to make
	* sure to add this call to the history.
	*/
	if (!sync) {
		this.store.history.push({ target: target, options: options, interval: interval });

		/**
		* Push initialization to the event queue, giving chained
		* reveal calls time to be interpretted.
		*/
		if (this.initTimeout) {
			window.clearTimeout(this.initTimeout);
		}
		this.initTimeout = window.setTimeout(initialize.bind(this), 0);
	}

	return this
}

/**
 * Re-runs the reveal method for each record stored in history, useful
 * for capturing new content asynchronously loaded into the DOM.
 *
 * @return {object} - The current ScrollReveal instance.
 */
function sync () {
	var this$1 = this;

	each(this.store.history, function (record) {
	  reveal.call(this$1, record.target, record.options, record.interval, true);
	});

	initialize.call(this);

	return this
}

function watch () {
	return this
}

var polyfill = (function () {
	var clock = Date.now();

	return function (callback) {
		var currentTime = Date.now();
		if (currentTime - clock > 16) {
			clock = currentTime;
			callback(currentTime);
		} else {
			setTimeout(function () { return polyfill(callback); }, 0);
		}
	}
})();


var requestAnimationFrame = window.requestAnimationFrame
	|| window.webkitRequestAnimationFrame
	|| window.mozRequestAnimationFrame
	|| polyfill;

function animate (element) {

	var styles;

	if (isElementVisible.call(this, element)) {
		styles = [
			element.styles.inline,
			element.styles.opacity.computed,
			element.styles.transform.generated.final,
			element.styles.transition.generated.instant ].join(' ');

		element.seen = true;
		element.visible = true;

	} else {
		styles = [
			element.styles.inline,
			element.styles.opacity.generated,
			element.styles.transform.generated.initial,
			element.styles.transition.generated.instant ].join(' ');

		element.visible = false;
	}

	element.node.setAttribute('style', styles);
}

function delegate (event) {
	var this$1 = this;
	if ( event === void 0 ) event = {};

	requestAnimationFrame(function () {
		var containers = this$1.store.containers;
		var elements = this$1.store.elements;

		switch (event.type) {

			case 'scroll':
				each(containers, function (container) { return container.scroll = getScrolled.call(this$1, container); });
				each(elements, function (element) { return animate.call(this$1, element); });
				break

			case 'resize':
			default:
				each(containers, function (container) {
					container.geometry = getGeometry.call(this$1, container, /* isContainer: */ true);
					container.scroll = getScrolled.call(this$1, container);
				});
				each(elements, function (element) {
					element.geometry = getGeometry.call(this$1, element);
					animate.call(this$1, element);
				});
		}
	});
}

var version = "4.0.0-alpha";

function ScrollReveal (options) {
	if ( options === void 0 ) options = {};


	// Returns a new instance without `new` keyword.
	if (typeof this === 'undefined' || Object.getPrototypeOf(this) !== ScrollReveal.prototype) {
		return new ScrollReveal(options)
	}

	if (!ScrollReveal.isSupported()) {
		logger('Instantiation aborted.', 'This browser is not supported.');
		return noop
	}

	try {
		Object.defineProperty(this, 'defaults', {
			get: (function () {
				var config = {};
				deepAssign(config, defaults, options);
				return function () { return config; }
			})(),
		});
	} catch (error) {
		logger('Instantiation failed.', 'Invalid configuration provided.', error.message);
		return noop
	}

	var container = getNode(this.defaults.container);
	if (!container) {
		logger('Instantiation failed.', 'Invalid or missing container.');
		return noop
	}

	document.documentElement.classList.add('sr');

	this.store = {
		containers: {},
		elements: {},
		history: [],
		sequences: {},
	};

	var containerId = nextUniqueId();
	this.store.containers[containerId] = {
		id: containerId,
		node: container,
	};

	this.initialized = false;
	this.delegate = delegate.bind(this);

	Object.defineProperty(this, 'version', {
		get: function () { return version; },
	});
}

ScrollReveal.isSupported = function () { return transformSupported() && transitionSupported(); };

ScrollReveal.prototype.destroy = destroy;
ScrollReveal.prototype.reveal = reveal;
ScrollReveal.prototype.sync = sync;
ScrollReveal.prototype.watch = watch;

/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////             /////    /////
/////             /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
         /////    /////
         /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////
/////    /////    /////    /////

/*!
 * ScrollReveal
 * ------------
 * Website : https://scrollreveal.com
 * Support : https://github.com/jlmakes/scrollreveal/issues
 * Author  : https://twitter.com/jlmakes
 *
 * Licensed under the GNU General Public License 3.0 for
 * compatible open source projects and non-commercial use.
 *
 * For commercial sites, themes, projects, and applications,
 * keep your source code proprietary and please purchase a
 * commercial license from https://scrollreveal.com
 *
 * Copyright (c) 2014–2017 Julian Lloyd. All rights reserved.
 */

return ScrollReveal;

})));
