/**
 * Web-based renderer with mouse-first controls
 * Author: Xavier Ho <xavier.ho@csiro.au>
 * See README.md for licenses and credits.
 */

// -----------------------------------------------------------------------------
// # Constants and variables
var PI_HALF = Math.PI / 2;

var mouse = { x: 0, y: 0 },         // current mouse location
    rotation = { x: 0, y: 0 },      // current camera rotation wrt world origin
    mouseOnDown = { x: 0, y: 0 },   // mouse click location on click
    targetOnDown = { x: 0, y: 0 },  // camera rotation on click
    pinchStart = 0,                 // Starting pinch distance
    target = { x: 0,                // target camera rotation to move to,
               y: 0 },              // in this case, that's Australia :)
    distance = 1000,                // current distance from camera to origin
    distanceTarget = 1000,          // target distance to move camera to
    cameraTarget = new THREE.Vector3(0, 0, 0);

// -----------------------------------------------------------------------------
// # Renderer managers and containers
var container = exports.container = document.getElementById('container');
var view = {
  w: container.offsetWidth || window.innerWidth,
  h: container.offsetHeight || window.innerHeight
};
var camera = new THREE.PerspectiveCamera(30, view.w / view.h, 0.1, 1000);
var scene = exports.scene = new THREE.Scene();
var renderer = exports.renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});

//  ----------------------------------------------------------------------------
//  ## add(object)
//  Include the object for render. Object must have property object.mesh that is
//  a threejs Mesh instance.
exports.add = function ( mesh ) {
  scene.add(mesh);
};

//  ----------------------------------------------------------------------------
//  ## render(setup, update)
//  Inits the render loop, runs setup(), and calls update() every draw frame.
exports.render = function render ( setup, update ) {
  init();
  setup();

  (function loop () {
    requestAnimationFrame(loop);
    update();
    updateLOD();
    draw();
  }());
};

function init () {
  camera.position.z = distance;

  renderer.setSize(view.w, view.h);
  renderer.domElement.style.position = 'absolute';
  container.appendChild(renderer.domElement);

  container.addEventListener('mousedown', onMouseDown, false);
  container.addEventListener('touchstart', onTouchStart, false);
  container.addEventListener('touchmove', onTouchMove, false);
  window.addEventListener('mousewheel', onMouseWheel, false);
  window.addEventListener('DOMMouseScroll', onMouseWheel, false); // Firefox
  window.addEventListener('resize', onWindowResize, false);
  // window.addEventListener('keydown', onKeyDown, false);
}

function draw () {
  distance += (distanceTarget - distance) * 0.075;
  rotation.x += (target.x - rotation.x) * 0.1;
  rotation.y += (target.y - rotation.y) * 0.1;

  camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
  camera.position.y = distance * Math.sin(rotation.y);
  camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

  camera.lookAt(cameraTarget);
  renderer.render(scene, camera);
}

// -----------------------------------------------------------------------------
// # Level of Detail visibility controls
//
//  o ---- LODDistance[0] ---- closeFade ---- LODDistance[1] ---- farFade
//  [invisible]         [fadeIn]       [visible]           [fadeOut]
//
//  ## setVisibleDistance(obj, min, max)
//  Adds obj to the LOD controller, with [min, max] being visible, otherwise
//  gently fades it out of view.
var LODObjects = [];
var setVisibleDistance = exports.setVisibleDistance = function ( obj, min, max ) {
  obj.LODDistance = [min, max];
  LODObjects.push(obj);
};

function updateLOD () {
  LODObjects.forEach(function (object) {
    if (!object.ready) { return; }

    var closeFade = Math.min(object.LODDistance[0] * 1.75, object.LODDistance[1]);
    var farFade = object.LODDistance[1] * 1.75;
    var opacity;

    if (distance < object.LODDistance[0] || distance >= farFade) {
      opacity = 0;

    } else if (distance >= object.LODDistance[0] && distance < closeFade) {
      opacity = (distance - object.LODDistance[0]) / (closeFade - object.LODDistance[0]);

    } else if (distance >= closeFade && distance < object.LODDistance[1]) {
      opacity = 1;

    } else if (distance >= object.LODDistance[1] && distance < farFade) {
      opacity = 1 - (distance - object.LODDistance[1]) / (farFade - object.LODDistance[1]);

    } else {
      console.warn('Level of details glitched :[');
      return;
    }

    if (object.material.uniforms) {
      object.material.uniforms.opacity.value = opacity;
    } else {
      object.material.opacity = opacity;
    }
  });
}

// -----------------------------------------------------------------------------
// # User input events
function onMouseDown ( event ) {
  event.preventDefault();

  container.addEventListener('mousemove', onMouseMove, false);
  container.addEventListener('mouseup', onMouseUp, false);
  container.addEventListener('mouseout', onMouseUp, false);

  mouseOnDown.x = -event.clientX;
  mouseOnDown.y = event.clientY;

  targetOnDown.x = target.x;
  targetOnDown.y = target.y;

  container.style.cursor = 'move';
}

function onMouseMove ( event ) {
  mouse.x = -event.clientX;
  mouse.y = event.clientY;

  var zoomDamp = (distance * distance) / 10000;

  target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.0001 * zoomDamp;
  target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.0001 * zoomDamp;

  target.y = target.y > PI_HALF ? PI_HALF : target.y;
  target.y = target.y < - PI_HALF ? -PI_HALF : target.y;
}

function onKeyDown ( event ) {
  var keyCode = event.keyCode;
  if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return;
  if (keyCode === 38) { // up
    target.y -= 0.1;
  } else if (keyCode === 39) { // right
    target.x -= 0.1;
  } else if (keyCode === 40) { // down
    target.y += 0.1;
  } else if (keyCode === 37) { // left
    target.x += 0.1;
  }

  target.y = target.y > PI_HALF ? PI_HALF : target.y;
  target.y = target.y < - PI_HALF ? -PI_HALF : target.y;
}

function onMouseUp ( event ) {
  container.removeEventListener('mousemove', onMouseMove, false);
  container.removeEventListener('mouseup', onMouseUp, false);
  container.removeEventListener('mouseout', onMouseUp, false);
  container.style.cursor = 'auto';
}

function onTouchStart ( event ) {
  if (event.targetTouches.length === 1) {

    var touch = event.targetTouches[0];
    mouseOnDown.x = -touch.pageX;
    mouseOnDown.y = touch.pageY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

  } else if (event.targetTouches.length === 2) {

    var t1 = event.targetTouches[0],
        t2 = event.targetTouches[1];

    pinchStart = Math.sqrt(Math.pow(t2.pageX - t1.pageX, 2) + Math.pow(t2.pageY - t1.pageY, 2));

  }
}

function onTouchMove ( event ) {
  if (event.targetTouches.length === 1) {

    if (pinchStart > 0) return;

    var touch = event.targetTouches[0];
    mouse.x = -touch.pageX;
    mouse.y = touch.pageY;

    var zoomDamp = (distance * distance) / 5000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.0001 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.0001 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? -PI_HALF : target.y;

    container.addEventListener('touchend', onTouchEnd, false);

  } else if (event.targetTouches.length === 2) {

    var t1 = event.targetTouches[0],
        t2 = event.targetTouches[1];
    var pinchDistance = Math.sqrt(Math.pow(t2.pageX - t1.pageX, 2) + Math.pow(t2.pageY - t1.pageY, 2));
    var zoomDistance = pinchDistance - pinchStart;
    pinchStart = pinchDistance;

    zoom(zoomDistance);

    container.addEventListener('touchend', onTouchEnd, false);
  }

  event.preventDefault();
}

function onTouchEnd ( event ) {
  if (event.targetTouches.length === 0) {
    container.removeEventListener('touchend', onTouchEnd, false);
    pinchStart = 0;
  }
}

function onWindowResize ( event ) {
  var w = view.w = container.offsetWidth || window.innerWidth;
  var h = view.h = container.offsetHeight || window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize( w, h );
}

var onMouseWheel = exports.onMouseWheel = function ( event ) {
  event.preventDefault();

  // Chrome || IE || Firefox
  var delta = event.wheelDeltaY || event.wheelDelta || -event.detail*10;
  zoom(delta * 0.17);
  return false;
}

function zoom ( delta ) {
  distanceTarget -= delta;
  distanceTarget = distanceTarget > 500 ? 500 : distanceTarget;
  distanceTarget = distanceTarget < 108 ? 108 : distanceTarget;
}

//  ----------------------------------------------------------------------------
//  ## zoomTo(distance, x, y)
//  Sets the camera target to a specific distance and <x, y> coordinates in
//  spherical radians.
exports.zoomTo = function ( distance, x, y ) {
  distanceTarget = distance;
  target.x = x;
  target.y = y;
}

exports.debug = function ( text, replace ) {
  var el = document.getElementById('debug');
  if (!replace)
    el.innerHTML += JSON.stringify(text) + '<br>';
  else
    el.innerHTML = JSON.stringify(text) + '<br>';
}

//  ----------------------------------------------------------------------------
//  ## queryState()
//  Returns a collection of resources used internally by the renderer for hooks
//  and precise reference patching.
exports.queryState = function () {
  return {
    camera: camera,
    container: container,
    distance: distance,
    distanceTarget: distanceTarget,
    mouse: mouse,
    mouseOnDown: mouseOnDown,
    renderer: renderer,
    rotation: rotation,
    scene: scene,
    target: target,
    targetOnDown: targetOnDown,
  };
};
