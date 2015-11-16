/**
 * Web-based air quality data visualisation for Martin Cope and O&A, CSIRO.
 * Author: Xavier Ho <xavier.ho@csiro.au>
 * See README.md for licenses and credits.
 */
var renderer = require('./renderer');

// Objects to manage
var objects = exports.objects = [];

exports.manage = function (object, updateFunc) {
  if (typeof undateFunc !== 'function') {
    console.error('Update funtion not specified for ' + object);
  }
  objects.push({
    object: object,
    update: updateFunc
  });
  renderer.add(object.mesh);
};

exports.update = function () {
  objects.forEach( function (object) {
    object.update( object.object );
  });
};