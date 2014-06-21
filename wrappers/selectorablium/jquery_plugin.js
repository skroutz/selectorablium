
  $.fn.Selectorablium = function(options) {
    this.each(function() {
      if (!$.data(this, 'Selectorablium')) {
        $.data(this, 'Selectorablium', new Selectorablium(this, options));
      }
    });
  };
