Dali - Surreal Templating
=========================

__Version:__
1.0

__Author:__
_Mathieu Sylvain_ - 2010-2011

__License:__
This work is in the Public Domain. To view a copy of the public domain
certification, visit [http://creativecommons.org/licenses/publicdomain/](http://creativecommons.org/licenses/publicdomain/)
or send a letter to Creative Commons, 171 Second Street, Suite 300,
San Francisco, California, 94105, USA.

__Distribution:__
The Dali engine is available for Download and for collaborations at : [https://github.com/masyl/Dali](https://github.com/masyl/Dali)

Introduction
------------

Dali is templating engine for javascript. It can run on the client in any browser and on servers such as [node.js](http://nodejs.org/).

Dali has the following characteristics:

* It's fast (bechmarks to come, but try the samples and see)
* A simple and consistent tag syntax
* Allows for logic-less templating
* A rich set of tags and filters
* Exstensible through custom tags and filters
* Extensive ability for code reuse
* Dynamic template loading and inheritance
* Verbose error handling
* Access to full javasript expressions as arguments
* Includes a lightweight MVC api
* An extensive set of samples in a live-testing tool
* The code is released in the public domain
* The code is documented and testable
* The code is available for the community on GitHub


Using the library
-----------------

Dali is packaged as a single javascript file which can be loaded either as a script tag in the browser, or as a CommonJS module using the "require" method. Simply download the latest stable release from GitHub and add it to your project like this:

	<script src="libs/dali/dali.js"></script>

or in [node.js](http://nodejs.org/) like this:

	var Dali = require(__dirname +"/libs/dali");

Altough optionnal, Dali will automatically detect the presence of jQuery and add the "dali" namespace inside jQuery.

Dali has no CSS and no other dependencies, and we do not have any CDN hosting available for now.

Once loaded, the librabry adds two object in the global scope:

* The "Dali" constructor _(uppercase "D")_
* The "dali" instance. _(lowercase "d")_

For most scenarios, you should simply start using dali immediatly with the global dali instance.

	var helloWorldData = {label: "Hello world!"};
	var helloWorldTemplate = dali.add("sample", "<div>{{out item.label /}}</div>");
	var output = helloWorldTemplate.render(helloWorldData)

But if you need either a custom dali instance or a dali instance resrained to a particular application scope, you can simply create a new instance like this:

	function someWidget() {
		var privateDali = new Dali();
	};

### Secondary API's

Dali also comes with a few lightweight API's to help you build apps. The is the MVC api, and the App api. Samples are available for both.

Note that the secondary API require the core Dali api and that the App api require the MVC api.

	<script src="libs/dali/dali.mvc.js"></script>
	<script src="libs/dali/dali.app.js"></script>


### Storing templates

There are two recommended techniques for storing your templates:

* Inside script tags and delivered inline with you html page
* Inside external resouces such as "templateABC.dali.html" files and load them with ajax

If you place dali templates inside script tags, make sure you use the "text/x-dali-template" type. Like this:

	<script id="templateABC" type="text/x-dali-template">
 		<div>
			Description: {{out item.vehicle.description /}}
		</div>
	</script>

Both methods give the same ouput and have similar restrictions, but their performance cost is very different. Adding a script tag is very fast and effective for small application and limits the number of HTTP requests, but loading templates in Ajax is a better solution for large application where the total weight of all templates is too much to load at first.

Once a template is loaded, it will be refered by its Id and should not need to be reloaded or recompiled.

If your curious about the mechanis of template compilation, you can jump to the "under the hood" section.

---

Tag Notation
------------

The syntax of Dali revolves mostly around the tag notation.

This notation has been choses because it is simple to understand, easy to remember and allows for great flexibility.

The basic constructs are :

An open "out" tag:

	{{out}}
		<span>Some text!</span>
	{{endout}}

A self-closing tag with arguments:

	{{out "<span>Some text!</span>" /}}

A tag with additionnal alternate tags:

	{{if vars.count > 1 }}
		is bigger than 1
	{{if-not}}
		is NOT bigger than 1
	{{endif}}

Tags with a filter:

	{{out "This will be in uppercase!" >> uppercase /}}

	{{out >> uppercase}}
		This will also be in uppercase!
	{{endout}}

A tag with linefeeds and whitespaces:

	{{ out
		"Some text to output in uppercase!"
		>> uppercase
	/}}



### Comments and commenting-out tags


Comment are usefull both for adding usefull information in your templates without being rendered.

But the Dali approach to commenting also allows you to comment-out your code quickly during development for doing tests or disabling features temporarilly.

Comment are triggered by the "#" symbol, and its behavior depends on where you place it.

Comments for documentation:

	{{#
		You can add multi-line comments anywhere...
		their content is innert, so they will not
		be parsed or evaluated.
	/}}

Commenting out a whole tag (argument, main block and all alternate tags):

	{{#if a > 1 }}
		Some text to output!
	{{if-not}}
		Or maybe not...
	{{endif}}

Commenting out only a tags content (while still parse its arguments and alternate tags):

	{{out "This will output" #}}
		But this will not
	{{endout}}

Commenting out only an alternate tag:

	{{#if 2 > 1 }}
		This will surely output
	{{if-not #}}
		But this will not.
	{{endif}}


Note: When you comment-out a tag, it will be "completely ignored", meaning that it will not even be present in the compiled template.


### Tag arguments and the execution scope


Most tags support arguments. Arguments are written immediatly after the name of the tag. Multiple arguments are separated by commas.

	{{var "varNameGoesHere", "var value goes here..." /}}

	{{out vars.someVar, 5 + 3, "some test!" /}}

Note that elements after the ">>" prefix used for filter will not be part of your arguments. For example, here we have only 1, 2 and 3 as arguments:

	{{out 1, 2, 3 >> void /}}

Argument are evaluated as javascript expressions. When these arguments are evaluation during the rendering process, they have acces to the global scope of you application and to some objects specific to the rendering.

These objects are:

* __env__ : The environment object, which contains the overall execution context and global variables.
* __vars__ : All the variables defined during the rendering process. (See the var tag)
* __item__ : The current data being rendered. This will change when you use the "each" tag.
* __loop__ : A status object which informs you on where ou are in a "each" loop. (first item, last item, etc)
* __dali__ : A reference to the dali instance.

Note that these expressions are prone to the same types of errors as any other javascript code, so make sure you account for most usage scenarios and handle empty values.


### Global scope vs Environment variables


Having access to the global scope of you app or document doesnt mean its a good idea to use it. It is tempting to just access everything globally and not worry too much, but this will make you template harder to reuse and is an error prone approach.

Instead, it is recommended that you pass your helper function and various variables into the environment object. This guaranties that all the dependencies of your templates are well understood and well managed.

Here is a sample scenario:

	[code sample goes here....]

---

Filters:
--------

A common feature of templating languages, is the notion of filters. In Dali, filter are used to transform the output of tag after they have been rendered. Filter can be used on every tags and alternate tags.

The rule is simple, filters follow the same "name followed by arguments" syntax as tags, but they are separated from the tag by the ">>" marker. Here is a few examples:

A basic filter:

	{{out "Some text in lowercase!" >> uppercase /}}

A filter on an alternate tag:

	{{if abc = true}}
		YEAH!
	{{if-not >> uppercase}}
		{{out vars.errorMessage /}
	{{endif}}

A custom filter with two argument:

	{{out "Firstname" >> wrapWith "[", "]" /}}

Two chained filters:

	{{out item.title >> trim >> lowercase /}}


### Built-in fiters

Here is the list of built-in filters supplied in Dali:

* __void__ : Intercept and cancels the output of a tag. The tag still executes, but it has not output.
* __trim__ : Will remove whitespaces before and after the content.
* __uppercase__ : Transform the output in lowecase
* __lowercase__ : Transform the ouput in uppercase

### Creatin Custom Filters

While this first version of Dali comes with few filters, you can easilly define you own customs filters.

Creating a custom filter is very simple. It is a simple function which outputs a string. This function can take in any number of arguments and the input is passed as the _this_ object. Simply register the functions you need like this:

	Dali.register({
		Filters: {
			"h1": function(args) {
				return "<h1>" + this + "</h1>";
			},
			"replace": function(args) {
				return "".replace.apply(this, args);
			}
		}
	});




---

Tags:
-----

	out / raw
	var
	if (else, not)
	each
		loop object
						"empty": [],
						"single": [],
						"begin": [],
						"end": [],
						"first": [],
						"odd": [],
						"between": [],
						"last": []
	template
	render
	load

---

Creating custom tags
--------------------

Here is how simple custom tag is built (explanations will follow):


	alertTag = new Dali.Tag("alert", function(data, _args, env, block, alternateBlocks) {
		var args = _args();
		alert(args.join(", "));
		return "";
	}, {})

	Dali.register({
		Tags: {
			"alert": alertTag
		}
	});

This "alert" tag will trigger an alert dialog that shows the values of the tags argument, separated by commas.

Note that before using the arguments, you must first call the "_args" argument as a function to evaluate their values.

After created the tag with the Dali.Tag constructor, you simply register it with the "Dali.register" method.

To see more complexe examples of tags that process block content, you can browse the Dali source code on GitHub.

---

Template inheritance
--------------------

While many templating engines support partials and macros, very few have achieved true template inheritance.

Dali achieves this elegantly with a combination of the render tag and the template tag.

In the dali sample you will find a situation where a page is rendered by a basePage template which is in turn renderd in an html5 page template.

This scenario is in comparable to the complex templating found in server langauges.

__See "Template inheritance" in the Dali Samples__

---


Errors Handling
-----------------

In Dali, a special care given to providing clear and verbose error messages. Since errors can come from many different sources, Dali uses the standard javascript exception handling methods for bubbling out errors. This means that a template that fails will output a true javascript error with a relevant message and description.

This means that for your apps to be robust, you should wrap dali operations inside try/catch statements, like this:

	try {
		templateABC.render(data);
	} catch (err) {
		showDefaultErrorMessage(err.name, err.message);
	}

In future versions, error handling might provide more subtulties, but this method will always be available and is totally future proof.

You can browse the samples for the full list of possible errors and a way to try to test more template failure scenarios.

---

MVC api
-------

To come... see samples.


---


Sample MVC Mobile App
---------------------

Along side the Dali api, there is a sample mobile application that is used to showcase how it can greatly simplify writing mobile apps. It combines jQuery Mobile, Dali and the Dali MVC api.

This sample is available to download and contribute to on GitHub at [https://github.com/masyl/jquery.mobile.mvc](https://github.com/masyl/jquery.mobile.mvc). And you can sample it online at [http://masyl.github.com/jquery.mobile.mvc/](http://masyl.github.com/jquery.mobile.mvc/).

---

Under the hood
--------------

When a template is loaded, it will go through a three step process, in the following order:

* Source is analysed and parser into a tree structure
* This tree structure is used to generate a function in javascript code
* The javascript code is compiled into a native object by using the "Function" constructor.

All this happens in the blink of an eye and should not affect your applications performance.

Future plans for optimization include:

* Option of running the template directly with the tree structure instead of relying on the "Function" constructor. This will allow cases where you are not allowed to use the "Function" constructor.
* Fetching and rendering templates only on demand instead of at load time.
* Caching templates
* Sanitizing helpers (utilities to remove JS from inputs)

__Note on code safety:__
Since we use the "_Function_" constructor for generating the template and evaluating expression, you should be carefull to sanitize any user input and use contributed content to prevent script injection for malicious purposes.






