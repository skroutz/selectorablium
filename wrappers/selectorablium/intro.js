(function(global, name, definition) {
  if (typeof module !== 'undefined') module.exports = definition;
  else if (typeof define === 'function' && typeof define.amd === 'object') define(definition);
  else global[name] = definition();
}(this, 'Selectorablium', function() {