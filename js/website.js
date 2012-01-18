(function() {
  var loader_url, manage_boxes_inside_tabs, number_of_plugins, popup_default_themes, resize_tab_containers, single_default_themes, theming_print_pixels_size;
  number_of_plugins = 2;
  loader_url = "http://d.scdn.gr/widgets/popup/js/skroutz_loader.js";
  popup_default_themes = {
    theme1: {
      skroutz_popup: {
        'background-color': "FFFFFF"
      },
      inner_container: {
        'border-color': "D8D8D8",
        'background-color': "EFEFEF"
      },
      product_title: {
        color: "F67A08"
      }
    },
    theme2: {
      skroutz_popup: {
        'background-color': "616161"
      },
      inner_container: {
        'border-color': "d1d2d2",
        'background-color': "FFFFFF"
      },
      product_title: {
        color: "262626"
      }
    },
    theme3: {
      skroutz_popup: {
        'background-color': "d1e8f4"
      },
      inner_container: {
        'border-color': "c0c9d5",
        'background-color': "f0f6f9"
      },
      product_title: {
        color: "0a5b85"
      }
    }
  };
  single_default_themes = {
    theme1: {
      skroutz_single_container: {
        'background-color': "FFFFFF"
      },
      inner_container: {
        'border-color': "D8D8D8",
        'background-color': "EFEFEF"
      },
      product_title: {
        color: "F67A08"
      }
    },
    theme2: {
      skroutz_single_container: {
        'background-color': "616161"
      },
      inner_container: {
        'border-color': "d1d2d2",
        'background-color': "FFFFFF"
      },
      product_title: {
        color: "262626"
      }
    },
    theme3: {
      skroutz_single_container: {
        'background-color': "d1e8f4"
      },
      inner_container: {
        'border-color': "c0c9d5",
        'background-color': "f0f6f9"
      },
      product_title: {
        color: "0a5b85"
      }
    }
  };
  manage_boxes_inside_tabs = function(tab) {
    var fix_me;
    tab = tab || null;
    fix_me = function(tab_el) {
      var active_button, target;
      active_button = tab_el.find(".tab_buttons_cont button.active");
      target = tab_el.find("." + active_button.data("id"));
      tab_el.find("header h2 span").html(active_button.html());
      tab_el.find('.tab_boxes_cont .box:not(.code)').hide();
      target.show();
    };
    if (tab) {
      fix_me(tab);
    } else {
      $(".tab").each(function() {
        fix_me($(this));
      });
    }
    return true;
  };
  resize_tab_containers = function() {
    var active_button, tab_target, window_width;
    active_button = $("#tab_selector button.active");
    tab_target = $("#" + active_button.data("id"));
    window_width = parseInt($(window).width(), 10);
    $("body").css({
      width: number_of_plugins * window_width + 100
    });
    $(".tab_extern_cont").each(function() {
      $(this).css({
        width: window_width
      });
    });
    $('html,body').scrollLeft(tab_target.offset().left);
  };
  theming_print_pixels_size = function(width, height) {
    width = $("#single_theming_data_cont > div").outerWidth(true);
    height = $("#single_theming_data_cont > div").outerHeight(true);
    $("#single_dimensions_cont").html(width + "x" + height);
  };
  $(function() {
    $("#tab_selector button").on('click', function() {
      if ($(this).hasClass("active")) {
        return true;
      }
      $("#tab_selector button.active").removeClass("active");
      $(this).addClass("active");
      $('html,body').stop().animate({
        scrollLeft: $("#" + $(this).data("id")).offset().left
      }, 500);
    });
    $(".tab_buttons_cont button").on('click', function(e) {
      if ($(this).hasClass("active")) {
        return true;
      }
      $(this).siblings(".active").removeClass("active");
      $(this).addClass("active");
      manage_boxes_inside_tabs($(this).parents(".tab"));
    });
    $(window).resize(function() {
      resize_tab_containers();
    });
    $("#slider_hori").slider({
      min: 0,
      max: 796,
      value: 796,
      slide: function(event, ui) {
        var single_height;
        $("#single_theming_data_cont").css("width", ui.value);
        if ($("#autoheight").hasClass("auto")) {
          single_height = 370 - parseInt($("#single_theming_data_cont").css("height"), 10);
          $("#slider_vert").slider("value", single_height);
        }
        return theming_print_pixels_size();
      }
    });
    $("#autowidth").on("click", function() {
      var disabled, old_height, value;
      if ($("#single_theming_data_cont").data("original_width") === void 0) {
        $("#single_theming_data_cont").data("original_width", $("#single_theming_data_cont").css("width"));
      }
      if ($(this).hasClass("auto")) {
        $(this).removeClass("auto");
        old_height = $("#single_theming_data_cont").data("old_width");
        $("#single_theming_data_cont").css("width", old_height);
        value = "On";
        disabled = false;
      } else {
        $(this).addClass("auto");
        old_height = $("#single_theming_data_cont").css("width");
        $("#single_theming_data_cont").data("old_width", old_height);
        $("#single_theming_data_cont").css("width", $("#single_theming_data_cont").data("original_width"));
        value = "Off";
        disabled = true;
      }
      $("#slider_hori").slider("option", "disabled", disabled);
      $(this).html(value);
      theming_print_pixels_size();
    });
    $("#slider_vert").slider({
      min: 0,
      max: 370,
      orientation: 'vertical',
      slide: function(event, ui) {
        var value;
        value = 370 - ui.value;
        $("#single_theming_data_cont").css("height", value);
        return theming_print_pixels_size();
      }
    });
    $("#autoheight").on("click", function() {
      var disabled, single_height, value;
      if ($(this).hasClass("auto")) {
        $(this).removeClass("auto");
        $("#single_theming_data_cont").css("height", 370 - $("#slider_vert").slider("value"));
        value = "On";
        disabled = false;
      } else {
        $(this).addClass("auto");
        $("#single_theming_data_cont").css("height", 'auto');
        single_height = 370 - parseInt($("#single_theming_data_cont").css("height"), 10);
        $("#slider_vert").slider("value", single_height);
        value = "Off";
        disabled = true;
      }
      $("#slider_vert").slider("option", "disabled", disabled);
      $(this).html(value);
      theming_print_pixels_size();
    });
    skroutz.widgets.Templator({
      plugin_name: "skroutz_popup",
      loader_url: loader_url,
      default_themes: popup_default_themes,
      list_of_theme_buttons: $("#popup_div .theming_layouts_cont button"),
      list_of_color_buttons: $("#popup_div .theming_pickers_cont input"),
      list_of_reset_buttons: $("#popup_div .theming_pickers_cont button"),
      list_of_additional_params: $("#popup_div .theming_data_inputs_cont input"),
      demo_cont_el: $("#popup_div .theming_data_cont"),
      pre_cont_el: $("#popup_div .theming_pre_cont")
    });
    skroutz.widgets.Templator({
      plugin_name: "skroutz_single",
      loader_url: loader_url,
      default_themes: single_default_themes,
      list_of_theme_buttons: $("#single_div .theming_layouts_cont button"),
      list_of_color_buttons: $("#single_div .theming_pickers_cont input"),
      list_of_reset_buttons: $("#single_div .theming_pickers_cont button"),
      list_of_additional_params: $("#single_div .theming_data_inputs_cont input"),
      demo_cont_el: $("#single_div .theming_data_cont"),
      pre_cont_el: $("#single_div .theming_pre_cont")
    });
  });
  $(window).load(function() {
    setTimeout(function() {
      var single_height;
      $(".tab_extern_cont").show();
      manage_boxes_inside_tabs();
      $('html,body').scrollLeft(0);
      resize_tab_containers();
      single_height = 370 - parseInt($("#single_theming_data_cont").css("height"), 10);
      $("#slider_vert").slider("value", single_height);
      $("#autoheight").click();
      $("#autowidth").click();
    }, 10);
  });
}).call(this);
