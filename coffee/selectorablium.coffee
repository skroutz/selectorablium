define [
  'jquery'
  'storage_freak'
], ($, StorageFreak)->

  class Selectorablium
    defaults:
      minCharsForRemoteSearch  : 3
      localCacheTimeout        : 7 * 24 * 60 * 60 * 1000 #milliseconds #one week
      XHRTimeout               : 650 #milliseconds
      debounceInterval         : 150 #milliseconds
      maxResultsNum            : 10
      default_value            : 0
      default_text             : 'Please select an option'
      selected_id              : null
      list_of_replacable_chars : [
        ['ά', 'α'],
        ['έ', 'ε'],
        ['ή', 'η'],
        ['ί', 'ι'],
        ['ό', 'ο'],
        ['ύ', 'υ'],
        ['ώ', 'ω']
      ]

    _required: [
      'app_name'
      'url'
      'query'
      'name'
      'minCharsForRemoteSearch'
      'XHRTimeout'
      'list_of_replacable_chars'
      'localCacheTimeout'
    ]

    template: """
        <div class="selectorablium_cont">
          <div class="top">
            <div class="initial_loader">Loading initial data...</div>
            <a class="clear_button">Clear</a>
          </div>
          <div class="inner_container">
            <form>
              <input autocomplete="off" name="var_name">
              <span class="input_icon"></span>
              <div class="loader"></div>
              <div class="XHRCounter"></div>
            </form>
            <ul class="list_container"></ul>
          </div>
        </div>
      """

    timer: 0

    constructor: (element, options)->
      return new Selectorablium(element, options) if @ instanceof Selectorablium is false
      throw new Error('Element argument is required') if !element
      @$el = $(element)

      @options  = options
      @metadata = @$el.data()
      @config   = $.extend {}, @defaults, @metadata, @options
      for attr in @_required
        throw new Error("'#{attr}' option is required") if !@config[attr]

      @state = 'disabled'
      @shift_pressed = false

      @structure = []
      @indexed_structure = {}

      @$result_items  = []
      @events_handled = []

      @db = new StorageFreak @config

      @_createHtmlElements()
      @_registerEventHandlers()

      @data_ready_dfd = @db.init()
      @data_ready_dfd.then @_onDBReady

    ################
    ## PUBLIC API ##
    ################
    cleanup: ->
      @db.cleanup()

      for item in @events_handled
        item[0].off.apply item[0], item[1]

      @$container.remove()
      @$el.unwrap()
      @$outer_container.remove()

    then: (success, fail)-> @data_ready_dfd.then(success, fail)

    reset: -> @_insertOptionElement @config.default_value, @config.default_text

    set: (key, value = null)->
      ##TODO:
      # if key and value
      ## UPDATE DATABASE
      if value is null
        value = @db.searchByKey key
        return false if value is false

      @_insertOptionElement key, value
      @_hide()
      return true

    add: (key, value)-> @db.add(key, value)

    ## PRIVATE ##
    _createHtmlElements: ->
      @$el.wrap $('<div class="selectorablium_outer_cont">')
      @$outer_container = @$el.parent()
      @$outer_container.append @template

      @$container       = @$outer_container.find('.selectorablium_cont')
      @$top             = @$container.find('.top')
      @$top_loader      = @$container.find('.initial_loader')
      @$inner_container = @$container.find('.inner_container')
      @$input           = @$container.find('input')
      @$results_list    = @$container.find('.list_container')
      @$XHR_counter     = @$container.find('.XHRCounter')
      @$XHR_loader      = @$container.find('.loader')
      @$clear_button    = @$container.find('.clear_button')

      @reset()

    _registerEventHandlers: ->
      @_addHandler @$top,          'click', @_togglePlugin
      @_addHandler @$el,           'focus', @_togglePlugin
      @_addHandler @$container,    'click', @_onContainerClick
      @_addHandler @$clear_button, 'click', @_onClearButtonClick
      @_addHandler $('html'),      'click', @_onHTMLClick
      @_addHandler @$input,        'keyup', @_onKeyUp
      @_addHandler @$input,        @_keyPressEventName(), @_onKeyPress
      @_addHandler @$results_list, 'mouseenter', '.item', @_onItemMouseEnter
      @_addHandler @$results_list, 'click',      '.item', @_activateSelectedItem

      # Internal Events
      @db.on 'dbcreate_start',        @_onDBCreateStart
      @db.on 'dbcreate_end',          @_onDBCreateEnd
      @db.on 'dbremote_search_in',    @_onDBSearchIn
      @db.on 'dbremote_search_start', @_onDBSearchStart
      @db.on 'dbremote_search_end',   @_onDBSearchEnd
      @db.on 'dbremote_search_error', @_onDBSearchError
      @db.on 'dbremote_search_reset', @_onDBSearchReset
      @db.on 'dbsearch_results',      @_onDBSearchResults

    _togglePlugin: (e)=>
      switch @state
        when 'disabled' then return
        when 'visible' then @_hide()
        when 'ready'
          ## TODO REMOVE THE IF
          ## TODO CATCH SHIFT+TAB AND GO TO PREVIOUS FOCUSABLE ELEMENT
          @_show() if @$inner_container.is(':visible') is false

    _onContainerClick: (e)=> @do_not_hide_me = true

    _onClearButtonClick: (e)=>
      @_clearSelectedItem(e)
      return false

    _clearSelectedItem: (e)=>
      @reset()
      @_hide()
      @$el.trigger("change")

    _onHTMLClick: (e)=>
      ## TODO: REFACTOR: THIS IS REGISTERED MULTIPLE TIMES
      if @do_not_hide_me is true then @do_not_hide_me = false else @_hide()

    _onItemMouseEnter: (e)=> @_selectItem $(e.currentTarget)

    _activateSelectedItem: (e)=>
      if @selected_item
        @_insertOptionElement @selected_item.data('value'), @selected_item.text()
        @$el.trigger("change")
      @_hide()
      return false

    _onKeyPress: (e)=>
      ## TODO REFACTOR RETURN VALUES
      switch e.keyCode
        when 16 then @shift_pressed = true #shift
        when 27 then @_hide() #esc
        when 38 then @_moveSelectedItem('up')   #up
        when 40 then @_moveSelectedItem('down') #down
        when 13 then @_activateSelectedItem() #enter
        when 9 #tab
          @_activateSelectedItem()
          # if @shift_pressed focus_next_focusable()
          # return false
          return true
        else return true
      return false

    _onKeyUp: (e)=>
      switch e.keyCode
        #KEYS SHIFT, CTRL, ALT, LEFT, UP, RIGHT, DOWN, ESC, ENTER, WIN KEY, CAPS LOCK, PAGEUP, PAGEDOWN, HOME, END, INSERT, TAB
        ## MAYBE JUST RETURN??
        when 17, 18, 37, 38, 39, 40, 27, 13, 91, 20, 33, 34, 35, 36, 45, 9 then return false
        when 16 #shift
          @shift_pressed = false
          return false

      @_resetContainer()
      @selected_item = null

      @query = $.trim @$input.val()
      if @query.length is 0
        @_resetSelectedItem()
        return false

      search_func = => @db.search @query

      clearTimeout @timer
      @timer = setTimeout search_func, @config.debounceInterval

      return false

    _onDBReady: (data)=>
      @set @config.selected_id if @config.selected_id
      @state = 'ready'

    _onDBCreateStart: =>
      @state = 'disabled'
      @$top_loader.show()
      @$top.addClass 'disabled'

    _onDBCreateEnd: =>
      @$top_loader.hide()
      @$top.removeClass 'disabled'

    _onDBSearchIn: (time)=> @_showXHRCountdown time

    _onDBSearchStart: =>
      ## MAYBE REDUNDANT?
      @_hideXHRCountdown()
      @$XHR_loader.show()

    _onDBSearchEnd: => @$XHR_loader.hide()

    _onDBSearchError: (xhr)=> @$XHR_loader.hide()

    _onDBSearchReset: =>
      ## MAYBE REDUNDANT?
      @_hideXHRCountdown()
      @$XHR_loader.hide()

    _onDBSearchResults: (results, query, xhr = false)=>
      return unless query is @query

      @_updateStructure(results, xhr)
      @_highlightResults(query)

      @$result_items = @_appendResults(query)
      @$result_items.filter('.new').hide().slideToggle()

      if (selected_item = @$result_items.filter('.selected')).length is 0
        selected_item = @$result_items.first()

      @_selectItem(selected_item)

    _updateStructure:(results, xhr)->
      @structure = []
      new_keys = {}

      for result in results
        new_keys[result.id] = true
        new_item =
          id       : result.id
          name     : result.name
          template : ''
          selected : false
          fresh    : !!xhr

        if @indexed_structure[result.id]
          new_item = $.extend(new_item, @indexed_structure[result.id])

        @indexed_structure[result.id] = new_item
        @structure.push new_item

      # Clean up @indexed_structure
      for key, value of @indexed_structure
        if !new_keys[key]
          @indexed_structure[key] = null
          delete @indexed_structure[key]

      return @structure

    _highlightResults: (query) ->
      re = @_createAccentIndependentRE(query)

      for item in @structure
        item.template = item.name.replace(re, '<span class="highlight">$1</span>')

    _appendResults: (query)->
      @$results_list.empty()
      @$results_list.append @_createTemplate(query)
      return @$results_list.find('.item')

    _createTemplate: (query)->
      items_templates = []

      ## TODO REFACTOR
      if @structure.length is 0
        text = 'No results found'
        ## TODO: if @state isnt 'XHR'
        # text = 'Loading...' if query.length >= @config.minCharsForRemoteSearch
        items_templates.push "<li><p class='empty-message'>#{text}</p></li>"
      else
        for item in @structure
          class_name = 'item'
          class_name += ' new' if item.fresh is true
          class_name += ' selected' if item.selected is true

          items_templates.push "<li><a href='#' class='#{class_name}' data-value='#{item.id}'>#{item.template}</a></li>"
          item.fresh    = false

      items_templates.join('\n')

    ## HELPERS ##
    _createAccentIndependentRE: (query)->
      for value in @config.list_of_replacable_chars
        re = new RegExp "#{value[0]}|#{value[1]}", 'ig'
        query = query.replace re, "(?:#{value[0]}|#{value[1]})"

      re = null
      return new RegExp "(#{query})", 'ig'

    _addHandler: ($element, on_args...)->
      $element.on.apply $element, on_args
      @events_handled.push [$element, on_args]

    ## TODO: MAYBE REMOVE THIS??
    _keyPressEventName: ->
      ff_ua_match = window.navigator.userAgent.match(/Firefox\/\d+\.\d+\.\d+/)
      if window.opera or !!ff_ua_match then 'keypress' else 'keydown'

    _insertOptionElement: (value, text)-> @$el.html("<option value=\"#{value}\">#{text}</option>")

    _showXHRCountdown: (milliseconds)->
      @$XHR_counter.stop(true, true).css('width', '0').show()
      @$XHR_counter.animate {width:'100%'}, milliseconds, -> $(this).hide()

    _hideXHRCountdown: -> @$XHR_counter.stop(true, true).hide()

    _show: ->
      @$container.addClass('active')
      @$el.addClass('active')
      @$inner_container.slideDown(200)
      @$input.focus()
      @state = 'visible'

    _hide: ->
      return unless @state is 'visible'
      # CSS
      @$container.removeClass('active')
      @$el.removeClass('active')
      @$inner_container.slideUp(200)

      @_resetSelectedItem()
      @_resetContainer()

      ## TODO: DOES THAT TRIGGER ANOTHER EVENT?
      @$input.val('')

      # STATE
      @query = ''
      @state = 'ready'

    _resetContainer: ->
      @$results_list.empty()
      @$XHR_loader.hide()
      @_hideXHRCountdown()

    _resetSelectedItem: ->
      return unless @selected_item
      ref = @indexed_structure[@selected_item.data('value')]
      ref and ref.selected = false

      @selected_item.removeClass('selected')
      @selected_item = null

    _selectItem: ($item)->
      return unless $item and $item.length isnt 0

      @_resetSelectedItem()

      @selected_item = $item.addClass('selected')
      @indexed_structure[$item.data('value')].selected = true

    _getNextItem: (direction)->
      count = @$result_items.length

      ## TODO: REFACTOR THAT
      index = @$result_items.index(@selected_item) + count
      custom_index = if direction is 'up' then index - 1 else index + 1
      new_index = custom_index % count

      $(@$result_items.get(new_index))

    _moveSelectedItem: (direction)->
      return unless @selected_item
      $item = @_getNextItem(direction)
      @_selectItem $item

  return Selectorablium
