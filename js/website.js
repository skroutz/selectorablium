(function() {
  $(function() {
    $("select.selectorablium").Selectorablium({
      app_name: "selectorablium_dev"
    });
    window.a = $("select.selectorablium:first").data("selectorablium");
    /*RESET THE SELECTORABLIUMS*/
    $("[type=reset]").on('click', function() {
      var my_selectorabliums;
      my_selectorabliums = $(this).parents('form').find('.selectorablium');
      my_selectorabliums.each(function() {
        $(this).data('selectorablium').resetSelectItem();
      });
    });
    $("#eshop_setter").on('click', function(e) {
      var my_obj;
      e.stopPropagation();
      my_obj = $(".selectorablium:nth(0)").data("selectorablium");
      my_obj.setSelectItem({
        value: 9999,
        text: "niamaniaima"
      });
      return false;
    });
    $("#manufacturer_setter").on('click', function(e) {
      var my_obj;
      e.stopPropagation();
      my_obj = $(".selectorablium:nth(1)").data("selectorablium");
      my_obj.setSelectItem({
        value: 123123123,
        text: "ZZZZZZZZ"
      });
      return false;
    });
  });
  $(window).load(function() {});
}).call(this);
