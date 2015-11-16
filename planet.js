/**
 * Vector-based spherical projection of our planet earth
 * Author: Xavier Ho <xavier.ho@csiro.au>
 * See README.md for licenses and credits.
 */
var renderer = require('./renderer');
var shaders = require('./shaders');
var xhr = new THREE.XHRLoader();

exports.earth = function () {
  //-------------------------------------------------------------------------
  //  Fetch our earth

  xhr.load('data/land-topo.json', function (data) {
    var earth = {};
    earth.data = JSON.parse(data);
    earth.mesh = new THREE.Object3D();
    earth.shader = shaders['ubershader'];
    earth.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(earth.shader.uniforms),
      vertexShader: earth.shader.vertexShader,
      fragmentShader: earth.shader.fragmentShader,
      depthTest: false,
      transparent: true,
      wireframe: true
    });
    earth.material.uniforms.staticValue.value = 1;

    topojson.feature(earth.data, earth.data.objects.land).features.forEach(function (feature) {
      feature.geometry.coordinates.forEach(function (polygons) {
        var geometry = new THREE.Geometry();
        polygons.forEach(function (coordinates) {
          geometry.vertices.push(new THREE.Vector3(coordinates[0], coordinates[1], 0));
        });
        var mesh = new THREE.Line(geometry, earth.material);
        mesh.frustumCulled = false;
        earth.mesh.add(mesh);
      });
    });

    earth.ready = true;
    renderer.add(earth.mesh);
    renderer.setVisibleDistance(earth, 200, 1000000);
  });

  //-------------------------------------------------------------------------
  //  Grab a copy of Australia

  xhr.load('data/australia-topo.json', function (data) {
    var australia = {};
    australia.data = JSON.parse(data);
    australia.mesh = new THREE.Object3D();
    australia.shader = shaders['ubershader'];
    australia.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(australia.shader.uniforms),
      vertexShader: australia.shader.vertexShader,
      fragmentShader: australia.shader.fragmentShader,
      depthTest: false,
      transparent: true,
      wireframe: true
    });
    australia.material.uniforms.staticValue.value = 1;
    australia.material.uniforms.opacity.value = 0;

    topojson.feature(australia.data, australia.data.objects.australia).features.forEach(function (feature) {
      feature.geometry.coordinates.forEach(function (multipolygons) {
        multipolygons.forEach(function (polygons) {
          var geometry = new THREE.Geometry();
          polygons.forEach(function (coordinates) {
            geometry.vertices.push(new THREE.Vector3(coordinates[0], coordinates[1], 0));
          });
          var mesh = new THREE.Line(geometry, australia.material);
          mesh.frustumCulled = false;
          australia.mesh.add(mesh);
        });
      });
    });

    australia.ready = true;
    renderer.add(australia.mesh);
    renderer.setVisibleDistance(australia, 120, 250);
  });

  //-------------------------------------------------------------------------
  //  Retrieve the state boundary of New South Wales

  xhr.load('data/nsw-topo.json', function (data) {
    var nsw = {};
    nsw.data = JSON.parse(data);
    nsw.mesh = new THREE.Object3D();
    nsw.shader = shaders['ubershader'];
    nsw.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(nsw.shader.uniforms),
      vertexShader: nsw.shader.vertexShader,
      fragmentShader: nsw.shader.fragmentShader,
      depthTest: false,
      transparent: true,
      wireframe: true
    });
    nsw.material.uniforms.staticValue.value = 1;
    nsw.material.uniforms.opacity.value = 0;

    topojson.feature(nsw.data, nsw.data.objects.nsw).features.forEach(function (feature) {
      feature.geometry.coordinates.forEach(function (polygons) {
        var geometry = new THREE.Geometry();
        polygons.forEach(function (coordinates) {
          geometry.vertices.push(new THREE.Vector3(coordinates[0], coordinates[1], 0));
        });
        var mesh = new THREE.Line(geometry, nsw.material);
        mesh.frustumCulled = false;
        nsw.mesh.add(mesh);
      });
    });

    nsw.ready = true;
    renderer.add(nsw.mesh);
    renderer.setVisibleDistance(nsw, 5, 130);
  });
};
