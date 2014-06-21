define ['shims/local_storage_shim'], (LocalStorageShim)->
  # TODO ADD JSON2 SHIM
  #jQuery Stuff
  # $.getScript "assets/json2.js" if StorageFreak.JSON_support() is false

  class StorageFreak
    @instance: null
    @get_localStorage_obj = ->
      try
        if "localStorage" of window and window["localStorage"] isnt null
          return window.localStorage
        else
          return new LocalStorageShim()
      catch
        return new LocalStorageShim()

    constructor: ->
      return StorageFreak.instance unless StorageFreak.instance is null
      @localStorage = StorageFreak.get_localStorage_obj()
      StorageFreak.instance = @

    get: (key) ->
      return false if typeof key isnt 'string' or key is ''

      try
        value = JSON.parse @localStorage.getItem(key)
      catch
        return false

      if value is null or value is '' then false else value

    set: (key, value) ->
      return false if typeof key isnt 'string' or key is ''
      return false if value is null or value is undefined

      try
        @localStorage.setItem key, JSON.stringify(value)
      catch
        return false

      true

  return StorageFreak