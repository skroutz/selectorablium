(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  (function($, window, document) {
    var Selectorableium, data_arr, defaults, pluginName;
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
        console.log(this.options.baseUrl + this.options.data_name + ".json?query=testa");
        $.ajax({
          url: this.options.baseUrl + this.options.data_name + ".json?query=testa",
          type: "get",
          dataType: "json",
          success: __bind(function(a, b, c) {
            console.log("success", a, b, c);
          }, this),
          error: __bind(function(a, b, c) {
            console.log("error", a, b, c);
          }, this),
          complete: __bind(function(XHRobj, status) {
            console.log("complete", XHRobj, status);
            window.c = XHRobj;
          }, this)
        });
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
    return data_arr = [
      {
        "name": "1-click",
        "id": 526
      }, {
        "name": "123-mpomponieres",
        "id": 813
      }, {
        "name": "123market",
        "id": 337
      }, {
        "name": "1store",
        "id": 775
      }, {
        "name": "24eshop",
        "id": 965
      }, {
        "name": "2click",
        "id": 731
      }, {
        "name": "2ft",
        "id": 924
      }, {
        "name": "2panda",
        "id": 817
      }, {
        "name": "3-S",
        "id": 1009
      }, {
        "name": "5050",
        "id": 356
      }, {
        "name": "@e-mail",
        "id": 1121
      }, {
        "name": "@shop",
        "id": 13
      }, {
        "name": "A&K accessories",
        "id": 710
      }, {
        "name": "Aadigitalphoto",
        "id": 1122
      }, {
        "name": "Aatsenergy",
        "id": 1191
      }, {
        "name": "Abestprime",
        "id": 1278
      }, {
        "name": "Accesstore",
        "id": 969
      }, {
        "name": "Acestore",
        "id": 1124
      }, {
        "name": "Achilleas Accessories ",
        "id": 1238
      }, {
        "name": "Achro",
        "id": 669
      }, {
        "name": "AcornShop",
        "id": 22
      }, {
        "name": "Action Items",
        "id": 1403
      }, {
        "name": "Activate",
        "id": 485
      }, {
        "name": "Active",
        "id": 624
      }, {
        "name": "ActiveSport",
        "id": 928
      }, {
        "name": "Adagio",
        "id": 243
      }, {
        "name": "Adorama",
        "id": 66
      }, {
        "name": "Advancedclima",
        "id": 1163
      }, {
        "name": "Aerostato Toys",
        "id": 701
      }, {
        "name": "Af-sports",
        "id": 1405
      }, {
        "name": "Agelopoulos Shop",
        "id": 1327
      }, {
        "name": "Agmrecruitment",
        "id": 1225
      }, {
        "name": "Agnytha",
        "id": 666
      }, {
        "name": "Agora",
        "id": 741
      }, {
        "name": "Agoraseto",
        "id": 1200
      }, {
        "name": "Agorazoome",
        "id": 1207
      }, {
        "name": "Airblock",
        "id": 839
      }, {
        "name": "Akalavrentzos",
        "id": 1065
      }, {
        "name": "Aleamarket",
        "id": 663
      }, {
        "name": "Alexopoulos Electronics",
        "id": 946
      }, {
        "name": "Alfalens",
        "id": 814
      }, {
        "name": "Alifragis",
        "id": 823
      }, {
        "name": "All electronic's world",
        "id": 699
      }, {
        "name": "All-Wear",
        "id": 483
      }, {
        "name": "Allforgarden",
        "id": 787
      }, {
        "name": "Allstore",
        "id": 1287
      }, {
        "name": "Allvoip",
        "id": 484
      }, {
        "name": "Alook4it",
        "id": 1230
      }, {
        "name": "Alpha Clima Gr",
        "id": 934
      }, {
        "name": "Alpha Sport and Models",
        "id": 1202
      }, {
        "name": "Amdigitalphoto",
        "id": 490
      }, {
        "name": "Amtel",
        "id": 541
      }, {
        "name": "Amw",
        "id": 709
      }, {
        "name": "Anatello",
        "id": 1162
      }, {
        "name": "Anelpako",
        "id": 808
      }, {
        "name": "Angelzzz",
        "id": 662
      }, {
        "name": "Anthemion",
        "id": 1056
      }, {
        "name": "Anthi-Fyta",
        "id": 533
      }, {
        "name": "Antoniadis",
        "id": 425
      }, {
        "name": "Antrin",
        "id": 1424
      }, {
        "name": "Anybody",
        "id": 964
      }, {
        "name": "aPazari",
        "id": 1239
      }, {
        "name": "Apiastos",
        "id": 495
      }, {
        "name": "Apotheka",
        "id": 1330
      }, {
        "name": "Apothema",
        "id": 303
      }, {
        "name": "Apothiki Hi-Fi",
        "id": 1051
      }, {
        "name": "Archlight",
        "id": 1301
      }, {
        "name": "Armaos Telecom",
        "id": 1018
      }, {
        "name": "Aromatica",
        "id": 355
      }, {
        "name": "Artandlight",
        "id": 1229
      }, {
        "name": "Artcool",
        "id": 926
      }, {
        "name": "Arte Piedi",
        "id": 599
      }, {
        "name": "Artis",
        "id": 648
      }, {
        "name": "Artsound",
        "id": 327
      }, {
        "name": "Asam",
        "id": 1160
      }, {
        "name": "Asimenio",
        "id": 381
      }, {
        "name": "Assos-shop",
        "id": 764
      }, {
        "name": "Astra Service",
        "id": 1215
      }, {
        "name": "Astrivoice",
        "id": 612
      }, {
        "name": "Astro",
        "id": 739
      }, {
        "name": "AthleticShop",
        "id": 1114
      }, {
        "name": "Athlotypo",
        "id": 695
      }, {
        "name": "Atpc",
        "id": 1134
      }, {
        "name": "Atsidas",
        "id": 349
      }, {
        "name": "Audioshop",
        "id": 257
      }, {
        "name": "Audioshow",
        "id": 523
      }, {
        "name": "Auto-View",
        "id": 1181
      }, {
        "name": "Autobeat",
        "id": 1090
      }, {
        "name": "Autoextra",
        "id": 792
      }, {
        "name": "Automobileclub",
        "id": 998
      }, {
        "name": "Autospark",
        "id": 980
      }, {
        "name": "Avalon Golden Store",
        "id": 646
      }, {
        "name": "Avoutlet",
        "id": 391
      }, {
        "name": "Avproshop",
        "id": 487
      }, {
        "name": "Axel",
        "id": 971
      }, {
        "name": "Axion Technology",
        "id": 675
      }, {
        "name": "AZshop",
        "id": 931
      }, {
        "name": "Bablis",
        "id": 633
      }, {
        "name": "Babymodi",
        "id": 1411
      }, {
        "name": "BabyMoo",
        "id": 947
      }, {
        "name": "Backshop Hellas",
        "id": 762
      }, {
        "name": "Bagz",
        "id": 1243
      }, {
        "name": "Baladeur",
        "id": 262
      }, {
        "name": "Bank-Electric",
        "id": 1157
      }, {
        "name": "Barcode24",
        "id": 1353
      }, {
        "name": "Batteries",
        "id": 330
      }, {
        "name": "Battery24",
        "id": 453
      }, {
        "name": "Batteryforyou",
        "id": 730
      }, {
        "name": "Beaute beaute",
        "id": 1012
      }, {
        "name": "Beauty Paths",
        "id": 647
      }, {
        "name": "BeautyFactor",
        "id": 829
      }, {
        "name": "Bebe-shop",
        "id": 1284
      }, {
        "name": "Bebelicious",
        "id": 1085
      }, {
        "name": "Best Phone",
        "id": 1260
      }, {
        "name": "Bestar",
        "id": 1060
      }, {
        "name": "Zupermarket",
        "id": 714
      }, {
        "name": "\u0391\u03c0\u03bf\u03c3\u03c4\u03bf\u03bb\u03cc\u03c0\u03bf\u03c5\u03bb\u03bf\u03c2",
        "id": 508
      }, {
        "name": "\u0391\u03c1\u03b9\u03c3\u03c4\u03b5\u03c1\u03cc\u03c7\u03b5\u03b9\u03c1\u03b1\u03c2",
        "id": 586
      }, {
        "name": "\u0391\u03c6\u03bf\u03b9 \u0393\u03b5\u03c9\u03c1\u03b3\u03af\u03bf\u03c5",
        "id": 777
      }, {
        "name": "\u0392\u03b1\u03c3\u03b9\u03bb\u03b5\u03af\u03bf\u03c5 \u0397\u03bb\u03b5\u03ba\u03c4\u03c1\u03b1\u03b3\u03bf\u03c1\u03ac",
        "id": 1286
      }, {
        "name": "\u0393\u03c1\u03b1\u03bc\u03bc\u03ae",
        "id": 64
      }, {
        "name": "\u0393\u03c1\u03b7\u03b3\u03bf\u03c1\u03b9\u03ac\u03b4\u03b7\u03c2",
        "id": 609
      }, {
        "name": "\u0394\u03b5\u03c1\u03bc\u03ac\u03c4\u03b9\u03bd\u03b1 100",
        "id": 717
      }, {
        "name": "\u0394\u03b9\u03ac\u03c0\u03bb\u03bf\u03c5\u03c2",
        "id": 636
      }, {
        "name": "\u0394\u03af\u03ba\u03c5\u03ba\u03bb\u03bf",
        "id": 537
      }, {
        "name": "\u0388\u03bd\u03c4\u03b5\u03c7\u03bd\u03bf",
        "id": 591
      }, {
        "name": "\u0395\u03c5\u03c3\u03c4\u03b1\u03b8\u03af\u03bf\u03c5",
        "id": 545
      }, {
        "name": "\u0397\u03bb\u03b5\u03ba\u03c4\u03c1\u03bf\u03bd\u03b9\u03ba\u03ac \u0391\u03bd\u03c4\u03c9\u03bd\u03afo\u03c5",
        "id": 635
      }, {
        "name": "\u0397\u03bb\u03b5\u03ba\u03c4\u03c1\u03bf\u03bd\u03b9\u03ba\u03ae",
        "id": 681
      }, {
        "name": "\u0397\u03c7\u03bf\u03ad\u03ba\u03c6\u03c1\u03b1\u03c3\u03b7",
        "id": 379
      }, {
        "name": "\u0397\u03c7\u03bf\u03ba\u03af\u03bd\u03b7\u03c3\u03b7",
        "id": 1247
      }, {
        "name": "\u0389\u03c7\u03bf\u03c2 \u0395\u03b9\u03ba\u03cc\u03bd\u03b1",
        "id": 469
      }, {
        "name": "\u039a\u03b5\u03c7\u03c1\u03b9\u03bc\u03c0\u03ac\u03c1\u03b9",
        "id": 581
      }, {
        "name": "\u039a\u03bf\u03c5\u03ba\u03bf\u03c5",
        "id": 865
      }, {
        "name": "\u039a\u03c9\u03c3\u03c4\u03af\u03ba\u03b1 \u039c\u03ac\u03c1\u03ba\u03b5\u03c4",
        "id": 664
      }, {
        "name": "\u039b\u03b7\u03bc\u03bd\u03b1\u03af\u03bf\u03c2",
        "id": 476
      }, {
        "name": "\u039b\u03b7\u03c4\u03ce",
        "id": 314
      }, {
        "name": "\u039f\u03c0\u03c4\u03b9\u03ba\u03ac \u0391\u03b2\u03c1\u03ac\u03bc\u03b7\u03c2",
        "id": 1061
      }, {
        "name": "\u039f\u03c1\u03b8\u03bf\u03c0\u03b5\u03b4\u03b9\u03ba\u03cc\u03c2 \u039a\u03cc\u03c3\u03bc\u03bf\u03c2 \u039a\u03c5\u03c6\u03af\u03b4\u03b7\u03c2",
        "id": 749
      }, {
        "name": "\u03a0\u03bb\u03b1\u03af\u03c3\u03b9\u03bf",
        "id": 11
      }, {
        "name": "\u03a1\u03b5\u03c0\u03ad\u03bb\u03bb\u03b1",
        "id": 522
      }, {
        "name": "\u03a3\u03b2\u03bf\u03cd\u03c1\u03b1",
        "id": 455
      }, {
        "name": "\u03a4\u03c3\u03ad\u03bb\u03b9\u03bf\u03c2",
        "id": 332
      }, {
        "name": "\u03a6\u03c5\u03c4\u03ce\u03c1\u03b9\u03b1 \u0391\u03bd\u03c4\u03b5\u03bc\u03b9\u03c3\u03ac\u03c1\u03b7",
        "id": 1039
      }, {
        "name": "\u03a7\u03b1\u03bc\u03cc\u03b3\u03b5\u03bb\u03bf \u03c4\u03bf\u03c5 \u03a0\u03b1\u03b9\u03b4\u03b9\u03bf\u03cd",
        "id": 667
      }, {
        "name": "\u03a7\u03c1\u03ce\u03bc\u03b1\u03c4\u03b1",
        "id": 1096
      }, {
        "name": "\u03a9\u03b4\u03ad\u03c2",
        "id": 457
      }
    ];
  })(jQuery, window, document);
}).call(this);
