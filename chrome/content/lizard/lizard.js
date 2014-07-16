var UI = {};

UI.animMoveTo = function(element, duration, left, top, right, bottom, callback, loop) {
	var props = UI.animPropsMoveTo(left, top, right, bottom);
	if (loop) {
		// copy start properties
		var reset = {};
		if (element.left != undefined) reset.left = element.left;
		if (element.top != undefined) reset.top = element.top;
		if (element.right != undefined) reset.right = element.right;
		if (element.bottom != undefined) reset.bottom = element.bottom;

		// start animation
		var restarter = function(elt, anim) {
			var running = false;

			// reset props to start values
			_API.Util.resetProps(element, reset);

			// callback exec
			if (callback) running = callback(elt, anim);

			// restart the animation
			if (running) {
				setTimeout(function(){
					//alert(left +' : '+reset.left+' : '+element.left);
					UI.animMoveTo(element, duration, left, top, right, bottom, callback, true);
				}, 60);
			}
		};
		UI.animate(element, props, duration, restarter);

	}
	else {
		// start animation
		UI.animate(element, props, duration, callback);
	}
};

UI.getFps = function(duration){
	// FIXME implement FPS auto-detection at app startup
	return 10;
};

UI.animEasing = function(pos) {
	// easing examples: http://www.kirupa.com/forum/showthread.php?205898-Easing-equations

	//return pos;
	//var s = 1.70158;
	//return pos * pos * ((s + 1) * pos - s);
	//return pos*Math.sin(pos*(Math.PI/2));
	return pos * pos * pos;
};

UI.animate = function(element, duration, props, callback) {
	var t0 = new Date().getTime();
	var fps = UI.getFps(duration);
	var steps = (duration / 1000) * fps;

	var initVals = {};
	// fetch initial values of properties requiring animating
	for (property in props) {
		initVals[property] = element[property];
	}

	
	var w_initial = element.width;
	var w_distance = (width != undefined) ? width - w_initial : 0;

	var h_initial = element.height;
	var h_distance = (height != undefined) ? height - h_initial : 0;

	var loop;
	loop = setInterval(function() {
		var t = new Date().getTime() - t0;
		var percent = t / duration;
		var w_value = w_initial;
		var h_value = h_initial;

		if (percent < 1) {
			if (w_distance != 0) w_value = w_initial + (UI.animEasing(percent) * w_distance);
			if (h_distance != 0) h_value = h_initial + (UI.animEasing(percent) * h_distance);
		} else {
			if (w_distance != 0) w_value = width;
			if (h_distance != 0) h_value = height;
			clearInterval(loop);

			// finished
			if (callback != undefined && _.isFunction(callback)) {
				callback();
			}
		}

		//_API.Debug.echo('animating h='+h_value+' w='+ w_value +' on'+ element);

		if (w_distance != 0 && element.width != w_value) {
			element.setWidth(w_value);
		}
		if (h_distance != 0 && element.height != h_value) {
			element.setHeight(h_value);
		}

	}, duration / steps);
};


UI.animSizeTo = function(element, duration, width, height, callback /*, loop *//* not supported yet */) {
	var t0 = new Date().getTime();
	var fps = UI.getFps(duration);
	var steps = (duration / 1000) * fps;

	var w_initial = element.width;
	var w_distance = (width != undefined) ? width - w_initial : 0;

	var h_initial = element.height;
	var h_distance = (height != undefined) ? height - h_initial : 0;

	var loop;
	loop = setInterval(function() {
		var t = new Date().getTime() - t0;
		var percent = t / duration;
		var w_value = w_initial;
		var h_value = h_initial;

		if (percent < 1) {
			if (w_distance != 0) w_value = w_initial + (UI.animEasing(percent) * w_distance);
			if (h_distance != 0) h_value = h_initial + (UI.animEasing(percent) * h_distance);
		} else {
			if (w_distance != 0) w_value = width;
			if (h_distance != 0) h_value = height;
			clearInterval(loop);

			// finished
			if (callback != undefined && _.isFunction(callback)) {
				callback();
			}
		}

		//_API.Debug.echo('animating h='+h_value+' w='+ w_value +' on'+ element);

		if (w_distance != 0 && element.width != w_value) {
			element.setWidth(w_value);
		}
		if (h_distance != 0 && element.height != h_value) {
			element.setHeight(h_value);
		}

	}, duration / steps);
};

/**
 * Convenience function for animation.
 *
 * This uses the native Titanium animation object for all properties
 * except width and height which are handled by custom code to avoid
 * flickering that happens due to GUI thread not being able to redraw
 * the components before the animation stops.
 *
 * Thus we use a setInterval() based animation alternative
 *
 * @param {Object} element
 * @param {Object} props
 * @param {Object} duration
 * @param {Object} callback
 */
UI.animate = function(element, props, duration, callback) {
	var animation = null;
	var width = null;
	var height = null;

	// animate height and width using custom code
	// in other cases (move and others) we use Titanium's
	// standard animation object

	// fetch properties requiring animating
	for (property in props) {
		if (property == 'width') {
			width = props[property];
		}
		else if (property == 'height') {
			height = props[property];
		}
		else {
			if (animation === null) {
				// create standard Titanium animation object
				animation = Titanium.UI.createAnimation();

				if (duration !== undefined) {
					animation.duration = duration;
				}
			}
			animation[property] = props[property];
		}
	}

	// end of animation handler
	var standardHandler = function() {
		// remove listener to only call this once and prevent memory leak
		animation.removeEventListener('complete', standardHandler);

		if (callback !== undefined && typeof callback == 'function') {
			callback(element, animation);
		}
		_API.Debug.echo('standardHandler finished and called callback for '+ element +' : '+ _API.DB.json_encode(props));
	};

	if (width != null || height != null) {
		// custom animation must be called : attach callback and do animating
		UI.animSizeTo(element, duration, width, height);
	}

	if (animation !== null) {
		// standard animation must be called : attach callback then do animating
		animation.addEventListener('complete', standardHandler);
		element.animate(animation);
	}

};

UI.animMap = function($map, region, annotations) {
	// fetch current location
	var reg = region;
		reg.latitudeDelta = 1.5;
		reg.longitudeDelta = 1.5;

	// unzoom
	$map.region = reg;
	_API.Debug.echo('moving map to '+ _API.DB.json_encode(reg));

	setTimeout(function(){
		// move to new region and zoom in
		if (region != undefined) {
			region.latitudeDelta = 0.1;
			region.longititudeDelta = 0.1;
		}

		// add annotations
		if (annotations != undefined) {
			$map.setAnnotations(annotations);
		}
	}, 2000);
};

/**
 * Convenience moveTo animation properties builder.
 *
 * @param {Object} left
 * @param {Object} top
 * @param {Object} right
 * @param {Object} bottom
 */
UI.animPropsMoveTo = function(left, top, right, bottom) {
	props = {};

	// undefined or null or 0 : ignore (0 should be '0dp' instead)
	if (top != undefined) props['top'] = top;
	if (left != undefined) props['left'] = left;
	if (right != undefined) props['right'] = right;
	if (bottom != undefined) props['bottom'] = bottom;

	return props;
};

/**
 * Convenience SizeTo animation properties builder.
 *
 * @param {Object} width
 * @param {Object} height
 */
UI.animPropsSizeTo = function(width, height) {
	props = {};

	// undefined or null or 0 : ignore (0 should be '0dp' instead)
	if (width != undefined) props['width'] = width;
	if (height != undefined) props['height'] = height;

	return props;
};
