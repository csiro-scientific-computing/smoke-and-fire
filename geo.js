/**
 * Geometry loader and maintenance functions for spherical projected datasets.
 * Author: Xavier Ho <xavier.ho@csiro.au>
 * See README.md for licenses and credits.
 */
var clock = require('./clock');
var shaders = require('./shaders');
var renderer = require('./renderer');
var xhr = new THREE.XHRLoader();

// Create a plane based on geographical boundary rectangle
var boundedPlane = exports.boundedPlane = function ( boundary, w, h ) {
  w = w || 32;
  h = h || 32;

  var dw = (boundary[2] - boundary[0]) / (w-1);
  var dh = (boundary[3] - boundary[1]) / (h-1);
  var geometry = new THREE.PlaneGeometry(1, 1, w-1, h-1);

  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var i = y * w + x;
      geometry.vertices[i].x = boundary[0] + dw * x;
      geometry.vertices[i].y = boundary[1] + dh * y;
      geometry.vertices[i].z = 0;
    }
  }

  return geometry;
};


// -------------------------------------------------------------------------
// ## geo.load2DGrid(url, success, progress, error)
// ## geo.loadPoints(url, success, progress, error)
//
// Retrieves geolocation data from `url`. The data should be formatted as
// described in `../scripts/data_web_converter.py`. The function runs async.
//
// url        URL to retrieve data from.
// success    Callback function with one argument of the loaded object.
// progress   Repeatedly runs when data is still loading. Argument is loading
//            progress information.
// error      Runs when loading fails. Argument is error information.
//
exports.load2DGrid = function (url, success, progress, error) {
  xhr.load(url, function (data) {
    var object = {};
    object.data = JSON.parse(data);

    var pData = object.data[0].data;
    var pFactor = object.data[0].factor || 1.0;

    var width = object.data[0].boundary[1] - object.data[0].boundary[0],
        height = object.data[0].boundary[3] - object.data[0].boundary[2],
        y_length = pData.length,
        x_length = pData[0].length,
        dw = width / (x_length - 1),
        dh = height / (y_length - 1);

    object.geometry = new THREE.PlaneGeometry(width, height, x_length-1, y_length-1);
    object.geometry.dynamic = true;

    for (var y = 0; y < y_length; y++) {
      for (var x = 0; x < x_length; x++) {
        var i = y * x_length + x;
        var z = pData[y][x] * pFactor;
        object.geometry.vertices[i].x = object.data[0].boundary[0] + dw * x;
        object.geometry.vertices[i].y = object.data[0].boundary[2] + dh * y;
        object.geometry.vertices[i].z = z;
      }
    }

    object.shader = shaders['ubershader'];
    object.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(object.shader.uniforms),
      vertexShader: object.shader.vertexShader,
      fragmentShader: object.shader.fragmentShader,
      depthTest: false,
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.MaxEquation,
      side: THREE.DoubleSide
    });

    object.mesh = new THREE.Mesh(object.geometry, object.material);
    object.mesh.frustumCulled = false;
    object.ready = true;

    success(object);
  },
  function ( prog ) { if (typeof progress === 'function') progress(prog); },
  function ( err ) { if (typeof error === 'function') error(err); });
};


exports.loadGeoImage = function ( url, success, progress, error ) {
  xhr.load(url, function (data) {
    var object = {};
    var metadata = JSON.parse(data);
    var boundary = metadata.corners_lon_lat.upper_left.concat(metadata.corners_lon_lat.lower_right);
    object.geometry = boundedPlane(boundary);

    var path = url.split('/');
    path.pop();
    path.push(metadata.filename);
    path = path.join('/');

    var map = THREE.ImageUtils.loadTexture(path);
    map.minFilter = THREE.NearestFilter;

    // Hardcoded image paths for now
    object.imageUrls = [
      'IDE00435.201510272140.jpg',
      'IDE00435.201510272150.jpg',
      'IDE00435.201510272200.jpg',
      'IDE00435.201510272210.jpg',
      'IDE00435.201510272220.jpg',
      'IDE00435.201510272230.jpg',
      'IDE00435.201510272240.jpg',
      'IDE00435.201510272250.jpg',
      'IDE00435.201510272300.jpg',
      'IDE00435.201510272310.jpg',
      'IDE00435.201510272320.jpg',
      'IDE00435.201510272330.jpg',
      'IDE00435.201510272340.jpg',
      'IDE00435.201510272350.jpg',
      'IDE00435.201510280000.jpg',
      'IDE00435.201510280010.jpg',
      'IDE00435.201510280020.jpg',
      'IDE00435.201510280030.jpg',
      'IDE00435.201510280040.jpg',
      'IDE00435.201510280050.jpg',
      'IDE00435.201510280100.jpg',
      'IDE00435.201510280110.jpg',
      'IDE00435.201510280120.jpg',
      'IDE00435.201510280130.jpg',
      'IDE00435.201510280140.jpg',
      'IDE00435.201510280150.jpg',
      'IDE00435.201510280200.jpg',
      'IDE00435.201510280210.jpg',
      'IDE00435.201510280220.jpg',
      'IDE00435.201510280230.jpg',
      'IDE00435.201510280250.jpg',
      'IDE00435.201510280300.jpg',
      'IDE00435.201510280310.jpg',
      'IDE00435.201510280320.jpg',
      'IDE00435.201510280330.jpg',
      'IDE00435.201510280340.jpg',
      'IDE00435.201510280350.jpg',
      'IDE00435.201510280400.jpg',
      'IDE00435.201510280410.jpg',
      'IDE00435.201510280420.jpg',
      'IDE00435.201510280430.jpg',
      'IDE00435.201510280440.jpg',
      'IDE00435.201510280450.jpg',
      'IDE00435.201510280500.jpg',
      'IDE00435.201510280510.jpg',
      'IDE00435.201510280520.jpg',
    ];

    object.images = [];

    // Preload the images
    setTimeout( function () {
      object.imageUrls.forEach( function ( url ) {
        var image = THREE.ImageUtils.loadTexture('images/himawari/' + url);
        image.minFilter = THREE.NearestFilter;
        object.images.push(image);
      });
    }, 0);

    object.shader = shaders['ubershader'];
    object.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(object.shader.uniforms),
      vertexShader: object.shader.vertexShader,
      fragmentShader: shaders.image.fragmentShader,
      depthTest: false,
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.MaxEquation,
      side: THREE.DoubleSide
    });
    object.material.uniforms.map.value = map;

    object.mesh = new THREE.Mesh(object.geometry, object.material);
    object.mesh.frustumCulled = false;
    object.ready = true;

    success(object);
  },
  function ( prog ) { if (typeof progress === 'function') progress(prog); },
  function ( err ) { if (typeof error === 'function') error(err); });
};


exports.loadPoints = function ( url, success, progress, error ) {
  var object = {};

  xhr.load(url, function (data) {
    object.data = JSON.parse(data);
    var d = object.data[0].data;
    object.length = d.length; // Maximum number of point cloud points.
    var factor = object.data[0].factor;

    var geometry = new THREE.Geometry();
    object.shader = shaders['ubershader'];
    object.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(object.shader.uniforms),
      vertexShader: object.shader.vertexShader,
      fragmentShader:  shaders['pointcloud'].fragmentShader,
      transparent: true,
      depthTest: false,
    });
    object.material.uniforms.size.value = 3;
    object.material.uniforms.time.value = time;

    for (var i = 0; i < object.length; i++) {
      if (i >= d.length) {
        var x = 0;
        var y = 90;
        var z = 0;
      } else {
        var x = d[i][0] * factor;
        var y = d[i][1] * factor;
        var z = d[i][2] * factor;
      }
      geometry.vertices.push(new THREE.Vector3(x, y, z));
    }
    object.mesh = new THREE.PointCloud(geometry, object.material);
    object.mesh.frustumCulled = false;
    object.ready = true;

    success(object);
  },
  function ( prog ) { if (typeof progress === 'function') progress(prog); },
  function ( err ) { if (typeof error === 'function') error(err); });
};

// -------------------------------------------------------------------------
// ## update2DGrid(object)
// ## updateLines(object)
// ## updatePoints(object)
//
// Updates the object mesh based on data set and clock.time().
exports.update2DGrid = function (object) {
  if (!object.ready) return;
  var time = clock.time();

  var ia = Math.floor(time) % object.data.length;
  var ib = Math.ceil(time) % object.data.length;
  var dt = Math.ceil(time) - time;

  var pData_a = object.data[ia].data;
  var pData_b = object.data[ib].data;
  var pFactor_a = object.data[ia].factor;
  var pFactor_b = object.data[ib].factor;

  var y_length = pData_a.length;
  var x_length = pData_a[0].length;

  for (var y = 0; y < y_length; y++) {
    for (var x = 0; x < x_length; x++) {
      var i = y * x_length + x;
      var a = pData_a[y][x] * dt * pFactor_a;
      var b = pData_b[y][x] * (1 - dt) * pFactor_b;
      var z = a + b;
      object.mesh.geometry.vertices[i].z = z;
    }
  }
  object.mesh.geometry.verticesNeedUpdate = true;
};

exports.updatePoints = function ( object ) {
  if (!object.ready) return;
  var time = clock.time();
  object.material.uniforms.time.value = time;

  var t = Math.floor(time) % object.data.length;
  var pData = object.data[t].data;
  var pFactor = object.data[t].factor;
  var dt = Math.ceil(time) - time;

  for (var i = 0; i < object.length; i++) {
    if (i >= pData.length) {
      object.mesh.geometry.vertices[i].x = 0;
      object.mesh.geometry.vertices[i].y = 90;
      object.mesh.geometry.vertices[i].z = 0;
    } else {
      var x = pData[i][0] * pFactor;
      var y = pData[i][1] * pFactor;
      var z = pData[i][2] * pFactor;
      object.mesh.geometry.vertices[i].x = x;
      object.mesh.geometry.vertices[i].y = y;
      object.mesh.geometry.vertices[i].z = z;
    }
  }
  object.mesh.geometry.verticesNeedUpdate = true;
};

exports.updateGeoImage = function ( object ) {
  if (!object.ready) return;
  var time = clock.time();

  var t = Math.floor(time) % object.images.length;
  object.material.uniforms.map.value = object.images[t];
  object.material.uniforms.map.needsUpdate = true;
};