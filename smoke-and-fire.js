/**
 * Web-based air quality data visualisation for Martin Cope and O&A, CSIRO.
 * Author: Xavier Ho <xavier.ho@csiro.au>
 * See README.md for licenses and credits.
 */
var geo = require('./geo');
var clock = require('./clock');
var planet = require('./planet');
var shaders = require('./shaders');
var renderer = require('./renderer');
var geoutils = require('./geoutils');
var loadingbar = require('./loadingbar');
var xhr = new THREE.XHRLoader();

// -----------------------------------------------------------------------------
// # Object container references
var aus_point_emissions = {},
    aus_inland_point_emissions = {},
    nsw_pollution_3k_PM25 = {},
    nsw_pollution_1k_PM25 = {},
    aus_pollution_PM25 = {},
    nsw_shipping_3k_PM25 = {},
    nsw_shipping_1k_PM25 = {},
    aus_shipping_PM25 = {},
    nsw_ships_pointclouds = {},
    data_boundaries = [];

var plume_min = 0.14,
    plume_max = 2.163,
    pollution_min = 1.75,
    pollution_max = 295;

var zoomLevel = {
  earth:      { distance: 500, x: 0.8121975, y: -0.4883185 },
  australia:  { distance: 250, x: 0.8121975, y: -0.4883185 },
  nsw:        { distance: 150, x: 1.00182605, y: -0.5796645 },
  sydney:     { distance: 110, x: 1.066858, y: -0.5887605 },
};

function zoomTo (key) {
  renderer.zoomTo(zoomLevel[key].distance, zoomLevel[key].x, zoomLevel[key].y);
}

// ----------------------------------------------------------------------------
// # GUI - Screen space controls
var GUI_time = document.getElementById('time');
var GUI_tools = document.getElementById('tools');
var GUI_header = document.getElementById('header');
var GUI_footer = document.getElementById('footer');
var GUI_zoomLevel = document.getElementById('focus');
var GUI_controls = document.getElementById('controls');
var GUI_show_PM25 = document.getElementById('show_PM25');
var GUI_show_inland = document.getElementById('show_inland');
var GUI_show_shipping = document.getElementById('show_shipping');
var GUI_show_pointsources = document.getElementById('show_pointsources');
var GUI_start_presentation = document.getElementById('start_presentation');
var GUI_show_dataBoundaries = document.getElementById('show_dataBoundaries');

// ----------------------------------------------------------------------------
// # Bam. (Entry point.)
renderer.render( function () {
  planet.earth();
  setup();
}, function () {
  update();
});

// ----------------------------------------------------------------------------
// # Load all the data for viz
function setup () {
  renderer.container.style.opacity = 1;
  zoomTo('australia');
  loadingbar.toDownload(9);

  var presentation;
  GUI_start_presentation.addEventListener('click', function ( event ) {
    var keys = Object.keys(zoomLevel);
    var i = 0;
    function present () {
      zoomTo(keys[++i % 4]);
    }

    if (event.target.checked) {
      presentation = window.setInterval(present, 60000);
    } else {
      window.clearInterval(presentation);
    }
  });

  GUI_zoomLevel.addEventListener('change', function ( event ) {
    zoomTo(event.target.value);
  });

  GUI_show_pointsources.addEventListener('click', function (event) {
    aus_point_emissions.mesh.visible = !!event.target.checked;
    nsw_ships_pointclouds.mesh.visible = !event.target.checked;
  });

  GUI_show_PM25.addEventListener('click', function (event) {
    nsw_pollution_3k_PM25.mesh.visible = !!event.target.checked;
    nsw_pollution_1k_PM25.mesh.visible = !!event.target.checked;
    aus_pollution_PM25.mesh.visible = !!event.target.checked;
  });

  GUI_show_inland.addEventListener('click', function (event) {
    aus_inland_point_emissions.mesh.visible = !!event.target.checked;
  });

  GUI_show_shipping.addEventListener('click', function (event) {
    nsw_shipping_3k_PM25.mesh.visible = !!event.target.checked;
    nsw_shipping_1k_PM25.mesh.visible = !!event.target.checked;
    aus_shipping_PM25.mesh.visible = !!event.target.checked;
  });

  GUI_show_dataBoundaries.addEventListener('click', function (event) {
    for (var i = 0; i < data_boundaries.length; i++) {
      data_boundaries[i].visible = !!event.target.checked;
    }
  });

  // --------------------------------------------------------------------------
  // # Load converted netCDF files

  geo.load2DGrid('data/data-aus-PM25.json',
    function (object) {
      aus_pollution_PM25 = object;

      // Colour
      aus_pollution_PM25.material.uniforms.r.value = 42 / 255.0;
      aus_pollution_PM25.material.uniforms.g.value = 169 / 255.0;
      aus_pollution_PM25.material.uniforms.b.value = 252 / 255.0;
      // Threshold
      aus_pollution_PM25.material.uniforms.minValue.value = pollution_min;
      // Saturate point
      aus_pollution_PM25.material.uniforms.normalValue.value = pollution_max;

      var boundary = geoutils.makeBoundary(aus_pollution_PM25.data[0].boundary);
      boundary.visible = false;
      data_boundaries.push(boundary);
      renderer.add(boundary)

      aus_pollution_PM25.mesh.visible = true;
      renderer.add(aus_pollution_PM25.mesh);
      loadingbar.complete(0);
    },
    function (progress) {
      loadingbar.update(0, progress.loaded / 6952429 * 100);
    }
  );

  geo.load2DGrid('data/data-nsw-3k-PM25.json',
    function (object) {
      nsw_pollution_3k_PM25 = object;

      // Colour
      nsw_pollution_3k_PM25.material.uniforms.r.value = 42 / 255.0;
      nsw_pollution_3k_PM25.material.uniforms.g.value = 169 / 255.0;
      nsw_pollution_3k_PM25.material.uniforms.b.value = 252 / 255.0;
      // Threshold
      nsw_pollution_3k_PM25.material.uniforms.minValue.value = pollution_min;
      // Saturate point
      nsw_pollution_3k_PM25.material.uniforms.normalValue.value = pollution_max;

      var boundary = geoutils.makeBoundary(nsw_pollution_3k_PM25.data[0].boundary);
      boundary.visible = false;
      data_boundaries.push(boundary);
      renderer.add(boundary);

      nsw_pollution_3k_PM25.mesh.visible = true;
      renderer.add(nsw_pollution_3k_PM25.mesh);
      loadingbar.complete(1);
    },
    function (progress) {
      loadingbar.update(1, progress.loaded / 6853152 * 100);
    }
  );

  geo.load2DGrid('data/data-nsw-1k-PM25.json',
    function (object) {
      nsw_pollution_1k_PM25 = object;

      // Colour
      nsw_pollution_1k_PM25.material.uniforms.r.value = 42 / 255.0;
      nsw_pollution_1k_PM25.material.uniforms.g.value = 169 / 255.0;
      nsw_pollution_1k_PM25.material.uniforms.b.value = 252 / 255.0;
      // Threshold
      nsw_pollution_1k_PM25.material.uniforms.minValue.value = pollution_min;
      // Saturate point
      nsw_pollution_1k_PM25.material.uniforms.normalValue.value = pollution_max;

      var boundary = geoutils.makeBoundary(nsw_pollution_1k_PM25.data[0].boundary);
      boundary.visible = false;
      data_boundaries.push(boundary);
      renderer.add(boundary);

      nsw_pollution_1k_PM25.mesh.visible = true;
      renderer.add(nsw_pollution_1k_PM25.mesh);
      loadingbar.complete(2);
    },
    function (progress) {
      loadingbar.update(2, progress.loaded / 6914609 * 100);
    }
  );

  //-------------------------------------------------------------------------
  // Shipping
  geo.load2DGrid('data/data-aus-shipping.json',
    function (object) {
      aus_shipping_PM25 = object;

      // Colour
      aus_shipping_PM25.material.uniforms.r.value = 252 / 255.0;
      aus_shipping_PM25.material.uniforms.g.value = 252 / 255.0;
      aus_shipping_PM25.material.uniforms.b.value = 151 / 255.0;
      // Threshold
      aus_shipping_PM25.material.uniforms.minValue.value = plume_min;
      // Saturate point
      aus_shipping_PM25.material.uniforms.normalValue.value = plume_max;

      renderer.add(aus_shipping_PM25.mesh);
      loadingbar.complete(3);
    },
    function (progress) {
      loadingbar.update(3, progress.loaded / 5813294 * 100);
    }
  );

  geo.load2DGrid('data/data-nsw-3k-shipping.json',
    function (object) {
      nsw_shipping_3k_PM25 = object;

      // Colour
      nsw_shipping_3k_PM25.material.uniforms.r.value = 252 / 255.0;
      nsw_shipping_3k_PM25.material.uniforms.g.value = 252 / 255.0;
      nsw_shipping_3k_PM25.material.uniforms.b.value = 151 / 255.0;
      // Threshold
      nsw_shipping_3k_PM25.material.uniforms.minValue.value = plume_min;
      // Saturate point
      nsw_shipping_3k_PM25.material.uniforms.normalValue.value = plume_max;

      renderer.add(nsw_shipping_3k_PM25.mesh);
      loadingbar.complete(4);
    },
    function (progress) {
      loadingbar.update(4, progress.loaded / 7183417 * 100);
    }
  );

  geo.load2DGrid('data/data-nsw-1k-shipping.json',
    function (object) {
      nsw_shipping_1k_PM25 = object;

      nsw_shipping_1k_PM25.material.uniforms.r.value = 252 / 255.0;
      nsw_shipping_1k_PM25.material.uniforms.g.value = 252 / 255.0;
      nsw_shipping_1k_PM25.material.uniforms.b.value = 151 / 255.0;
      // Threshold
      nsw_shipping_1k_PM25.material.uniforms.minValue.value = plume_min;
      // Saturate point
      nsw_shipping_1k_PM25.material.uniforms.normalValue.value = plume_max;

      renderer.add(nsw_shipping_1k_PM25.mesh);
      loadingbar.complete(5);
    },
    function (progress) {
      loadingbar.update(5, progress.loaded / 7480102 * 100);
    }
  );

  geo.loadPoints('data/data-pointsources-shipping.json',
    function (object) {
      aus_inland_point_emissions = object;

      aus_inland_point_emissions.material.uniforms.r.value = 252 / 255.0;
      aus_inland_point_emissions.material.uniforms.g.value = 151 / 255.0;
      aus_inland_point_emissions.material.uniforms.b.value = 151 / 255.0;
      aus_inland_point_emissions.material.uniforms.scale.value = 1;
      aus_inland_point_emissions.material.uniforms.size.value = 0;
      aus_inland_point_emissions.material.uniforms.minValue.value = 1;
      renderer.add(aus_inland_point_emissions.mesh);
      loadingbar.complete(6);
    },
    function (progress) {
        loadingbar.update(6, progress.loaded / 8594961 * 100);
    }
  );

  geo.loadPoints('data/data-aus-pointsources.json',
    function (object) {
      aus_point_emissions = object;

      aus_point_emissions.material.uniforms.r.value = 252 / 255.0;
      aus_point_emissions.material.uniforms.g.value = 252 / 255.0;
      aus_point_emissions.material.uniforms.b.value = 151 / 255.0;
      aus_point_emissions.material.uniforms.scale.value = 1;
      aus_point_emissions.material.uniforms.size.value = 0;
      aus_point_emissions.material.uniforms.minValue.value = 1;
      aus_point_emissions.mesh.visible = false;
      renderer.add(aus_point_emissions.mesh);
      loadingbar.complete(7);
    },
    function (progress) {
        loadingbar.update(7, progress.loaded / 8594961 * 100);
    }
  );

  geo.loadPoints('data/data-pointsources-3k.json',
    function (object) {
      nsw_ships_pointclouds = object;

      nsw_ships_pointclouds.material.uniforms.r.value = 252 / 255.0;
      nsw_ships_pointclouds.material.uniforms.g.value = 252 / 255.0;
      nsw_ships_pointclouds.material.uniforms.b.value = 151 / 255.0;
      nsw_ships_pointclouds.material.uniforms.scale.value = 1;
      nsw_ships_pointclouds.material.uniforms.size.value = 0.25;
      nsw_ships_pointclouds.material.uniforms.minValue.value = 1;
      renderer.add(nsw_ships_pointclouds.mesh);
      loadingbar.complete(8);
    },
    function (progress) {
      loadingbar.update(8, progress.loaded / 2163287 * 100);
    }
  );

} // end setup

function update () {
  var distanceTarget = renderer.queryState().distanceTarget;
  var time = clock.tick();

  // Update GUI Timestamp
  if (aus_pollution_PM25.ready) {
    var i = Math.floor(time) % aus_pollution_PM25.data.length;
    if (aus_pollution_PM25.data[i].timestamp) {
      GUI_time.timestamp = aus_pollution_PM25.data[i].timestamp;
      GUI_time.innerHTML = moment(aus_pollution_PM25.data[i].timestamp).format('LLLL');
    }
  }

  geo.update2DGrid(aus_pollution_PM25);
  geo.update2DGrid(nsw_pollution_3k_PM25);
  geo.update2DGrid(nsw_pollution_1k_PM25);
  geo.update2DGrid(aus_shipping_PM25);
  geo.update2DGrid(nsw_shipping_3k_PM25);
  geo.update2DGrid(nsw_shipping_1k_PM25);
  geo.updatePoints(aus_inland_point_emissions);
  geo.updatePoints(nsw_ships_pointclouds);

  if (distanceTarget <= zoomLevel.sydney.distance) {
    GUI_zoomLevel.options[3].selected = true;
  } else if (distanceTarget <= zoomLevel.nsw.distance) {
    GUI_zoomLevel.options[2].selected = true;
  } else if (distanceTarget <= zoomLevel.australia.distance) {
    GUI_zoomLevel.options[1].selected = true;
  } else {
    GUI_zoomLevel.options[0].selected = true;
  }
}

// ----------------------------------------------------------------------------
// # Hook up scroll event for GUI
GUI_controls.addEventListener('mousewheel', renderer.onMouseWheel);
GUI_footer.addEventListener('mousewheel', renderer.onMouseWheel);
GUI_header.addEventListener('mousewheel', renderer.onMouseWheel);
loadingbar.GUI.addEventListener('mousewheel', renderer.onMouseWheel);

// ----------------------------------------------------------------------------
// # Hide and show tools
var GUI_controls_hide = true;
var GUI_tools_hide = true;
window.addEventListener('keypress', function ( event ) {
  var k = String.fromCharCode(event.which);
  if (k === 'h') {
    GUI_controls_hide = !GUI_controls_hide;
    GUI_controls.style.opacity = GUI_controls_hide ? 0 : 1;
  } else if (k === 't') {
    GUI_tools_hide = !GUI_tools_hide;
    GUI_tools.style.opacity = GUI_tools_hide ? 0 : 1;
  }
});


// ----------------------------------------------------------------------------
// # Debug tools
var GUI_tool_plume_min = document.getElementById('tool-plume-min');
var GUI_tool_plume_min_display = document.getElementById('tool-plume-min-display');
GUI_tool_plume_min.value = GUI_tool_plume_min_display.textContent = plume_min;
GUI_tool_plume_min.addEventListener('input', function ( event ) {
  if (aus_shipping_PM25.ready) {
    aus_shipping_PM25.material.uniforms.minValue.value = Number(event.target.value);
    nsw_shipping_3k_PM25.material.uniforms.minValue.value = Number(event.target.value);
    nsw_shipping_1k_PM25.material.uniforms.minValue.value = Number(event.target.value);
    GUI_tool_plume_min_display.textContent = event.target.value;
  }
});

var GUI_tool_plume = document.getElementById('tool-plume');
var GUI_legend_plume = document.getElementById('legend-plume-max');
var GUI_tool_plume_display = document.getElementById('tool-plume-display');
GUI_tool_plume.value = GUI_tool_plume_display.textContent = GUI_legend_plume.textContent = plume_max;
GUI_tool_plume.addEventListener('input', function ( event ) {
  if (aus_shipping_PM25.ready) {
    aus_shipping_PM25.material.uniforms.normalValue.value = Number(event.target.value);
    nsw_shipping_3k_PM25.material.uniforms.normalValue.value = Number(event.target.value);
    nsw_shipping_1k_PM25.material.uniforms.normalValue.value = Number(event.target.value);
    GUI_tool_plume_display.textContent = event.target.value;
    GUI_legend_plume.textContent = event.target.value;
  }
});

var GUI_tool_smoke_min = document.getElementById('tool-smoke-min');
var GUI_tool_smoke_min_display = document.getElementById('tool-smoke-min-display');
GUI_tool_smoke_min.value = GUI_tool_smoke_min_display.textContent = pollution_min;
GUI_tool_smoke_min.addEventListener('input', function ( event ) {
  if (aus_pollution_PM25.ready) {
    aus_pollution_PM25.material.uniforms.minValue.value = Number(event.target.value);
    GUI_tool_smoke_min_display.textContent = event.target.value;
  }
});

var GUI_tool_smoke = document.getElementById('tool-smoke');
var GUI_legend_pm25 = document.getElementById('legend-pm25-max');
var GUI_tool_smoke_display = document.getElementById('tool-smoke-display');
GUI_tool_smoke.value = GUI_tool_smoke_display.textContent = GUI_legend_pm25.textContent = pollution_max;
GUI_tool_smoke.addEventListener('input', function ( event ) {
  if (aus_pollution_PM25.ready) {
    aus_pollution_PM25.material.uniforms.normalValue.value = Number(event.target.value);
    nsw_pollution_3k_PM25.material.uniforms.normalValue.value = Number(event.target.value);
    nsw_pollution_1k_PM25.material.uniforms.normalValue.value = Number(event.target.value);
    GUI_tool_smoke_display.textContent = event.target.value;
    GUI_legend_pm25.textContent = event.target.value;
  }
});

var GUI_tool_speed = document.getElementById('tool-speed');
var GUI_tool_speed_display = document.getElementById('tool-speed-display');
GUI_tool_speed.addEventListener('input', function ( event ) {
  clock.setSpeed(event.target.value);
  GUI_tool_speed_display.textContent = event.target.value;
});
