toggle_plugin_tests = ->
  context 'when @state is "disabled"', ->
    beforeEach ->
      @instance.state = 'disabled'
      @trigger()

    it 'does not call hide', ->
      expect(@hide_spy).to.not.be.called

    it 'does not call show', ->
      expect(@show_spy).to.not.be.called

  context 'when @state is "visible"', ->
    beforeEach ->
      @instance.state = 'visible'
      @trigger()

    it 'hides the plugin', ->
      expect(@hide_spy).to.be.calledOnce

  context 'when @state is "ready"', ->
    beforeEach ->
      @instance.state = 'ready'
      @trigger()

    it 'shows the plugin', ->
      expect(@show_spy).to.be.calledOnce


describe 'Selectorablium', ->
  @timeout(0) # Disable the spec's timeout

  before (done)->
    ## MOCK STORAGE
    window.__requirejs__.clearRequireState()

    # mock Session
    requirejs.undef 'storage_freak'
    @storage_init_deferred = storage_init_deferred = new $.Deferred()

    class StorageFreak
      constructor: ->
      on: ->
      init: -> return storage_init_deferred
      searchByKey: ->
      search: ->
      cleanup: ->
      add: ->

    @storage_mock = StorageFreak
    @storage_spy = sinon.spy this, 'storage_mock'
    @storage_search_spy = sinon.spy StorageFreak::,  'search'

    define 'storage_freak', [], =>
      return @storage_mock

    @respond_to_db_creates = ->
      for request in @requests
        if request.url is 'shops.json'
          request.respond 200, { "Content-Type": "application/json" }, @shops_json
        else if request.url is 'makers.json'
          request.respond 200, { "Content-Type": "application/json" }, @makers_json
    @options =
      app_name: "selectorablium_test"

    [@shops_obj, @makers_obj] = fixture.load('shops.json', 'makers.json')
    fixture.load 'shops.html'
    @makers_json = JSON.stringify @makers_obj
    @shops_json  = JSON.stringify @shops_obj

    @$el = $(".selectorablium.shops")

    @init = (el = @$el, options = @options, respond = true)=>
      @instance = new @Selectorablium el, options
      @$el.data 'Selectorablium', @instance
      respond and @respond_to_db_creates()

    require ['selectorablium'], (Selectorablium)=>
      @Selectorablium = Selectorablium
      done()

  after ->
    requirejs.undef 'storage_freak'
    window.__requirejs__.clearRequireState()

  beforeEach ->
    @requests = []
    @xhr = sinon.useFakeXMLHttpRequest()
    @xhr.onCreate = (xhr)=> @requests.push xhr

    @data = [
      {
        id: 4
        name: 'zero1'
      },
      {
        id: 5
        name: 'zero2'
      },
      {
        id: 6
        name: 'zero3'
      }
    ]
    @data2 = [
        {
          id: 3
          name: 'zero0'
        },
        {
          id: 4
          name: 'zero1'
        },
        {
          id: 5
          name: 'zero2'
        },
        {
          id: 6
          name: 'zero3'
        }
      ]

  afterEach ->
    $(".selectorablium").each -> $(this).data('Selectorablium')?.cleanup()
    @xhr.restore()
    window.localStorage && localStorage.clear()
    @storage_spy.reset()
    @storage_search_spy.reset()

  describe '.constructor', ->
    it 'returns an instance when called without new', ->
      instance = @Selectorablium(@$el, @options)
      expect(instance).to.be.an.instanceof(@Selectorablium)
      instance.cleanup()

    it 'thows if no element is given', ->
      expect(@Selectorablium).to.throw(/Element argument is required/)

    it 'thows if not required options are given', ->
      expect(=>@Selectorablium(@$el)).to.throw(/option is required/)

    it 'initializes @state to "disabled"', ->
      @init()
      expect(@instance.state).to.equal('disabled')

    it 'get a Storage instance', ->
      @init()
      expect(@storage_spy).to.be.calledWithNew

    it 'creates HTML', ->
      @init()

      template = """<div class="selectorablium_outer_cont"><select class="selectorablium shops" name="eshop_id" data-url="shops.json" data-query="query" data-name="shops" data-default_value="" data-default_text="Choose eshop" data-selected_id="3"><option value="">Choose eshop</option></select><div class="selectorablium_cont">
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
      </div></div>"""

      expect($(fixture.el).html()).to.equal(template)

    it 'registers handlers on HTML elements', ->
      @init()
      expect(@instance.events_handled).to.have.length(9)

    it 'registers handlers for storage events', ->
      spy = sinon.spy @storage_mock::, 'on'
      @init()
      expect(spy).to.have.callCount(8)
      spy.restore()

    it 'inits storage', ->
      spy = sinon.spy @storage_mock::, 'init'
      @init()
      expect(spy).to.be.calledOnce
      spy.restore()

  describe 'HTML Events', ->
    beforeEach ->
      @init()
      @show_spy = sinon.spy @instance, '_show'
      @hide_spy = sinon.spy @instance, '_hide'

    afterEach ->
      @show_spy.restore()
      @hide_spy.restore()

    context '@$top element', ->
      context 'on click', ->
        beforeEach ->
          @trigger = => @instance.$top.triggerHandler 'click'

        toggle_plugin_tests()

    context '@$el element', ->
      context 'on focus', ->
        beforeEach ->
          @trigger = => @instance.$el.triggerHandler 'focus'

        toggle_plugin_tests()

    context '@$container element', ->
      context 'on click', ->
        beforeEach ->
          @trigger = => @instance.$container.triggerHandler 'click'

        it 'sets @do_not_hide_me to true', ->
          @trigger()
          expect(@instance.do_not_hide_me).to.be.true

    context '@$clear_button element', ->
      context 'on click', ->
        beforeEach ->
          @trigger = => @instance.$clear_button.triggerHandler 'click'

        it 'resets the plugin', ->
          spy = sinon.spy @instance, 'reset'
          @trigger()
          expect(spy).to.be.calledOnce

        it 'hides the plugin', ->
          @trigger()
          expect(@hide_spy).to.be.calledOnce

    context 'html element', ->
      context 'on click', ->
        beforeEach ->
          @trigger = => $('html').triggerHandler 'click'

        context 'when @do_not_hide_me is true', ->
          beforeEach ->
            @instance.do_not_hide_me = true

          it 'sets @do_not_hide_me to false', ->
            @trigger()
            expect(@instance.do_not_hide_me).to.be.false

        context 'when @do_not_hide_me is false', ->
          beforeEach ->
            @instance.do_not_hide_me = false

          it 'hides the plugin', ->
            @trigger()
            expect(@hide_spy).to.be.calledOnce

    context 'result element', ->
      beforeEach ->
        @query = 'ze'
        @instance.query = @query
        @instance._show()
        @instance._onDBSearchResults(@data, @query)

      context 'on mouseenter', ->
        beforeEach ->
          @$selected_element = @instance.selected_item
          @$last_element = @instance.$result_items.last()

          @trigger = => @$last_element.trigger 'mouseenter'

        it 'deselects previously selected element', ->
          @trigger()
          expect(@instance.selected_item[0]).to.not.equal(@$selected_element[0])

        it 'selects mouseentered element', ->
          @trigger()
          expect(@instance.selected_item[0]).to.equal(@$last_element[0])

      context 'on click', ->
        beforeEach ->
          @$last_element = @instance.$result_items.last()

          @trigger = =>
            @$last_element.trigger 'mouseenter'
            @$last_element.trigger 'click'

        it 'hides the plugin', ->
          @trigger()
          expect(@hide_spy).to.be.calledOnce

        it 'triggers the change event on the select element', ->
          spy = sinon.spy()
          @instance.$el.one 'change', spy
          @trigger()
          expect(spy).to.be.calledOnce

        it 'creates option with selected items attributes', ->
          expected_template = '<option value="6">zero3</option>'
          @trigger()
          expect(@instance.$el.html()).to.equal expected_template

    context '@$input element', ->
      context 'on keyup', ->
        beforeEach ->
          @event = jQuery.Event 'keyup', { keyCode: 55 }
          @trigger = => @instance.$input.triggerHandler @event
          @clock = sinon.useFakeTimers()

        afterEach ->
          @clock.restore()

        context 'when key is not a character', ->
          beforeEach ->
            @event = jQuery.Event 'keyup', { keyCode: 39 }
            @trigger = => @instance.$input.triggerHandler @event

          it 'returns false', ->
            expect(@trigger()).to.be.false

          context 'when key is shift', ->
            beforeEach ->
              @instance.shift_pressed = true
              event = jQuery.Event 'keyup', { keyCode: 16 }
              @trigger = => @instance.$input.triggerHandler event

            it 'sets @shift_pressed to true', ->
              @trigger()
              expect(@instance.shift_pressed).to.be.false

        context 'when key is a character', ->
          beforeEach ->
            @query = 'zz'
            @instance.$input.val(@query)

          it 'returns false', ->
            expect(@trigger()).to.be.false

          it 'calls @_resetContainer', ->
            spy = sinon.spy @instance, '_resetContainer'
            @trigger()
            expect(spy).to.be.calledOnce
            spy.restore()

          it 'searches for the query in the storage', ->
            @trigger()
            @clock.tick(@instance.config.debounceInterval);

            expect(@storage_search_spy).to.be.calledOnce

      context 'on keypress', ->
        beforeEach ->
          @trigger = (keycode)=>
            my_event = $.Event @instance._keyPressEventName(), { keyCode: keycode }
            @instance.$input.triggerHandler my_event

        context 'when key is shift', ->
          it 'sets shift_pressed to true', ->
            @instance.shift_pressed = false
            @trigger(16)
            expect(@instance.shift_pressed).to.be.true

          it 'returns false', ->
            expect(@trigger(16)).to.be.false

        context 'when key is escape', ->
          it 'hides plugin', ->
            @trigger(27)
            expect(@hide_spy).to.be.calledOnce

          it 'returns false', ->
            expect(@trigger(27)).to.be.false

        context 'when key is up', ->
          it 'selects result above', ->
            spy = sinon.spy @instance, '_moveSelectedItem'
            @trigger(38)
            expect(spy.args[0][0]).to.equal 'up'
            spy.restore()

          it 'returns false', ->
            expect(@trigger(38)).to.be.false

        context 'when key is down', ->
          it 'selects result below', ->
            spy = sinon.spy @instance, '_moveSelectedItem'
            @trigger(40)
            expect(spy.args[0][0]).to.equal 'down'
            spy.restore()

          it 'returns false', ->
            expect(@trigger(40)).to.be.false

        context 'when key is enter', ->
          it 'hides the plugin', ->
            @trigger(13)
            expect(@hide_spy).to.be.calledOnce

          it 'returns false', ->
            expect(@trigger(13)).to.be.false

          context 'when there are results printed', ->
            beforeEach ->
              @query = 'ze'
              @instance.query = @query
              @instance._show()
              @instance._onDBSearchResults(@data, @query)

            it 'triggers the change event on the select element', ->
              spy = sinon.spy()
              @instance.$el.one 'change', spy
              @trigger(13)
              expect(spy).to.be.calledOnce

            it 'creates option with selected items attributes', ->
              expected_template = '<option value="4">zero1</option>'
              @trigger(13)
              expect(@instance.$el.html()).to.equal expected_template


        context 'when key is tab', ->
          beforeEach ->
            @query = 'ze'
            @instance.query = @query
            @instance._show()
            @instance._onDBSearchResults(@data, @query)

          it 'hides the plugin', ->
            @trigger(9)
            expect(@hide_spy).to.be.calledOnce

          it 'triggers the change event on the select element', ->
            spy = sinon.spy()
            @instance.$el.one 'change', spy
            @trigger(9)
            expect(spy).to.be.calledOnce

          it 'creates option with selected items attributes', ->
            expected_template = '<option value="4">zero1</option>'
            @trigger(9)
            expect(@instance.$el.html()).to.equal expected_template

          it 'returns true', ->
            expect(@trigger(9)).to.be.true

        context 'when any other key is pressed', ->
          it 'returns true', ->
            expect(@trigger(55)).to.be.true

  describe 'Storage Events', ->
    beforeEach -> @init()

    context 'on "dbcreate_start"', ->
      beforeEach ->
        @instance._onDBCreateStart()

      it 'disables plugin state', ->
        expect(@instance.state).to.equal('disabled')

      it 'disables html state', ->
        expect(@instance.$top.hasClass('disabled')).to.be.true

      it 'shows loader', ->
        expect(@instance.$top_loader.is(':visible')).to.be.true

    context 'on "dbcreate_end"', ->
      beforeEach ->
        @instance._onDBCreateEnd()

      it 'disables html state', ->
        expect(@instance.$top.hasClass('disabled')).to.be.false

      it 'hides loader', ->
        expect(@instance.$top_loader.is(':visible')).to.be.false

    context 'on "dbremote_search_in"', ->
      it 'shows XHR countdown slider', ->
        spy = sinon.spy @instance, '_showXHRCountdown'
        @instance._onDBSearchIn()
        expect(spy).to.be.calledOnce
        spy.restore()

    context 'on "dbremote_search_start"', ->
      it 'hides XHR countdown slider', ->
        spy = sinon.spy @instance, '_hideXHRCountdown'
        @instance._onDBSearchStart()
        expect(spy).to.be.calledOnce
        spy.restore()

      it 'shows XHR loader', ->
        @instance._onDBSearchStart()
        expect(@instance.$XHR_loader.css('display')).to.equal('block')

    context 'on "dbremote_search_end"', ->
      it 'hides XHR loader', ->
        @instance._onDBSearchEnd()
        expect(@instance.$XHR_loader.css('display')).to.equal('none')

    context 'on "dbremote_search_error"', ->

    context 'on "dbremote_search_reset"', ->
      it 'hides XHR countdown slider', ->
        spy = sinon.spy @instance, '_hideXHRCountdown'
        @instance._onDBSearchReset()
        expect(spy).to.be.calledOnce
        spy.restore()

      it 'hides XHR loader', ->
        @instance._onDBSearchReset()
        expect(@instance.$XHR_loader.css('display')).to.equal('none')

    context 'on "dbsearch_results"', ->
      beforeEach ->
        @query = 'ze'
        @init()
        @instance.query = @query
        @instance._show()

      it 'creates html elements for results', ->
        @instance._onDBSearchResults(@data, @query)
        expect(@instance.$result_items).to.have.length(3)

      it 'highlights query in each element\'s text', ->
        @instance._onDBSearchResults(@data, @query)
        expect(@instance.$result_items.first().html()).to.equal('<span class="highlight">ze</span>ro1')

      context 'when previous query gave no results', ->
        it 'selects first result', ->
          @instance._onDBSearchResults(@data, @query)
          expect(@instance.$results_list.find('.item').index('.selected')).to.equal(0)

      context 'when previous query gave results', ->
        beforeEach ->
          @instance._onDBSearchResults(@data, @query)

        it 'adds "new" class to new results', ->
          @instance._onDBSearchResults(@data2, @query, true)

          expect(@instance.$results_list.find('.item.new').first().text()).to.equal('zero0')

        it 'selects previously selected result', ->
          $(@instance.$results_list.find('.item')[1]).trigger('mouseenter')
          @instance._onDBSearchResults(@data2, @query, true)

          $selected_el = @instance.$results_list.find('.selected')
          expect(@instance.$results_list.find('.item').index($selected_el)).to.equal(2)

  describe 'add', ->
    beforeEach ->
      @storage_add_spy = sinon.spy @storage_mock::,  'add'
      @instance = @Selectorablium(@$el, @options)
      @key = 10101
      @value = 'test'

    afterEach ->
      @storage_add_spy.restore()

    it 'calls @db\'s add', ->
      @instance.add @key, @value
      expect(@storage_add_spy.args[0]).to.eql [@key, @value]

  xdescribe '#_hideXHRCountdown', ->
  xdescribe '#_showXHRCountdown', ->
  xdescribe '#_moveSelectedItem', ->
  xdescribe '#_resetContainer', ->
  xdescribe '#reset', ->
  xdescribe '#_hide', ->
  xdescribe '#_show', ->
