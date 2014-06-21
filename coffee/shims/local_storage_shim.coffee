define ->
  class LocalStorageShim
    @instance: null
    constructor: ->
      return LocalStorageShim.instance unless LocalStorageShim.instance is null
      @length = 0
      @_data = {}
      LocalStorageShim.instance = @

    getItem: (key) ->
      value = @_data[key]
      return null if value is undefined
      value

    setItem: (key, value) ->
      @_data[key] = value
      @length += 1
      true

    removeItem: (key) ->
      return false unless @_data[key]
      @_data[key] = null
      delete @_data[key]
      @length -= 1
      true

    clear: ->
      @length = 0
      @_data[item] = null for item of @_data
      @_data = {}
      true

    key: (index) ->
      i = 0
      for key, value of @_data
        return key if i is index
        i++
      false

  return LocalStorageShim