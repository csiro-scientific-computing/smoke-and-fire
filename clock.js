/**
 * The code that governs time.
 * Author: Xavier Ho <xavier.ho@csiro.au>
 * See README.md for licenses and credits.
 */

var clock = new THREE.Clock();
var _time = 0;
var speed = 2;

exports.setSpeed = function(s) {
  speed = Number(s);
};

var time = (exports.time = function() {
  return _time;
});

var tick = (exports.tick = function() {
  _time += clock.getDelta() * speed;
  return _time;
});
