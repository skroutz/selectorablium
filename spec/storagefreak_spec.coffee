cleanup_tests = ->
  it 'triggers "dbremote_search_reset" event', ->
    spy = sinon.spy()
    @instance.on 'dbremote_search_reset', spy
    @instance.search(@query)

    expect(spy).to.be.calledOnce

  context 'when a timeout is pending', ->
    it 'clears the timeout', ->
      spy = sinon.spy(window, 'clearTimeout')
      timeout_val = @instance.timeout
      @instance.search(@query)

      expect(spy.args[0][0]).to.equal(timeout_val)
      spy.restore()

  context 'when an XHR has already been triggered', ->
    it 'aborts the XHR', ->
      @clock.tick(@instance.config.XHRTimeout + 100)
      spy = sinon.spy @instance.XHR_dfd, 'abort'
      @instance.search(@query)

      expect(spy).to.be.calledOnce
      spy.restore()

describe 'StorageFreak', ->
  @timeout(0)

  before (done)->
    @respondJSON = (json_data)->
      @requests[0].respond 200, { "Content-Type": "application/json" }, json_data

    [@shops_obj, @makers_obj] = fixture.load('shops.json', 'makers.json')
    @makers_json = JSON.stringify @makers_obj
    @shops_json  = JSON.stringify @shops_obj

    @init_options =
      url : 'dummy_url'
      name : 'a_select'
      query : 'get_param_key'
      app_name : 'test'
      maxResultsNum: 5
      XHRTimeout : 650
      localCacheTimeout : 6000
      minCharsForRemoteSearch : 5
      list_of_replacable_chars : [
        ['ά', 'α'],
        ['έ', 'ε'],
        ['ή', 'η'],
        ['ί', 'ι'],
        ['ό', 'ο'],
        ['ύ', 'υ'],
        ['ώ', 'ω']
      ]

    require [
      'storage_freak'
      'shims/local_storage_shim'
    ], (StorageFreak, LocalStorageShim)=>
      @LocalStorageShim = LocalStorageShim
      @StorageFreak = StorageFreak
      done()

  beforeEach ->
    @requests = []
    @xhr = sinon.useFakeXMLHttpRequest()
    @xhr.onCreate = (xhr)=> @requests.push xhr

  afterEach ->
    @xhr.restore()
    @instance and @instance.cleanup()
    localStorage and localStorage.clear()

  describe '.constructor', ->
    it 'returns an instance when called without new', ->
      @instance = @StorageFreak(@init_options)
      expect(@instance).to.be.instanceof(@StorageFreak)

    it 'thows if not all required options are given', ->
      expect(@StorageFreak).to.throw(/option is required/)

    it 'creates @_db_prefix', ->
      @instance = @StorageFreak(@init_options)
      expect(@instance._db_prefix).to.equal('selectorablium.test')

    it 'creates @_data_key', ->
      @instance = @StorageFreak(@init_options)
      expect(@instance._data_key).to.equal('a_select_data')

    it 'creates @_timestamp_key', ->
      @instance = @StorageFreak(@init_options)
      expect(@instance._timestamp_key).to.equal('a_select_timestamp')

    it 'creates @_data', ->
      @instance = @StorageFreak(@init_options)
      expect(@instance._data).to.eql({})

    it 'creates @_events', ->
      @instance = @StorageFreak(@init_options)
      expect(@instance._events).to.eql({})

    it 'gets @_storage', ->
      @instance = @StorageFreak(@init_options)
      expect(@instance._storage).to.be.empty

    context 'when window.localStorage is available', ->
      beforeEach ->
        if !window.localStorage
          @prev = window.localStorage
          window.localStorage = null

      afterEach ->
        @prev and window.localStorage = @prev

      it 'references @_storage to localStorage', ->
        @instance = @StorageFreak(@init_options)
        expect(@instance._storage).to.equal(window.localStorage)

    xcontext 'when window.localStorage is not available', ->
      beforeEach ->
        ## DOES NOT WORK
        @prev = window.localStorage
        window.localStorage = null

      afterEach ->
        window.localStorage = @prev

      it 'references @_storage to localStorageShim', ->
        @instance = @StorageFreak(@init_options)
        expect(@instance._storage).to.be.instanceof(@LocalStorageShim)

  describe 'on', ->
    beforeEach ->
      @instance = @StorageFreak(@init_options)
      @event_name = 'event_name'
      @func = ->

    it 'registers data', ->
      @instance.on @event_name, @func
      expect(@instance._events)
       .to.have.property(@event_name)
       .that.is.an('array')
       .with.deep.property('[0]')
       .to.include
          callback: @func
          context: null

    it 'registers third argument as context', ->
      test_obj = {koko:'lala'}
      @instance.on @event_name, @func, test_obj

      expect(@instance._events)
       .to.have.property(@event_name)
       .that.is.an('array')
       .with.deep.property('[0]')
       .to.include
          callback: @func
          context: test_obj

    it 'defaults context to null', ->
      @instance.on @event_name, @func

      expect(@instance._events)
       .to.have.property(@event_name)
       .that.is.an('array')
       .with.deep.property('[0]')
       .to.include
          callback: @func
          context: null

    it 'registers multiple calls with the same event_name', ->
      @instance.on @event_name, @func
      @instance.on @event_name, @func

      expect(@instance._events)
       .to.have.property(@event_name)
       .that.is.an('array')
       .to.have.length(2)

  describe 'init', ->
    beforeEach ->
      @instance = @StorageFreak(@init_options)

    context 'when storage has no data', ->
      beforeEach ->
        @instance._storage.clear()

      it 'returns a Deferred object', ->
        result = @instance.init()
        expect(result).to.respondTo('then')

      it 'makes a GET JSON XHR', ->
        @instance.init()
        expect(@requests).to.have.length(1)

      context 'before the XHR resolves', ->
        it 'triggers a "dbcreate_start" event', ->
          spy = sinon.spy()
          @instance.on 'dbcreate_start', spy
          @instance.init()
          expect(spy).to.be.calledOnce

        it 'does not add new data to storage', ->
          @instance.init()
          expect(@instance._get(@instance._data_key))
            .to.equal(false)

        it 'does not add data_timestamp to storage', ->
          @instance.init()
          expect(@instance._get(@instance._timestamp_key))
            .to.equal(false)

        it 'does not trigger a "dbcreate_end" event', ->
          spy = sinon.spy()
          @instance.on 'dbcreate_end', spy
          @instance.init()
          expect(spy).to.not.be.called

        it 'does not resolve the returned deferred', ->
          result = @instance.init()
          expect(result.state()).to.equal('pending')

      context 'after the XHR resolves', ->
        beforeEach ->
          @spy_end = sinon.spy()
          @instance.on 'dbcreate_end', @spy_end

          @result = @instance.init()
          return

        it 'adds data to storage', ->
          @respondJSON(@shops_json)

          expect(@instance._get(@instance._data_key))
            .to.not.equal(false)

        it 'adds data_timestamp to storage', ->
          @respondJSON(@shops_json)
          expect(@instance._get(@instance._timestamp_key))
            .to.not.equal(false)

        it 'triggers a "dbcreate_end" event', ->
          @respondJSON(@shops_json)
          expect(@spy_end).to.be.calledOnce

        it 'resolves the returned deferred', (done)->
          @respondJSON(@shops_json)
          @result.then ->
            expect(true).to.be.true
            done()

    context 'when storage has data that need refreshing', ->
      beforeEach ->
        @timestamp = new Date().getTime()
        @timestamp = @timestamp - (2 * @instance.config.localCacheTimeout)

        @instance._set @instance._data_key, @makers_obj
        @old_data = @instance._get @instance._data_key
        @instance._set @instance._timestamp_key, @timestamp

      it 'returns a Deferred object', ->
        result = @instance.init()
        expect(result).to.respondTo('then')

      it 'makes a GET JSON XHR', ->
        @instance.init()
        expect(@requests).to.have.length(1)

      context 'before the XHR resolves', ->
        it 'triggers a "dbcreate_start" event', ->
          spy = sinon.spy()
          @instance.on 'dbcreate_start', spy
          @instance.init()
          expect(spy).to.be.calledOnce

        it 'does not add new data to storage', ->
          @instance.init()
          expect(@instance._get(@instance._data_key))
            .to.eql(@old_data)

        it 'does not add data_timestamp to storage', ->
          @instance.init()
          expect(@instance._get(@instance._timestamp_key))
            .to.eql(@timestamp)

        it 'does not trigger a "dbcreate_end" event', ->
          spy = sinon.spy()
          @instance.on 'dbcreate_end', spy
          @instance.init()
          expect(spy).to.not.be.called

        it 'does not resolve the returned deferred', ->
          result = @instance.init()
          expect(result.state()).to.equal('pending')

      context 'after the XHR resolves', ->
        beforeEach ->
          @spy_end = sinon.spy()
          @instance.on 'dbcreate_end', @spy_end

          @result = @instance.init()
          return

        it 'adds old data in storage with new', ->
          @respondJSON(@shops_json)

          expect(@instance._get(@instance._data_key))
            .to.not.eql(@old_data)

        it 'replaces old data_timestamp in storage with new', ->
          @respondJSON(@shops_json)
          expect(@instance._get(@instance._timestamp_key))
            .to.not.eql(@timestamp)

        it 'triggers a "dbcreate_end" event', ->
          @respondJSON(@shops_json)
          expect(@spy_end).to.be.calledOnce

        it 'resolves the returned deferred', (done)->
          @respondJSON(@shops_json)
          @result.then ->
            expect(true).to.be.true
            done()

    context 'when storage has data', ->
      beforeEach ->
        @instance._updateDB(@shops_obj)
        @ret = @instance.init()

      it 'returns a Deferred object', ->
        expect(@ret).to.respondTo('then')

      it 'does not make an XHR', ->
        expect(@requests).to.have.length(0)

      it 'retrieves data from storage', ->
        expect(@instance._data).eql(@shops_obj)

      it 'resolves returned deferred', (done)->
        @ret.then ->
          expect(true).to.be.true
          done()

  describe 'add', ->
    beforeEach ->
      @instance = @StorageFreak(@init_options)
      obj =
        koko: 'lala'
        koko2: 'lala2'
      @instance._data = obj
      @instance._updateDB obj


      @data = @instance._get @instance._data_key
      @timestamp = @instance._get @instance._timestamp_key

    it 'expects key as first argument and value as second', ->
      @instance.add('lala', 'koko')
      expect(@instance._get @instance._data_key).to.eql
        koko: 'lala'
        koko2: 'lala2'
        lala: 'koko'

    it 'appends data to localStorage', ->
      @instance.add('lala', 'koko')
      expect(@instance._get @instance._data_key).to.eql
        koko: 'lala'
        koko2: 'lala2'
        lala: 'koko'

    it 'appends data to @_data', ->
      @instance.add('lala', 'koko')
      expect(@instance._data).to.eql
        koko: 'lala'
        koko2: 'lala2'
        lala: 'koko'

    it 'triggers "dbupdated" event', (done)->
      @instance.on 'dbupdated', ->
        expect(true).to.be.true
        done()

      @instance.add('lala', 'koko')

    context 'when key exists', ->
      beforeEach ->
        @instance.add('koko', 'different_value')

      it 'does not update key with new value in localStorage', ->
        expect(@instance._get @instance._data_key).to.eql
          koko: 'lala'
          koko2: 'lala2'

      it 'does not update key with new value in @instance._data', ->
        expect(@instance._data).to.eql
          koko: 'lala'
          koko2: 'lala2'



  describe 'searchByKey', ->
    beforeEach ->
      @instance = @StorageFreak(@init_options)
      @instance._data = {
        koko: 'lala'
      }

    it 'returns value for searched key', ->
      expect(@instance.searchByKey('koko')).to.equal('lala')

    it 'returns false if nothing is found', ->
      expect(@instance.searchByKey('lala')).to.equal(false)

    it 'does not make an XHR', ->
      expect(@requests).to.have.length(0)

  describe 'search', ->
    beforeEach ->
      @instance = @StorageFreak(@init_options)

    it 'does not search storage', ->
      spy = sinon.spy @instance._storage, 'getItem'

      @instance.search('as')
      expect(spy).to.not.be.called

    it 'searches in-memory data', (done)->
      @instance._data = {
        add: 'add'
        asd: 'asd'
        as: 'as'
      }

      @instance.on 'dbsearch_results', (data, query, remote = false)->
        expect(data)
          .to.be.an('array')
          .to.have.length(2)
        done()

      @instance.search('as')

    xit 'matches accented characters ignoring their accent', ->

    it 'triggers "dbsearch_results" event and passes results', (done)->
      @instance._data = {
        as: 'as'
        asd: 'asd'
        add: 'add'
      }

      @instance.on 'dbsearch_results', (data, query)->
        expect(data)
          .to.be.an('array')
          .to.have.length(2)
        done()

      @instance.search('as')

    it 'also passes original query as second argument to the event callback', (done)->
      @instance._data = {
        as: 'as'
        asd: 'asd'
        add: 'add'
      }

      @instance.on 'dbsearch_results', (data, query)->
        expect(query).to.equal('as')
        done()

      @instance.search('as')

    it 'sorts results', (done)->
      @instance._data =
        asd: 'asd'
        add: 'add'
        as: 'as'

      @instance.on 'dbsearch_results', (data)->
        expect(data).to.deep.equal [
          { id: 'as', name: 'as' },
          { id: 'asd', name: 'asd' }
        ]
        done()

      @instance.search('as')

    it 'slices results', (done)->
      @instance._data =
        asd: 'asd'
        add: 'add'
        as: 'as'
        asd1: 'asd1'
        add1: 'add1'
        as1: 'as1'
        asd2: 'asd2'
        add2: 'add2'
        as3: 'as2'

      @instance.on 'dbsearch_results', (data)=>
        expect(data).to.have.length @instance.config.maxResultsNum
        done()

      @instance.search('as')

    it 'triggers "dbremote_search_reset" event', (done)->
      @instance.on 'dbremote_search_reset', ->
        expect(true).to.be.true
        done()
      @instance.search('as')

    context 'when query is smaller than @config.minCharsForRemoteSearch', ->
      it 'does not make an XHR', ->
        @instance.search('asdasd')
        expect(@requests).to.have.length(0)

    context 'when query is bigger or equal to @config.minCharsForRemoteSearch', ->
      beforeEach ->
        @query = 'asdasd'
        @instance._data =
          asdasd0: 'asdasd0'

        @clock = sinon.useFakeTimers()

      afterEach ->
        @clock.restore()

      it 'registers XHR to occur after timeout', ->
        spy = sinon.spy(window, 'setTimeout')
        @instance.search(@query)
        expect(spy.args[0][1]).to.equal(@instance.config.XHRTimeout)
        spy.restore()

      context 'before timeout', ->
        it 'triggers "dbremote_search_in" event and passes @config.XHRTimeout', (done)->
          @instance.on 'dbremote_search_in', (timeout)=>
            expect(timeout).to.equal(@instance.config.XHRTimeout)
            done()
          @instance.search(@query)

      context 'after timeout', ->
        beforeEach ->
          @expected_makers_data = [
            {
              'id': 'asdasd0',
              'name': 'asdasd0'
            },
            {
              'id': 'asdasd3',
              'name': 'asdasd3'
            },
            {
              'id': 'asdasd4',
              'name': 'asdasd4'
            },
            {
              'id': 'asdasd5',
              'name': 'asdasd5'
            },
            {
              'id': 'asdasd6',
              'name': 'asdasd6'
            }
          ]

        it 'makes an XHR', (done)->
          @instance.on 'dbsearch_results', (results, query, xhr = false)=>
            if xhr
              expect(@requests).to.have.length(1)
              done()

          @instance.search(@query)
          @clock.tick(@instance.config.XHRTimeout)
          @respondJSON(@shops_json)

        it 'updates storage', (done)->
          @instance._set @instance._data_key, @makers_obj
          old_data = @instance._get @instance._data_key

          @instance.on 'dbsearch_results', (results, query, xhr = false)=>
            if xhr
              expect(@instance._get(@instance._data_key)).to.not.eql(old_data)
              done()

          @instance.search(@query)
          @clock.tick(@instance.config.XHRTimeout)
          @respondJSON(@makers_json)

        it 'updates @_data', (done)->
          data = {koko:'lala'}
          @instance._data = data

          @instance.on 'dbsearch_results', (results, query, xhr = false)=>
            if xhr
              expect(@instance._data).to.not.eql(data)
              done()

          @instance.search(@query)
          @clock.tick(@instance.config.XHRTimeout)
          @respondJSON(@makers_json)

        it 'triggers "dbsearch_results" event and passes results from updated data as first arg', (done)->
          @instance.on 'dbsearch_results', (results, query, xhr = false)=>
            if xhr
              expect(results).to.deep.eql @expected_makers_data
              done()

          @instance.search(@query)
          @clock.tick(@instance.config.XHRTimeout)
          @respondJSON(@makers_json)

        it 'triggers "dbsearch_results" event and passes original query as second arg', (done)->
          @instance.on 'dbsearch_results', (results, query, xhr = false)=>
            if xhr
              expect(query).to.equal(@query)
              done()

          @instance.search(@query)
          @clock.tick(@instance.config.XHRTimeout)
          @respondJSON(@makers_json)

        it 'triggers "dbsearch_results" event and passes "xhr" as third arg', (done)->
          @instance.on 'dbsearch_results', (results, query, xhr = false)=>
            if xhr
              expect(xhr).to.equal('xhr')
              done()

          @instance.search(@query)
          @clock.tick(@instance.config.XHRTimeout)
          @respondJSON(@makers_json)

        it 'sorts results', (done)->
          @instance.on 'dbsearch_results', (results, query, xhr = false)=>
            if xhr
              expect(results).to.deep.eql @expected_makers_data
              done()

          @instance.search(@query)
          @clock.tick(@instance.config.XHRTimeout)
          @respondJSON(@makers_json)

        it 'slices results', (done)->
          @instance.on 'dbsearch_results', (results, query, xhr = false)=>
            if xhr
              expect(results).to.be.an('array').with.length(@instance.config.maxResultsNum)
              done()

          @instance.search(@query)
          @clock.tick(@instance.config.XHRTimeout)
          @respondJSON(@makers_json)

    context 'when a new remote request starts before the previous finishes', ->
      beforeEach ->
        @query = 'asdasd'
        @instance._data =
          asdasd0: 'asdasd0'
        @clock = sinon.useFakeTimers()
        @instance.search(@query)

      afterEach ->
        @clock.restore()

      cleanup_tests()

  describe 'cleanup', ->
    beforeEach ->
      @instance = @StorageFreak(@init_options)
      @query = 'asdasd'
      @instance._data =
        asdasd0: 'asdasd0'
      @clock = sinon.useFakeTimers()
      @instance.search(@query)

    afterEach ->
      @clock.restore()

    cleanup_tests()