( ($, window, document) ->
  ##PRIVATE PROPERTIES
  pluginName = "selectorablium"
  defaults   =
    minCharsForRemoteSearch    : 3
    localCacheTimeout          : 7 * 24 * 60 * 60 * 1000 #milliseconds #one week
    XHRTimeout                 : 650 #milliseconds
    maxResultsNum              : 10
    maxNewResultsNum           : 5
    list_of_replacable_chars   : [
        ["ά", "α"],
        ['έ', 'ε'],
        ['ή', 'η'],
        ['ί', 'ι'],
        ['ό', 'ο'],
        ['ύ', 'υ'],
        ['ώ', 'ω']
      ]
  
  Selectorablium = (element, options) ->
    return false unless $.fn.toolsfreak
    return false unless $.fn.storagefreak
    @timers_func           = $.fn.toolsfreak.timers_handler()
    @el                    = $(element).attr("autocomplete", "off")
    @options               = $.extend {}, defaults, options

    if !@options.app_name or @options.app_name is ""
      @__error 'objectCreation', "no app_name specified on params"
      return false
    
    @options.url           = @el.data "url"
    @options.query_string  = @el.data "query"
    @options.data_name     = @el.data "name"
    
    @options.default_value = @el.data "default_value"    || 0
    @options.default_text  = @el.data "default_text"     || "Please select an option"
    @options.selected_id   = @el.data "selected_id" || null

    @db                    = null
    @db_prefix             = "skr." + @options.app_name + "." + pluginName + "."
    
    @el_container          = null
    @el_top                = null
    @el_inner_container    = null
    @el_input              = null
    @el_list_cont          = null
    @el_XHRCounter         = null
    @el_loader             = null
    @el_clear              = null
    @el_initial_loader     = null
    
    @query                 = ""
    @queryLength           = ""
    
    @data                  = null
    @result_list           = null
    @selected_item         = null
    @items_list            = null
    @result_to_prepend     = []
    @no_results            = false
    @do_not_hide_me        = false
    @got_focused           = false
    
    @init()
    
    return

  Selectorablium:: =
    name     : pluginName
    defaults : defaults
    
    init: ->
      @createHtmlElements()
      @makeDbPreparation()
      @registerEventHandlers()
      return
    
    makeDbPreparation: ->
      @db = Selectorablium.getLocalDBObj()
      Selectorablium.initiateLocalData.call this
      return

    createHtmlElements: ->
      @el_container = $('<div class="selectorablium_cont">').css
        width     : @el.outerWidth()
        minHeight : @el.outerHeight()
      
      HTML_string  = '<div class="top">'
      HTML_string += '<div class="initial_loader">Loading initial data...</div>'
      HTML_string += '<a class="cancel_button">Clear</a>'
      HTML_string += '</div>'
      HTML_string += '<div class="inner_container clearfix">'
      HTML_string += '<form>'
      HTML_string += '<input name="var_name">'
      HTML_string += '<span class="input_icon"></span>'
      HTML_string += '<div class="loader"></div>'
      HTML_string += '<div class="XHRCounter"></div>'
      HTML_string += '</form>'
      HTML_string += '<ul class="list_container"></ul>'
      HTML_string += '</div>'
      @el_container.append HTML_string
      
      @el_top             = @el_container.find(".top").css 'height', @el.outerHeight(true)
      @el_inner_container = @el_container.find(".inner_container")
      @el_input           = @el_container.find("input").attr("autocomplete", "off")
      @el_list_cont       = @el_container.find(".list_container")
      @el_XHRCounter      = @el_container.find(".XHRCounter")
      @el_loader          = @el_container.find(".loader")
      @el_clear           = @el_container.find(".cancel_button").css 
        'height'     : @el.outerHeight(true) + "px",
        'lineHeight' : @el.outerHeight(true) + "px"

      @el_initial_loader  = @el_container.find(".initial_loader")
      
      
      @el.parent().css('position','relative').append @el_container
      @el.html('<option value="' + @options.default_value + '">' + @options.default_text + '</option>')
      @el.css
        'borderBottomRightRadius': 0
        'borderTopRightRadius': 0
      return

    registerEventHandlers: ->
      @el_top.on 'click', (e) =>
        if @el_inner_container.is(":visible")
          @hide()
        else 
          #WAIT FOR INITIAL DATA TO LOAD
          if @el_top.hasClass("disabled") is false
            @el_container.addClass("active")
            @el.addClass("active")
            @el_inner_container.slideDown(200)
            @el_input.focus()

        return
      
      @el.on 'focus', (e) =>
        if @el_inner_container.is(":visible")
          @hide()
        else 
          #WAIT FOR INITIAL DATA TO LOAD
          if @el_top.hasClass("disabled") is false
            @el_container.addClass("active")
            @el.addClass("active")
            @el_inner_container.slideDown(200)
            @el_input.focus()

        return
      
      @el_container.on 'click', (e)=>
        @do_not_hide_me = true
        return
      
      @el_clear.on 'click', (e)=>
        e.stopPropagation()
        @resetSelectItem()
        return false

      $("html").on 'click', (e)=>
        if @do_not_hide_me is true
          @do_not_hide_me = false
        else
          @hide()
        return

      if window.opera or $.browser.mozilla
        @el_input.on 'keypress', (e) =>
          @onKeyPress e
      else
        @el_input.on 'keydown', (e) =>
          @onKeyPress e
      
      @el_input.on 'keyup', (e) =>
        @onKeyUp e
      
      return
    
    hide: ->
      if @el_inner_container.is(":visible")
        @el_container.removeClass("active")
        @el.removeClass("active")
        @el_inner_container.slideUp(200)
        @el_input.val("")
        @el_list_cont.empty()
        @el_loader.hide()
        @el_XHRCounter.hide()
        @selected_item = null
        @timers_func.end("RemoteSearchTimeout")
        @query = ""
      return

    onKeyPress: (e) ->
      switch e.keyCode
        when 9 #tab
          if @selected_item
            @activateTheSelectedItem()
          else  
            @hide()
          return true
        when 27 #esc
          @hide()
        when 38 #up
          @moveSelectedElement("up")
          return false
        when 40 #down
          @moveSelectedElement("down")
          return false
        when 13 #enter
          @activateTheSelectedItem()
          return false
          # if @selected_suggest_item isnt null and @suggestions_container.is(":visible")
          #   @el.parents("form").attr( "action", @selected_suggest_item.attr("href") )
          return true
        when 37 #left
          return true
        when 39 #right
          return true
        when 8 #backspace
          return true
        else
          return
        
      e.stopImmediatePropagation()
      e.preventDefault()
      return
    
    onKeyUp: (e) ->
      switch e.keyCode
        #KEYS SHIFT, CTRL, ALT, LEFT, UP, RIGHT, DOWN, ESC, ENTER, WIN KEY, CAPS LOCK, PAGEUP, PAGEDOWN, HOME, END, INSERT, TAB
        when 16, 17, 18, 37, 38, 39, 40, 27, 13, 91, 20, 33, 34, 35, 36, 45, 9
          return false
      
      @query = @el_input.val().trim()
      @queryLength = @query.length
      
      if @queryLength is 0 
        @el_list_cont.empty()
        @selected_item = null
        @timers_func.end("RemoteSearchTimeout")
        @el_loader.hide()
        @el_XHRCounter.hide()
      else
        ##BENCHMARKING STUFF##
          # @start_timestamp = new Date().getTime()
        query = @query
        @beginLocalSearchFor query
        if query.length >= @options.minCharsForRemoteSearch #and @query.indexOf(@last_invalid_query) is -1
          @showCountdownForXHR()
          @timers_func.endAndStart =>
              @el_loader.show()
              @beginRemoteSearchFor query
              return
            , @options.XHRTimeout
            ,"RemoteSearchTimeout"
        else
          @timers_func.end("RemoteSearchTimeout")
          @el_loader.hide()
          @el_XHRCounter.hide()
            
      return false
    
    showCountdownForXHR: ->
      @el_loader.hide()
      @el_XHRCounter.stop(true, true).css("width", "0").show()
      @el_XHRCounter.animate 
        width: "100%"
      , @options.XHRTimeout
      , =>
        @el_XHRCounter.hide()
        return
      
      return

    beginLocalSearchFor: (query) ->
      @makeSuggestionListFor query
      return
    
    beginRemoteSearchFor: (query) ->
      params = {}
      params[@options.query_string] = query

      $.getJSON @options.url, params, (response_data) =>
        we_have_new_results = false
        for value in response_data
          if !@data[value.id]
            we_have_new_results = true
            @result_to_prepend.push {id: value.id, name: value.name}
            @data[value.id] = value.name
        if we_have_new_results and query is @query
          @el_list_cont.find(".empty-message").remove()
          @__dbSet @options.data_name + "_data", @data
          @result_to_prepend = @result_to_prepend.sort (a,b) -> 
            if (a.name < b.name)
                return -1
            else
                return 1
          @result_to_prepend = @result_to_prepend.slice 0, @options.maxNewResultsNum
          @insertNewResults(query)

        else
          @el_list_cont.find(".empty-message").text("No results found")
        @el_loader.hide()
        return
      
      return
    
    insertNewResults: (query) ->
      fragment = document.createDocumentFragment()

      for item in @result_to_prepend
        li = document.createElement "li"
        a = document.createElement "a"
        a.className = "item"
        a.className += " ajaxed"
        a.setAttribute "data-value", item.id
        a.setAttribute "href", "#"
        a.setAttribute "style", "display:none"
        a.appendChild document.createTextNode item.name
        li.appendChild a
        fragment.appendChild li
      @el_list_cont.prepend fragment
      @el_list_cont[0].innerHTML += ''
      
      new_items = @el_list_cont.find(".item.ajaxed")
      
      #make an animation for the newly brought items
      sliding_timer = 0
      new_items.each (index, item)=>
        setTimeout =>
          $(item).slideDown(70)
          return 
        , sliding_timer
        sliding_timer += 100
        return

      @items_list = @el_list_cont.find(".item")
      @selected_item = @el_list_cont.find(".selected")

      me = this
      @items_list.on 'mouseenter', {me}, ->
        me.selectThisItem $(this)
      @items_list.on 'click', {me}, ->
        me.activateTheSelectedItem()
      
      @highlightTextAndItems(new_items)
      @result_to_prepend = []
      return
    
    removeAccents: (string) ->
      new_string = string
      for index, value of @options.list_of_replacable_chars
        new_string = new_string.replace(value[0],value[1])

      return new_string

    makeSuggestionListFor: (query) ->
      result_list = []
      canonical_query = @removeAccents query.toLowerCase()
      ##BENCHMARKING STUFF##
        # count = 0
      for id, name of @data
        ##BENCHMARKING STUFF##
          # count +=1
        ## TODO convert it to REXEXP.test
        canonical_name = @removeAccents name.toLowerCase()
        result_list.push({id: id, name: name}) if canonical_name.indexOf(canonical_query) isnt -1
      ##BENCHMARKING STUFF##
        # console.log "searched:" + count
      
      if result_list.length is 0
        @no_results = true
      
      @result_list = result_list.slice 0, @options.maxResultsNum
      
      @result_list = @result_list.sort (a,b) -> 
        if (a.name < b.name)
            return -1
        else
            return 1
      
      @printSuggestionList(query)
      return
    
    printSuggestionList: (cached_result) ->
      @el_list_cont.empty()

      fragment = document.createDocumentFragment()
      if @result_list.length is 0
        li = document.createElement "li"
        p = document.createElement "p"
        p.className = "empty-message"
        p.setAttribute "href", "#"
        p.appendChild document.createTextNode "loading..."
        li.appendChild p
        fragment.appendChild li
        @el_list_cont.append fragment
        @el_list_cont[0].innerHTML += ''
      else
        for item in @result_list
          li = document.createElement "li"
          a = document.createElement "a"
          a.className = "item"
          a.setAttribute "data-value", item.id
          a.setAttribute "href", "#"
          a.appendChild document.createTextNode item.name
          li.appendChild a
          fragment.appendChild li
        @el_list_cont.append fragment
        @el_list_cont[0].innerHTML += ''
        
        ##BENCHMARKING STUFF##
          # @end_timestamp = new Date().getTime()
          # console.log "ms for search and print:" + (parseInt(@end_timestamp,10) - parseInt(@start_timestamp,10))

        @items_list = @el_list_cont.find(".item")

        me = this
        @items_list.on 'mouseenter', {me}, ->
          me.selectThisItem $(this)
        @items_list.on 'click', {me}, ->
          me.activateTheSelectedItem()
        
        @selected_item = @el_list_cont.find(".item:first").addClass("selected")
        
        @highlightTextAndItems()
      return 

    highlightTextAndItems: (items) ->
      if @query isnt ""
        item_to_highlight = items || @items_list
        item_to_highlight.each (index, element) => 
          item_name = $(element).html()
          if @query isnt ""

            new_string = @query
            for index, value of @options.list_of_replacable_chars
              regEXP = new RegExp value[1], "ig"
              new_string = new_string.replace regEXP, "(?:" + value[0] + "|" + value[1] + ")"
              delete regEXP
            
            regEXP = new RegExp "(" + new_string + ")", "ig"
            item_name = item_name.replace(regEXP, "<span class='highlight'>$1</span>")
            delete regEXP
          $(element).html(item_name)
          return         
        
      return
    
    resetSelectItem: () ->
      @el.html('<option value="' + @options.default_value + '">' + @options.default_text + '</option>')
      @hide()
      return

    activateTheSelectedItem: () ->
      @el.html('<option value="' + @selected_item.data("value") + '" selected="selected">   ' + @selected_item.text() + '</option>')
      @hide()
      return false

    selectThisItem: (element) ->
      if @selected_item isnt null
        @selected_item.removeClass("selected")
        @selected_item = null
      
      @selected_item = element.addClass("selected")
      return 
    
    moveSelectedElement: (direction) ->
      count = @items_list.length
      index = @items_list.index(@selected_item) + count
      
      if direction is "up"
        custom_index = index - 1
      else if direction is "down"
        custom_index = index + 1
      index = custom_index % count

      @selectThisItem @items_list.filter(".item:nth(" + index + ")")
      return
    
    setSelectItem: (params, type) ->
      my_type = type || "refresh"
      if typeof params is 'object'
        value = params.value
        text  = params.text
      else if typeof params is 'number'
        if @data and @data[params]
          value = params
          text  = @data[params]
        else
          if Selectorablium.makeWholeDumpXHR.call( this, {type: my_type} ) is true
            if @data and @data[params]
              value = params
              text  = @data[params]
            else
              return false
          else
            return false

      @el.html('<option value="' + value + '" selected="selected">   ' + text + '</option>')
      @hide()
      return true
    
    refreshData: ->
      if (@data = @__dbGet @options.data_name + "_data") isnt false
        return true
      else 
        return false
      
    showPreSelectedItem: ->
      if @options.selected_id
        @setSelectItem @options.selected_id, "preselected"
      return

    __dbGet: (name)->
      return @db.get @db_prefix + name

    __dbSet: (name, data)->
      return @db.set( @db_prefix + name, data )
    
    __error: (message, func_name) ->
      if func_name
        x = message
        message = func_name
        func_name = x
      
      name = (if @options.app_name then @options.app_name else "[" + @name + "]" )
      where = "@" + name + ":"
      if func_name
        where = func_name + where
      
      $.fn.toolsfreak.error_func message, where

      return
  
  ##PRIVATE STATIC METHODS
  Selectorablium.getLocalDBObj = ->
    try
      return $.fn.storagefreak()
    catch e
      @__error 'getLocalDBObj', "could not get StorageFreak object"
      return null

  Selectorablium.makeWholeDumpXHR = (params) ->
    if params and params.type and params.type is "initial"
      error_string_where = 'initiateLocalData'
      type               = "initial"
      my_async           = true
    else if params and params.type and params.type is "refresh"
      error_string_where = 'refreshXHRForSetSelectItem'
      type               = "refresh"
      my_async           = false
      return_value       = false
    else if params and params.type and params.type is "preselected"
      error_string_where = 'XHRForPreselectedItem'
      type               = "preselected"
      my_async           = true

    try
      $.ajax
        url: @options.url
        type: "get"
        dataType: "json"
        async: my_async
        success: (data)=>
          new_data = {}
          result = {}
          
          length = 0
          for index, value of data
            new_data[value.id] = value.name
            length += 1
          
          ##BENCHMARKING CODE##
            # for iteration in [1..150000]
            #   # console.log iteration, iteration % length
            #   result[iteration] = new_data[iteration % length]
            #   i = iteration
            # console.log "setted" + @options.data_name + ":" + i
            ##change below new_data to result##

          if @__dbSet(@options.data_name + "_data", new_data) is false
            @__error error_string_where, "error storing '" + @options.data_name + "' initial data to localStorage"
            return false
          else
            if @__dbSet(@options.data_name + "_timestamp", new Date().getTime()) is false
              @__error error_string_where, "error storing timestamp" + @options.app_name
              return false
            
            @data = new_data
            if type is "initial"
              @showPreSelectedItem()
              @el_initial_loader.fadeOut()
              @el_top.removeClass "disabled"
            
          return_value = true
          return true
        error: (a,b,c)=>
          @__error error_string_where, "XHR error"
          return_value = false
          return false

    catch e
      @__error error_string_where, "catched XHR error"
      return_value = false

    return return_value

  Selectorablium.initiateLocalData = () ->
    current_timestamp = new Date().getTime()
    @local_db_timestamp = @__dbGet @options.data_name + "_timestamp"
    
    if @local_db_timestamp isnt false
      @local_db_timestamp = parseInt @local_db_timestamp, 10
    
    if @local_db_timestamp is false or (current_timestamp - @local_db_timestamp) > @options.localCacheTimeout
      @el_initial_loader.show()
      @el_top.addClass "disabled"

      #MAKE THE XHR
      Selectorablium.makeWholeDumpXHR.call this, {type: "initial"}

    else
      @data = @__dbGet @options.data_name + "_data"
      @showPreSelectedItem()

    return

  $.fn.Selectorablium = (options) ->
    @each ->
      $.data this, pluginName, new Selectorablium(this, options)  unless $.data(this, pluginName)
      return
    
    return
  
  return
) jQuery, window, document
