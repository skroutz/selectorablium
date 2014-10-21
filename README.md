# Selectorablium [![Build Status](https://travis-ci.org/skroutz/selectorablium.svg?branch=master)](https://travis-ci.org/skroutz/selectorablium) [![Bower version](https://badge.fury.io/bo/selectorablium.svg)](http://badge.fury.io/bo/selectorablium)

Make huge `<select>` elements lighter by caching out all the options to localStorage, and easier to browse with options filtering.

##Features:
- Loads data as JSON via an XHR call and caches it inside localStorage
- Makes extra XHR calls if queries are over a threshhold value in length
- Filters options via an input element
- Matches option's text
- Matching ignores accented characters
- Sorts matched options
- Highlights query in option's text
- Keyboard navigation works as expected
- Fast


##Installation
```bash
$ bower install selectorablium
```

## Dependencies
- jQuery

## Compatibility
Selectorabllium depends on the **localStorage** object. If localStorage is not supported in the browser, it uses an included shim which **does not persist**. So if you run it in an old browser, the JSON data will be fetched every time.

# Setup
Include jQuery, the plugin and its css:

```html
<link rel="stylesheet" href="css/selectorablium.css">
<script src="jquery.js"></script>
<script src="selectorablium.js"></script>
```

Then initialize the plugin:

```html
<select class="selectorablium" name="my_name"></select>

<script>
  $('.selectorablium').selectorablium({
      app_name: 'my_app', //required, for namespacing purposes
      url: 'some_url',    //required, where the XHR will be fetched from
      query: 'q',         //required, GET param name for the XHR queries
      name: 'shops'       //required, name of specifix instance
  })
</script>
```

The `<select>` element should include no options.

# Usage

The plugin can be configured by passing it some options. See next chapter for detailed options listing.

The options can be passed with two ways:

**Options object on initialization**:

```Javascript
$('.selectorablium').selectorablium({
    app_name: 'my_app',
    url: 'some_url',
    query: 'q',
    name: 'shops',
    default_value: -1,
    default_text: 'some_text'
})
```

**Data-attributes on `<select>` element**:

```html
<select class="selectorablium" name="my_name" data-app_name="test_app" data-url="some_url"></select>
```

> Options passed on initialization have precedence over the data-attribute options.

## Options

| Name | Required | Value | Default | Description |
|------|----------|-------|---------|-------------|
|**app_name** | **yes** | string | - | The name of the app. It is used for namespacing the data inside the localStorage.
|**url**      | **yes** | string| - | The url where the XHRs will point to.
|**query**    | **yes** | string | - | the GET param key for the query URL.
|**name**     | **yes** | string | -| the name of the specific Selectorablium instance. It is used for namespacing the data inside the localStorage.
|**default_value** | no | string&#124;number | 0 | The `value` for the default `<option>`.
|**default_text** | no | string&#124;number | 'Please select an option' | The `text` for the default `<option>`.
|**selected_id** | no | string&#124;number | null | On initialization, search the localStorage and create an `<option>` with this as `value` and the `text` the localStorage returns.
|**minCharsForRemoteSearch** | no | number | 3 | When the query is  longer than this number make query XHRs.
|**localCacheTimeout**| no | number | 604800000 *(one week)* | Milliseconds after which the localStorage is considered as invalid and needs refreshing.
|**XHRTimeout**| no | number | 650 | Milliseconds to wait before making an XHR query call.
|**maxResultsNum**| no | number | 10| The number of results printed
|**list_of_replacable_chars**| no | array | [['ά', 'α'],...] | An array with accented characters and their unaccented counterpart. This is used to make smart matching on accented names even if non accented characters are used in the query

## XHR Communications
The response JSON must be an array with objects, with each object having an `id` and a `name` key-value:
```json
[{
    "id": "text_or_number1",
    "name":"text_or_number1"
},{
    "id": "text_or_number2",
    "name":"text_or_number2"
}]
```

On **first initialization** or when the localStorage needs to be **refreshed**, an XHR will be made to the `url` option. The response is expected to be the full list of `<option>` data.

As the user searches for results by typing a query string on an input, and after the query is longer than the `minCharsForRemoteSearch` option, an XHR will be made.

If, for example, the `url` option is 'http://some_url', the `query` option is 'q', and the query the user has typed in is 'testtest' an XHR will be made to: *http://some_url?q=testtest*

## API
The instance object of each initialized `<select>` element can be referenced through `.data('Selectorablium')`:

```Javascript
var instance = $('.selectorablium').first().data('Selectorablium')
```

#####.then(success_callback, error_callback)

A `then` method is exposed so that the instance can be seen as a [thenable](http://promises-aplus.github.io/promises-spec/).

The `success_callback` is executed after:

* the localStorage gets initialized
* any `selected_item` gets activated.

On error, the `error_callback` is executed.

#####.add(value, text)

Persist to localStorage the passed data. Subsequent searches will find and show that data
If value is already present in the localStorage, then the text is not updated.

#####.set(value[, text])

Manually create an `<option>` element with the params passed for `value` and `text`.

If only the `value` param is passed, the `text` is searched in the localStorage.

#####.reset()

Reset the `<select>`'s element option to the default value and text.

#####.cleanup()

Resets the `<select>` element the the previous state. It completely removes the plugins HTML elements, its internal event handlers and stops any XHR activity.


## Authors

Bill Trikalinos (*[billtrik](https://github.com/billtrik)*)

## License

This software is released under the MIT License.
