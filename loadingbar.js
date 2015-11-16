/**
 * Loading bar display.
 * Author: Xavier Ho <xavier.ho@csiro.au>
 * See README.md for licenses and credits.
 */
var GUI_loading = exports.GUI = document.getElementById('loading');
var cb;

//  ----------------------------------------------------------------------------
//  ## loadingbar.toDownload(numberOfFiles)
//  Number of files to download (& reserve) the loading bar
exports.toDownload = function ( numberOfFiles ) {
  for (var i = 0; i < numberOfFiles; i++) {
    var loadingBar = document.createElement('div');
    loadingBar.classList.add('loading-bar');
    loadingBar.style.width = '0%';
    loadingBar.style.opacity = '100%';
    GUI_loading.appendChild(loadingBar);
  }
}

//  ----------------------------------------------------------------------------
//  ## loadingbar.update(index, progress)
//  Update loading progress at index (0 to numberOfFiles-1).
//  progress should be between 0 and 100.
exports.update = function ( index, progress ) {
  GUI_loading.children[index].style.width = progress + '%';
}

exports.complete = function ( index ) {
  GUI_loading.children[index].style.width = '100%';

  for (var i = 0; i < GUI_loading.children.length; i++) {
    if (GUI_loading.children[i].style.width != '100%') return;
  }

  GUI_loading.style.opacity = 0;
  window.setTimeout(function () {
    GUI_loading.style.display = "none";
  }, 1000);
  if (typeof cb === 'function') cb();
}

exports.then = function ( callback ) {
  cb = callback;
}