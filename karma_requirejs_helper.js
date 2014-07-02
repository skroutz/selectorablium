var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;
// var TEST_REGEXP = /storage_freak_spec\.js$/i;

var pathToModule = function(path) {
  return path;
};

Object.keys(window.__karma__.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {

    // Normalize paths to RequireJS module names.
    allTestFiles.push(pathToModule(file));
  }
});

window.__requirejs__ = {
  loaded_amds: {},
  clearRequireState: function(){
    var key, value, _ref;
    _ref = window.__requirejs__.loaded_amds;
    for (key in _ref) {
      value = _ref[key];
      requirejs.undef(key);
      delete window.__requirejs__.loaded_amds[key];
    }
  }
}

require.config({
  baseUrl        : '/base/coffee',
  deps           : allTestFiles,
  callback       : window.__karma__.start,
  onResourceLoad : function(context, map, deps){
    window.__requirejs__.loaded_amds[map.id] = true;
  }
});

