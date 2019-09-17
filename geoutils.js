/**
 * Misc. tools to work with geometries.
 * Author: Xavier Ho <xavier.ho@csiro.au>
 * See README.md for licenses and credits.
 */
var shaders = require("./shaders");

// -------------------------------------------------------------------------
// ## makeBoundary([minLat, maxLat, minLon, maxLon])
// Draws a boundary rectangle on specified boundary.
// boundary = [minLat, maxLat, minLon, maxLon]
exports.makeBoundary = function(boundary) {
  var geometry = new THREE.BufferGeometry();
  var vertices = [];

  // Draw 4 sides with many segments so it projects nicely
  var x, y;
  var segments = 32; // should be enough for a "smooth" curve look on a globe
  for (
    y = boundary[2];
    y < boundary[3];
    y += (boundary[3] - boundary[2]) / segments
  ) {
    vertices.push([boundary[0], y, 0]);
  }
  for (
    x = boundary[0];
    x < boundary[1];
    x += (boundary[1] - boundary[0]) / segments
  ) {
    vertices.push([x, boundary[3], 0]);
  }
  for (
    y = boundary[3];
    y > boundary[2];
    y -= (boundary[3] - boundary[2]) / segments
  ) {
    vertices.push([boundary[1], y, 0]);
  }
  for (
    x = boundary[1];
    x > boundary[0];
    x -= (boundary[1] - boundary[0]) / segments
  ) {
    vertices.push([x, boundary[2], 0]);
  }
  // Close the line
  vertices.push([boundary[0], boundary[2], 0]);

  var shader = shaders["ubershader"];
  var material = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(shader.uniforms),
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
    linewidth: 2,
    depthTest: false,
    transparent: true,
    wireframe: true
  });
  material.uniforms.r.value = 151 / 255;
  material.uniforms.g.value = 252 / 255;
  material.uniforms.b.value = 151 / 255;
  material.uniforms.staticValue.value = 1;

  // Required hack to treat buffer geometry not as triangles
  var indices = vertices.flatMap(function(_, i) {
    if (i === 0 || i === vertices.length - 1) {
      return [i];
    }
    return [i, i, i];
  });

  var positions_f32 = Float32Array.from(vertices.flat());

  geometry.addAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions_f32, 3)
  );

  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

  geometry.computeBoundingSphere();

  var mesh = new THREE.Line(geometry, material);

  mesh.frustumCulled = false;
  mesh.ready = true;
  return mesh;
};
