(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  (function($, window, document) {
    var Selectorableium, defaults, pluginName;
    pluginName = "Selectorableium";
    defaults = {
      minCharsForRemoteSearch: 2,
      baseUrl: "/earth/",
      localCacheTimeout: 7 * 24 * 60 * 60 * 1000,
      XHRTimeout: 1200,
      maxResultsNum: 10
    };
    Selectorableium = function(element, options) {
      if (!$.fn.toolsfreak) {
        return false;
      }
      if (!$.fn.storagefreak) {
        return false;
      }
      this.timers_func = $.fn.toolsfreak.timers_handler();
      window.b = this.timers_func;
      this.el = $(element).attr("autocomplete", "off");
      this.options = $.extend({}, defaults, options);
      if (!this.options.instance_name || this.options.instance_name === "") {
        this.__error('objectCreation', "no instance_name specified on params");
        return false;
      }
      this.db = null;
      this.db_prefix = "skr." + this.options.instance_name + ".";
      this.el_container = null;
      this.el_top = null;
      this.el_inner_container = null;
      this.el_input = null;
      this.el_list_cont = null;
      this.query = "";
      this.queryLength = "";
      this.data = null;
      this.result_list = null;
      this.selected_item = null;
      this.items_list = null;
      this.init();
    };
    Selectorableium.prototype = {
      name: pluginName,
      defaults: defaults,
      init: function() {
        this.makeDbPreparation();
        this.createHtmlElements();
        this.registerEventHandlers();
      },
      makeDbPreparation: function() {
        this.db = Selectorableium.getLocalDBObj();
        Selectorableium.initiateLocalData.call(this);
      },
      createHtmlElements: function() {
        this.el_container = $('<div class="selectorableium_cont">').css({
          width: this.el.outerWidth(),
          minHeight: this.el.outerHeight()
        });
        this.el_container.append('<div class="top"></div><div class="inner_container clearfix"><form><input name="var_name"></form><ul class="list_container"></ul></div>');
        this.el_top = this.el_container.find(".top").css('height', this.el.outerHeight(true));
        this.el_inner_container = this.el_container.find(".inner_container");
        this.el_input = this.el_container.find("input").attr("autocomplete", "off");
        this.el_list_cont = this.el_container.find(".list_container");
        this.el.parent().css('position', 'relative').append(this.el_container);
      },
      registerEventHandlers: function() {
        this.el_top.on('click', __bind(function(e) {
          if (this.el_inner_container.is(":visible")) {
            this.hide();
          } else {
            this.el_inner_container.slideDown(200);
          }
          this.el_input.focus();
        }, this));
        this.el_container.on('click', function(e) {
          return e.stopPropagation();
        });
        $("html").on('click', __bind(function(e) {
          this.hide();
        }, this));
        if (window.opera || $.browser.mozilla) {
          this.el_input.on('keypress', __bind(function(e) {
            return this.onKeyPress(e);
          }, this));
        } else {
          this.el_input.on('keydown', __bind(function(e) {
            return this.onKeyPress(e);
          }, this));
        }
        this.el_input.on('keyup', __bind(function(e) {
          return this.onKeyUp(e);
        }, this));
      },
      hide: function() {
        if (this.el_inner_container.is(":visible")) {
          this.el_inner_container.slideUp(200);
          this.el_input.val("");
          this.el_list_cont.empty();
        }
      },
      onKeyPress: function(e) {
        console.log("KeyPress:", e.keyCode);
        switch (e.keyCode) {
          case 27:
            this.hide();
            break;
          case 38:
            this.moveSelectedElement("up");
            return false;
          case 40:
            this.moveSelectedElement("down");
            return false;
          case 13:
            this.activateTheSelectedItem();
            return false;
            return true;
          case 37:
            return true;
          case 39:
            return true;
          case 8:
            return true;
          default:
            return;
        }
        e.stopImmediatePropagation();
        e.preventDefault();
      },
      onKeyUp: function(e) {
        console.log("KeyUp:", e.keyCode);
        switch (e.keyCode) {
          case 16:
          case 17:
          case 37:
          case 38:
          case 39:
          case 40:
          case 27:
          case 13:
            return false;
        }
        this.query = this.el_input.val().trim();
        this.queryLength = this.query.length;
        this.beginLocalSearchFor(this.query);
        if (this.queryLength >= this.options.minCharsForRemoteSearch) {
          this.timers_func.endAndStart(__bind(function() {
            this.beginRemoteSearchFor(this.query);
          }, this), this.options.XHRTimeout, "RemoteSearchTimeout");
        }
        return false;
      },
      beginLocalSearchFor: function(query) {
        this.makeSuggestionListFor(query);
      },
      beginRemoteSearchFor: function(query) {
        console.log("REMOTE FOR: " + query);
      },
      makeSuggestionListFor: function(query) {
        var lowerQuery, result_list, value, _i, _len, _ref;
        result_list = [];
        lowerQuery = query.toLowerCase();
        _ref = this.data;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          value = _ref[_i];
          if (value.name.toLowerCase().indexOf(lowerQuery) !== -1) {
            result_list.push(value);
          }
        }
        this.result_list = result_list.slice(0, this.options.maxResultsNum);
        this.printSuggestionList(query);
      },
      printSuggestionList: function(cached_result) {
        var a, fragment, item, li, me, _i, _len, _ref;
        this.el_list_cont.empty();
        fragment = document.createDocumentFragment();
        _ref = this.result_list;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          li = document.createElement("li");
          a = document.createElement("a");
          a.className = "item";
          a.setAttribute("data-value", item.id);
          a.setAttribute("href", "#");
          a.appendChild(document.createTextNode(item.name));
          li.appendChild(a);
          fragment.appendChild(li);
        }
        this.el_list_cont.append(fragment);
        this.el_list_cont[0].innerHTML += '';
        this.items_list = this.el_list_cont.find(".item");
        me = this;
        this.items_list.on('mouseenter', {
          me: me
        }, function() {
          return me.selectThisItem($(this));
        });
        this.items_list.on('click', {
          me: me
        }, function() {
          console.log(me, "here");
          return me.activateTheSelectedItem();
        });
        this.selected_item = this.el_list_cont.find(".item:first").addClass("selected");
        this.highlightTextAndItem();
      },
      highlightTextAndItem: function() {
        if (this.query !== "") {
          this.items_list.each(__bind(function(index, element) {
            var item_name, regEXP;
            item_name = $(element).html();
            if (this.query !== "") {
              regEXP = new RegExp("(" + this.query + ")", "ig");
              item_name = item_name.replace(regEXP, "<span class='highlight'>$1</span>");
            }
            $(element).html(item_name);
          }, this));
        }
      },
      activateTheSelectedItem: function() {
        this.el.html('<option value="' + this.selected_item.data("value") + '">' + this.selected_item.text() + '</option>');
        this.hide();
        return false;
      },
      selectThisItem: function(element) {
        if (this.selected_item !== null) {
          this.selected_item.removeClass("selected");
          this.selected_item = null;
        }
        this.selected_item = element.addClass("selected");
      },
      moveSelectedElement: function(direction) {
        var count, custom_index, index;
        count = this.items_list.length;
        index = this.items_list.index(this.selected_item) + count;
        if (direction === "up") {
          custom_index = index - 1;
        } else if (direction === "down") {
          custom_index = index + 1;
        }
        index = custom_index % count;
        this.selectThisItem(this.items_list.filter(".item:nth(" + index + ")"));
      },
      updateLocalDB: function(response_data) {
        var index, items, manufacturer, my_regexp, new_categories_list, new_list, new_manufacturer_list, old_list, product_list, product_manufacturer, responce_item, updated_manufacturer_list;
        product_list = [];
        new_manufacturer_list = [];
        new_categories_list = [];
        updated_manufacturer_list = [];
        for (index in response_data) {
          responce_item = response_data[index];
          if (responce_item.t === "m") {
            new_manufacturer_list.push(responce_item);
          } else if (responce_item.t === "c") {
            new_categories_list.push(responce_item);
          } else if (responce_item.t === "b") {
            this.we_have_books = true;
          } else if (responce_item.t === "k") {
            my_regexp = new RegExp(" ", "ig");
            product_manufacturer = responce_item.m.replace(my_regexp, "_").toLowerCase();
            if (product_list[product_manufacturer] === void 0) {
              product_list[product_manufacturer] = [];
            }
            product_list[product_manufacturer] = product_list[product_manufacturer].concat([responce_item]);
            new_manufacturer_list.push({
              n: responce_item.m,
              t: "m"
            });
          }
        }
        this.list_of_manufacturers = this.concatSliceUnique(this.list_of_manufacturers, new_manufacturer_list, 0, this.options.numberOfLocalManufacturers, true);
        this.db.set("list_of_m", this.list_of_manufacturers);
        this.list_of_categories = this.concatSliceUnique(this.list_of_categories, new_categories_list, 0, this.options.numberOfLocalCategories, true);
        this.db.set("list_of_c", this.list_of_categories);
        for (manufacturer in product_list) {
          items = product_list[manufacturer];
          old_list = this.db.get("products_of_" + manufacturer);
          new_list = this.concatSliceUnique(old_list, items, 0, this.options.numberOfLocalProducts, true);
          this.db.set("products_of_" + manufacturer, new_list);
        }
      },
      limitSuggestionResults: function(data_arrays) {
        var books_list, cat_length, cat_start_length, i, manu_length, manu_start_length, manus_length, max_slots, prod_length, prod_start_length, prods_length, result_list, round, temp_manu_array, which_manu;
        result_list = [];
        books_list = [];
        prod_start_length = data_arrays.product_starting_match.length;
        i = 0;
        while (i < prod_start_length && i < 3) {
          prods_length = data_arrays.product_starting_match[i].products.length;
          if (prods_length > 3) {
            prods_length = 3;
          }
          data_arrays.product_starting_match[i].products = data_arrays.product_starting_match[i].products.splice(0, prods_length);
          data_arrays.product_starting_match[i].filter = "prod_start";
          result_list = result_list.concat(data_arrays.product_starting_match[i]);
          i += 1;
        }
        manu_start_length = data_arrays.manufacturer_starting_match.length;
        i = 0;
        while (i < manu_start_length && i < 3) {
          manus_length = data_arrays.manufacturer_starting_match[i].products.length;
          if (manus_length > 3) {
            manus_length = 3;
          }
          data_arrays.manufacturer_starting_match[i].products = data_arrays.manufacturer_starting_match[i].products.splice(0, manus_length);
          data_arrays.manufacturer_starting_match[i].filter = "manu_start";
          result_list = result_list.concat(data_arrays.manufacturer_starting_match[i]);
          i += 1;
        }
        cat_start_length = data_arrays.category_starting_match.length;
        i = 0;
        while (i < cat_start_length && i < 3) {
          data_arrays.category_starting_match[i].filter = "cat_start";
          result_list = result_list.concat(data_arrays.category_starting_match[i]);
          i += 1;
        }
        console.log(data_arrays);
        prod_length = data_arrays.product_match.length;
        i = 0;
        while (i < prod_length && i < 3) {
          prods_length = data_arrays.product_match[i].products.length;
          if (prods_length > 3) {
            prods_length = 3;
          }
          data_arrays.product_match[i].products = data_arrays.product_match[i].products.splice(0, prods_length);
          data_arrays.product_match[i].filter = "prod";
          result_list = result_list.concat(data_arrays.product_match[i]);
          i += 1;
        }
        max_slots = 10;
        i = 0;
        round = 0;
        which_manu = 0;
        manu_length = data_arrays.manufacturer_match.length;
        if (manu_length > 3) {
          manu_length = 3;
        }
        temp_manu_array = {};
        if (manu_length > 0) {
          while (1) {
            if (i >= max_slots || round >= max_slots) {
              break;
            }
            if (data_arrays.manufacturer_match[which_manu].products.length === 0 && temp_manu_array[which_manu] === void 0) {
              temp_manu_array[which_manu] = round;
              i += 1;
            } else if (data_arrays.manufacturer_match[which_manu].products[round] !== void 0) {
              temp_manu_array[which_manu] = round;
              i += 1;
            }
            which_manu = which_manu + 1;
            if ((which_manu % manu_length) === 0) {
              which_manu = 0;
              round += 1;
            }
          }
        }
        i = 0;
        while (i < manu_length) {
          data_arrays.manufacturer_match[i].products = data_arrays.manufacturer_match[i].products.splice(0, parseInt(temp_manu_array[i]) + 1);
          data_arrays.manufacturer_match[i].filter = "manu";
          result_list = result_list.concat(data_arrays.manufacturer_match[i]);
          i++;
        }
        cat_length = data_arrays.category_match.length;
        i = 0;
        while (i < cat_length && i < 3) {
          data_arrays.category_match[i].filter = "cat";
          result_list = result_list.concat(data_arrays.category_match[i]);
          i += 1;
        }
        /*
                max_cat_length = @options.numberOfMatchedCategories
                top_cat_length = top_categories_list.length
                if top_cat_length > max_cat_length
                  top_cat_length = max_cat_length
                top_categories_list = top_categories_list.splice 0, top_cat_length
                result_list = result_list.concat top_categories_list
        
                prod_manu_length = matched_products_list.length
                i = 0
                while i < @options.numberOfUnmatchedManufacturersWithMatchInProductName and i < prod_manu_length
                  prods_length = matched_products_list[i].products.length
                  if prods_length > @options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
                    prods_length = @options.numberOfProductsOfUnmatchedManufacturersWithMatchInProductName
                  matched_products_list[i].products = matched_products_list[i].products.splice 0, prods_length
                  matched_products_list[i].filter = "matched_prods"
                  result_list = result_list.concat matched_products_list[i]
                  i += 1
                
                max_slots = @options.numberOfMatchedManufacturers * @options.numberOfProductsPerMatchedManufacturer
                i=0
                round = 0
                which_manu = 0
                manu_length = manufacturers_list.length
                if manu_length > @options.numberOfMatchedManufacturers
                  manu_length = @options.numberOfMatchedManufacturers
                temp_manu_array = {}
                if manu_length > 0
                  #do a round robin for manufacturers and get the max quantity of product per manu 
                  while 1
                    break if i >= max_slots or round >= max_slots
                    if manufacturers_list[which_manu].products.length is 0 and temp_manu_array[which_manu] is undefined
                      temp_manu_array[which_manu] = round
                      i += 1
                    else if manufacturers_list[which_manu].products[round] isnt undefined
                      temp_manu_array[which_manu] = round
                      i += 1
                    which_manu = which_manu + 1
                    if (which_manu % manu_length) is 0
                      which_manu = 0
                      round += 1
                i=0
                while i < manu_length
                  manufacturers_list[i].products = manufacturers_list[i].products.splice(0, parseInt(temp_manu_array[i]) + 1)
                  manufacturers_list[i].filter = "matched_manus"
                  result_list = result_list.concat manufacturers_list[i]
                  i++
                
                available_cat_length = max_cat_length - top_cat_length
                cat_length = categories_list.length
                if cat_length > max_cat_length
                  cat_length = max_cat_length
                if available_cat_length < cat_length
                  cat_length = available_cat_length
                categories_list = categories_list.splice 0, (max_cat_length - top_cat_length)
                result_list = result_list.concat categories_list
                result_list = result_list.concat books_list
              */
        return result_list;
      },
      fix_container_location: function() {
        var elOuterHeight, minWidth, offset;
        offset = this.el.offset();
        elOuterHeight = this.el.outerHeight();
        minWidth = this.el.outerWidth();
        if (this.options.minWidth > this.el.outerWidth()) {
          minWidth = this.options.minWidth;
        }
        return this.suggestions_container.css({
          top: (offset.top + elOuterHeight) + "px",
          left: offset.left + "px",
          minWidth: minWidth
        });
      },
      cleanQuery: function(query) {
        var arr, d;
        if (typeof query !== "string") {
          return false;
        }
        d = this.options.delimiter;
        if (d) {
          arr = query.split(d);
          query = arr[arr.length - 1];
        }
        if (query.charAt(0) === " ") {
          query = query.slice(1);
        }
        return query;
      },
      isForbiddenQuery: function(query) {
        if (query.search(/([ ]|[ ].)$/) !== -1) {
          return true;
        }
        return false;
      },
      showSpinner: function() {
        return $("#" + this.options.spinnerSelectorID).show();
      },
      hideSpinner: function() {
        return $("#" + this.options.spinnerSelectorID).hide();
      },
      __dbGet: function(name) {
        return this.db.get(this.db_prefix + name);
      },
      __dbSet: function(name, data) {
        return this.db.set(this.db_prefix + name, data);
      },
      __error: function(message, func_name) {
        var name, where, x;
        if (func_name) {
          x = message;
          message = func_name;
          func_name = x;
        }
        name = (this.options.instance_name ? this.options.instance_name : "[" + this.name + "]");
        where = "@" + name + ":";
        if (func_name) {
          where = func_name + where;
        }
        $.fn.toolsfreak.error_func(message, where);
      }
    };
    Selectorableium.getLocalDBObj = function() {
      try {
        return $.fn.storagefreak();
      } catch (e) {
        this.__error('getLocalDBObj', "could not get StorageFreak object");
        return null;
      }
    };
    Selectorableium.initiateLocalData = function() {
      var current_timestamp;
      current_timestamp = new Date().getTime();
      this.local_db_timestamp = this.__dbGet("timestamp");
      if (this.local_db_timestamp !== false) {
        this.local_db_timestamp = parseInt(this.local_db_timestamp, 10);
      }
      if (this.local_db_timestamp === false || (current_timestamp - this.local_db_timestamp) > this.options.localCacheTimeout) {
        try {
          $.ajax({
            url: this.options.baseUrl + this.options.data_name + ".json",
            type: "get",
            dataType: "json",
            success: __bind(function(data) {
              this.__dbSet("timestamp", new Date().getTime());
              this.__dbSet(this.options.data_name + "_data", data);
            }, this),
            error: __bind(function(a, b, c) {
              this.__error('initiateLocalData', "XHR error");
            }, this)
          });
        } catch (e) {
          this.__error('initiateLocalData', "catched XHR error");
          return false;
        }
      }
      this.data = this.__dbGet(this.options.data_name + "_data");
    };
    $.fn.Selectorableium = function(options) {
      this.each(function() {
        if (!$.data(this, pluginName)) {
          $.data(this, pluginName, new Selectorableium(this, options));
        }
      });
    };
  })(jQuery, window, document);
}).call(this);
