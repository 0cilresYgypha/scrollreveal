
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

/**
 * ScrollReveal
 * ------------
 * Version : 3.1-RC (Supersonic Sequencer)
 * Website : scrollrevealjs.org
 * Repo    : github.com/jlmakes/scrollreveal.js
 * Author  : Julian Lloyd (@jlmakes)
 */

;(function() {
    'use strict';

    var
        sr,
        Tools,
        _requestAnimationFrame;

    this.ScrollReveal = (function() {

        /**
         * Configuration
         * -------------
         * This object signature can be passed directly to the ScrollReveal constructor,
         * or as the second argument of the `reveal()` method.
         */

        ScrollReveal.prototype.defaults = {

            //            'bottom', 'left', 'top', 'right'
            origin      : 'bottom',

            //            Can be any valid CSS distance, e.g. '5rem', '10%', '20vw', etc.
            distance    : '20px',

            //            Time in milliseconds.
            duration    : 500,
            delay       : 0,

            //            Starting angles in degrees, will transition from these values to 0 in all axes.
            rotate      : { x: 0, y: 0, z: 0 },

            //            Starting opacity value, before transitioning to the computed opacity.
            opacity     : 0,

            //            Starting scale value, will transition from this value to 1
            scale       : 0.9,

            //            Accepts any valid CSS easing, e.g. 'ease', 'ease-in-out', 'linear', etc.
            easing      : 'cubic-bezier(0.6, 0.2, 0.1, 1)',

            //            When null, `<html>` is assumed to be the reveal container. You can pass a
            //            DOM node as a custom container, e.g. document.querySelector('.fooContainer')
            //            or a selector, e.g. '.fooContainer'
            container   : null,

            //            true/false to control reveal animations on mobile.
            mobile      : true,

            //            true:  reveals occur every time elements become visible
            //            false: reveals occur once as elements become visible
            reset       : false,

            //            'always' — delay for all reveal animations
            //            'once'   — delay only the first time reveals occur
            //            'onload' - delay only for animations triggered by first load
            useDelay    : 'always',

            //            Change when an element is considered in the viewport. The default value
            //            of 0.20 means 20% of an element must be visible for its reveal to occur.
            viewFactor  : 0.2,

            //            Pixel values that alter the container boundaries.
            //            e.g. Set `{ top: 48 }`, if you have a 48px tall fixed toolbar.
            //            --
            //            Visual Aid: https://scrollrevealjs.org/assets/viewoffset.png
            viewOffset  : { top: 0, right: 0, bottom: 0, left: 0 },

            //            Callbacks that fire for each completed element reveal, and if
            //            `config.reset = true`, for each completed element reset. When creating your
            //            callbacks, remember they are passed the element’s DOM node that triggered
            //            it as the first argument.
            afterReveal : function(domEl) {},
            afterReset  : function(domEl) {}
        };



        function ScrollReveal(config) {

            // Support instantiation without the `new` keyword.
            if (typeof this == 'undefined' || Object.getPrototypeOf(this) !== ScrollReveal.prototype) {
                return new ScrollReveal(config)
            }

            sr = this; // Save reference to instance.

            if (sr.supported()) {

                sr.tools = new Tools();
                sr.tools.extend(sr.defaults, config || {});

                _resolveContainer(sr.defaults);

                sr.store = {
                    elements   : {},
                    containers : {},
                    sequences  : {}
                };

                sr.history     = [];
                sr.uid         = 0;
                sr.initialized = false;
            }

            // Note: IE9 only supports console if devtools are open.
            else if (typeof console !== 'undefined' && console !== null) {
                console.log('ScrollReveal is not supported in this browser.');
            }

            return sr
        }



        /**
         * Check if client supports CSS Transform and CSS Transition.
         * @return {boolean}
         */
        ScrollReveal.prototype.supported = function() {
            var style = document.documentElement.style;
            return 'WebkitTransition' in style && 'WebkitTransform' in style
                || 'transition' in style && 'transform' in style
        };



        /**
         * Creates a reveal set, a group of elements that will animate when they
         * become visible. If [interval] is provided, a new sequence is created
         * that will ensure elements reveal in the order they appear in the DOM.
         *
         * @param {string|Node} [selector] The element (node) or elements (selector) to animate.
         * @param {Object}      [config]   Override the defaults for this reveal set.
         * @param {number}      [interval] Time between sequenced element animations (milliseconds).
         * @param {boolean}     [sync]     Used internally when updating reveals for async content.
         *
         * @return {Object} The current ScrollReveal instance.
         */
        ScrollReveal.prototype.reveal = function(selector, config, interval, sync) {

            var
                container,
                elements,
                elem,
                elemId,
                sequence,
                sequenceId;

            // Resolve container.
            if (config && config.container) {
                container = _resolveContainer(config);
            } else {
                container = sr.defaults.container;
            }

            // Let’s check to see if a DOM node was passed in as the first argument,
            // otherwise query the container for all elements matching the selector.
            if (sr.tools.isNode(selector)) {
                elements = [selector];
            } else {
                elements = Array.prototype.slice.call(container.querySelectorAll(selector));
            }

            if (!elements.length) {
                console.log('ScrollReveal: reveal on "'+ selector + '"" failed, no elements found.');
                return sr
            }

            // Prepare a new sequence if an interval is passed.
            if (interval && typeof interval == 'number') {
                sequenceId = _nextUid();
                sequence = sr.store.sequences[sequenceId] = {
                    id        : sequenceId,
                    interval  : interval,
                    elemIds   : [],
                    index     : {
                        first : null,
                        last  : null,
                        next  : null
                    }
                }
            }

            // Begin main loop to configure ScrollReveal elements.
            for (var i = 0; i < elements.length; i++) {

                // Check if the element has already been configured and grab it from the store.
                elemId = elements[i].getAttribute('data-sr-id');
                if (elemId) {
                    elem = sr.store.elements[elemId];
                }

                // Otherwise, let’s do some basic setup.
                else {
                    elem = {
                        id        : _nextUid(),
                        domEl     : elements[i],
                        seen      : false,
                        revealing : false
                    };
                    elem.domEl.setAttribute('data-sr-id', elem.id);
                }

                // Sequence only setup
                if (sequence) {

                    elem.sequence = {
                        id    : sequence.id,
                        index : _nextUid()
                    };

                    sequence.elemIds.push(elem.id);

                    // top left to bottom right sequence
                    if (interval > 0) {
                        if (i == 0) {
                            sequence.index.first = elem.id;
                        }
                        if (i == elements.length - 1) {
                            sequence.index.last = elem.id;
                        }
                    }

                    // bottom right to top left sequence
                    if (interval < 0) {
                        if (i == 0) {
                            sequence.index.last = elem.id;
                        }
                        if (i == elements.length - 1) {
                            sequence.index.first = elem.id;
                        }
                    }
                }

                // New or existing element, it’s time to update its configuration, styles,
                // and send the updates to our store.
                _configure(elem, config || {});
                _style(elem);
                _updateStore(elem);

                // We need to make sure elements are set to visibility: visibile, even when
                // on mobile and `config.mobile == false`, or if unsupported.
                if (sr.tools.isMobile() && !elem.config.mobile || !sr.supported()) {
                    elem.domEl.setAttribute('style', elem.styles.inline);
                    elem.disabled = true;
                }

                // Otherwise, proceed normally.
                else if (!elem.revealing) {
                    elem.domEl.setAttribute('style',
                        elem.styles.inline
                      + elem.styles.transform.initial
                    );
                }
            }

            // Each `reveal()` is recorded so that when calling `sync()` while working
            // with asynchronously loaded content, it can re-trace your steps but with
            // all your new elements now in the DOM.

            // Since `reveal()` is called internally by `sync()`, we don’t want to
            // record or intiialize each reveal during syncing.
            if (!sync && sr.supported()) {
                _record(selector, config);

                // We push initialization to the event queue using setTimeout, so that we can
                // give ScrollReveal room to process all reveal calls before putting things into motion.
                // --
                // Philip Roberts - What the heck is the event loop anyway? (JSConf EU 2014)
                // https://www.youtube.com/watch?v=8aGhZQkoFbQ
                if (sr.initTimeout) {
                    window.clearTimeout(sr.initTimeout);
                }
                sr.initTimeout = window.setTimeout(_init, 0);
            }

            return sr
        };



        /**
         * Re-runs `reveal()` for each record stored in history, effectively capturing
         * any content loaded asynchronously that matches existing reveal set selectors.
         *
         * @return {Object} The current ScrollReveal instance.
         */
        ScrollReveal.prototype.sync = function() {
            if (sr.history.length && sr.supported()) {
                for (var i = 0; i < sr.history.length; i++) {
                    var record = sr.history[i];
                    sr.reveal(record.selector, record.config, record.interval, true);
                };
                _init();
            } else {
                console.log('ScrollReveal: sync failed, no reveals found.');
            }
            return sr
        };



        /**
         * Private Methods
         * ---------------
         * These methods remain accessible only to the ScrollReveal instance, even
         * though they only "exist" during instantiation outside of the constructors scope.
         * --
         * http://stackoverflow.com/questions/111102/how-do-javascript-closures-work
         */

        function _resolveContainer(config) {
            var container = config.container;

            // Check if our container is defined by a selector.
            if (container && typeof container == 'string') {
                return config.container = window.document.querySelector(container);
            }

            // Check if our container is defined by a node.
            else if (container && !sr.tools.isNode(container)) {
                console.log('ScrollReveal: Invalid container provided, using <html> instead.');
                config.container = null;
            }

            // Otherwise use <html> by default.
            if (container == null) {
                config.container = window.document.documentElement;
            }

            return config.container
        }



        /**
         * A consistent way of creating unique IDs.
         * @returns {number}
         */
        function _nextUid() {
            return ++sr.uid;
        }



        function _configure(elem, config) {

            // If the element hasn’t already been configured, let’s use a clone of the
            // defaults extended by the configuration passed as the second argument.
            if (!elem.config) {
                elem.config = sr.tools.extendClone(sr.defaults, config);
            }

            // Otherwise, let’s use a clone of the existing element configuration extended
            // by the configuration passed as the second argument.
            else {
                elem.config = sr.tools.extendClone(elem.config, config);
            }

            // Infer CSS Transform axis from origin string.
            if (elem.config.origin === 'top' || elem.config.origin === 'bottom') {
                elem.config.axis = 'Y';
            } else {
                elem.config.axis = 'X';
            }

            // Let’s make sure our our pixel distances are negative for top and left.
            // e.g. config.origin = 'top' and config.distance = '25px' starts at `top: -25px` in CSS.
            if (elem.config.origin === 'top' || elem.config.origin === 'left') {
                elem.config.distance = '-' + elem.config.distance;
            }
        }



        function _style(elem) {
            var computed = window.getComputedStyle(elem.domEl);

            if (!elem.styles) {
                elem.styles = {
                    transition : {},
                    transform  : {},
                    computed   : {}
                };

                // Capture any existing inline styles, and add our visibility override.
                // --
                // See section 4.2. in the Documentation:
                // https://github.com/jlmakes/scrollreveal.js#42-improve-user-experience
                elem.styles.inline  = elem.domEl.getAttribute('style') || '';
                elem.styles.inline += '; visibility: visible; ';

                // grab the elements existing opacity.
                elem.styles.computed.opacity = computed.opacity;

                // grab the elements existing transitions.
                if (!computed.transition || computed.transition == 'all 0s ease 0s') {
                    elem.styles.computed.transition = '';
                } else {
                    elem.styles.computed.transition = computed.transition + ', ';
                }
            }

            // Create transition styles
            elem.styles.transition.instant = _generateTransition(elem, 0);
            elem.styles.transition.delayed = _generateTransition(elem, elem.config.delay);

            // Generate transform styles, first with the webkit prefix.
            elem.styles.transform.initial = ' -webkit-transform:';
            elem.styles.transform.target  = ' -webkit-transform:';
            _generateTransform(elem);

            // And again without any prefix.
            elem.styles.transform.initial += 'transform:';
            elem.styles.transform.target  += 'transform:';
            _generateTransform(elem);

        }



        function _generateTransition(elem, delay) {
            var config = elem.config;

            return '-webkit-transition: ' + elem.styles.computed.transition +
                     '-webkit-transform ' + config.duration / 1000 + 's '
                                          + config.easing + ' '
                                          + delay / 1000 + 's, opacity '
                                          + config.duration / 1000 + 's '
                                          + config.easing + ' '
                                          + delay / 1000 + 's; ' +

                           'transition: ' + elem.styles.computed.transition +
                             'transform ' + config.duration / 1000 + 's '
                                          + config.easing + ' '
                                          + delay / 1000 + 's, opacity '
                                          + config.duration / 1000 + 's '
                                          + config.easing + ' '
                                          + delay / 1000 + 's; '
        }



        function _generateTransform(elem) {
            var config    = elem.config;
            var transform = elem.styles.transform;

            if (parseInt(config.distance)) {
                transform.initial += ' translate' + config.axis + '(' + config.distance + ')';
                transform.target  += ' translate' + config.axis + '(0)';
            }
            if (config.scale) {
                transform.initial += ' scale(' + config.scale + ')';
                transform.target  += ' scale(1)';
            }
            if (config.rotate.x) {
                transform.initial += ' rotateX(' + config.rotate.x + 'deg)';
                transform.target  += ' rotateX(0)';
            }
            if (config.rotate.y) {
                transform.initial += ' rotateY(' + config.rotate.y + 'deg)';
                transform.target  += ' rotateY(0)';
            }
            if (config.rotate.z) {
                transform.initial += ' rotateZ(' + config.rotate.z + 'deg)';
                transform.target  += ' rotateZ(0)';
            }
            transform.initial += '; opacity: ' + config.opacity + ';';
            transform.target  += '; opacity: ' + elem.styles.computed.opacity + ';';
        }



        /**
         * Check if the container already exists within the store.
         * @param  {Node} container The element’s `config.container` in question.
         * @return {boolean}
         */
        function _containerIsUnique(container) {
            if (sr.store.containers !== {}) {
                sr.tools.forOwn(sr.store.containers, function(containerId) {
                    if (container === sr.store.containers[containerId].node) {
                        return false
                    }
                });
            }
            return true
        }



        function _updateStore(elem) {

            if (_containerIsUnique(elem.config.container)) {
                var containerId = _nextUid();
                sr.store.containers[containerId] = {
                    id       : containerId,
                    node     : elem.config.container,
                    scrolled : _getScrolled(elem.config.container),
                    vector   : [0,0]
                }
            }

            // Update the element stored with our new element.
            sr.store.elements[elem.id] = elem;
        };



        function _record(selector, config, interval) {

            // Save the `reveal()` arguments that triggered this `_record()` call, so we
            // can re-trace our steps when calling the `sync()` method.
            var record = {
                selector : selector,
                config   : config,
                interval : interval
            };
            sr.history.push(record);
        }



        function _init() {
            if (sr.supported()) {

                // Initial animate call triggers valid reveal animations on first load.
                // Subsequent animate calls are made inside the event handler.
                _animate();

                // Then we loop through all container nodes in the store and bind event
                // listeners to each.
                if (sr.store.containers !== {}) {
                    sr.tools.forOwn(sr.store.containers, function(containerId) {
                        sr.store.containers[containerId].node.addEventListener('scroll', _handler);
                        sr.store.containers[containerId].node.addEventListener('resize', _handler);
                    });
                }

                // Let’s also do a one-time binding of window event listeners.
                if (!sr.initialized) {
                    window.addEventListener('scroll', _handler);
                    window.addEventListener('resize', _handler);
                    sr.initialized = true;
                }
            }
            return sr
        }



        function _handler(evt) {
            _requestAnimationFrame(function() {
                if (evt) {
                    console.log(evt.target.scrollTop);
                    // compare to previous stored container.scrolled
                    // set container.direction
                    // ...
                }
                _animate();
            });
        }



        /**
         * Finds the lowest sequence index of visible non-revealing elements.
         */
        function _prepareSequencer() {

            var
                boundary,
                elem,
                elemId,
                next,
                sequence,
                visible;

            // Loop through all sequenced elements
            sr.tools.forOwn(sr.store.sequences, function(sequenceId){
                sequence = sr.store.sequences[sequenceId];
                for (var i = 0; i < sequence.elemIds.length; i++) {

                    elemId = sequence.elemIds[i]
                    elem = sr.store.elements[elemId];
                    visible = _isElemVisible(elem);

                    if (visible && !elem.revealing) {

                        // Positive intervals are first in, first out sequences (forwards)
                        if (sequence.interval > 0) {
                            next = (next) ? Math.min(next, elem.sequence.index) : elem.sequence.index;
                            console.log('positive: ' + next);
                            boundary = Infinity;
                        }

                        // Negative intervals are first in, last out sequences (backwards)
                        else if (sequence.interval < 0) {
                            next = (next) ? Math.max(next, elem.sequence.index) : elem.sequence.index;
                            console.log('negative: ' + next);
                            boundary = -Infinity;
                        }
                    }
                }
                sequence.index.next = (next) ? next : boundary;
            });
        }



        function _animate() {

            var
                delayed,
                elem;

            _prepareSequencer();

            // Loop through all elements in the store
            sr.tools.forOwn(sr.store.elements, function(elemId) {

                elem = sr.store.elements[elemId];
                delayed = _shouldUseDelay(elem);

                // Let’s see if we should reveal, and if so, whether to use delay.
                if (_shouldReveal(elem)) {
                    if (delayed) {
                        elem.domEl.setAttribute('style',
                            elem.styles.inline
                          + elem.styles.transform.target
                          + elem.styles.transition.delayed
                        );
                    } else {
                        elem.domEl.setAttribute('style',
                            elem.styles.inline
                          + elem.styles.transform.target
                          + elem.styles.transition.instant
                        );
                    }

                    if (elem.sequence) {
                        _sequenceHandler(elem);
                    }

                    // The element is revealing, so let’s queue the `afterReveal` callback, and mark
                    // it as `seen` for future reference.
                    _queueCallback('reveal', elem, delayed);

                    return elem.seen = true
                }

                // If we got this far our element shouldn’t reveal, but should it reset?
                if (_shouldReset(elem)) {
                    elem.domEl.setAttribute('style',
                        elem.styles.inline
                      + elem.styles.transform.initial
                      + elem.styles.transition.instant
                    );
                    _queueCallback('reset', elem);
                }
            });
        }



        function _sequenceHandler(elem) {

            var
                elapsed  = 0,
                sequence = sr.store.sequences[elem.sequence.id];

            // We’re processing a sequenced element, so let's block other elements in this sequence.
            sequence.blocked = true;

            // If a sequence timer is already running, capture the elapsed time and clear it.
            if (elem.sequence.timer) {
                elapsed = Math.abs(elem.sequence.timer.started - new Date());
                window.clearTimeout(elem.sequence.timer);
            }

            // Start a new timer.
            elem.sequence.timer = { started: new Date() };
            elem.sequence.timer.clock = window.setTimeout(function() {

                // Sequence interval has passed, so unblock the sequence and re-run the handler.
                sequence.blocked = false;
                elem.sequence.timer = null;
                _handler();

            }, Math.abs(sequence.interval) - elapsed);
        }



        function _queueCallback(type, elem, delayed) {

            var
                elapsed  = 0,
                duration = 0,
                callback = 'after';

            // Check which callback we’re working with.
            switch (type) {

                case 'reveal':
                    duration = elem.config.duration;
                    if (delayed) {
                        duration += elem.config.delay;
                    }
                    callback += 'Reveal';
                    break

                case 'reset':
                    duration = elem.config.duration;
                    callback += 'Reset';
                    break
            }

            // If a timer is already running, capture the elapsed time and clear it.
            if (elem.timer) {
                elapsed = Math.abs(elem.timer.started - new Date());
                window.clearTimeout(elem.timer.clock);
            }

            // Start a new timer.
            elem.timer = { started: new Date() };
            elem.timer.clock = window.setTimeout(function() {

                // The timer completed, so let’s fire the callback and null the timer.
                elem.config[callback](elem.domEl);
                elem.timer = null;

            }, duration - elapsed);

            // Update element status for future animate loops.
            return type === 'reveal'
                ? elem.revealing = true
                : elem.revealing = false
        }



        function _shouldReveal(elem) {
            if (elem.sequence) {
                var sequence = sr.store.sequences[elem.sequence.id];

                // There’s certainly no need to reveal if we’re a part of a sequence and
                // the element is not the lowest index, or if the sequence is currently working.
                if (sequence.index.next !== elem.sequence.index || sequence.blocked ) {
                    return false
                }
            }
            return _isElemVisible(elem)
                && !elem.revealing
                && !elem.disabled
        }



        function _shouldUseDelay(elem) {
            var config = elem.config.useDelay;
            return config === 'always'
                || (config === 'onload' && !sr.initialized)
                || (config === 'once' && !elem.seen)
        }



        function _shouldReset(elem) {
            var visible = _isElemVisible(elem);
            return !visible
                && elem.config.reset
                && elem.revealing
                && !elem.disabled
        }



        function _getContainer(container) {
            return {
                width  : container.clientWidth,
                height : container.clientHeight
            }
        }



        function _getScrolled(container) {

            // Return the container scroll values, plus the its offset.
            if (container) {
                var offset = _getOffset(container);
                return {
                    x : container.scrollLeft + offset.left,
                    y : container.scrollTop  + offset.top
                }
            }

            // Otherwise, default to the window object’s scroll values.
            else {
                return {
                    x : window.pageXOffset,
                    y : window.pageYOffset
                }
            }
        }



        function _getOffset(domEl) {

            var
                offsetTop    = 0,
                offsetLeft   = 0,

                // Grab the element’s dimensions.
                offsetHeight = domEl.offsetHeight,
                offsetWidth  = domEl.offsetWidth;

            // Now calculate the distance between the element and its parent, then
            // again for the parent to its parent, and again etc... until we have the
            // total distance of the element to the document’s top and left origin.
            do {
                if (!isNaN(domEl.offsetTop)) {
                    offsetTop += domEl.offsetTop;
                }
                if (!isNaN(domEl.offsetLeft)) {
                    offsetLeft += domEl.offsetLeft;
                }
            } while (domEl = domEl.offsetParent);

            return {
                top    : offsetTop,
                left   : offsetLeft,
                height : offsetHeight,
                width  : offsetWidth
            }
        }



        function _isElemVisible(elem) {

            var
                offset     = _getOffset(elem.domEl),
                container  = _getContainer(elem.config.container),
                scrolled   = _getScrolled(elem.config.container),
                vF         = elem.config.viewFactor,

                // Define the element geometry.
                elemHeight = offset.height,
                elemWidth  = offset.width,
                elemTop    = offset.top,
                elemLeft   = offset.left,
                elemBottom = elemTop  + elemHeight,
                elemRight  = elemLeft + elemWidth;

            return confirmBounds() || isPositionFixed()

            function confirmBounds() {

                var
                    // Define the element’s functional boundaries using its view factor.
                    top        = elemTop    + elemHeight * vF,
                    left       = elemLeft   + elemWidth  * vF,
                    bottom     = elemBottom - elemHeight * vF,
                    right      = elemRight  - elemWidth  * vF,

                    // Define the container functional boundaries using its view offset.
                    viewTop    = scrolled.y + elem.config.viewOffset.top,
                    viewLeft   = scrolled.x + elem.config.viewOffset.left,
                    viewBottom = scrolled.y - elem.config.viewOffset.bottom + container.height,
                    viewRight  = scrolled.x - elem.config.viewOffset.right  + container.width;

                return top    < viewBottom
                    && bottom > viewTop
                    && left   > viewLeft
                    && right  < viewRight
            }

            function isPositionFixed() {
                return (window.getComputedStyle(elem.domEl).position === 'fixed')
            }
        }



        return ScrollReveal

    })();


    /**
     * helper.tools.js
     * ---------------
     * Simple deep object extend, and a few other agnostic helper methods.
     * gist: https://gist.github.com/jlmakes/9f104e3f1b4d86334987
     */

    Tools = (function() {

        Tools.prototype.isObject = function(object) {
            return object !== null && typeof object === 'object' && object.constructor == Object
        };

        Tools.prototype.isNode = function(object) {
            return typeof Node === 'object'
                ? object instanceof Node
                : object && typeof object === 'object'
                         && typeof object.nodeType === 'number'
                         && typeof object.nodeName === 'string'
        };

        Tools.prototype.forOwn = function(object, callback) {
            if (!this.isObject(object)) {
                throw new TypeError('Expected "object", but received "' + typeof object + '".');
            } else {
                for (var property in object) {
                    if (object.hasOwnProperty(property)) {
                        callback(property);
                    }
                }
            }
        };

        Tools.prototype.extend = function(target, source) {
            this.forOwn(source, function(property) {
                if (this.isObject(source[property])) {
                    if (!target[property] || !this.isObject(target[property])) {
                        target[property] = {};
                    }
                    this.extend(target[property], source[property]);
                } else {
                    target[property] = source[property];
                }
            }.bind(this));
            return target
        };

        Tools.prototype.extendClone = function(target, source) {
            return this.extend(this.extend({}, target), source)
        };

        Tools.prototype.isMobile = function() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        };

        function Tools() {};
        return Tools

    })();



    _requestAnimationFrame = window.requestAnimationFrame       ||
                             window.webkitRequestAnimationFrame ||
                             window.mozRequestAnimationFrame;



}).call(this);
