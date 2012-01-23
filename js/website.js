(function() {
  $(function() {
    $("select.selectorablium").Selectorablium({
      app_name: "selectorablium_dev"
    });
    window.a = $("select.selectorablium").data("Selectorablium");
  });
  $(window).load(function() {});
}).call(this);
