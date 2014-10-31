/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 1.0.3
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/*jslint browser:true, node:true*/
/*global define, Event, Node*/


/**
 * Instantiate fast-clicking listeners on the specified layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 * @param {Object} options The options to override the defaults
 */
function FastClick(layer, options) {
	'use strict';
	var oldOnClick;

	options = options || {};

	/**
	 * Whether a click is currently being tracked.
	 *
	 * @type boolean
	 */
	this.trackingClick = false;


	/**
	 * Timestamp for when click tracking started.
	 *
	 * @type number
	 */
	this.trackingClickStart = 0;


	/**
	 * The element being tracked for a click.
	 *
	 * @type EventTarget
	 */
	this.targetElement = null;


	/**
	 * X-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartX = 0;


	/**
	 * Y-coordinate of touch start event.
	 *
	 * @type number
	 */
	this.touchStartY = 0;


	/**
	 * ID of the last touch, retrieved from Touch.identifier.
	 *
	 * @type number
	 */
	this.lastTouchIdentifier = 0;


	/**
	 * Touchmove boundary, beyond which a click will be cancelled.
	 *
	 * @type number
	 */
	this.touchBoundary = options.touchBoundary || 10;


	/**
	 * The FastClick layer.
	 *
	 * @type Element
	 */
	this.layer = layer;

	/**
	 * The minimum time between tap(touchstart and touchend) events
	 *
	 * @type number
	 */
	this.tapDelay = options.tapDelay || 200;

	if (FastClick.notNeeded(layer)) {
		return;
	}

	// Some old versions of Android don't have Function.prototype.bind
	function bind(method, context) {
		return function() { return method.apply(context, arguments); };
	}


	var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
	var context = this;
	for (var i = 0, l = methods.length; i < l; i++) {
		context[methods[i]] = bind(context[methods[i]], context);
	}

	// Set up event handlers as required
	if (deviceIsAndroid) {
		layer.addEventListener('mouseover', this.onMouse, true);
		layer.addEventListener('mousedown', this.onMouse, true);
		layer.addEventListener('mouseup', this.onMouse, true);
	}

	layer.addEventListener('click', this.onClick, true);
	layer.addEventListener('touchstart', this.onTouchStart, false);
	layer.addEventListener('touchmove', this.onTouchMove, false);
	layer.addEventListener('touchend', this.onTouchEnd, false);
	layer.addEventListener('touchcancel', this.onTouchCancel, false);

	// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
	// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
	// layer when they are cancelled.
	if (!Event.prototype.stopImmediatePropagation) {
		layer.removeEventListener = function(type, callback, capture) {
			var rmv = Node.prototype.removeEventListener;
			if (type === 'click') {
				rmv.call(layer, type, callback.hijacked || callback, capture);
			} else {
				rmv.call(layer, type, callback, capture);
			}
		};

		layer.addEventListener = function(type, callback, capture) {
			var adv = Node.prototype.addEventListener;
			if (type === 'click') {
				adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
					if (!event.propagationStopped) {
						callback(event);
					}
				}), capture);
			} else {
				adv.call(layer, type, callback, capture);
			}
		};
	}

	// If a handler is already declared in the element's onclick attribute, it will be fired before
	// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
	// adding it as listener.
	if (typeof layer.onclick === 'function') {

		// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
		// - the old one won't work if passed to addEventListener directly.
		oldOnClick = layer.onclick;
		layer.addEventListener('click', function(event) {
			oldOnClick(event);
		}, false);
		layer.onclick = null;
	}
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);

/**
 * BlackBerry requires exceptions.
 *
 * @type boolean
 */
var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {

	// Don't send a synthetic click to disabled inputs (issue #62)
	case 'button':
	case 'select':
	case 'textarea':
		if (target.disabled) {
			return true;
		}

		break;
	case 'input':

		// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
		if ((deviceIsIOS && target.type === 'file') || target.disabled) {
			return true;
		}

		break;
	case 'label':
	case 'video':
		return true;
	}

	return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
	'use strict';
	switch (target.nodeName.toLowerCase()) {
	case 'textarea':
		return true;
	case 'select':
		return !deviceIsAndroid;
	case 'input':
		switch (target.type) {
		case 'button':
		case 'checkbox':
		case 'file':
		case 'image':
		case 'radio':
		case 'submit':
			return false;
		}

		// No point in attempting to focus disabled inputs
		return !target.disabled && !target.readOnly;
	default:
		return (/\bneedsfocus\b/).test(target.className);
	}
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
	'use strict';
	var clickEvent, touch;

	// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
	if (document.activeElement && document.activeElement !== targetElement) {
		document.activeElement.blur();
	}

	touch = event.changedTouches[0];

	// Synthesise a click event, with an extra attribute so it can be tracked
	clickEvent = document.createEvent('MouseEvents');
	clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
	clickEvent.forwardedTouchEvent = true;
	targetElement.dispatchEvent(clickEvent);
};

FastClick.prototype.determineEventType = function(targetElement) {
	'use strict';

	//Issue #159: Android Chrome Select Box does not open with a synthetic click event
	if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
		return 'mousedown';
	}

	return 'click';
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
	'use strict';
	var length;

	// Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
	if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
		length = targetElement.value.length;
		targetElement.setSelectionRange(length, length);
	} else {
		targetElement.focus();
	}
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
	'use strict';
	var scrollParent, parentElement;

	scrollParent = targetElement.fastClickScrollParent;

	// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
	// target element was moved to another parent.
	if (!scrollParent || !scrollParent.contains(targetElement)) {
		parentElement = targetElement;
		do {
			if (parentElement.scrollHeight > parentElement.offsetHeight) {
				scrollParent = parentElement;
				targetElement.fastClickScrollParent = parentElement;
				break;
			}

			parentElement = parentElement.parentElement;
		} while (parentElement);
	}

	// Always update the scroll top tracker if possible.
	if (scrollParent) {
		scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
	}
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
	'use strict';

	// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
	if (eventTarget.nodeType === Node.TEXT_NODE) {
		return eventTarget.parentNode;
	}

	return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
	'use strict';
	var targetElement, touch, selection;

	// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
	if (event.targetTouches.length > 1) {
		return true;
	}

	targetElement = this.getTargetElementFromEventTarget(event.target);
	touch = event.targetTouches[0];

	if (deviceIsIOS) {

		// Only trusted events will deselect text on iOS (issue #49)
		selection = window.getSelection();
		if (selection.rangeCount && !selection.isCollapsed) {
			return true;
		}

		if (!deviceIsIOS4) {

			// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
			// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
			// with the same identifier as the touch event that previously triggered the click that triggered the alert.
			// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
			// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
			// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
			// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
			// random integers, it's safe to to continue if the identifier is 0 here.
			if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
				event.preventDefault();
				return false;
			}

			this.lastTouchIdentifier = touch.identifier;

			// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
			// 1) the user does a fling scroll on the scrollable layer
			// 2) the user stops the fling scroll with another tap
			// then the event.target of the last 'touchend' event will be the element that was under the user's finger
			// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
			// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
			this.updateScrollParent(targetElement);
		}
	}

	this.trackingClick = true;
	this.trackingClickStart = event.timeStamp;
	this.targetElement = targetElement;

	this.touchStartX = touch.pageX;
	this.touchStartY = touch.pageY;

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
		event.preventDefault();
	}

	return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
	'use strict';
	var touch = event.changedTouches[0], boundary = this.touchBoundary;

	if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
		return true;
	}

	return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
	'use strict';
	if (!this.trackingClick) {
		return true;
	}

	// If the touch has moved, cancel the click tracking
	if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
		this.trackingClick = false;
		this.targetElement = null;
	}

	return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
	'use strict';

	// Fast path for newer browsers supporting the HTML5 control attribute
	if (labelElement.control !== undefined) {
		return labelElement.control;
	}

	// All browsers under test that support touch events also support the HTML5 htmlFor attribute
	if (labelElement.htmlFor) {
		return document.getElementById(labelElement.htmlFor);
	}

	// If no for attribute exists, attempt to retrieve the first labellable descendant element
	// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
	return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
	'use strict';
	var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

	if (!this.trackingClick) {
		return true;
	}

	// Prevent phantom clicks on fast double-tap (issue #36)
	if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
		this.cancelNextClick = true;
		return true;
	}

	// Reset to prevent wrong click cancel on input (issue #156).
	this.cancelNextClick = false;

	this.lastClickTime = event.timeStamp;

	trackingClickStart = this.trackingClickStart;
	this.trackingClick = false;
	this.trackingClickStart = 0;

	// On some iOS devices, the targetElement supplied with the event is invalid if the layer
	// is performing a transition or scroll, and has to be re-detected manually. Note that
	// for this to function correctly, it must be called *after* the event target is checked!
	// See issue #57; also filed as rdar://13048589 .
	if (deviceIsIOSWithBadTarget) {
		touch = event.changedTouches[0];

		// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
		targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
		targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
	}

	targetTagName = targetElement.tagName.toLowerCase();
	if (targetTagName === 'label') {
		forElement = this.findControl(targetElement);
		if (forElement) {
			this.focus(targetElement);
			if (deviceIsAndroid) {
				return false;
			}

			targetElement = forElement;
		}
	} else if (this.needsFocus(targetElement)) {

		// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
		// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
		if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
			this.targetElement = null;
			return false;
		}

		this.focus(targetElement);
		this.sendClick(targetElement, event);

		// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
		// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
		if (!deviceIsIOS || targetTagName !== 'select') {
			this.targetElement = null;
			event.preventDefault();
		}

		return false;
	}

	if (deviceIsIOS && !deviceIsIOS4) {

		// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
		// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
		scrollParent = targetElement.fastClickScrollParent;
		if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
			return true;
		}
	}

	// Prevent the actual click from going though - unless the target node is marked as requiring
	// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
	if (!this.needsClick(targetElement)) {
		event.preventDefault();
		this.sendClick(targetElement, event);
	}

	return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
	'use strict';
	this.trackingClick = false;
	this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
	'use strict';

	// If a target element was never set (because a touch event was never fired) allow the event
	if (!this.targetElement) {
		return true;
	}

	if (event.forwardedTouchEvent) {
		return true;
	}

	// Programmatically generated events targeting a specific element should be permitted
	if (!event.cancelable) {
		return true;
	}

	// Derive and check the target element to see whether the mouse event needs to be permitted;
	// unless explicitly enabled, prevent non-touch click events from triggering actions,
	// to prevent ghost/doubleclicks.
	if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

		// Prevent any user-added listeners declared on FastClick element from being fired.
		if (event.stopImmediatePropagation) {
			event.stopImmediatePropagation();
		} else {

			// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
			event.propagationStopped = true;
		}

		// Cancel the event
		event.stopPropagation();
		event.preventDefault();

		return false;
	}

	// If the mouse event is permitted, return true for the action to go through.
	return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
	'use strict';
	var permitted;

	// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
	if (this.trackingClick) {
		this.targetElement = null;
		this.trackingClick = false;
		return true;
	}

	// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
	if (event.target.type === 'submit' && event.detail === 0) {
		return true;
	}

	permitted = this.onMouse(event);

	// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
	if (!permitted) {
		this.targetElement = null;
	}

	// If clicks are permitted, return true for the action to go through.
	return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
	'use strict';
	var layer = this.layer;

	if (deviceIsAndroid) {
		layer.removeEventListener('mouseover', this.onMouse, true);
		layer.removeEventListener('mousedown', this.onMouse, true);
		layer.removeEventListener('mouseup', this.onMouse, true);
	}

	layer.removeEventListener('click', this.onClick, true);
	layer.removeEventListener('touchstart', this.onTouchStart, false);
	layer.removeEventListener('touchmove', this.onTouchMove, false);
	layer.removeEventListener('touchend', this.onTouchEnd, false);
	layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
	'use strict';
	var metaViewport;
	var chromeVersion;
	var blackberryVersion;

	// Devices that don't support touch don't need FastClick
	if (typeof window.ontouchstart === 'undefined') {
		return true;
	}

	// Chrome version - zero for other browsers
	chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

	if (chromeVersion) {

		if (deviceIsAndroid) {
			metaViewport = document.querySelector('meta[name=viewport]');

			if (metaViewport) {
				// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
				if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
					return true;
				}
				// Chrome 32 and above with width=device-width or less don't need FastClick
				if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
					return true;
				}
			}

		// Chrome desktop doesn't need FastClick (issue #15)
		} else {
			return true;
		}
	}

	if (deviceIsBlackBerry10) {
		blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

		// BlackBerry 10.3+ does not require Fastclick library.
		// https://github.com/ftlabs/fastclick/issues/251
		if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
			metaViewport = document.querySelector('meta[name=viewport]');

			if (metaViewport) {
				// user-scalable=no eliminates click delay.
				if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
					return true;
				}
				// width=device-width (or less than device-width) eliminates click delay.
				if (document.documentElement.scrollWidth <= window.outerWidth) {
					return true;
				}
			}
		}
	}

	// IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
	if (layer.style.msTouchAction === 'none') {
		return true;
	}

	return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 * @param {Object} options The options to override the defaults
 */
FastClick.attach = function(layer, options) {
	'use strict';
	return new FastClick(layer, options);
};


if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {

	// AMD. Register as an anonymous module.
	define(function() {
		'use strict';
		return FastClick;
	});
} else if (typeof module !== 'undefined' && module.exports) {
	module.exports = FastClick.attach;
	module.exports.FastClick = FastClick;
} else {
	window.FastClick = FastClick;
}

/**
 * State-based routing for AngularJS
 * @version v0.2.11
 * @link http://angular-ui.github.com/
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
"undefined"!=typeof module&&"undefined"!=typeof exports&&module.exports===exports&&(module.exports="ui.router"),function(a,b,c){"use strict";function d(a,b){return J(new(J(function(){},{prototype:a})),b)}function e(a){return I(arguments,function(b){b!==a&&I(b,function(b,c){a.hasOwnProperty(c)||(a[c]=b)})}),a}function f(a,b){var c=[];for(var d in a.path){if(a.path[d]!==b.path[d])break;c.push(a.path[d])}return c}function g(a){if(Object.keys)return Object.keys(a);var c=[];return b.forEach(a,function(a,b){c.push(b)}),c}function h(a,b){if(Array.prototype.indexOf)return a.indexOf(b,Number(arguments[2])||0);var c=a.length>>>0,d=Number(arguments[2])||0;for(d=0>d?Math.ceil(d):Math.floor(d),0>d&&(d+=c);c>d;d++)if(d in a&&a[d]===b)return d;return-1}function i(a,b,c,d){var e,i=f(c,d),j={},k=[];for(var l in i)if(i[l].params&&(e=g(i[l].params),e.length))for(var m in e)h(k,e[m])>=0||(k.push(e[m]),j[e[m]]=a[e[m]]);return J({},j,b)}function j(a,b,c){if(!c){c=[];for(var d in a)c.push(d)}for(var e=0;e<c.length;e++){var f=c[e];if(a[f]!=b[f])return!1}return!0}function k(a,b){var c={};return I(a,function(a){c[a]=b[a]}),c}function l(a,b){var d=1,f=2,g={},h=[],i=g,j=J(a.when(g),{$$promises:g,$$values:g});this.study=function(g){function k(a,c){if(o[c]!==f){if(n.push(c),o[c]===d)throw n.splice(0,n.indexOf(c)),new Error("Cyclic dependency: "+n.join(" -> "));if(o[c]=d,F(a))m.push(c,[function(){return b.get(a)}],h);else{var e=b.annotate(a);I(e,function(a){a!==c&&g.hasOwnProperty(a)&&k(g[a],a)}),m.push(c,a,e)}n.pop(),o[c]=f}}function l(a){return G(a)&&a.then&&a.$$promises}if(!G(g))throw new Error("'invocables' must be an object");var m=[],n=[],o={};return I(g,k),g=n=o=null,function(d,f,g){function h(){--s||(t||e(r,f.$$values),p.$$values=r,p.$$promises=!0,delete p.$$inheritedValues,o.resolve(r))}function k(a){p.$$failure=a,o.reject(a)}function n(c,e,f){function i(a){l.reject(a),k(a)}function j(){if(!D(p.$$failure))try{l.resolve(b.invoke(e,g,r)),l.promise.then(function(a){r[c]=a,h()},i)}catch(a){i(a)}}var l=a.defer(),m=0;I(f,function(a){q.hasOwnProperty(a)&&!d.hasOwnProperty(a)&&(m++,q[a].then(function(b){r[a]=b,--m||j()},i))}),m||j(),q[c]=l.promise}if(l(d)&&g===c&&(g=f,f=d,d=null),d){if(!G(d))throw new Error("'locals' must be an object")}else d=i;if(f){if(!l(f))throw new Error("'parent' must be a promise returned by $resolve.resolve()")}else f=j;var o=a.defer(),p=o.promise,q=p.$$promises={},r=J({},d),s=1+m.length/3,t=!1;if(D(f.$$failure))return k(f.$$failure),p;f.$$inheritedValues&&e(r,f.$$inheritedValues),f.$$values?(t=e(r,f.$$values),p.$$inheritedValues=f.$$values,h()):(f.$$inheritedValues&&(p.$$inheritedValues=f.$$inheritedValues),J(q,f.$$promises),f.then(h,k));for(var u=0,v=m.length;v>u;u+=3)d.hasOwnProperty(m[u])?h():n(m[u],m[u+1],m[u+2]);return p}},this.resolve=function(a,b,c,d){return this.study(a)(b,c,d)}}function m(a,b,c){this.fromConfig=function(a,b,c){return D(a.template)?this.fromString(a.template,b):D(a.templateUrl)?this.fromUrl(a.templateUrl,b):D(a.templateProvider)?this.fromProvider(a.templateProvider,b,c):null},this.fromString=function(a,b){return E(a)?a(b):a},this.fromUrl=function(c,d){return E(c)&&(c=c(d)),null==c?null:a.get(c,{cache:b}).then(function(a){return a.data})},this.fromProvider=function(a,b,d){return c.invoke(a,null,d||{params:b})}}function n(a,d){function e(a){return D(a)?this.type.decode(a):p.$$getDefaultValue(this)}function f(b,c,d){if(!/^\w+(-+\w+)*$/.test(b))throw new Error("Invalid parameter name '"+b+"' in pattern '"+a+"'");if(n[b])throw new Error("Duplicate parameter name '"+b+"' in pattern '"+a+"'");n[b]=J({type:c||new o,$value:e},d)}function g(a,b,c){var d=a.replace(/[\\\[\]\^$*+?.()|{}]/g,"\\$&");if(!b)return d;var e=c?"?":"";return d+e+"("+b+")"+e}function h(a){if(!d.params||!d.params[a])return{};var b=d.params[a];return G(b)?b:{value:b}}d=b.isObject(d)?d:{};var i,j=/([:*])(\w+)|\{(\w+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,k="^",l=0,m=this.segments=[],n=this.params={};this.source=a;for(var q,r,s,t,u;(i=j.exec(a))&&(q=i[2]||i[3],r=i[4]||("*"==i[1]?".*":"[^/]*"),s=a.substring(l,i.index),t=this.$types[r]||new o({pattern:new RegExp(r)}),u=h(q),!(s.indexOf("?")>=0));)k+=g(s,t.$subPattern(),D(u.value)),f(q,t,u),m.push(s),l=j.lastIndex;s=a.substring(l);var v=s.indexOf("?");if(v>=0){var w=this.sourceSearch=s.substring(v);s=s.substring(0,v),this.sourcePath=a.substring(0,l+v),I(w.substring(1).split(/[&?]/),function(a){f(a,null,h(a))})}else this.sourcePath=a,this.sourceSearch="";k+=g(s)+(d.strict===!1?"/?":"")+"$",m.push(s),this.regexp=new RegExp(k,d.caseInsensitive?"i":c),this.prefix=m[0]}function o(a){J(this,a)}function p(){function a(){return{strict:f,caseInsensitive:e}}function b(a){return E(a)||H(a)&&E(a[a.length-1])}function c(){I(h,function(a){if(n.prototype.$types[a.name])throw new Error("A type named '"+a.name+"' has already been defined.");var c=new o(b(a.def)?d.invoke(a.def):a.def);n.prototype.$types[a.name]=c})}var d,e=!1,f=!0,g=!0,h=[],i={"int":{decode:function(a){return parseInt(a,10)},is:function(a){return D(a)?this.decode(a.toString())===a:!1},pattern:/\d+/},bool:{encode:function(a){return a?1:0},decode:function(a){return 0===parseInt(a,10)?!1:!0},is:function(a){return a===!0||a===!1},pattern:/0|1/},string:{pattern:/[^\/]*/},date:{equals:function(a,b){return a.toISOString()===b.toISOString()},decode:function(a){return new Date(a)},encode:function(a){return[a.getFullYear(),("0"+(a.getMonth()+1)).slice(-2),("0"+a.getDate()).slice(-2)].join("-")},pattern:/[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])/}};p.$$getDefaultValue=function(a){if(!b(a.value))return a.value;if(!d)throw new Error("Injectable functions cannot be called at configuration time");return d.invoke(a.value)},this.caseInsensitive=function(a){e=a},this.strictMode=function(a){f=a},this.compile=function(b,c){return new n(b,J(a(),c))},this.isMatcher=function(a){if(!G(a))return!1;var b=!0;return I(n.prototype,function(c,d){E(c)&&(b=b&&D(a[d])&&E(a[d]))}),b},this.type=function(a,b){return D(b)?(h.push({name:a,def:b}),g||c(),this):n.prototype.$types[a]},this.$get=["$injector",function(a){return d=a,g=!1,n.prototype.$types={},c(),I(i,function(a,b){n.prototype.$types[b]||(n.prototype.$types[b]=new o(a))}),this}]}function q(a,b){function d(a){var b=/^\^((?:\\[^a-zA-Z0-9]|[^\\\[\]\^$*+?.()|{}]+)*)/.exec(a.source);return null!=b?b[1].replace(/\\(.)/g,"$1"):""}function e(a,b){return a.replace(/\$(\$|\d{1,2})/,function(a,c){return b["$"===c?0:Number(c)]})}function f(a,b,c){if(!c)return!1;var d=a.invoke(b,b,{$match:c});return D(d)?d:!0}function g(b,c,d,e){function f(a,b,c){return"/"===m?a:b?m.slice(0,-1)+a:c?m.slice(1)+a:a}function g(a){function c(a){var c=a(d,b);return c?(F(c)&&b.replace().url(c),!0):!1}if(!a||!a.defaultPrevented){var e,f=i.length;for(e=0;f>e;e++)if(c(i[e]))return;j&&c(j)}}function l(){return h=h||c.$on("$locationChangeSuccess",g)}var m=e.baseHref(),n=b.url();return k||l(),{sync:function(){g()},listen:function(){return l()},update:function(a){return a?void(n=b.url()):void(b.url()!==n&&(b.url(n),b.replace()))},push:function(a,c,d){b.url(a.format(c||{})),d&&d.replace&&b.replace()},href:function(c,d,e){if(!c.validates(d))return null;var g=a.html5Mode(),h=c.format(d);if(e=e||{},g||null===h||(h="#"+a.hashPrefix()+h),h=f(h,g,e.absolute),!e.absolute||!h)return h;var i=!g&&h?"/":"",j=b.port();return j=80===j||443===j?"":":"+j,[b.protocol(),"://",b.host(),j,i,h].join("")}}}var h,i=[],j=null,k=!1;this.rule=function(a){if(!E(a))throw new Error("'rule' must be a function");return i.push(a),this},this.otherwise=function(a){if(F(a)){var b=a;a=function(){return b}}else if(!E(a))throw new Error("'rule' must be a function");return j=a,this},this.when=function(a,c){var g,h=F(c);if(F(a)&&(a=b.compile(a)),!h&&!E(c)&&!H(c))throw new Error("invalid 'handler' in when()");var i={matcher:function(a,c){return h&&(g=b.compile(c),c=["$match",function(a){return g.format(a)}]),J(function(b,d){return f(b,c,a.exec(d.path(),d.search()))},{prefix:F(a.prefix)?a.prefix:""})},regex:function(a,b){if(a.global||a.sticky)throw new Error("when() RegExp must not be global or sticky");return h&&(g=b,b=["$match",function(a){return e(g,a)}]),J(function(c,d){return f(c,b,a.exec(d.path()))},{prefix:d(a)})}},j={matcher:b.isMatcher(a),regex:a instanceof RegExp};for(var k in j)if(j[k])return this.rule(i[k](a,c));throw new Error("invalid 'what' in when()")},this.deferIntercept=function(a){a===c&&(a=!0),k=a},this.$get=g,g.$inject=["$location","$rootScope","$injector","$browser"]}function r(a,e){function f(a){return 0===a.indexOf(".")||0===a.indexOf("^")}function h(a,b){if(!a)return c;var d=F(a),e=d?a:a.name,g=f(e);if(g){if(!b)throw new Error("No reference point given for path '"+e+"'");for(var h=e.split("."),i=0,j=h.length,k=b;j>i;i++)if(""!==h[i]||0!==i){if("^"!==h[i])break;if(!k.parent)throw new Error("Path '"+e+"' not valid for state '"+b.name+"'");k=k.parent}else k=b;h=h.slice(i).join("."),e=k.name+(k.name&&h?".":"")+h}var l=v[e];return!l||!d&&(d||l!==a&&l.self!==a)?c:l}function l(a,b){w[a]||(w[a]=[]),w[a].push(b)}function m(b){b=d(b,{self:b,resolve:b.resolve||{},toString:function(){return this.name}});var c=b.name;if(!F(c)||c.indexOf("@")>=0)throw new Error("State must have a valid name");if(v.hasOwnProperty(c))throw new Error("State '"+c+"'' is already defined");var e=-1!==c.indexOf(".")?c.substring(0,c.lastIndexOf(".")):F(b.parent)?b.parent:"";if(e&&!v[e])return l(e,b.self);for(var f in y)E(y[f])&&(b[f]=y[f](b,y.$delegates[f]));if(v[c]=b,!b[x]&&b.url&&a.when(b.url,["$match","$stateParams",function(a,c){u.$current.navigable==b&&j(a,c)||u.transitionTo(b,a,{location:!1})}]),w[c])for(var g=0;g<w[c].length;g++)m(w[c][g]);return b}function n(a){return a.indexOf("*")>-1}function o(a){var b=a.split("."),c=u.$current.name.split(".");if("**"===b[0]&&(c=c.slice(c.indexOf(b[1])),c.unshift("**")),"**"===b[b.length-1]&&(c.splice(c.indexOf(b[b.length-2])+1,Number.MAX_VALUE),c.push("**")),b.length!=c.length)return!1;for(var d=0,e=b.length;e>d;d++)"*"===b[d]&&(c[d]="*");return c.join("")===b.join("")}function p(a,b){return F(a)&&!D(b)?y[a]:E(b)&&F(a)?(y[a]&&!y.$delegates[a]&&(y.$delegates[a]=y[a]),y[a]=b,this):this}function q(a,b){return G(a)?b=a:b.name=a,m(b),this}function r(a,e,f,l,m,p,q){function r(b,c,d,f){var g=a.$broadcast("$stateNotFound",b,c,d);if(g.defaultPrevented)return q.update(),A;if(!g.retry)return null;if(f.$retry)return q.update(),B;var h=u.transition=e.when(g.retry);return h.then(function(){return h!==u.transition?y:(b.options.$retry=!0,u.transitionTo(b.to,b.toParams,b.options))},function(){return A}),q.update(),h}function w(a,c,d,h,i){var j=d?c:k(g(a.params),c),n={$stateParams:j};i.resolve=m.resolve(a.resolve,n,i.resolve,a);var o=[i.resolve.then(function(a){i.globals=a})];return h&&o.push(h),I(a.views,function(c,d){var e=c.resolve&&c.resolve!==a.resolve?c.resolve:{};e.$template=[function(){return f.load(d,{view:c,locals:n,params:j})||""}],o.push(m.resolve(e,n,i.resolve,a).then(function(f){if(E(c.controllerProvider)||H(c.controllerProvider)){var g=b.extend({},e,n);f.$$controller=l.invoke(c.controllerProvider,null,g)}else f.$$controller=c.controller;f.$$state=a,f.$$controllerAs=c.controllerAs,i[d]=f}))}),e.all(o).then(function(){return i})}var y=e.reject(new Error("transition superseded")),z=e.reject(new Error("transition prevented")),A=e.reject(new Error("transition aborted")),B=e.reject(new Error("transition failed"));return t.locals={resolve:null,globals:{$stateParams:{}}},u={params:{},current:t.self,$current:t,transition:null},u.reload=function(){u.transitionTo(u.current,p,{reload:!0,inherit:!1,notify:!1})},u.go=function(a,b,c){return u.transitionTo(a,b,J({inherit:!0,relative:u.$current},c))},u.transitionTo=function(b,c,f){c=c||{},f=J({location:!0,inherit:!1,relative:null,notify:!0,reload:!1,$retry:!1},f||{});var m,n=u.$current,o=u.params,v=n.path,A=h(b,f.relative);if(!D(A)){var B={to:b,toParams:c,options:f},C=r(B,n.self,o,f);if(C)return C;if(b=B.to,c=B.toParams,f=B.options,A=h(b,f.relative),!D(A)){if(!f.relative)throw new Error("No such state '"+b+"'");throw new Error("Could not resolve '"+b+"' from state '"+f.relative+"'")}}if(A[x])throw new Error("Cannot transition to abstract state '"+b+"'");f.inherit&&(c=i(p,c||{},u.$current,A)),b=A;var E=b.path,F=0,G=E[F],H=t.locals,I=[];if(!f.reload)for(;G&&G===v[F]&&j(c,o,G.ownParams);)H=I[F]=G.locals,F++,G=E[F];if(s(b,n,H,f))return b.self.reloadOnSearch!==!1&&q.update(),u.transition=null,e.when(u.current);if(c=k(g(b.params),c||{}),f.notify&&a.$broadcast("$stateChangeStart",b.self,c,n.self,o).defaultPrevented)return q.update(),z;for(var L=e.when(H),M=F;M<E.length;M++,G=E[M])H=I[M]=d(H),L=w(G,c,G===b,L,H);var N=u.transition=L.then(function(){var d,e,g;if(u.transition!==N)return y;for(d=v.length-1;d>=F;d--)g=v[d],g.self.onExit&&l.invoke(g.self.onExit,g.self,g.locals.globals),g.locals=null;for(d=F;d<E.length;d++)e=E[d],e.locals=I[d],e.self.onEnter&&l.invoke(e.self.onEnter,e.self,e.locals.globals);return u.transition!==N?y:(u.$current=b,u.current=b.self,u.params=c,K(u.params,p),u.transition=null,f.location&&b.navigable&&q.push(b.navigable.url,b.navigable.locals.globals.$stateParams,{replace:"replace"===f.location}),f.notify&&a.$broadcast("$stateChangeSuccess",b.self,c,n.self,o),q.update(!0),u.current)},function(d){return u.transition!==N?y:(u.transition=null,m=a.$broadcast("$stateChangeError",b.self,c,n.self,o,d),m.defaultPrevented||q.update(),e.reject(d))});return N},u.is=function(a,d){var e=h(a);return D(e)?u.$current!==e?!1:D(d)&&null!==d?b.equals(p,d):!0:c},u.includes=function(a,b){if(F(a)&&n(a)){if(!o(a))return!1;a=u.$current.name}var d=h(a);return D(d)?D(u.$current.includes[d.name])?j(b,p):!1:c},u.href=function(a,b,c){c=J({lossy:!0,inherit:!0,absolute:!1,relative:u.$current},c||{});var d=h(a,c.relative);if(!D(d))return null;c.inherit&&(b=i(p,b||{},u.$current,d));var e=d&&c.lossy?d.navigable:d;return e&&e.url?q.href(e.url,k(g(d.params),b||{}),{absolute:c.absolute}):null},u.get=function(a,b){if(0===arguments.length)return g(v).map(function(a){return v[a].self});var c=h(a,b);return c&&c.self?c.self:null},u}function s(a,b,c,d){return a!==b||(c!==b.locals||d.reload)&&a.self.reloadOnSearch!==!1?void 0:!0}var t,u,v={},w={},x="abstract",y={parent:function(a){if(D(a.parent)&&a.parent)return h(a.parent);var b=/^(.+)\.[^.]+$/.exec(a.name);return b?h(b[1]):t},data:function(a){return a.parent&&a.parent.data&&(a.data=a.self.data=J({},a.parent.data,a.data)),a.data},url:function(a){var b=a.url,c={params:a.params||{}};if(F(b))return"^"==b.charAt(0)?e.compile(b.substring(1),c):(a.parent.navigable||t).url.concat(b,c);if(!b||e.isMatcher(b))return b;throw new Error("Invalid url '"+b+"' in state '"+a+"'")},navigable:function(a){return a.url?a:a.parent?a.parent.navigable:null},params:function(a){return a.params?a.params:a.url?a.url.params:a.parent.params},views:function(a){var b={};return I(D(a.views)?a.views:{"":a},function(c,d){d.indexOf("@")<0&&(d+="@"+a.parent.name),b[d]=c}),b},ownParams:function(a){if(a.params=a.params||{},!a.parent)return g(a.params);var b={};I(a.params,function(a,c){b[c]=!0}),I(a.parent.params,function(c,d){if(!b[d])throw new Error("Missing required parameter '"+d+"' in state '"+a.name+"'");b[d]=!1});var c=[];return I(b,function(a,b){a&&c.push(b)}),c},path:function(a){return a.parent?a.parent.path.concat(a):[]},includes:function(a){var b=a.parent?J({},a.parent.includes):{};return b[a.name]=!0,b},$delegates:{}};t=m({name:"",url:"^",views:null,"abstract":!0}),t.navigable=null,this.decorator=p,this.state=q,this.$get=r,r.$inject=["$rootScope","$q","$view","$injector","$resolve","$stateParams","$urlRouter"]}function s(){function a(a,b){return{load:function(c,d){var e,f={template:null,controller:null,view:null,locals:null,notify:!0,async:!0,params:{}};return d=J(f,d),d.view&&(e=b.fromConfig(d.view,d.params,d.locals)),e&&d.notify&&a.$broadcast("$viewContentLoading",d),e}}}this.$get=a,a.$inject=["$rootScope","$templateFactory"]}function t(){var a=!1;this.useAnchorScroll=function(){a=!0},this.$get=["$anchorScroll","$timeout",function(b,c){return a?b:function(a){c(function(){a[0].scrollIntoView()},0,!1)}}]}function u(a,c,d){function e(){return c.has?function(a){return c.has(a)?c.get(a):null}:function(a){try{return c.get(a)}catch(b){return null}}}function f(a,b){var c=function(){return{enter:function(a,b,c){b.after(a),c()},leave:function(a,b){a.remove(),b()}}};if(i)return{enter:function(a,b,c){i.enter(a,null,b,c)},leave:function(a,b){i.leave(a,b)}};if(h){var d=h&&h(b,a);return{enter:function(a,b,c){d.enter(a,null,b),c()},leave:function(a,b){d.leave(a),b()}}}return c()}var g=e(),h=g("$animator"),i=g("$animate"),j={restrict:"ECA",terminal:!0,priority:400,transclude:"element",compile:function(c,e,g){return function(c,e,h){function i(){k&&(k.remove(),k=null),m&&(m.$destroy(),m=null),l&&(q.leave(l,function(){k=null}),k=l,l=null)}function j(f){var j,k=w(h,e.inheritedData("$uiView")),r=k&&a.$current&&a.$current.locals[k];if(f||r!==n){j=c.$new(),n=a.$current.locals[k];var s=g(j,function(a){q.enter(a,e,function(){(b.isDefined(p)&&!p||c.$eval(p))&&d(a)}),i()});l=s,m=j,m.$emit("$viewContentLoaded"),m.$eval(o)}}var k,l,m,n,o=h.onload||"",p=h.autoscroll,q=f(h,c);c.$on("$stateChangeSuccess",function(){j(!1)}),c.$on("$viewContentLoading",function(){j(!1)}),j(!0)}}};return j}function v(a,b,c){return{restrict:"ECA",priority:-400,compile:function(d){var e=d.html();return function(d,f,g){var h=c.$current,i=w(g,f.inheritedData("$uiView")),j=h&&h.locals[i];if(j){f.data("$uiView",{name:i,state:j.$$state}),f.html(j.$template?j.$template:e);var k=a(f.contents());if(j.$$controller){j.$scope=d;var l=b(j.$$controller,j);j.$$controllerAs&&(d[j.$$controllerAs]=l),f.data("$ngControllerController",l),f.children().data("$ngControllerController",l)}k(d)}}}}}function w(a,b){var c=a.uiView||a.name||"";return c.indexOf("@")>=0?c:c+"@"+(b?b.state.name:"")}function x(a,b){var c,d=a.match(/^\s*({[^}]*})\s*$/);if(d&&(a=b+"("+d[1]+")"),c=a.replace(/\n/g," ").match(/^([^(]+?)\s*(\((.*)\))?$/),!c||4!==c.length)throw new Error("Invalid state ref '"+a+"'");return{state:c[1],paramExpr:c[3]||null}}function y(a){var b=a.parent().inheritedData("$uiView");return b&&b.state&&b.state.name?b.state:void 0}function z(a,c){var d=["location","inherit","reload"];return{restrict:"A",require:["?^uiSrefActive","?^uiSrefActiveEq"],link:function(e,f,g,h){var i=x(g.uiSref,a.current.name),j=null,k=y(f)||a.$current,l="FORM"===f[0].nodeName,m=l?"action":"href",n=!0,o={relative:k,inherit:!0},p=e.$eval(g.uiSrefOpts)||{};b.forEach(d,function(a){a in p&&(o[a]=p[a])});var q=function(b){if(b&&(j=b),n){var c=a.href(i.state,j,o),d=h[1]||h[0];return d&&d.$$setStateInfo(i.state,j),null===c?(n=!1,!1):void(f[0][m]=c)}};i.paramExpr&&(e.$watch(i.paramExpr,function(a){a!==j&&q(a)},!0),j=e.$eval(i.paramExpr)),q(),l||f.bind("click",function(b){var d=b.which||b.button;if(!(d>1||b.ctrlKey||b.metaKey||b.shiftKey||f.attr("target"))){var e=c(function(){a.go(i.state,j,o)});b.preventDefault(),b.preventDefault=function(){c.cancel(e)}}})}}}function A(a,b,c){return{restrict:"A",controller:["$scope","$element","$attrs",function(d,e,f){function g(){h()?e.addClass(m):e.removeClass(m)}function h(){return"undefined"!=typeof f.uiSrefActiveEq?a.$current.self===k&&i():a.includes(k.name)&&i()}function i(){return!l||j(l,b)}var k,l,m;m=c(f.uiSrefActiveEq||f.uiSrefActive||"",!1)(d),this.$$setStateInfo=function(b,c){k=a.get(b,y(e)),l=c,g()},d.$on("$stateChangeSuccess",g)}]}}function B(a){return function(b){return a.is(b)}}function C(a){return function(b){return a.includes(b)}}var D=b.isDefined,E=b.isFunction,F=b.isString,G=b.isObject,H=b.isArray,I=b.forEach,J=b.extend,K=b.copy;b.module("ui.router.util",["ng"]),b.module("ui.router.router",["ui.router.util"]),b.module("ui.router.state",["ui.router.router","ui.router.util"]),b.module("ui.router",["ui.router.state"]),b.module("ui.router.compat",["ui.router"]),l.$inject=["$q","$injector"],b.module("ui.router.util").service("$resolve",l),m.$inject=["$http","$templateCache","$injector"],b.module("ui.router.util").service("$templateFactory",m),n.prototype.concat=function(a,b){return new n(this.sourcePath+a+this.sourceSearch,b)},n.prototype.toString=function(){return this.source},n.prototype.exec=function(a,b){var c=this.regexp.exec(a);if(!c)return null;b=b||{};var d,e,f,g=this.parameters(),h=g.length,i=this.segments.length-1,j={};if(i!==c.length-1)throw new Error("Unbalanced capture group in route '"+this.source+"'");for(d=0;i>d;d++)f=g[d],e=this.params[f],j[f]=e.$value(c[d+1]);for(;h>d;d++)f=g[d],e=this.params[f],j[f]=e.$value(b[f]);return j},n.prototype.parameters=function(a){return D(a)?this.params[a]||null:g(this.params)},n.prototype.validates=function(a){var b,c,d=!0,e=this;return I(a,function(a,f){e.params[f]&&(c=e.params[f],b=!a&&D(c.value),d=d&&(b||c.type.is(a)))}),d},n.prototype.format=function(a){var b=this.segments,c=this.parameters();if(!a)return b.join("").replace("//","/");var d,e,f,g,h,i,j=b.length-1,k=c.length,l=b[0];if(!this.validates(a))return null;for(d=0;j>d;d++)g=c[d],f=a[g],h=this.params[g],(D(f)||"/"!==b[d]&&"/"!==b[d+1])&&(null!=f&&(l+=encodeURIComponent(h.type.encode(f))),l+=b[d+1]);for(;k>d;d++)g=c[d],f=a[g],null!=f&&(i=H(f),i&&(f=f.map(encodeURIComponent).join("&"+g+"=")),l+=(e?"&":"?")+g+"="+(i?f:encodeURIComponent(f)),e=!0);return l},n.prototype.$types={},o.prototype.is=function(){return!0},o.prototype.encode=function(a){return a},o.prototype.decode=function(a){return a},o.prototype.equals=function(a,b){return a==b},o.prototype.$subPattern=function(){var a=this.pattern.toString();return a.substr(1,a.length-2)},o.prototype.pattern=/.*/,b.module("ui.router.util").provider("$urlMatcherFactory",p),q.$inject=["$locationProvider","$urlMatcherFactoryProvider"],b.module("ui.router.router").provider("$urlRouter",q),r.$inject=["$urlRouterProvider","$urlMatcherFactoryProvider"],b.module("ui.router.state").value("$stateParams",{}).provider("$state",r),s.$inject=[],b.module("ui.router.state").provider("$view",s),b.module("ui.router.state").provider("$uiViewScroll",t),u.$inject=["$state","$injector","$uiViewScroll"],v.$inject=["$compile","$controller","$state"],b.module("ui.router.state").directive("uiView",u),b.module("ui.router.state").directive("uiView",v),z.$inject=["$state","$timeout"],A.$inject=["$state","$stateParams","$interpolate"],b.module("ui.router.state").directive("uiSref",z).directive("uiSrefActive",A).directive("uiSrefActiveEq",A),B.$inject=["$state"],C.$inject=["$state"],b.module("ui.router.state").filter("isState",B).filter("includedByState",C)}(window,window.angular);

/**
 * Angular Carousel - Mobile friendly touch carousel for AngularJS
 * @version v0.3.5 - 2014-10-21
 * @link http://revolunet.github.com/angular-carousel
 * @author Julien Bouquillon <julien@revolunet.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
/*global angular */

/*
Angular touch carousel with CSS GPU accel and slide buffering
http://github.com/revolunet/angular-carousel

*/

angular.module('angular-carousel', [
    'ngTouch',
    'angular-carousel.shifty'
]);

angular.module('angular-carousel')

.directive('rnCarouselAutoSlide', ['$timeout', function($timeout) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
        var delay = Math.round(parseFloat(attrs.rnCarouselAutoSlide) * 1000),
            timer = increment = false, slidesCount = element.children().length;

        if(!scope.carouselExposedIndex){
            scope.carouselExposedIndex = 0;
        }
        stopAutoplay = function () {
            if (angular.isDefined(timer)) {
                $timeout.cancel(timer);
            }
            timer = undefined;
        };

        increment = function () {
            if (scope.carouselExposedIndex < slidesCount - 1) {
                scope.carouselExposedIndex =  scope.carouselExposedIndex + 1;
            } else {
                scope.carouselExposedIndex = 0;
            }
        };

        restartTimer = function (){
            stopAutoplay();
            timer = $timeout(increment, delay);
        };

        scope.$watch('carouselIndex', function(){
           restartTimer();
        });

        restartTimer();
        if (attrs.rnCarouselPauseOnHover && attrs.rnCarouselPauseOnHover != 'false'){
            element.on('mouseenter', stopAutoplay);

            element.on('mouseleave', restartTimer);
        }

        scope.$on('$destroy', function(){
            stopAutoplay();
            element.off('mouseenter', stopAutoplay);
            element.off('mouseleave', restartTimer);
        });


    }
  };
}]);
angular.module('angular-carousel')

.directive('rnCarouselIndicators', ['$parse', function($parse) {
  return {
    restrict: 'A',
    scope: {
      slides: '=',
      index: '=rnCarouselIndex'
    },
    templateUrl: 'carousel-indicators.html',
    link: function(scope, iElement, iAttributes) {
      var indexModel = $parse(iAttributes.rnCarouselIndex);
      scope.goToSlide = function(index) {
        indexModel.assign(scope.$parent.$parent, index);
      };
    }
  };
}]);

angular.module('angular-carousel').run(['$templateCache', function($templateCache) {
  $templateCache.put('carousel-indicators.html',
      '<div class="rn-carousel-indicator">\n' +
        '<span ng-repeat="slide in slides" ng-class="{active: $index==index}" ng-click="goToSlide($index)">●</span>' +
      '</div>'
  );
}]);

(function() {
    "use strict";

    angular.module('angular-carousel')

    .service('DeviceCapabilities', function() {

        // detect supported CSS property
        function detectTransformProperty() {
            var transformProperty = 'transform';
            if (typeof document.body.style[transformProperty] !== 'undefined') {
                ['webkit', 'moz', 'o', 'ms'].every(function (prefix) {
                    var e = '-' + prefix + '-transform';
                    if (typeof document.body.style[e] !== 'undefined') {
                        transformProperty = e;
                        return false;
                    }
                    return true;
                });
            } else {
                transformProperty = undefined;
            }
            return transformProperty;
        }

        //Detect support of translate3d
        function detect3dSupport() {
            var el = document.createElement('p'),
                has3d,
                transforms = {
                    'webkitTransform': '-webkit-transform',
                    'msTransform': '-ms-transform',
                    'transform': 'transform'
                };
            // Add it to the body to get the computed style
            document.body.insertBefore(el, null);
            for (var t in transforms) {
                if (el.style[t] !== undefined) {
                    el.style[t] = 'translate3d(1px,1px,1px)';
                    has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
                }
            }
            document.body.removeChild(el);
            return (has3d !== undefined && has3d.length > 0 && has3d !== "none");
        }

        return {
            has3d: detect3dSupport(),
            transformProperty: detectTransformProperty()
        };

    })

    .service('computeCarouselSlideStyle', ["DeviceCapabilities", function(DeviceCapabilities) {
        // compute transition transform properties for a given slide and global offset
        return function(slideIndex, offset, transitionType) {
            var style = {
                    display: 'inline-block'
                },
                opacity,
                absoluteLeft = (slideIndex * 100) + offset,
                slideTransformValue = DeviceCapabilities.has3d ? 'translate3d(' + absoluteLeft + '%, 0, 0)' : 'translate3d(' + absoluteLeft + '%, 0)',
                distance = ((100 - Math.abs(absoluteLeft)) / 100);

            if (!DeviceCapabilities.transformProperty) {
                // fallback to default slide if transformProperty is not available
                style['margin-left'] = absoluteLeft + '%';
            } else {
                if (transitionType == 'fadeAndSlide') {
                    style[DeviceCapabilities.transformProperty] = slideTransformValue;
                    opacity = 0;
                    if (Math.abs(absoluteLeft) < 100) {
                        opacity = 0.3 + distance * 0.7;
                    }
                    style.opacity = opacity;
                } else if (transitionType == 'hexagon') {
                    var transformFrom = 100,
                        degrees = 0,
                        maxDegrees = 60 * (distance - 1);

                    transformFrom = offset < (slideIndex * -100) ? 100 : 0;
                    degrees = offset < (slideIndex * -100) ? maxDegrees : -maxDegrees;
                    style[DeviceCapabilities.transformProperty] = slideTransformValue + ' ' + 'rotateY(' + degrees + 'deg)';
                    style['transform-origin'] = transformFrom + '% 50%';
                } else if (transitionType == 'zoom') {
                    style[DeviceCapabilities.transformProperty] = slideTransformValue;
                    var scale = 1;
                    if (Math.abs(absoluteLeft) < 100) {
                        scale = 1 + ((1 - distance) * 2);
                    }
                    style[DeviceCapabilities.transformProperty] += ' scale(' + scale + ')';
                    style['transform-origin'] = '50% 50%';
                    opacity = 0;
                    if (Math.abs(absoluteLeft) < 100) {
                        opacity = 0.3 + distance * 0.7;
                    }
                    style.opacity = opacity;
                } else {
                    style[DeviceCapabilities.transformProperty] = slideTransformValue;
                }
            }
            return style;
        };
    }])

    .service('createStyleString', function() {
        return function(object) {
            var styles = [];
            angular.forEach(object, function(value, key) {
                styles.push(key + ':' + value);
            });
            return styles.join(';');
        };
    })

    .directive('rnCarousel', ['$swipe', '$window', '$document', '$parse', '$compile', '$timeout', '$interval', 'computeCarouselSlideStyle', 'createStyleString', 'Tweenable',
        function($swipe, $window, $document, $parse, $compile, $timeout, $interval, computeCarouselSlideStyle, createStyleString, Tweenable) {
            // internal ids to allow multiple instances
            var carouselId = 0,
                // in absolute pixels, at which distance the slide stick to the edge on release
                rubberTreshold = 3;

            var requestAnimationFrame = $window.requestAnimationFrame || $window.webkitRequestAnimationFrame || $window.mozRequestAnimationFrame;

            return {
                restrict: 'A',
                scope: true,
                compile: function(tElement, tAttributes) {
                    // use the compile phase to customize the DOM
                    var firstChild = tElement[0].querySelector('li'),
                        firstChildAttributes = (firstChild) ? firstChild.attributes : [],
                        isRepeatBased = false,
                        isBuffered = false,
                        repeatItem,
                        repeatCollection;

                    // try to find an ngRepeat expression
                    // at this point, the attributes are not yet normalized so we need to try various syntax
                    ['ng-repeat', 'data-ng-repeat', 'ng:repeat', 'x-ng-repeat'].every(function(attr) {
                        var repeatAttribute = firstChildAttributes[attr];
                        if (angular.isDefined(repeatAttribute)) {
                            // ngRepeat regexp extracted from angular 1.2.7 src
                            var exprMatch = repeatAttribute.value.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?\s*$/),
                                trackProperty = exprMatch[3];

                            repeatItem = exprMatch[1];
                            repeatCollection = exprMatch[2];

                            if (repeatItem) {
                                if (angular.isDefined(tAttributes['rnCarouselBuffered'])) {
                                    // update the current ngRepeat expression and add a slice operator if buffered
                                    isBuffered = true;
                                    repeatAttribute.value = repeatItem + ' in ' + repeatCollection + '|carouselSlice:carouselBufferIndex:carouselBufferSize';
                                    if (trackProperty) {
                                        repeatAttribute.value += ' track by ' + trackProperty;
                                    }
                                }
                                isRepeatBased = true;
                                return false;
                            }
                        }
                        return true;
                    });

                    return function(scope, iElement, iAttributes, containerCtrl) {

                        carouselId++;

                        var defaultOptions = {
                            transitionType: iAttributes.rnCarouselTransition || 'slide',
                            transitionEasing: 'easeTo',
                            transitionDuration: 300,
                            /* do touchend trigger next slide automatically */
                            isSequential: true,
                            autoSlideDuration: 3,
                            bufferSize: 5,
                            /* in container % how much we need to drag to trigger the slide change */
                            moveTreshold: 0.1
                        };

                        // TODO
                        var options = angular.extend({}, defaultOptions);

                        var pressed,
                            startX,
                            isIndexBound = false,
                            offset = 0,
                            destination,
                            swipeMoved = false,
                            //animOnIndexChange = true,
                            currentSlides,
                            elWidth = null,
                            elX = null,
                            animateTransitions = true,
                            intialState = true,
                            animating = false,
                            locked = false;

                        if(iAttributes.rnCarouselControls!==undefined) {
                            // dont use a directive for this
                            var tpl = '<div class="rn-carousel-controls">\n' +
                                '  <span class="rn-carousel-control rn-carousel-control-prev" ng-click="prevSlide()" ng-if="carouselIndex > 0"></span>\n' +
                                '  <span class="rn-carousel-control rn-carousel-control-next" ng-click="nextSlide()" ng-if="carouselIndex < ' + repeatCollection + '.length - 1"></span>\n' +
                                '</div>';
                            iElement.append($compile(angular.element(tpl))(scope));
                        }

                        $swipe.bind(iElement, {
                            start: swipeStart,
                            move: swipeMove,
                            end: swipeEnd,
                            cancel: function(event) {
                                swipeEnd({}, event);
                            }
                        });

                        function getSlidesDOM() {
                            return iElement[0].querySelectorAll('ul[rn-carousel] > li');
                        }

                        function documentMouseUpEvent(event) {
                            // in case we click outside the carousel, trigger a fake swipeEnd
                            swipeMoved = true;
                            swipeEnd({
                                x: event.clientX,
                                y: event.clientY
                            }, event);
                        }

                        function updateSlidesPosition(offset) {
                            // manually apply transformation to carousel childrens
                            // todo : optim : apply only to visible items
                            var x = scope.carouselBufferIndex * 100 + offset;
                            angular.forEach(getSlidesDOM(), function(child, index) {
                                child.style.cssText = createStyleString(computeCarouselSlideStyle(index, x, options.transitionType));
                            });
                        }

                        scope.nextSlide = function(slideOptions) {
                            var index = scope.carouselIndex + 1;
                            if (index > currentSlides.length - 1) {
                                index = 0;
                            }
                            if (!locked) {
                                goToSlide(index, slideOptions);
                            }
                        };

                        scope.prevSlide = function(slideOptions) {
                            var index = scope.carouselIndex - 1;
                            if (index < 0) {
                                index = currentSlides.length - 1;
                            }
                            goToSlide(index, slideOptions);
                        };

                        function goToSlide(index, slideOptions) {
                            // move a to the given slide index
                            if (index === undefined) {
                                index = scope.carouselIndex;
                            }

                            slideOptions = slideOptions || {};
                            if (slideOptions.animate === false || options.transitionType === 'none') {
                                locked = false;
                                offset = index * -100;
                                scope.carouselIndex = index;
                                updateBufferIndex();
                                return;
                            }

                            locked = true;
                            var tweenable = new Tweenable();
                            tweenable.tween({
                                from: {
                                    'x': offset
                                },
                                to: {
                                    'x': index * -100
                                },
                                duration: options.transitionDuration,
                                easing: options.transitionEasing,
                                step: function(state) {
                                    updateSlidesPosition(state.x);
                                },
                                finish: function() {
                                    locked = false;
                                    scope.$apply(function() {
                                        scope.carouselIndex = index;
                                        offset = index * -100;
                                        updateBufferIndex();
                                    });
                                }
                            });
                        }

                        function getContainerWidth() {
                            var rect = iElement[0].getBoundingClientRect();
                            return rect.width ? rect.width : rect.right - rect.left;
                        }

                        function updateContainerWidth() {
                            elWidth = getContainerWidth();
                        }

                        function swipeStart(coords, event) {
                            // console.log('swipeStart', coords, event);
                            $document.bind('mouseup', documentMouseUpEvent);
                            updateContainerWidth();
                            elX = iElement[0].querySelector('li').getBoundingClientRect().left;
                            pressed = true;
                            startX = coords.x;
                            return false;
                        }

                        function swipeMove(coords, event) {
                            //console.log('swipeMove', coords, event);
                            if (locked) {
                                return;
                            }
                            var x, delta;
                            if (pressed) {
                                x = coords.x;
                                delta = startX - x;
                                if (delta > 2 || delta < -2) {
                                    swipeMoved = true;
                                    var moveOffset = offset + (-delta * 100 / elWidth);
                                    updateSlidesPosition(moveOffset);
                                }
                            }
                            return false;
                        }

                        var init = true;
                        scope.carouselIndex = 0;

                        if (!isRepeatBased) {
                            // fake array when no ng-repeat
                            currentSlides = [];
                            angular.forEach(getSlidesDOM(), function(node, index) {
                                currentSlides.push({id: index});
                            });
                        }

                        var autoSlider;
                        if (iAttributes.rnCarouselAutoSlide!==undefined) {
                            var duration = parseInt(iAttributes.rnCarouselAutoSlide, 10) || options.autoSlideDuration;
                            autoSlider = $interval(function() {
                                if (!locked && !pressed) {
                                    scope.nextSlide();
                                }
                            }, duration * 1000);
                        }

                        if (iAttributes.rnCarouselIndex) {
                            var updateParentIndex = function(value) {
                                indexModel.assign(scope.$parent, value);
                            };
                            var indexModel = $parse(iAttributes.rnCarouselIndex);
                            if (angular.isFunction(indexModel.assign)) {
                                /* check if this property is assignable then watch it */
                                scope.$watch('carouselIndex', function(newValue) {
                                    if (!locked) {
                                        updateParentIndex(newValue);
                                    }

                                });
                                scope.$parent.$watch(indexModel, function(newValue, oldValue) {

                                    if (newValue !== undefined && newValue !== null) {
                                        if (currentSlides && newValue >= currentSlides.length) {
                                            newValue = currentSlides.length - 1;
                                            updateParentIndex(newValue);
                                        } else if (currentSlides && newValue < 0) {
                                            newValue = 0;
                                            updateParentIndex(newValue);
                                        }
                                        if (!locked) {
                                            goToSlide(newValue, {
                                                animate: !init
                                            });
                                        }
                                        init = false;
                                    }
                                });
                                isIndexBound = true;
                            } else if (!isNaN(iAttributes.rnCarouselIndex)) {
                                /* if user just set an initial number, set it */
                                goToSlide(parseInt(iAttributes.rnCarouselIndex, 10), {
                                    animate: false
                                });
                            }
                        } else {
                            goToSlide(0, {
                                animate: !init
                            });
                            init = false;
                        }

                        if (iAttributes.rnCarouselLocked) {
                            scope.$watch(iAttributes.rnCarouselLocked, function(newValue, oldValue) {
                                // only bind swipe when it's not switched off
                                if(newValue === true) {
                                    locked = true;
                                } else {
                                    locked = false;
                                }
                            });
                        }

                        if (isRepeatBased) {
                            scope.$watchCollection(repeatCollection, function(newValue, oldValue) {
                                //console.log('repeatCollection', arguments);
                                currentSlides = newValue;
                                goToSlide(scope.carouselIndex);
                            });
                        }

                        function swipeEnd(coords, event, forceAnimation) {
                            //  console.log('swipeEnd', 'scope.carouselIndex', scope.carouselIndex);
                            // Prevent clicks on buttons inside slider to trigger "swipeEnd" event on touchend/mouseup
                            if (event && !swipeMoved) {
                                return;
                            }

                            $document.unbind('mouseup', documentMouseUpEvent);
                            pressed = false;
                            swipeMoved = false;
                            destination = startX - coords.x;
                            if (destination===0) {
                                return;
                            }
                            if (locked) {
                                return;
                            }
                            offset += (-destination * 100 / elWidth);
                            if (options.isSequential) {
                                var minMove = options.moveTreshold * elWidth,
                                    absMove = -destination,
                                    slidesMove = -Math[absMove >= 0 ? 'ceil' : 'floor'](absMove / elWidth),
                                    shouldMove = Math.abs(absMove) > minMove;

                                if (currentSlides && (slidesMove + scope.carouselIndex) >= currentSlides.length) {
                                    slidesMove = currentSlides.length - 1 - scope.carouselIndex;
                                }
                                if ((slidesMove + scope.carouselIndex) < 0) {
                                    slidesMove = -scope.carouselIndex;
                                }
                                var moveOffset = shouldMove ? slidesMove : 0;

                                destination = (scope.carouselIndex + moveOffset);

                                goToSlide(destination);
                            } else {
                                scope.$apply(function() {
                                    scope.carouselIndex = parseInt(-offset / 100, 10);
                                    updateBufferIndex();
                                });

                            }

                        }

                        scope.$on('$destroy', function() {
                            $document.unbind('mouseup', documentMouseUpEvent);
                        });

                        scope.carouselBufferIndex = 0;
                        scope.carouselBufferSize = options.bufferSize;

                        function updateBufferIndex() {
                            // update and cap te buffer index
                            var bufferIndex = 0;
                            var bufferEdgeSize = (scope.carouselBufferSize - 1) / 2;
                            if (isBuffered) {
                                if (scope.carouselIndex <= bufferEdgeSize) {
                                    // first buffer part
                                    bufferIndex = 0;
                                } else if (currentSlides && currentSlides.length < scope.carouselBufferSize) {
                                    // smaller than buffer
                                    bufferIndex = 0;
                                } else if (currentSlides && scope.carouselIndex > currentSlides.length - scope.carouselBufferSize) {
                                    // last buffer part
                                    bufferIndex = currentSlides.length - scope.carouselBufferSize;
                                } else {
                                    // compute buffer start
                                    bufferIndex = scope.carouselIndex - bufferEdgeSize;
                                }

                                scope.carouselBufferIndex = bufferIndex;
                                $timeout(function() {
                                    updateSlidesPosition(offset);
                                }, 0, false);
                            } else {
                                $timeout(function() {
                                    updateSlidesPosition(offset);
                                }, 0, false);
                            }
                        }

                        function onOrientationChange() {
                            updateContainerWidth();
                            goToSlide();
                        }

                        // handle orientation change
                        var winEl = angular.element($window);
                        winEl.bind('orientationchange', onOrientationChange);
                        winEl.bind('resize', onOrientationChange);

                        scope.$on('$destroy', function() {
                            $document.unbind('mouseup', documentMouseUpEvent);
                            winEl.unbind('orientationchange', onOrientationChange);
                            winEl.unbind('resize', onOrientationChange);
                        });
                    };
                }
            };
        }
    ]);
})();



angular.module('angular-carousel.shifty', [])

.factory('Tweenable', function() {

  (function (root, window) {
    /*!
     * Shifty Core
     * By Jeremy Kahn - jeremyckahn@gmail.com
     */

    // UglifyJS define hack.  Used for unit testing.  Contents of this if are
    // compiled away.
    if (typeof SHIFTY_DEBUG_NOW === 'undefined') {
      SHIFTY_DEBUG_NOW = function () {
        return +new Date();
      };
    }

    var Tweenable = (function () {

      'use strict';

      // Aliases that get defined later in this function
      var formula;

      // CONSTANTS
      var DEFAULT_SCHEDULE_FUNCTION;
      var DEFAULT_EASING = 'linear';
      var DEFAULT_DURATION = 500;
      var UPDATE_TIME = 1000 / 60;

      var _now = Date.now
           ? Date.now
           : function () {return +new Date();};

      var now = SHIFTY_DEBUG_NOW
           ? SHIFTY_DEBUG_NOW
           : _now;

      if (typeof window !== 'undefined') {
        // requestAnimationFrame() shim by Paul Irish (modified for Shifty)
        // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
        DEFAULT_SCHEDULE_FUNCTION = window.requestAnimationFrame
           || window.webkitRequestAnimationFrame
           || window.oRequestAnimationFrame
           || window.msRequestAnimationFrame
           || (window.mozCancelRequestAnimationFrame
           && window.mozRequestAnimationFrame)
           || setTimeout;
      } else {
        DEFAULT_SCHEDULE_FUNCTION = setTimeout;
      }

      function noop () {
        // NOOP!
      }

      /*!
       * Handy shortcut for doing a for-in loop. This is not a "normal" each
       * function, it is optimized for Shifty.  The iterator function only receives
       * the property name, not the value.
       * @param {Object} obj
       * @param {Function(string)} fn
       */
      function each (obj, fn) {
        var key;
        for (key in obj) {
          if (Object.hasOwnProperty.call(obj, key)) {
            fn(key);
          }
        }
      }

      /*!
       * Perform a shallow copy of Object properties.
       * @param {Object} targetObject The object to copy into
       * @param {Object} srcObject The object to copy from
       * @return {Object} A reference to the augmented `targetObj` Object
       */
      function shallowCopy (targetObj, srcObj) {
        each(srcObj, function (prop) {
          targetObj[prop] = srcObj[prop];
        });

        return targetObj;
      }

      /*!
       * Copies each property from src onto target, but only if the property to
       * copy to target is undefined.
       * @param {Object} target Missing properties in this Object are filled in
       * @param {Object} src
       */
      function defaults (target, src) {
        each(src, function (prop) {
          if (typeof target[prop] === 'undefined') {
            target[prop] = src[prop];
          }
        });
      }

      /*!
       * Calculates the interpolated tween values of an Object for a given
       * timestamp.
       * @param {Number} forPosition The position to compute the state for.
       * @param {Object} currentState Current state properties.
       * @param {Object} originalState: The original state properties the Object is
       * tweening from.
       * @param {Object} targetState: The destination state properties the Object
       * is tweening to.
       * @param {number} duration: The length of the tween in milliseconds.
       * @param {number} timestamp: The UNIX epoch time at which the tween began.
       * @param {Object} easing: This Object's keys must correspond to the keys in
       * targetState.
       */
      function tweenProps (forPosition, currentState, originalState, targetState,
        duration, timestamp, easing) {
        var normalizedPosition = (forPosition - timestamp) / duration;

        var prop;
        for (prop in currentState) {
          if (currentState.hasOwnProperty(prop)) {
            currentState[prop] = tweenProp(originalState[prop],
              targetState[prop], formula[easing[prop]], normalizedPosition);
          }
        }

        return currentState;
      }

      /*!
       * Tweens a single property.
       * @param {number} start The value that the tween started from.
       * @param {number} end The value that the tween should end at.
       * @param {Function} easingFunc The easing curve to apply to the tween.
       * @param {number} position The normalized position (between 0.0 and 1.0) to
       * calculate the midpoint of 'start' and 'end' against.
       * @return {number} The tweened value.
       */
      function tweenProp (start, end, easingFunc, position) {
        return start + (end - start) * easingFunc(position);
      }

      /*!
       * Applies a filter to Tweenable instance.
       * @param {Tweenable} tweenable The `Tweenable` instance to call the filter
       * upon.
       * @param {String} filterName The name of the filter to apply.
       */
      function applyFilter (tweenable, filterName) {
        var filters = Tweenable.prototype.filter;
        var args = tweenable._filterArgs;

        each(filters, function (name) {
          if (typeof filters[name][filterName] !== 'undefined') {
            filters[name][filterName].apply(tweenable, args);
          }
        });
      }

      var timeoutHandler_endTime;
      var timeoutHandler_currentTime;
      var timeoutHandler_isEnded;
      /*!
       * Handles the update logic for one step of a tween.
       * @param {Tweenable} tweenable
       * @param {number} timestamp
       * @param {number} duration
       * @param {Object} currentState
       * @param {Object} originalState
       * @param {Object} targetState
       * @param {Object} easing
       * @param {Function} step
       * @param {Function(Function,number)}} schedule
       */
      function timeoutHandler (tweenable, timestamp, duration, currentState,
        originalState, targetState, easing, step, schedule) {
        timeoutHandler_endTime = timestamp + duration;
        timeoutHandler_currentTime = Math.min(now(), timeoutHandler_endTime);
        timeoutHandler_isEnded = timeoutHandler_currentTime >= timeoutHandler_endTime;

        if (tweenable.isPlaying() && !timeoutHandler_isEnded) {
          schedule(tweenable._timeoutHandler, UPDATE_TIME);

          applyFilter(tweenable, 'beforeTween');
          tweenProps(timeoutHandler_currentTime, currentState, originalState,
            targetState, duration, timestamp, easing);
          applyFilter(tweenable, 'afterTween');

          step(currentState);
        } else if (timeoutHandler_isEnded) {
          step(targetState);
          tweenable.stop(true);
        }
      }


      /*!
       * Creates a usable easing Object from either a string or another easing
       * Object.  If `easing` is an Object, then this function clones it and fills
       * in the missing properties with "linear".
       * @param {Object} fromTweenParams
       * @param {Object|string} easing
       */
      function composeEasingObject (fromTweenParams, easing) {
        var composedEasing = {};

        if (typeof easing === 'string') {
          each(fromTweenParams, function (prop) {
            composedEasing[prop] = easing;
          });
        } else {
          each(fromTweenParams, function (prop) {
            if (!composedEasing[prop]) {
              composedEasing[prop] = easing[prop] || DEFAULT_EASING;
            }
          });
        }

        return composedEasing;
      }

      /**
       * Tweenable constructor.
       * @param {Object=} opt_initialState The values that the initial tween should start at if a "from" object is not provided to Tweenable#tween.
       * @param {Object=} opt_config See Tweenable.prototype.setConfig()
       * @constructor
       */
      function Tweenable (opt_initialState, opt_config) {
        this._currentState = opt_initialState || {};
        this._configured = false;
        this._scheduleFunction = DEFAULT_SCHEDULE_FUNCTION;

        // To prevent unnecessary calls to setConfig do not set default configuration here.
        // Only set default configuration immediately before tweening if none has been set.
        if (typeof opt_config !== 'undefined') {
          this.setConfig(opt_config);
        }
      }

      /**
       * Configure and start a tween.
       * @param {Object=} opt_config See Tweenable.prototype.setConfig()
       * @return {Tweenable}
       */
      Tweenable.prototype.tween = function (opt_config) {
        if (this._isTweening) {
          return this;
        }

        // Only set default config if no configuration has been set previously and none is provided now.
        if (opt_config !== undefined || !this._configured) {
          this.setConfig(opt_config);
        }

        this._start(this.get());
        return this.resume();
      };

      /**
       * Sets the tween configuration. `config` may have the following options:
       *
       * - __from__ (_Object=_): Starting position.  If omitted, the current state is used.
       * - __to__ (_Object=_): Ending position.
       * - __duration__ (_number=_): How many milliseconds to animate for.
       * - __start__ (_Function(Object)=_): Function to execute when the tween begins.  Receives the state of the tween as the only parameter.
       * - __step__ (_Function(Object)=_): Function to execute on every tick.  Receives the state of the tween as the only parameter.  This function is not called on the final step of the animation, but `finish` is.
       * - __finish__ (_Function(Object)=_): Function to execute upon tween completion.  Receives the state of the tween as the only parameter.
       * - __easing__ (_Object|string=_): Easing curve name(s) to use for the tween.
       * @param {Object} config
       * @return {Tweenable}
       */
      Tweenable.prototype.setConfig = function (config) {
        config = config || {};
        this._configured = true;

        // Init the internal state
        this._pausedAtTime = null;
        this._start = config.start || noop;
        this._step = config.step || noop;
        this._finish = config.finish || noop;
        this._duration = config.duration || DEFAULT_DURATION;
        this._currentState = config.from || this.get();
        this._originalState = this.get();
        this._targetState = config.to || this.get();
        this._timestamp = now();

        // Aliases used below
        var currentState = this._currentState;
        var targetState = this._targetState;

        // Ensure that there is always something to tween to.
        defaults(targetState, currentState);

        this._easing = composeEasingObject(
          currentState, config.easing || DEFAULT_EASING);

        this._filterArgs =
          [currentState, this._originalState, targetState, this._easing];

        applyFilter(this, 'tweenCreated');
        return this;
      };

      /**
       * Gets the current state.
       * @return {Object}
       */
      Tweenable.prototype.get = function () {
        return shallowCopy({}, this._currentState);
      };

      /**
       * Sets the current state.
       * @param {Object} state
       */
      Tweenable.prototype.set = function (state) {
        this._currentState = state;
      };

      /**
       * Pauses a tween.  Paused tweens can be resumed from the point at which they were paused.  This is different than [`stop()`](#stop), as that method causes a tween to start over when it is resumed.
       * @return {Tweenable}
       */
      Tweenable.prototype.pause = function () {
        this._pausedAtTime = now();
        this._isPaused = true;
        return this;
      };

      /**
       * Resumes a paused tween.
       * @return {Tweenable}
       */
      Tweenable.prototype.resume = function () {
        if (this._isPaused) {
          this._timestamp += now() - this._pausedAtTime;
        }

        this._isPaused = false;
        this._isTweening = true;

        var self = this;
        this._timeoutHandler = function () {
          timeoutHandler(self, self._timestamp, self._duration, self._currentState,
            self._originalState, self._targetState, self._easing, self._step,
            self._scheduleFunction);
        };

        this._timeoutHandler();

        return this;
      };

      /**
       * Stops and cancels a tween.
       * @param {boolean=} gotoEnd If false or omitted, the tween just stops at its current state, and the "finish" handler is not invoked.  If true, the tweened object's values are instantly set to the target values, and "finish" is invoked.
       * @return {Tweenable}
       */
      Tweenable.prototype.stop = function (gotoEnd) {
        this._isTweening = false;
        this._isPaused = false;
        this._timeoutHandler = noop;

        if (gotoEnd) {
          shallowCopy(this._currentState, this._targetState);
          applyFilter(this, 'afterTweenEnd');
          this._finish.call(this, this._currentState);
        }

        return this;
      };

      /**
       * Returns whether or not a tween is running.
       * @return {boolean}
       */
      Tweenable.prototype.isPlaying = function () {
        return this._isTweening && !this._isPaused;
      };

      /**
       * Sets a custom schedule function.
       *
       * If a custom function is not set the default one is used [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame) if available, otherwise [`setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout)).
       *
       * @param {Function(Function,number)} scheduleFunction The function to be called to schedule the next frame to be rendered
       */
      Tweenable.prototype.setScheduleFunction = function (scheduleFunction) {
        this._scheduleFunction = scheduleFunction;
      };

      /**
       * `delete`s all "own" properties.  Call this when the `Tweenable` instance is no longer needed to free memory.
       */
      Tweenable.prototype.dispose = function () {
        var prop;
        for (prop in this) {
          if (this.hasOwnProperty(prop)) {
            delete this[prop];
          }
        }
      };

      /*!
       * Filters are used for transforming the properties of a tween at various
       * points in a Tweenable's life cycle.  See the README for more info on this.
       */
      Tweenable.prototype.filter = {};

      /*!
       * This object contains all of the tweens available to Shifty.  It is extendible - simply attach properties to the Tweenable.prototype.formula Object following the same format at linear.
       *
       * `pos` should be a normalized `number` (between 0 and 1).
       */
      Tweenable.prototype.formula = {
        linear: function (pos) {
          return pos;
        }
      };

      formula = Tweenable.prototype.formula;

      shallowCopy(Tweenable, {
        'now': now
        ,'each': each
        ,'tweenProps': tweenProps
        ,'tweenProp': tweenProp
        ,'applyFilter': applyFilter
        ,'shallowCopy': shallowCopy
        ,'defaults': defaults
        ,'composeEasingObject': composeEasingObject
      });

      // `root` is provided in the intro/outro files.

      // A hook used for unit testing.
      if (typeof SHIFTY_DEBUG_NOW === 'function') {
        root.timeoutHandler = timeoutHandler;
      }

      // Bootstrap Tweenable appropriately for the environment.
      if (typeof exports === 'object') {
        // CommonJS
        module.exports = Tweenable;
      } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(function () {return Tweenable;});
      } else if (typeof root.Tweenable === 'undefined') {
        // Browser: Make `Tweenable` globally accessible.
        root.Tweenable = Tweenable;
      }

      return Tweenable;

    } ());
    
    window.Tweenable = Tweenable;
    /*!
     * All equations are adapted from Thomas Fuchs' [Scripty2](https://github.com/madrobby/scripty2/blob/master/src/effects/transitions/penner.js).
     *
     * Based on Easing Equations (c) 2003 [Robert Penner](http://www.robertpenner.com/), all rights reserved. This work is [subject to terms](http://www.robertpenner.com/easing_terms_of_use.html).
     */

    /*!
     *  TERMS OF USE - EASING EQUATIONS
     *  Open source under the BSD License.
     *  Easing Equations (c) 2003 Robert Penner, all rights reserved.
     */

    ;(function () {

      Tweenable.shallowCopy(Tweenable.prototype.formula, {
        easeInQuad: function (pos) {
          return Math.pow(pos, 2);
        },

        easeOutQuad: function (pos) {
          return -(Math.pow((pos - 1), 2) - 1);
        },

        easeInOutQuad: function (pos) {
          if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,2);}
          return -0.5 * ((pos -= 2) * pos - 2);
        },

        easeInCubic: function (pos) {
          return Math.pow(pos, 3);
        },

        easeOutCubic: function (pos) {
          return (Math.pow((pos - 1), 3) + 1);
        },

        easeInOutCubic: function (pos) {
          if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,3);}
          return 0.5 * (Math.pow((pos - 2),3) + 2);
        },

        easeInQuart: function (pos) {
          return Math.pow(pos, 4);
        },

        easeOutQuart: function (pos) {
          return -(Math.pow((pos - 1), 4) - 1);
        },

        easeInOutQuart: function (pos) {
          if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,4);}
          return -0.5 * ((pos -= 2) * Math.pow(pos,3) - 2);
        },

        easeInQuint: function (pos) {
          return Math.pow(pos, 5);
        },

        easeOutQuint: function (pos) {
          return (Math.pow((pos - 1), 5) + 1);
        },

        easeInOutQuint: function (pos) {
          if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,5);}
          return 0.5 * (Math.pow((pos - 2),5) + 2);
        },

        easeInSine: function (pos) {
          return -Math.cos(pos * (Math.PI / 2)) + 1;
        },

        easeOutSine: function (pos) {
          return Math.sin(pos * (Math.PI / 2));
        },

        easeInOutSine: function (pos) {
          return (-0.5 * (Math.cos(Math.PI * pos) - 1));
        },

        easeInExpo: function (pos) {
          return (pos === 0) ? 0 : Math.pow(2, 10 * (pos - 1));
        },

        easeOutExpo: function (pos) {
          return (pos === 1) ? 1 : -Math.pow(2, -10 * pos) + 1;
        },

        easeInOutExpo: function (pos) {
          if (pos === 0) {return 0;}
          if (pos === 1) {return 1;}
          if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(2,10 * (pos - 1));}
          return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
        },

        easeInCirc: function (pos) {
          return -(Math.sqrt(1 - (pos * pos)) - 1);
        },

        easeOutCirc: function (pos) {
          return Math.sqrt(1 - Math.pow((pos - 1), 2));
        },

        easeInOutCirc: function (pos) {
          if ((pos /= 0.5) < 1) {return -0.5 * (Math.sqrt(1 - pos * pos) - 1);}
          return 0.5 * (Math.sqrt(1 - (pos -= 2) * pos) + 1);
        },

        easeOutBounce: function (pos) {
          if ((pos) < (1 / 2.75)) {
            return (7.5625 * pos * pos);
          } else if (pos < (2 / 2.75)) {
            return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
          } else if (pos < (2.5 / 2.75)) {
            return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
          } else {
            return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
          }
        },

        easeInBack: function (pos) {
          var s = 1.70158;
          return (pos) * pos * ((s + 1) * pos - s);
        },

        easeOutBack: function (pos) {
          var s = 1.70158;
          return (pos = pos - 1) * pos * ((s + 1) * pos + s) + 1;
        },

        easeInOutBack: function (pos) {
          var s = 1.70158;
          if ((pos /= 0.5) < 1) {return 0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s));}
          return 0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
        },

        elastic: function (pos) {
          return -1 * Math.pow(4,-8 * pos) * Math.sin((pos * 6 - 1) * (2 * Math.PI) / 2) + 1;
        },

        swingFromTo: function (pos) {
          var s = 1.70158;
          return ((pos /= 0.5) < 1) ? 0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s)) :
              0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
        },

        swingFrom: function (pos) {
          var s = 1.70158;
          return pos * pos * ((s + 1) * pos - s);
        },

        swingTo: function (pos) {
          var s = 1.70158;
          return (pos -= 1) * pos * ((s + 1) * pos + s) + 1;
        },

        bounce: function (pos) {
          if (pos < (1 / 2.75)) {
            return (7.5625 * pos * pos);
          } else if (pos < (2 / 2.75)) {
            return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
          } else if (pos < (2.5 / 2.75)) {
            return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
          } else {
            return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
          }
        },

        bouncePast: function (pos) {
          if (pos < (1 / 2.75)) {
            return (7.5625 * pos * pos);
          } else if (pos < (2 / 2.75)) {
            return 2 - (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
          } else if (pos < (2.5 / 2.75)) {
            return 2 - (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
          } else {
            return 2 - (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
          }
        },

        easeFromTo: function (pos) {
          if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,4);}
          return -0.5 * ((pos -= 2) * Math.pow(pos,3) - 2);
        },

        easeFrom: function (pos) {
          return Math.pow(pos,4);
        },

        easeTo: function (pos) {
          return Math.pow(pos,0.25);
        }
      });

    }());

    /*!
     * The Bezier magic in this file is adapted/copied almost wholesale from
     * [Scripty2](https://github.com/madrobby/scripty2/blob/master/src/effects/transitions/cubic-bezier.js),
     * which was adapted from Apple code (which probably came from
     * [here](http://opensource.apple.com/source/WebCore/WebCore-955.66/platform/graphics/UnitBezier.h)).
     * Special thanks to Apple and Thomas Fuchs for much of this code.
     */

    /*!
     *  Copyright (c) 2006 Apple Computer, Inc. All rights reserved.
     *
     *  Redistribution and use in source and binary forms, with or without
     *  modification, are permitted provided that the following conditions are met:
     *
     *  1. Redistributions of source code must retain the above copyright notice,
     *  this list of conditions and the following disclaimer.
     *
     *  2. Redistributions in binary form must reproduce the above copyright notice,
     *  this list of conditions and the following disclaimer in the documentation
     *  and/or other materials provided with the distribution.
     *
     *  3. Neither the name of the copyright holder(s) nor the names of any
     *  contributors may be used to endorse or promote products derived from
     *  this software without specific prior written permission.
     *
     *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
     *  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
     *  THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
     *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
     *  FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
     *  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
     *  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
     *  ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
     *  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
     *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */
    ;(function () {
      // port of webkit cubic bezier handling by http://www.netzgesta.de/dev/
      function cubicBezierAtTime(t,p1x,p1y,p2x,p2y,duration) {
        var ax = 0,bx = 0,cx = 0,ay = 0,by = 0,cy = 0;
        function sampleCurveX(t) {return ((ax * t + bx) * t + cx) * t;}
        function sampleCurveY(t) {return ((ay * t + by) * t + cy) * t;}
        function sampleCurveDerivativeX(t) {return (3.0 * ax * t + 2.0 * bx) * t + cx;}
        function solveEpsilon(duration) {return 1.0 / (200.0 * duration);}
        function solve(x,epsilon) {return sampleCurveY(solveCurveX(x,epsilon));}
        function fabs(n) {if (n >= 0) {return n;}else {return 0 - n;}}
        function solveCurveX(x,epsilon) {
          var t0,t1,t2,x2,d2,i;
          for (t2 = x, i = 0; i < 8; i++) {x2 = sampleCurveX(t2) - x; if (fabs(x2) < epsilon) {return t2;} d2 = sampleCurveDerivativeX(t2); if (fabs(d2) < 1e-6) {break;} t2 = t2 - x2 / d2;}
          t0 = 0.0; t1 = 1.0; t2 = x; if (t2 < t0) {return t0;} if (t2 > t1) {return t1;}
          while (t0 < t1) {x2 = sampleCurveX(t2); if (fabs(x2 - x) < epsilon) {return t2;} if (x > x2) {t0 = t2;}else {t1 = t2;} t2 = (t1 - t0) * 0.5 + t0;}
          return t2; // Failure.
        }
        cx = 3.0 * p1x; bx = 3.0 * (p2x - p1x) - cx; ax = 1.0 - cx - bx; cy = 3.0 * p1y; by = 3.0 * (p2y - p1y) - cy; ay = 1.0 - cy - by;
        return solve(t, solveEpsilon(duration));
      }
      /*!
       *  getCubicBezierTransition(x1, y1, x2, y2) -> Function
       *
       *  Generates a transition easing function that is compatible
       *  with WebKit's CSS transitions `-webkit-transition-timing-function`
       *  CSS property.
       *
       *  The W3C has more information about
       *  <a href="http://www.w3.org/TR/css3-transitions/#transition-timing-function_tag">
       *  CSS3 transition timing functions</a>.
       *
       *  @param {number} x1
       *  @param {number} y1
       *  @param {number} x2
       *  @param {number} y2
       *  @return {function}
       */
      function getCubicBezierTransition (x1, y1, x2, y2) {
        return function (pos) {
          return cubicBezierAtTime(pos,x1,y1,x2,y2,1);
        };
      }
      // End ported code

      /**
       * Creates a Bezier easing function and attaches it to `Tweenable.prototype.formula`.  This function gives you total control over the easing curve.  Matthew Lein's [Ceaser](http://matthewlein.com/ceaser/) is a useful tool for visualizing the curves you can make with this function.
       *
       * @param {string} name The name of the easing curve.  Overwrites the old easing function on Tweenable.prototype.formula if it exists.
       * @param {number} x1
       * @param {number} y1
       * @param {number} x2
       * @param {number} y2
       * @return {function} The easing function that was attached to Tweenable.prototype.formula.
       */
      Tweenable.setBezierFunction = function (name, x1, y1, x2, y2) {
        var cubicBezierTransition = getCubicBezierTransition(x1, y1, x2, y2);
        cubicBezierTransition.x1 = x1;
        cubicBezierTransition.y1 = y1;
        cubicBezierTransition.x2 = x2;
        cubicBezierTransition.y2 = y2;

        return Tweenable.prototype.formula[name] = cubicBezierTransition;
      };


      /**
       * `delete`s an easing function from `Tweenable.prototype.formula`.  Be careful with this method, as it `delete`s whatever easing formula matches `name` (which means you can delete default Shifty easing functions).
       *
       * @param {string} name The name of the easing function to delete.
       * @return {function}
       */
      Tweenable.unsetBezierFunction = function (name) {
        delete Tweenable.prototype.formula[name];
      };

    })();

    ;(function () {

      function getInterpolatedValues (
        from, current, targetState, position, easing) {
        return Tweenable.tweenProps(
          position, current, from, targetState, 1, 0, easing);
      }

      // Fake a Tweenable and patch some internals.  This approach allows us to
      // skip uneccessary processing and object recreation, cutting down on garbage
      // collection pauses.
      var mockTweenable = new Tweenable();
      mockTweenable._filterArgs = [];

      /**
       * Compute the midpoint of two Objects.  This method effectively calculates a specific frame of animation that [Tweenable#tween](shifty.core.js.html#tween) does many times over the course of a tween.
       *
       * Example:
       *
       * ```
       *  var interpolatedValues = Tweenable.interpolate({
       *    width: '100px',
       *    opacity: 0,
       *    color: '#fff'
       *  }, {
       *    width: '200px',
       *    opacity: 1,
       *    color: '#000'
       *  }, 0.5);
       *
       *  console.log(interpolatedValues);
       *  // {opacity: 0.5, width: "150px", color: "rgb(127,127,127)"}
       * ```
       *
       * @param {Object} from The starting values to tween from.
       * @param {Object} targetState The ending values to tween to.
       * @param {number} position The normalized position value (between 0.0 and 1.0) to interpolate the values between `from` and `to` for.  `from` represents 0 and `to` represents `1`.
       * @param {string|Object} easing The easing curve(s) to calculate the midpoint against.  You can reference any easing function attached to `Tweenable.prototype.formula`.  If omitted, this defaults to "linear".
       * @return {Object}
       */
      Tweenable.interpolate = function (from, targetState, position, easing) {
        var current = Tweenable.shallowCopy({}, from);
        var easingObject = Tweenable.composeEasingObject(
          from, easing || 'linear');

        mockTweenable.set({});

        // Alias and reuse the _filterArgs array instead of recreating it.
        var filterArgs = mockTweenable._filterArgs;
        filterArgs.length = 0;
        filterArgs[0] = current;
        filterArgs[1] = from;
        filterArgs[2] = targetState;
        filterArgs[3] = easingObject;

        // Any defined value transformation must be applied
        Tweenable.applyFilter(mockTweenable, 'tweenCreated');
        Tweenable.applyFilter(mockTweenable, 'beforeTween');

        var interpolatedValues = getInterpolatedValues(
          from, current, targetState, position, easingObject);

        // Transform values back into their original format
        Tweenable.applyFilter(mockTweenable, 'afterTween');

        return interpolatedValues;
      };

    }());

    /**
     * Adds string interpolation support to Shifty.
     *
     * The Token extension allows Shifty to tween numbers inside of strings.  Among other things, this allows you to animate CSS properties.  For example, you can do this:
     *
     * ```
     * var tweenable = new Tweenable();
     * tweenable.tween({
     *   from: { transform: 'translateX(45px)'},
     *   to: { transform: 'translateX(90xp)'}
     * });
     * ```
     *
     * `translateX(45)` will be tweened to `translateX(90)`.  To demonstrate:
     *
     * ```
     * var tweenable = new Tweenable();
     * tweenable.tween({
     *   from: { transform: 'translateX(45px)'},
     *   to: { transform: 'translateX(90px)'},
     *   step: function (state) {
     *     console.log(state.transform);
     *   }
     * });
     * ```
     *
     * The above snippet will log something like this in the console:
     *
     * ```
     * translateX(60.3px)
     * ...
     * translateX(76.05px)
     * ...
     * translateX(90px)
     * ```
     *
     * Another use for this is animating colors:
     *
     * ```
     * var tweenable = new Tweenable();
     * tweenable.tween({
     *   from: { color: 'rgb(0,255,0)'},
     *   to: { color: 'rgb(255,0,255)'},
     *   step: function (state) {
     *     console.log(state.color);
     *   }
     * });
     * ```
     *
     * The above snippet will log something like this:
     *
     * ```
     * rgb(84,170,84)
     * ...
     * rgb(170,84,170)
     * ...
     * rgb(255,0,255)
     * ```
     *
     * This extension also supports hexadecimal colors, in both long (`#ff00ff`) and short (`#f0f`) forms.  Be aware that hexadecimal input values will be converted into the equivalent RGB output values.  This is done to optimize for performance.
     *
     * ```
     * var tweenable = new Tweenable();
     * tweenable.tween({
     *   from: { color: '#0f0'},
     *   to: { color: '#f0f'},
     *   step: function (state) {
     *     console.log(state.color);
     *   }
     * });
     * ```
     *
     * This snippet will generate the same output as the one before it because equivalent values were supplied (just in hexadecimal form rather than RGB):
     *
     * ```
     * rgb(84,170,84)
     * ...
     * rgb(170,84,170)
     * ...
     * rgb(255,0,255)
     * ```
     *
     * ## Easing support
     *
     * Easing works somewhat differently in the Token extension.  This is because some CSS properties have multiple values in them, and you might need to tween each value along its own easing curve.  A basic example:
     *
     * ```
     * var tweenable = new Tweenable();
     * tweenable.tween({
     *   from: { transform: 'translateX(0px) translateY(0px)'},
     *   to: { transform:   'translateX(100px) translateY(100px)'},
     *   easing: { transform: 'easeInQuad' },
     *   step: function (state) {
     *     console.log(state.transform);
     *   }
     * });
     * ```
     *
     * The above snippet create values like this:
     *
     * ```
     * translateX(11.560000000000002px) translateY(11.560000000000002px)
     * ...
     * translateX(46.24000000000001px) translateY(46.24000000000001px)
     * ...
     * translateX(100px) translateY(100px)
     * ```
     *
     * In this case, the values for `translateX` and `translateY` are always the same for each step of the tween, because they have the same start and end points and both use the same easing curve.  We can also tween `translateX` and `translateY` along independent curves:
     *
     * ```
     * var tweenable = new Tweenable();
     * tweenable.tween({
     *   from: { transform: 'translateX(0px) translateY(0px)'},
     *   to: { transform:   'translateX(100px) translateY(100px)'},
     *   easing: { transform: 'easeInQuad bounce' },
     *   step: function (state) {
     *     console.log(state.transform);
     *   }
     * });
     * ```
     *
     * The above snippet create values like this:
     *
     * ```
     * translateX(10.89px) translateY(82.355625px)
     * ...
     * translateX(44.89000000000001px) translateY(86.73062500000002px)
     * ...
     * translateX(100px) translateY(100px)
     * ```
     *
     * `translateX` and `translateY` are not in sync anymore, because `easeInQuad` was specified for `translateX` and `bounce` for `translateY`.  Mixing and matching easing curves can make for some interesting motion in your animations.
     *
     * The order of the space-separated easing curves correspond the token values they apply to.  If there are more token values than easing curves listed, the last easing curve listed is used.
     */
    function token () {
      // Functionality for this extension runs implicitly if it is loaded.
    } /*!*/

    // token function is defined above only so that dox-foundation sees it as
    // documentation and renders it.  It is never used, and is optimized away at
    // build time.

    ;(function (Tweenable) {

      /*!
       * @typedef {{
       *   formatString: string
       *   chunkNames: Array.<string>
       * }}
       */
      var formatManifest;

      // CONSTANTS

      var R_NUMBER_COMPONENT = /(\d|\-|\.)/;
      var R_FORMAT_CHUNKS = /([^\-0-9\.]+)/g;
      var R_UNFORMATTED_VALUES = /[0-9.\-]+/g;
      var R_RGB = new RegExp(
        'rgb\\(' + R_UNFORMATTED_VALUES.source +
        (/,\s*/.source) + R_UNFORMATTED_VALUES.source +
        (/,\s*/.source) + R_UNFORMATTED_VALUES.source + '\\)', 'g');
      var R_RGB_PREFIX = /^.*\(/;
      var R_HEX = /#([0-9]|[a-f]){3,6}/gi;
      var VALUE_PLACEHOLDER = 'VAL';

      // HELPERS

      var getFormatChunksFrom_accumulator = [];
      /*!
       * @param {Array.number} rawValues
       * @param {string} prefix
       *
       * @return {Array.<string>}
       */
      function getFormatChunksFrom (rawValues, prefix) {
        getFormatChunksFrom_accumulator.length = 0;

        var rawValuesLength = rawValues.length;
        var i;

        for (i = 0; i < rawValuesLength; i++) {
          getFormatChunksFrom_accumulator.push('_' + prefix + '_' + i);
        }

        return getFormatChunksFrom_accumulator;
      }

      /*!
       * @param {string} formattedString
       *
       * @return {string}
       */
      function getFormatStringFrom (formattedString) {
        var chunks = formattedString.match(R_FORMAT_CHUNKS);

        if (!chunks) {
          // chunks will be null if there were no tokens to parse in
          // formattedString (for example, if formattedString is '2').  Coerce
          // chunks to be useful here.
          chunks = ['', ''];

          // If there is only one chunk, assume that the string is a number
          // followed by a token...
          // NOTE: This may be an unwise assumption.
        } else if (chunks.length === 1 ||
            // ...or if the string starts with a number component (".", "-", or a
            // digit)...
            formattedString[0].match(R_NUMBER_COMPONENT)) {
          // ...prepend an empty string here to make sure that the formatted number
          // is properly replaced by VALUE_PLACEHOLDER
          chunks.unshift('');
        }

        return chunks.join(VALUE_PLACEHOLDER);
      }

      /*!
       * Convert all hex color values within a string to an rgb string.
       *
       * @param {Object} stateObject
       *
       * @return {Object} The modified obj
       */
      function sanitizeObjectForHexProps (stateObject) {
        Tweenable.each(stateObject, function (prop) {
          var currentProp = stateObject[prop];

          if (typeof currentProp === 'string' && currentProp.match(R_HEX)) {
            stateObject[prop] = sanitizeHexChunksToRGB(currentProp);
          }
        });
      }

      /*!
       * @param {string} str
       *
       * @return {string}
       */
      function  sanitizeHexChunksToRGB (str) {
        return filterStringChunks(R_HEX, str, convertHexToRGB);
      }

      /*!
       * @param {string} hexString
       *
       * @return {string}
       */
      function convertHexToRGB (hexString) {
        var rgbArr = hexToRGBArray(hexString);
        return 'rgb(' + rgbArr[0] + ',' + rgbArr[1] + ',' + rgbArr[2] + ')';
      }

      var hexToRGBArray_returnArray = [];
      /*!
       * Convert a hexadecimal string to an array with three items, one each for
       * the red, blue, and green decimal values.
       *
       * @param {string} hex A hexadecimal string.
       *
       * @returns {Array.<number>} The converted Array of RGB values if `hex` is a
       * valid string, or an Array of three 0's.
       */
      function hexToRGBArray (hex) {

        hex = hex.replace(/#/, '');

        // If the string is a shorthand three digit hex notation, normalize it to
        // the standard six digit notation
        if (hex.length === 3) {
          hex = hex.split('');
          hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }

        hexToRGBArray_returnArray[0] = hexToDec(hex.substr(0, 2));
        hexToRGBArray_returnArray[1] = hexToDec(hex.substr(2, 2));
        hexToRGBArray_returnArray[2] = hexToDec(hex.substr(4, 2));

        return hexToRGBArray_returnArray;
      }

      /*!
       * Convert a base-16 number to base-10.
       *
       * @param {Number|String} hex The value to convert
       *
       * @returns {Number} The base-10 equivalent of `hex`.
       */
      function hexToDec (hex) {
        return parseInt(hex, 16);
      }

      /*!
       * Runs a filter operation on all chunks of a string that match a RegExp
       *
       * @param {RegExp} pattern
       * @param {string} unfilteredString
       * @param {function(string)} filter
       *
       * @return {string}
       */
      function filterStringChunks (pattern, unfilteredString, filter) {
        var pattenMatches = unfilteredString.match(pattern);
        var filteredString = unfilteredString.replace(pattern, VALUE_PLACEHOLDER);

        if (pattenMatches) {
          var pattenMatchesLength = pattenMatches.length;
          var currentChunk;

          for (var i = 0; i < pattenMatchesLength; i++) {
            currentChunk = pattenMatches.shift();
            filteredString = filteredString.replace(
              VALUE_PLACEHOLDER, filter(currentChunk));
          }
        }

        return filteredString;
      }

      /*!
       * Check for floating point values within rgb strings and rounds them.
       *
       * @param {string} formattedString
       *
       * @return {string}
       */
      function sanitizeRGBChunks (formattedString) {
        return filterStringChunks(R_RGB, formattedString, sanitizeRGBChunk);
      }

      /*!
       * @param {string} rgbChunk
       *
       * @return {string}
       */
      function sanitizeRGBChunk (rgbChunk) {
        var numbers = rgbChunk.match(R_UNFORMATTED_VALUES);
        var numbersLength = numbers.length;
        var sanitizedString = rgbChunk.match(R_RGB_PREFIX)[0];

        for (var i = 0; i < numbersLength; i++) {
          sanitizedString += parseInt(numbers[i], 10) + ',';
        }

        sanitizedString = sanitizedString.slice(0, -1) + ')';

        return sanitizedString;
      }

      /*!
       * @param {Object} stateObject
       *
       * @return {Object} An Object of formatManifests that correspond to
       * the string properties of stateObject
       */
      function getFormatManifests (stateObject) {
        var manifestAccumulator = {};

        Tweenable.each(stateObject, function (prop) {
          var currentProp = stateObject[prop];

          if (typeof currentProp === 'string') {
            var rawValues = getValuesFrom(currentProp);

            manifestAccumulator[prop] = {
              'formatString': getFormatStringFrom(currentProp)
              ,'chunkNames': getFormatChunksFrom(rawValues, prop)
            };
          }
        });

        return manifestAccumulator;
      }

      /*!
       * @param {Object} stateObject
       * @param {Object} formatManifests
       */
      function expandFormattedProperties (stateObject, formatManifests) {
        Tweenable.each(formatManifests, function (prop) {
          var currentProp = stateObject[prop];
          var rawValues = getValuesFrom(currentProp);
          var rawValuesLength = rawValues.length;

          for (var i = 0; i < rawValuesLength; i++) {
            stateObject[formatManifests[prop].chunkNames[i]] = +rawValues[i];
          }

          delete stateObject[prop];
        });
      }

      /*!
       * @param {Object} stateObject
       * @param {Object} formatManifests
       */
      function collapseFormattedProperties (stateObject, formatManifests) {
        Tweenable.each(formatManifests, function (prop) {
          var currentProp = stateObject[prop];
          var formatChunks = extractPropertyChunks(
            stateObject, formatManifests[prop].chunkNames);
          var valuesList = getValuesList(
            formatChunks, formatManifests[prop].chunkNames);
          currentProp = getFormattedValues(
            formatManifests[prop].formatString, valuesList);
          stateObject[prop] = sanitizeRGBChunks(currentProp);
        });
      }

      /*!
       * @param {Object} stateObject
       * @param {Array.<string>} chunkNames
       *
       * @return {Object} The extracted value chunks.
       */
      function extractPropertyChunks (stateObject, chunkNames) {
        var extractedValues = {};
        var currentChunkName, chunkNamesLength = chunkNames.length;

        for (var i = 0; i < chunkNamesLength; i++) {
          currentChunkName = chunkNames[i];
          extractedValues[currentChunkName] = stateObject[currentChunkName];
          delete stateObject[currentChunkName];
        }

        return extractedValues;
      }

      var getValuesList_accumulator = [];
      /*!
       * @param {Object} stateObject
       * @param {Array.<string>} chunkNames
       *
       * @return {Array.<number>}
       */
      function getValuesList (stateObject, chunkNames) {
        getValuesList_accumulator.length = 0;
        var chunkNamesLength = chunkNames.length;

        for (var i = 0; i < chunkNamesLength; i++) {
          getValuesList_accumulator.push(stateObject[chunkNames[i]]);
        }

        return getValuesList_accumulator;
      }

      /*!
       * @param {string} formatString
       * @param {Array.<number>} rawValues
       *
       * @return {string}
       */
      function getFormattedValues (formatString, rawValues) {
        var formattedValueString = formatString;
        var rawValuesLength = rawValues.length;

        for (var i = 0; i < rawValuesLength; i++) {
          formattedValueString = formattedValueString.replace(
            VALUE_PLACEHOLDER, +rawValues[i].toFixed(4));
        }

        return formattedValueString;
      }

      /*!
       * Note: It's the duty of the caller to convert the Array elements of the
       * return value into numbers.  This is a performance optimization.
       *
       * @param {string} formattedString
       *
       * @return {Array.<string>|null}
       */
      function getValuesFrom (formattedString) {
        return formattedString.match(R_UNFORMATTED_VALUES);
      }

      /*!
       * @param {Object} easingObject
       * @param {Object} tokenData
       */
      function expandEasingObject (easingObject, tokenData) {
        Tweenable.each(tokenData, function (prop) {
          var currentProp = tokenData[prop];
          var chunkNames = currentProp.chunkNames;
          var chunkLength = chunkNames.length;
          var easingChunks = easingObject[prop].split(' ');
          var lastEasingChunk = easingChunks[easingChunks.length - 1];

          for (var i = 0; i < chunkLength; i++) {
            easingObject[chunkNames[i]] = easingChunks[i] || lastEasingChunk;
          }

          delete easingObject[prop];
        });
      }

      /*!
       * @param {Object} easingObject
       * @param {Object} tokenData
       */
      function collapseEasingObject (easingObject, tokenData) {
        Tweenable.each(tokenData, function (prop) {
          var currentProp = tokenData[prop];
          var chunkNames = currentProp.chunkNames;
          var chunkLength = chunkNames.length;
          var composedEasingString = '';

          for (var i = 0; i < chunkLength; i++) {
            composedEasingString += ' ' + easingObject[chunkNames[i]];
            delete easingObject[chunkNames[i]];
          }

          easingObject[prop] = composedEasingString.substr(1);
        });
      }

      Tweenable.prototype.filter.token = {
        'tweenCreated': function (currentState, fromState, toState, easingObject) {
          sanitizeObjectForHexProps(currentState);
          sanitizeObjectForHexProps(fromState);
          sanitizeObjectForHexProps(toState);
          this._tokenData = getFormatManifests(currentState);
        },

        'beforeTween': function (currentState, fromState, toState, easingObject) {
          expandEasingObject(easingObject, this._tokenData);
          expandFormattedProperties(currentState, this._tokenData);
          expandFormattedProperties(fromState, this._tokenData);
          expandFormattedProperties(toState, this._tokenData);
        },

        'afterTween': function (currentState, fromState, toState, easingObject) {
          collapseFormattedProperties(currentState, this._tokenData);
          collapseFormattedProperties(fromState, this._tokenData);
          collapseFormattedProperties(toState, this._tokenData);
          collapseEasingObject(easingObject, this._tokenData);
        }
      };

    } (Tweenable));

  }(this, window));

  return window.Tweenable;
});

(function() {
    "use strict";

    angular.module('angular-carousel')

    .filter('carouselSlice', function() {
        return function(collection, start, size) {
            if (angular.isArray(collection)) {
                return collection.slice(start, start + size);
            } else if (angular.isObject(collection)) {
                // dont try to slice collections :)
                return collection;
            }
        };
    });

})();

/**
 * @license AngularJS v1.3.0
 * (c) 2010-2014 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {'use strict';

/**
 * @ngdoc module
 * @name ngTouch
 * @description
 *
 * # ngTouch
 *
 * The `ngTouch` module provides touch events and other helpers for touch-enabled devices.
 * The implementation is based on jQuery Mobile touch event handling
 * ([jquerymobile.com](http://jquerymobile.com/)).
 *
 *
 * See {@link ngTouch.$swipe `$swipe`} for usage.
 *
 * <div doc-module-components="ngTouch"></div>
 *
 */

// define ngTouch module
/* global -ngTouch */
var ngTouch = angular.module('ngTouch', []);

/* global ngTouch: false */

    /**
     * @ngdoc service
     * @name $swipe
     *
     * @description
     * The `$swipe` service is a service that abstracts the messier details of hold-and-drag swipe
     * behavior, to make implementing swipe-related directives more convenient.
     *
     * Requires the {@link ngTouch `ngTouch`} module to be installed.
     *
     * `$swipe` is used by the `ngSwipeLeft` and `ngSwipeRight` directives in `ngTouch`, and by
     * `ngCarousel` in a separate component.
     *
     * # Usage
     * The `$swipe` service is an object with a single method: `bind`. `bind` takes an element
     * which is to be watched for swipes, and an object with four handler functions. See the
     * documentation for `bind` below.
     */

ngTouch.factory('$swipe', [function() {
  // The total distance in any direction before we make the call on swipe vs. scroll.
  var MOVE_BUFFER_RADIUS = 10;

  var POINTER_EVENTS = {
    'mouse': {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup'
    },
    'touch': {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend',
      cancel: 'touchcancel'
    }
  };

  function getCoordinates(event) {
    var touches = event.touches && event.touches.length ? event.touches : [event];
    var e = (event.changedTouches && event.changedTouches[0]) ||
        (event.originalEvent && event.originalEvent.changedTouches &&
            event.originalEvent.changedTouches[0]) ||
        touches[0].originalEvent || touches[0];

    return {
      x: e.clientX,
      y: e.clientY
    };
  }

  function getEvents(pointerTypes, eventType) {
    var res = [];
    angular.forEach(pointerTypes, function(pointerType) {
      var eventName = POINTER_EVENTS[pointerType][eventType];
      if (eventName) {
        res.push(eventName);
      }
    });
    return res.join(' ');
  }

  return {
    /**
     * @ngdoc method
     * @name $swipe#bind
     *
     * @description
     * The main method of `$swipe`. It takes an element to be watched for swipe motions, and an
     * object containing event handlers.
     * The pointer types that should be used can be specified via the optional
     * third argument, which is an array of strings `'mouse'` and `'touch'`. By default,
     * `$swipe` will listen for `mouse` and `touch` events.
     *
     * The four events are `start`, `move`, `end`, and `cancel`. `start`, `move`, and `end`
     * receive as a parameter a coordinates object of the form `{ x: 150, y: 310 }`.
     *
     * `start` is called on either `mousedown` or `touchstart`. After this event, `$swipe` is
     * watching for `touchmove` or `mousemove` events. These events are ignored until the total
     * distance moved in either dimension exceeds a small threshold.
     *
     * Once this threshold is exceeded, either the horizontal or vertical delta is greater.
     * - If the horizontal distance is greater, this is a swipe and `move` and `end` events follow.
     * - If the vertical distance is greater, this is a scroll, and we let the browser take over.
     *   A `cancel` event is sent.
     *
     * `move` is called on `mousemove` and `touchmove` after the above logic has determined that
     * a swipe is in progress.
     *
     * `end` is called when a swipe is successfully completed with a `touchend` or `mouseup`.
     *
     * `cancel` is called either on a `touchcancel` from the browser, or when we begin scrolling
     * as described above.
     *
     */
    bind: function(element, eventHandlers, pointerTypes) {
      // Absolute total movement, used to control swipe vs. scroll.
      var totalX, totalY;
      // Coordinates of the start position.
      var startCoords;
      // Last event's position.
      var lastPos;
      // Whether a swipe is active.
      var active = false;

      pointerTypes = pointerTypes || ['mouse', 'touch'];
      element.on(getEvents(pointerTypes, 'start'), function(event) {
        startCoords = getCoordinates(event);
        active = true;
        totalX = 0;
        totalY = 0;
        lastPos = startCoords;
        eventHandlers['start'] && eventHandlers['start'](startCoords, event);
      });
      var events = getEvents(pointerTypes, 'cancel');
      if (events) {
        element.on(events, function(event) {
          active = false;
          eventHandlers['cancel'] && eventHandlers['cancel'](event);
        });
      }

      element.on(getEvents(pointerTypes, 'move'), function(event) {
        if (!active) return;

        // Android will send a touchcancel if it thinks we're starting to scroll.
        // So when the total distance (+ or - or both) exceeds 10px in either direction,
        // we either:
        // - On totalX > totalY, we send preventDefault() and treat this as a swipe.
        // - On totalY > totalX, we let the browser handle it as a scroll.

        if (!startCoords) return;
        var coords = getCoordinates(event);

        totalX += Math.abs(coords.x - lastPos.x);
        totalY += Math.abs(coords.y - lastPos.y);

        lastPos = coords;

        if (totalX < MOVE_BUFFER_RADIUS && totalY < MOVE_BUFFER_RADIUS) {
          return;
        }

        // One of totalX or totalY has exceeded the buffer, so decide on swipe vs. scroll.
        if (totalY > totalX) {
          // Allow native scrolling to take over.
          active = false;
          eventHandlers['cancel'] && eventHandlers['cancel'](event);
          return;
        } else {
          // Prevent the browser from scrolling.
          event.preventDefault();
          eventHandlers['move'] && eventHandlers['move'](coords, event);
        }
      });

      element.on(getEvents(pointerTypes, 'end'), function(event) {
        if (!active) return;
        active = false;
        eventHandlers['end'] && eventHandlers['end'](getCoordinates(event), event);
      });
    }
  };
}]);

/* global ngTouch: false */

/**
 * @ngdoc directive
 * @name ngClick
 *
 * @description
 * A more powerful replacement for the default ngClick designed to be used on touchscreen
 * devices. Most mobile browsers wait about 300ms after a tap-and-release before sending
 * the click event. This version handles them immediately, and then prevents the
 * following click event from propagating.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * This directive can fall back to using an ordinary click event, and so works on desktop
 * browsers as well as mobile.
 *
 * This directive also sets the CSS class `ng-click-active` while the element is being held
 * down (by a mouse click or touch) so you can restyle the depressed element if you wish.
 *
 * @element ANY
 * @param {expression} ngClick {@link guide/expression Expression} to evaluate
 * upon tap. (Event object is available as `$event`)
 *
 * @example
    <example module="ngClickExample" deps="angular-touch.js">
      <file name="index.html">
        <button ng-click="count = count + 1" ng-init="count=0">
          Increment
        </button>
        count: {{ count }}
      </file>
      <file name="script.js">
        angular.module('ngClickExample', ['ngTouch']);
      </file>
    </example>
 */

ngTouch.config(['$provide', function($provide) {
  $provide.decorator('ngClickDirective', ['$delegate', function($delegate) {
    // drop the default ngClick directive
    $delegate.shift();
    return $delegate;
  }]);
}]);

ngTouch.directive('ngClick', ['$parse', '$timeout', '$rootElement',
    function($parse, $timeout, $rootElement) {
  var TAP_DURATION = 750; // Shorter than 750ms is a tap, longer is a taphold or drag.
  var MOVE_TOLERANCE = 12; // 12px seems to work in most mobile browsers.
  var PREVENT_DURATION = 2500; // 2.5 seconds maximum from preventGhostClick call to click
  var CLICKBUSTER_THRESHOLD = 25; // 25 pixels in any dimension is the limit for busting clicks.

  var ACTIVE_CLASS_NAME = 'ng-click-active';
  var lastPreventedTime;
  var touchCoordinates;
  var lastLabelClickCoordinates;


  // TAP EVENTS AND GHOST CLICKS
  //
  // Why tap events?
  // Mobile browsers detect a tap, then wait a moment (usually ~300ms) to see if you're
  // double-tapping, and then fire a click event.
  //
  // This delay sucks and makes mobile apps feel unresponsive.
  // So we detect touchstart, touchmove, touchcancel and touchend ourselves and determine when
  // the user has tapped on something.
  //
  // What happens when the browser then generates a click event?
  // The browser, of course, also detects the tap and fires a click after a delay. This results in
  // tapping/clicking twice. We do "clickbusting" to prevent it.
  //
  // How does it work?
  // We attach global touchstart and click handlers, that run during the capture (early) phase.
  // So the sequence for a tap is:
  // - global touchstart: Sets an "allowable region" at the point touched.
  // - element's touchstart: Starts a touch
  // (- touchmove or touchcancel ends the touch, no click follows)
  // - element's touchend: Determines if the tap is valid (didn't move too far away, didn't hold
  //   too long) and fires the user's tap handler. The touchend also calls preventGhostClick().
  // - preventGhostClick() removes the allowable region the global touchstart created.
  // - The browser generates a click event.
  // - The global click handler catches the click, and checks whether it was in an allowable region.
  //     - If preventGhostClick was called, the region will have been removed, the click is busted.
  //     - If the region is still there, the click proceeds normally. Therefore clicks on links and
  //       other elements without ngTap on them work normally.
  //
  // This is an ugly, terrible hack!
  // Yeah, tell me about it. The alternatives are using the slow click events, or making our users
  // deal with the ghost clicks, so I consider this the least of evils. Fortunately Angular
  // encapsulates this ugly logic away from the user.
  //
  // Why not just put click handlers on the element?
  // We do that too, just to be sure. If the tap event caused the DOM to change,
  // it is possible another element is now in that position. To take account for these possibly
  // distinct elements, the handlers are global and care only about coordinates.

  // Checks if the coordinates are close enough to be within the region.
  function hit(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) < CLICKBUSTER_THRESHOLD && Math.abs(y1 - y2) < CLICKBUSTER_THRESHOLD;
  }

  // Checks a list of allowable regions against a click location.
  // Returns true if the click should be allowed.
  // Splices out the allowable region from the list after it has been used.
  function checkAllowableRegions(touchCoordinates, x, y) {
    for (var i = 0; i < touchCoordinates.length; i += 2) {
      if (hit(touchCoordinates[i], touchCoordinates[i+1], x, y)) {
        touchCoordinates.splice(i, i + 2);
        return true; // allowable region
      }
    }
    return false; // No allowable region; bust it.
  }

  // Global click handler that prevents the click if it's in a bustable zone and preventGhostClick
  // was called recently.
  function onClick(event) {
    if (Date.now() - lastPreventedTime > PREVENT_DURATION) {
      return; // Too old.
    }

    var touches = event.touches && event.touches.length ? event.touches : [event];
    var x = touches[0].clientX;
    var y = touches[0].clientY;
    // Work around desktop Webkit quirk where clicking a label will fire two clicks (on the label
    // and on the input element). Depending on the exact browser, this second click we don't want
    // to bust has either (0,0), negative coordinates, or coordinates equal to triggering label
    // click event
    if (x < 1 && y < 1) {
      return; // offscreen
    }
    if (lastLabelClickCoordinates &&
        lastLabelClickCoordinates[0] === x && lastLabelClickCoordinates[1] === y) {
      return; // input click triggered by label click
    }
    // reset label click coordinates on first subsequent click
    if (lastLabelClickCoordinates) {
      lastLabelClickCoordinates = null;
    }
    // remember label click coordinates to prevent click busting of trigger click event on input
    if (event.target.tagName.toLowerCase() === 'label') {
      lastLabelClickCoordinates = [x, y];
    }

    // Look for an allowable region containing this click.
    // If we find one, that means it was created by touchstart and not removed by
    // preventGhostClick, so we don't bust it.
    if (checkAllowableRegions(touchCoordinates, x, y)) {
      return;
    }

    // If we didn't find an allowable region, bust the click.
    event.stopPropagation();
    event.preventDefault();

    // Blur focused form elements
    event.target && event.target.blur();
  }


  // Global touchstart handler that creates an allowable region for a click event.
  // This allowable region can be removed by preventGhostClick if we want to bust it.
  function onTouchStart(event) {
    var touches = event.touches && event.touches.length ? event.touches : [event];
    var x = touches[0].clientX;
    var y = touches[0].clientY;
    touchCoordinates.push(x, y);

    $timeout(function() {
      // Remove the allowable region.
      for (var i = 0; i < touchCoordinates.length; i += 2) {
        if (touchCoordinates[i] == x && touchCoordinates[i+1] == y) {
          touchCoordinates.splice(i, i + 2);
          return;
        }
      }
    }, PREVENT_DURATION, false);
  }

  // On the first call, attaches some event handlers. Then whenever it gets called, it creates a
  // zone around the touchstart where clicks will get busted.
  function preventGhostClick(x, y) {
    if (!touchCoordinates) {
      $rootElement[0].addEventListener('click', onClick, true);
      $rootElement[0].addEventListener('touchstart', onTouchStart, true);
      touchCoordinates = [];
    }

    lastPreventedTime = Date.now();

    checkAllowableRegions(touchCoordinates, x, y);
  }

  // Actual linking function.
  return function(scope, element, attr) {
    var clickHandler = $parse(attr.ngClick),
        tapping = false,
        tapElement,  // Used to blur the element after a tap.
        startTime,   // Used to check if the tap was held too long.
        touchStartX,
        touchStartY;

    function resetState() {
      tapping = false;
      element.removeClass(ACTIVE_CLASS_NAME);
    }

    element.on('touchstart', function(event) {
      tapping = true;
      tapElement = event.target ? event.target : event.srcElement; // IE uses srcElement.
      // Hack for Safari, which can target text nodes instead of containers.
      if(tapElement.nodeType == 3) {
        tapElement = tapElement.parentNode;
      }

      element.addClass(ACTIVE_CLASS_NAME);

      startTime = Date.now();

      var touches = event.touches && event.touches.length ? event.touches : [event];
      var e = touches[0].originalEvent || touches[0];
      touchStartX = e.clientX;
      touchStartY = e.clientY;
    });

    element.on('touchmove', function(event) {
      resetState();
    });

    element.on('touchcancel', function(event) {
      resetState();
    });

    element.on('touchend', function(event) {
      var diff = Date.now() - startTime;

      var touches = (event.changedTouches && event.changedTouches.length) ? event.changedTouches :
          ((event.touches && event.touches.length) ? event.touches : [event]);
      var e = touches[0].originalEvent || touches[0];
      var x = e.clientX;
      var y = e.clientY;
      var dist = Math.sqrt( Math.pow(x - touchStartX, 2) + Math.pow(y - touchStartY, 2) );

      if (tapping && diff < TAP_DURATION && dist < MOVE_TOLERANCE) {
        // Call preventGhostClick so the clickbuster will catch the corresponding click.
        preventGhostClick(x, y);

        // Blur the focused element (the button, probably) before firing the callback.
        // This doesn't work perfectly on Android Chrome, but seems to work elsewhere.
        // I couldn't get anything to work reliably on Android Chrome.
        if (tapElement) {
          tapElement.blur();
        }

        if (!angular.isDefined(attr.disabled) || attr.disabled === false) {
          element.triggerHandler('click', [event]);
        }
      }

      resetState();
    });

    // Hack for iOS Safari's benefit. It goes searching for onclick handlers and is liable to click
    // something else nearby.
    element.onclick = function(event) { };

    // Actual click handler.
    // There are three different kinds of clicks, only two of which reach this point.
    // - On desktop browsers without touch events, their clicks will always come here.
    // - On mobile browsers, the simulated "fast" click will call this.
    // - But the browser's follow-up slow click will be "busted" before it reaches this handler.
    // Therefore it's safe to use this directive on both mobile and desktop.
    element.on('click', function(event, touchend) {
      scope.$apply(function() {
        clickHandler(scope, {$event: (touchend || event)});
      });
    });

    element.on('mousedown', function(event) {
      element.addClass(ACTIVE_CLASS_NAME);
    });

    element.on('mousemove mouseup', function(event) {
      element.removeClass(ACTIVE_CLASS_NAME);
    });

  };
}]);

/* global ngTouch: false */

/**
 * @ngdoc directive
 * @name ngSwipeLeft
 *
 * @description
 * Specify custom behavior when an element is swiped to the left on a touchscreen device.
 * A leftward swipe is a quick, right-to-left slide of the finger.
 * Though ngSwipeLeft is designed for touch-based devices, it will work with a mouse click and drag
 * too.
 *
 * To disable the mouse click and drag functionality, add `ng-swipe-disable-mouse` to
 * the `ng-swipe-left` or `ng-swipe-right` DOM Element.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * @element ANY
 * @param {expression} ngSwipeLeft {@link guide/expression Expression} to evaluate
 * upon left swipe. (Event object is available as `$event`)
 *
 * @example
    <example module="ngSwipeLeftExample" deps="angular-touch.js">
      <file name="index.html">
        <div ng-show="!showActions" ng-swipe-left="showActions = true">
          Some list content, like an email in the inbox
        </div>
        <div ng-show="showActions" ng-swipe-right="showActions = false">
          <button ng-click="reply()">Reply</button>
          <button ng-click="delete()">Delete</button>
        </div>
      </file>
      <file name="script.js">
        angular.module('ngSwipeLeftExample', ['ngTouch']);
      </file>
    </example>
 */

/**
 * @ngdoc directive
 * @name ngSwipeRight
 *
 * @description
 * Specify custom behavior when an element is swiped to the right on a touchscreen device.
 * A rightward swipe is a quick, left-to-right slide of the finger.
 * Though ngSwipeRight is designed for touch-based devices, it will work with a mouse click and drag
 * too.
 *
 * Requires the {@link ngTouch `ngTouch`} module to be installed.
 *
 * @element ANY
 * @param {expression} ngSwipeRight {@link guide/expression Expression} to evaluate
 * upon right swipe. (Event object is available as `$event`)
 *
 * @example
    <example module="ngSwipeRightExample" deps="angular-touch.js">
      <file name="index.html">
        <div ng-show="!showActions" ng-swipe-left="showActions = true">
          Some list content, like an email in the inbox
        </div>
        <div ng-show="showActions" ng-swipe-right="showActions = false">
          <button ng-click="reply()">Reply</button>
          <button ng-click="delete()">Delete</button>
        </div>
      </file>
      <file name="script.js">
        angular.module('ngSwipeRightExample', ['ngTouch']);
      </file>
    </example>
 */

function makeSwipeDirective(directiveName, direction, eventName) {
  ngTouch.directive(directiveName, ['$parse', '$swipe', function($parse, $swipe) {
    // The maximum vertical delta for a swipe should be less than 75px.
    var MAX_VERTICAL_DISTANCE = 75;
    // Vertical distance should not be more than a fraction of the horizontal distance.
    var MAX_VERTICAL_RATIO = 0.3;
    // At least a 30px lateral motion is necessary for a swipe.
    var MIN_HORIZONTAL_DISTANCE = 30;

    return function(scope, element, attr) {
      var swipeHandler = $parse(attr[directiveName]);

      var startCoords, valid;

      function validSwipe(coords) {
        // Check that it's within the coordinates.
        // Absolute vertical distance must be within tolerances.
        // Horizontal distance, we take the current X - the starting X.
        // This is negative for leftward swipes and positive for rightward swipes.
        // After multiplying by the direction (-1 for left, +1 for right), legal swipes
        // (ie. same direction as the directive wants) will have a positive delta and
        // illegal ones a negative delta.
        // Therefore this delta must be positive, and larger than the minimum.
        if (!startCoords) return false;
        var deltaY = Math.abs(coords.y - startCoords.y);
        var deltaX = (coords.x - startCoords.x) * direction;
        return valid && // Short circuit for already-invalidated swipes.
            deltaY < MAX_VERTICAL_DISTANCE &&
            deltaX > 0 &&
            deltaX > MIN_HORIZONTAL_DISTANCE &&
            deltaY / deltaX < MAX_VERTICAL_RATIO;
      }

      var pointerTypes = ['touch'];
      if (!angular.isDefined(attr['ngSwipeDisableMouse'])) {
        pointerTypes.push('mouse');
      }
      $swipe.bind(element, {
        'start': function(coords, event) {
          startCoords = coords;
          valid = true;
        },
        'cancel': function(event) {
          valid = false;
        },
        'end': function(coords, event) {
          if (validSwipe(coords)) {
            scope.$apply(function() {
              element.triggerHandler(eventName);
              swipeHandler(scope, {$event: event});
            });
          }
        }
      }, pointerTypes);
    };
  }]);
}

// Left is negative X-coordinate, right is positive.
makeSwipeDirective('ngSwipeLeft', -1, 'swipeleft');
makeSwipeDirective('ngSwipeRight', 1, 'swiperight');



})(window, window.angular);

(function() {
    'use strict';

    
    angular.module( 'ngTextTruncate', [] )


    .directive( "ngTextTruncate", function( $compile, ValidationServices, CharBasedTruncation, WordBasedTruncation ) {
        return {
            restrict: "A",
            scope: {
                text: "=ngTextTruncate",
                charsThreshould: "@ngTtCharsThreshold",
                wordsThreshould: "@ngTtWordsThreshold",
                customMoreLabel: "@ngTtMoreLabel",
                customLessLabel: "@ngTtLessLabel"
            },
            controller: function( $scope, $element, $attrs ) {
                $scope.toggleShow = function() {
                    $scope.open = !$scope.open;
                };

                $scope.useToggling = $attrs.ngTtNoToggling === undefined;
            },
            link: function( $scope, $element, $attrs ) {
                $scope.open = false;

                ValidationServices.failIfWrongThreshouldConfig( $scope.charsThreshould, $scope.wordsThreshould );

                var CHARS_THRESHOLD = parseInt( $scope.charsThreshould );
                var WORDS_THRESHOLD = parseInt( $scope.wordsThreshould );

                $scope.$watch( "text", function() {
                    $element.empty();
                    
                    if( CHARS_THRESHOLD ) {
                            if( $scope.text && CharBasedTruncation.truncationApplies( $scope, CHARS_THRESHOLD ) ) {
                                CharBasedTruncation.applyTruncation( CHARS_THRESHOLD, $scope, $element );

                            } else {
                                $element.append( $scope.text );
                            }

                    } else {

                        if( $scope.text && WordBasedTruncation.truncationApplies( $scope, WORDS_THRESHOLD ) ) {
                            WordBasedTruncation.applyTruncation( WORDS_THRESHOLD, $scope, $element );

                        } else {
                            $element.append( $scope.text );
                        }

                    }
                } );
            }
        };
    } )



    .factory( "ValidationServices", function() {
        return {
            failIfWrongThreshouldConfig: function( firstThreshould, secondThreshould ) {
                if( (! firstThreshould && ! secondThreshould) || (firstThreshould && secondThreshould) ) {
                    throw "You must specify one, and only one, type of threshould (chars or words)";
                }
            }
        };
    })



    .factory( "CharBasedTruncation", function( $compile ) {
        return {
            truncationApplies: function( $scope, threshould ) {
                return $scope.text.length > threshould;
            },

            applyTruncation: function( threshould, $scope, $element ) {
                if( $scope.useToggling ) {
                    var el = angular.element(    "<span>" +
                                                    $scope.text.substr( 0, threshould ) +
                                                    "<span ng-show='!open'>...</span>" +
                                                    "<span class='btn-link ngTruncateToggleText' " +
                                                        "ng-click='toggleShow()'" +
                                                        "ng-show='!open'>" +
                                                        " " + ($scope.customMoreLabel ? $scope.customMoreLabel : "More") +
                                                    "</span>" +
                                                    "<span ng-show='open'>" +
                                                        $scope.text.substring( threshould ) +
                                                        "<span class='btn-link ngTruncateToggleText'" +
                                                              "ng-click='toggleShow()'>" +
                                                            " " + ($scope.customLessLabel ? $scope.customLessLabel : "Less") +
                                                        "</span>" +
                                                    "</span>" +
                                                "</span>" );
                    $compile( el )( $scope );
                    $element.append( el );

                } else {
                    $element.append( $scope.text.substr( 0, threshould ) + "..." );

                }
            }
        };
    })



    .factory( "WordBasedTruncation", function( $compile ) {
        return {
            truncationApplies: function( $scope, threshould ) {
                return $scope.text.split( " " ).length > threshould;
            },

            applyTruncation: function( threshould, $scope, $element ) {
                var splitText = $scope.text.split( " " );
                if( $scope.useToggling ) {
                    var el = angular.element(    "<span>" +
                                                    splitText.slice( 0, threshould ).join( " " ) + " " +
                                                    "<span ng-show='!open'>...</span>" +
                                                    "<span class='btn-link ngTruncateToggleText' " +
                                                        "ng-click='toggleShow()'" +
                                                        "ng-show='!open'>" +
                                                        " " + ($scope.customMoreLabel ? $scope.customMoreLabel : "More") +
                                                    "</span>" +
                                                    "<span ng-show='open'>" +
                                                        splitText.slice( threshould, splitText.length ).join( " " ) +
                                                        "<span class='btn-link ngTruncateToggleText'" +
                                                              "ng-click='toggleShow()'>" +
                                                            " " + ($scope.customLessLabel ? $scope.customLessLabel : "Less") +
                                                        "</span>" +
                                                    "</span>" +
                                                "</span>" );
                    $compile( el )( $scope );
                    $element.append( el );

                } else {
                    $element.append( splitText.slice( 0, threshould ).join( " " ) + "..." );
                }
            }
        };
    });
    
}());
