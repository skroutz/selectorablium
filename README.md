SKROUTZ SELECTORABLIUM
====================

***A "chosen" like jQuery plugin for a richer `<select>` experience***

On plugin load, it loads via XHR the initial data and stores them into the localstorage.
It then searches the localstorage, prints sorts, and highlights the results.

You can select an item from the results either by clicking with the mouse or via naviagtion with the keyboard keys and pressing enter. 

Tab navigation should work as if it wa a native element.

If the length of the query is more than a threshold value, it makes an XHR and adds the new data (if any) to the local storage and then it displays them.

Its search in case-insensitive as well as accent insensitive, regading the greek language.

It is tested with more than 10.000 items stored in the localstorage, with the responce time while searching being < 50ms.



##HOWTO

The `<select>` elements should have no options hardcoded.

So in order for the plugin to load two things must be configured.

1. The `<select>` tag must have some **data-**attibutes
2. Javascript invocation with an argument for the localstorage namespacing

###1) `<select>` attibutes

* data-url = "url/from/where/the/data/will/come.json" ***(required)***
* data-query = "string_that_will_be_appended_as_a_get_param" ***(required)***
* data-name = "string_for_ddifferentiation_inside_a_namespaced_group" ***(required)***
* data-default_value = "string_value_for_the_default_and_reseted_option_element" ***(optional)***
* data-default_text = "string_text_for_the_default_and_reseted_option_element" ***(optional)***
* data-selected_id = "string_id_for_preselected_option" ***(optional)***

*example:* `<select class="selectorablium" name="customer_id" data-url="/company/customer" data-query="search" `
`data-name="customers" data-default_value="-1" data-default_text="choose an option" data-selected_id="22"></select>`

###2) Javascript invocation

just include the following

`$("select.selectorablium").Selectorablium({app_name : "my_test_app"})`

**'app_name'** is the var that will be used for namespacing and is ***required***



##XHR
On plugin load an initial XHR will be made to get the initial data
It will be like:

**http://`your_domain`/`data-url`/**

where **your_domain** is the domain of your site or web-service and **data-url** is the value in the `<select>` attribute.

Then if you type some characters and the query length is bigger than the threshold, and the timeout time passes, another XHR is made and it will be like:

**http://`your_domain`/`data-url`/?`data-query`=`query`**

where **your_domain** is domain of your site or web-service and **data-url** and **data-query** are the values in the according `<select>` attributes, and **query** is what the user has typed. 



##JSON DATA
The received JSON data must be in the form of
`[{"id":1,"name":"test1"},{"id":2,"name":"test2"}]`
It must be an array of objects and each object must have an id property and a name property.
The id is the option value and the anme is the options text.



##USEFULL METHODS
First of all, get the instance object:a 

`var instance_object = $("select.selectorablium:nth(0)").data('selectorablium')`

* **instance_object.setSelectItem({value:9999, text:"text_for_custom_option"})** -> Manually set the selected option. If it is passed an object with 'value' and 'text' properties, it creates an option with the aforementioned data. Localstorage is not contacted at all.
* **instance_object.setSelectItem(32)** -> Manually set the selected option. If it is passed a number, it searches the localstorage for an entry with the passed number as an ID. If none is found, it makes an XHR and completely refreshes the localstorage and then it searches again. If none is found it returns `false`. Otherwise it returns `true`. The XHR is made on synchronous mode so that it can return true or false depending on the XHR status.


* **instance_object.refreshMyData()** -> Refresh the localstorage data stored inside the instance with the current localstorage values
* **instance_object.resetSelectItem()** -> Reset the select to the default option



##LOCALSTORAGE NAMESPACING
The namespacing scheme is designed so that multiple selectorablium groups can be present in the same page.

It is implemented in the form of 
**"skr" + app_name + ".selectorablium." + data-name + "." + attributes**

* **app_name** is the param passed during the javascript invocation
* **data-name** is an attribute on the element equivalent to the [name] attribute
* **attributes** will be either 'data' or 'timestamp'

They are grouped by the **app_name** during the javascript invocation and further differentiation inside the group can be made by **data-name**.



##CAKEFILE
By running cake build you can build the coffee scripts as well as minify them. Furthermore a bundle version is created (+ minified) with all the required dependencies included. 
**Required:** coffeescript, uglify-js *(on top of node with npm of course)*



##Authors
Bill Trikalinos

* [https://github.com/basiloungas](https://github.com/basiloungas)