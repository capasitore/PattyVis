/*
 *  PathControls
 *  by Ben van Werkhoven (Netherlands eScience Center)
 *
 *  free look around with mouse drag
 */

(function() {
	'use strict';

	var me;

	var camera;
	var clock;
	var path;
	var lookatPath;
	var drag = false;
	var lookatPathFactor = 1.08;
	var el;

	var bodyPosition;
	var xAngle = 0;
	var yAngle = 0;

	var MAX_YANGLE = 0.95 * Math.PI / 2;
	var MIN_YANGLE = -0.95 * Math.PI / 2;

	var mouseX = window.innerWidth / 2;
	var mouseY = window.innerHeight / 2;

	//	this factor controls mouse sensitivity
	//	should be more than 2*Math.PI to get full rotation
	var factor = 8;

	//	Map for key states
	var keys = [];
	var zoom = 45;
	var maxZoom = 45;
	var positionOnRoad = 0.0;
	var looptime = 240;
	var THREE;

	var PathControls = function($window) {
		THREE = $window.THREE;

		me = this;

		for (var i = 0; i < 130; i++) {
			keys.push(false);
		}

		this.camera = null;
		this.path = null;

		clock = new THREE.Clock();

		this.modes = {
			ONRAILS: 'onrails',
			FLY: 'fly',
			DEMO: 'demo',
			OFF: 'off'
		};

		this.mode = this.modes.ONRAILS;
	};

	PathControls.prototype.initCamera = function(cam, startPos) {
		this.camera = cam;
		camera = cam;

		camera.position.copy(startPos);
		camera.up.set(0, 1, 0);
		camera.rotation.order = 'YXZ';

		bodyPosition = camera.position;
		zoom = camera.fov;
		maxZoom = camera.fov;
	};

	PathControls.prototype.initListeners = function(element) {
		el = element;
		element.setAttribute('tabindex', 1);

		element.addEventListener('keydown', onKeyDown, false);
		element.addEventListener('keyup', onKeyUp, false);

		element.addEventListener('mouseleave', onBlur, false);
		element.addEventListener('mouseout', onBlur, false);

		element.addEventListener('mousemove', mousemove, false);
		element.addEventListener('mousedown', mousedown, false);
		element.addEventListener('mouseup', mouseup, false);

		element.addEventListener('mousewheel', mousewheel, false);
		element.addEventListener('DOMMouseScroll', mousewheel, false); // firefox
	};

	PathControls.prototype.disableListeners = function(element) {
		element.removeEventListener('keydown', onKeyDown, false);
		element.removeEventListener('keyup', onKeyUp, false);

		element.removeEventListener('mouseleave', onBlur, false);
		element.removeEventListener('mouseout', onBlur, false);

		element.removeEventListener('mousemove', mousemove, false);
		element.removeEventListener('mousedown', mousedown, false);
		element.removeEventListener('mouseup', mouseup, false);

		element.removeEventListener('mousewheel', mousewheel, false);
		element.removeEventListener('DOMMouseScroll', mousewheel, false); // firefox
	};

	PathControls.prototype.init = function(cam, cameraPath, lookPath, element) {
		var defLookPath = new THREE.SplineCurve3(lookPath);
		lookatPath = new THREE.SplineCurve3(defLookPath.getSpacedPoints(100));

		var definedPath = new THREE.SplineCurve3(cameraPath);
		path = new THREE.SplineCurve3(definedPath.getSpacedPoints(100));

        this.initCamera(cam, path.getPointAt(0));

		this.lookat(lookatPath.getPointAt(0.05));
		camera.updateProjectionMatrix();

		this.initListeners(element);
	};

	function findNearestPointOnPath(path, point) {
		//first find nearest point on road
		var minDist = Number.MAX_VALUE;
		var dist = 0;
		var index = 0;
		var i;
		for (i=0; i < path.points.length; i++) {
			dist = point.distanceTo(path.points[i]);
			if (dist < minDist) {
				minDist = dist;
				index = i;
			}
		}

		return index;
	}

	function findPrecisePositionOnPath(cpath, point) {
		//first find nearest point on road
		var index = findNearestPointOnPath(cpath, point);

		//interpolate to find precise positionOnRoad
		//first find second nearest point on the road
		var distOne = Number.MAX_VALUE;
		var distTwo = Number.MAX_VALUE;
		var secondIndex = 1;
		if (index !== 0) {
			distOne = point.distanceTo(cpath.points[index-1]);
		}
		if (index < cpath.points.length-1) {
			distTwo = point.distanceTo(cpath.points[index+1]);
		}
		if (distOne > distTwo) {
			secondIndex = index+1;
		} else {
			index = index-1;
			secondIndex = index+1;
		}
		//interpolate using dot product of vector A and B

		//vector A is the vector from index to point
		var A = point.clone();
		A.sub(cpath.points[index]);

		//vector B is the vector from index to secondIndex
		var B = cpath.points[secondIndex].clone();
		B.sub(cpath.points[index].clone());
		B.normalize();

		//project vector A onto vector B
		var delta = A.dot(B) / A.length();

		//delta = delta / B.length();

		//compute new position on road
		return ((index + delta) / cpath.points.length) * looptime;
	}

	//go to a point on the road near the specified point
	PathControls.prototype.goToPointOnRoad = function(point) {
		//find position on road
		positionOnRoad = findPrecisePositionOnPath(path, point);

		//move the camera there
		bodyPosition.copy(path.getPointAt(positionOnRoad / looptime));
	};

	PathControls.prototype.lookat = function(center) {
		camera.up = new THREE.Vector3(0,1,0);
		camera.lookAt(center);

		xAngle = camera.rotation.y;
		yAngle = camera.rotation.x;
	};

	function addBalls(scene, pointsArray, colorHex) {
		var sphereGeo;
		var meshMat;
		var sphere;

		sphereGeo = new THREE.SphereGeometry(0.5,32,32);
		meshMat = new THREE.MeshBasicMaterial({color: colorHex});
		for (var i=0; i<pointsArray.length; i++) {
			sphere = new THREE.Mesh(sphereGeo, meshMat);
			sphere.position.copy(pointsArray[i]);
			scene.add(sphere);
		}
	}

	PathControls.prototype.createPath = function() {
		var tube = new THREE.TubeGeometry(path, 1024, 0.25, 8, false);
		var lookTube = new THREE.TubeGeometry(lookatPath, 1024, 0.25, 8, false);

		var tubeMesh = THREE.SceneUtils.createMultiMaterialObject( tube, [
				new THREE.MeshLambertMaterial({
					color: 0x00ffff
				}),
				new THREE.MeshBasicMaterial({
					color: 0x00ffff,
					opacity: 0.3,
					wireframe: false,
					transparent: false
			})]);
		var lookTubeMesh = THREE.SceneUtils.createMultiMaterialObject( lookTube, [
				new THREE.MeshLambertMaterial({
					color: 0x0000ff
				}),
				new THREE.MeshBasicMaterial({
					color: 0x0000ff,
					opacity: 0.3,
					wireframe: false,
					transparent: false
			})]);

		tubeMesh.add(lookTubeMesh);

		addBalls(tubeMesh, path.points, 0xff0000);

		addBalls(tubeMesh, lookatPath.points, 0x00ff00);

		return tubeMesh;
	};

	function cap(value) {
		return Math.min(Math.max(value, 0), 1);
	}

	function moveStep(step) {
		var vec = new THREE.Vector3(Math.sin(xAngle), Math.sin(-yAngle), Math.cos(xAngle));
		return vec.multiplyScalar(-step);
	}

	function strafeStep(step) {
		var vec = new THREE.Vector3(Math.cos(-xAngle), 0.0, Math.sin(-xAngle));
		return vec.multiplyScalar(-step);
	}

	function updateCameraRotation() {
		yAngle = Math.max(Math.min(yAngle,MAX_YANGLE),MIN_YANGLE);
 		camera.rotation.set(yAngle, xAngle, 0, 'YXZ');
	}

	function updateOnRailsMode(delta) {
		// Forward/backward on the rails
		if (keys[87] || keys[38]) { // W or UP
			positionOnRoad += delta;
		}
		if (keys[83] || keys[40]) { // S or DOWN
			positionOnRoad -= delta;
		}

		positionOnRoad = positionOnRoad % looptime;
		//javascript modulus operator allows negative numbers, correct for that
		if (positionOnRoad < 0) {
			positionOnRoad = looptime + positionOnRoad;
		}

		camera.position.copy(path.getPointAt(positionOnRoad / looptime));
	}

	function updateForwardBackward(step) {
		// Forward/backward
		if (keys[87] || keys[119] || keys[38]) { // W or UP
			bodyPosition.add(moveStep(step));
		}
		if (keys[83] || keys[115] || keys[40]) { // S or DOWN
			bodyPosition.sub(moveStep(step));
		}
	}

	function updateUpDown(step) {
		// Fly up or down
		if (keys[90] || keys[122]) { // Z
			bodyPosition.y -= step;
		}
		if (keys[81] || keys[113]) { // Q
			bodyPosition.y += step;
		}
	}

	function updateStrafe(vec) {
		// Strafe
		if (keys[65] || keys[97] || keys[37]) { // A or left
			bodyPosition.add(vec);
		}
		if (keys[68] || keys[100] || keys[39]) { // D or right
			bodyPosition.sub(vec);
		}
	}

	function updateFlyMode(step) {
		updateForwardBackward(step);

		updateUpDown(step);

		updateStrafe(strafeStep(step));
	}

	function getLocalFactor() {
		var factor = 1;

		//compute the factor that will be used to scale the arclength used to index the lookatpath
		var estArcLookPath = findPrecisePositionOnPath(lookatPath, bodyPosition) / lookatPath.points.length;
		var estArcPath = findPrecisePositionOnPath(path, bodyPosition) / path.points.length;

		//prevent div by zero
		if (estArcPath !== 0 && estArcLookPath !== 0) {
			//divide the larger by the smaller value
			factor = Math.max(estArcPath,estArcLookPath) / Math.min(estArcPath, estArcLookPath);
		}

		return factor;
	}

	PathControls.prototype.updateDemoMode = function(delta) {
		positionOnRoad += delta;
		positionOnRoad = positionOnRoad % looptime;
		//javascript modulus operator allows negative numbers, correct for that
		if (positionOnRoad < 0) {
			positionOnRoad = looptime + positionOnRoad;
		}
		camera.position.copy(path.getPointAt(positionOnRoad / looptime));

		//slowly adjust the factor over time to the local factor
		lookatPathFactor = (1.0 - delta/3.0) * lookatPathFactor + (delta/3.0) * getLocalFactor();
		//console.log('f=' + lookatPathFactor);

		var positionOnLookPath = (positionOnRoad / looptime) * (  lookatPath.getLength() / path.getLength() ) * lookatPathFactor;
		var lookPoint = lookatPath.getPointAt(cap(positionOnLookPath));

		this.lookat(lookPoint);
	};

	PathControls.prototype.updateInput = function() {
		if (!path) {
			return;
		}

		var delta = clock.getDelta();
		if (keys[32]) {
			delta *= 6;
		}

		updateCameraRotation();

		if (this.mode === this.modes.DEMO) {
			this.updateDemoMode(delta);
		} else if (this.mode === this.modes.FLY) {
			updateFlyMode(10 * delta);
		} else if (this.mode === this.modes.ONRAILS) {
			updateOnRailsMode(delta);
		} else if (this.mode === this.modes.OFF) {
			//TODO: Implement something else
		} else {
			console.log('error: unknown control mode in path.controls');
		}

	};

	PathControls.prototype.enableFlightMode = function() {
		this.mode = this.modes.FLY;
	};

	PathControls.prototype.transitionFromFlightMode = function() {
		if (this.mode === this.modes.FLY) {
			this.goToPointOnRoad(bodyPosition);
		}
	};

	PathControls.prototype.enableRailsMode = function() {
		this.transitionFromFlightMode();
		this.mode = this.modes.ONRAILS;
	};

	PathControls.prototype.enableDemoMode = function() {
		this.transitionFromFlightMode();
		this.mode = this.modes.DEMO;
	};

	function onKeyDown(event) {
		keys[event.keyCode] = true;

		if (event.keyCode === 32) {
			event.preventDefault();
		}
	}

	function onKeyUp(event) {
		keys[event.keyCode] = false;
	}

	//a blur event is fired when we lose focus
	//in such an event we want to turn off all keys
	function onBlur() {
		drag = false;

		var i;
		for (i=0; i < keys.length; i++) {
			keys[i] = false;
		}
	}

	function mousedown(event) {
		//right mouse button going down!!
		if (event.button === 2) {

			// claim focus when right click on canvas and not yet focused
			if (document.activeElement !== el) {
				el.focus();
			}

			event.preventDefault();

			mouseX = event.pageX;
			mouseY = event.pageY;

			drag = true;
		}
	}

	function mouseup(event) {
		//right mouse button going up!!
		if (event.button === 2) {
			event.preventDefault();
			drag = false;
		}
	}

	function mousemove(event) {
		if (!drag) {
			return;
		}

		xAngle -= factor * (event.pageX - mouseX) / (window.innerWidth);
		yAngle -= factor * (event.pageY - mouseY) / (window.innerHeight);

		mouseX = event.pageX;
		mouseY = event.pageY;
	}

	function mousewheel(event) {
		event.preventDefault();
		event.stopPropagation();

		var delta = 0;

		if (event.wheelDelta !== undefined) { // WebKit / Opera / Explorer 9
			delta = event.wheelDelta;
		} else if (event.detail !== undefined) { // Firefox
			delta = -event.detail;
		}

		if (delta < 0) {
			zoom += 2.5;
		} else {
			zoom -= 2.5;
		}

		if (zoom > maxZoom) {
			zoom = maxZoom;
		}
		if (zoom < 5) {
			zoom = 5;
		}

		camera.fov = zoom;
		camera.updateProjectionMatrix();
	}

	  angular.module('pattyApp.pointcloud')
	    .service('PathControls', PathControls);
})();
