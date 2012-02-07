;(($, window, document) ->
  #private
  pluginName = "storagefreak"
  defaults = dummy_var: null

  #public stuff
  StorageFreak = (element, options) ->
    @element = element
    @options = $.extend({}, defaults, options)
    @_defaults = defaults
    @_name = pluginName
    @localStorageSupport = false;
    @init()
  
  NOLocalStorageClass = () ->
    @length = 0
    @NOLocalData = {}
    
    @getItem = (key) => 
      value = @NOLocalData[key]
      return null if value is undefined
      return value
    
    @setItem = (key, value) =>
      @NOLocalData[key] = value
      @length += 1
      return true
    
    @clear = =>
      @length = 0
      delete @NOLocalData
      @NOLocalData = {}
      return true
    
    @key = (index) =>
      i = 0
      for key, value of @NOLocalData
        return key if i is index
        i++
      return false
    return

  StorageFreak:: =
    init: ->
      return  if StorageFreak.instance?
      StorageFreak.obj_count++
      @my_count = StorageFreak.obj_count
      @localStorageSupport = StorageFreak.localStorage_support()
      if @localStorageSupport isnt true
        @localStorage = new NOLocalStorageClass()
      else
        @localStorage = localStorage
      
      return
    
    toString: ->
      @_name
    
    get_instance: ->
      StorageFreak.instance
    
    get_objcount: -> 
      StorageFreak.obj_count
    
    local_available: ->
      @localStorageSupport
    
    get: (key) ->
      return false if typeof (key) isnt "string" or key is ""
      try
        value = JSON.parse( @localStorage.getItem(key) );
      catch e
        return false;
      (if (value is null or value is "") then false else value)

    set: (key, value) -> 
      return false if typeof(key) isnt "string" or key is ""
      return false if value is `undefined` or value is null

      try
        @localStorage.setItem key, JSON.stringify(value)
      catch e
        return false
      true
    length: ->
      try
        return @localStorage.length
      catch e
        return false
    
    del: (key) ->
      return false if typeof (key) isnt "string" or key is ""
      if @get(key) is false
        false
      else
        @set key, ""
    del_all: ->
      try
        @localStorage.clear()
      catch e
        return false
      
      true

    find_index_by_key: (key) ->
      return false if typeof (key) isnt "string" or key is ""
      number_of_tuples = @length()
      temp_key = null
      i = 0
      while i < number_of_tuples
        temp_key = @find_key_by_index(i)
        return i if temp_key is key
        i++
      
      false
    
    find_value_by_key: (key) ->
      @get(key)
    
    find_key_by_index: (index) ->
      return false if typeof(index) isnt "number"
      temp_length = @length()
      return false if index < 0 || index >= temp_length
      try
        return @localStorage.key(index)
      catch e
        return false
    
    find_value_by_index: (index) ->
      return false if typeof(index) isnt "number"
      try
        return @get( @find_key_by_index(index) )
      catch e
        return false

    find_key_by_value: (value) ->
      return false if value is `undefined` or value is null or value is ""
      number_of_tuples = @length()
      temp_key = null
      temp_value = null
      i = 0

      while i < number_of_tuples
        temp_key = @find_key_by_index(i)
        temp_value = @get(temp_key)
        return temp_key if temp_value is value
        i++
      
      false;
    
    find_index_by_value: (value) ->
      return false if value is `undefined` or value is null or value is ""
      number_of_tuples = @length()
      temp_key = null
      temp_value = null
      i = 0

      while i < number_of_tuples
        temp_key = @find_key_by_index(i)
        temp_value = @get(temp_key)
        return i if temp_value is value
        i++
      
      false;
    
    get_all_values: ->
      values = []
      number_of_tuples = @length()
      temp_value = null
      i = 0

      while i < number_of_tuples
        temp_value = @find_value_by_index(i)
        values.push temp_value
        i++
      values
    
    get_all_keys: ->
      array_of_keys = [];
      number_of_tuples = @length();
      temp_key = null;
      i = 0
      while i < number_of_tuples
        temp_key = @find_key_by_index(i)
        array_of_keys.push temp_key
        i++
      array_of_keys;
    
  #private stuff
  StorageFreak.instance = null
  StorageFreak.obj_count = 0
  StorageFreak.local = false

  StorageFreak.JSON_support = ->
    try
      return "JSON" of window and window["JSON"] isnt null
    catch e
      return false

  StorageFreak.localStorage_support = ->
    try
      return ("localStorage" of window and window["localStorage"] isnt null)
    catch e
      return false
  
  #jQuery Stuff
  $.fn.storagefreak = (options) ->
    if StorageFreak.JSON_support() is false
      $.getScript "assets/json2.js"
    unless StorageFreak.instance?
      StorageFreak.instance = new StorageFreak(null, options)    
    return StorageFreak.instance

) jQuery, window, document