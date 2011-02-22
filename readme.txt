Dali - Surreal Templating
=========================

Version:
1.0

Author:
Mathieu Sylvain - 2010-2011

License:
This work is in the Public Domain. To view a copy of the public domain
certification, visit http://creativecommons.org/licenses/publicdomain/
or send a letter to Creative Commons, 171 Second Street, Suite 300,
San Francisco, California, 94105, USA.


About this documentation
------------------------

Documentation is incomplete for now, but you can learn/try every features
in the live samples tool. This tools provides live sample for every aspects
of Dali.


Introduction
------------

Dali is templating api for javscript. It can run on the client in any browser and on servers such as node.js.

Dali has the following characteristics
- It's fast (bechmark to come, but try the samples and see)
- A simple and consistent tag syntax
- Allows for logic-less templating
- A rich set of tags and filters
- Exstensible through custom tags and filters
- Extensive ability for code reuse
- Dynamic template loading and inheritance
- Verbose error handling
- Access to full javasript expressions as arguments
- Includes a lightweight MVC api
- An extensive set of samples in a live-testing tool
- The code is released in the public domain
- The code is documented and testable
- The code is available for the community on GitHub


Using the library
-----------------

Dali is packaged as a single javascript file which can be loaded either as a script tag in the browser, or as a CommonJS module using the "require" method. Simply [download] the latest stable release and add it to your project like this:

[sample code goes here...]

or in node.js like this:

[sample code goes here...]

Altough optionnal, Dali will automatically detect the presence of jQuery and add the "dali" namespace inside jQuery.

Dali has no CSS and no other dependencies, and we do not have any CDN hosting available for now.

Once loaded, the librabry adds two object in the global scope:
- The "Dali" constructor (uppercase "D")
- The "dali" instance. (lowercase "d")

For most scenarios, you should simply start using dali immediatly with the global dali instance.

[sample code goes here...]

But if you need either a custom dali instance or a dali instance resrained to a particular application scope, you can simply create a new instance like this:

[sample code goes here...]


Storing templates
-----------------

There are two recommended techniques for storing your templates:
- Inside script tags and delivered inline with you html page
- Inside .dali.html filed and loaded in ajax

Both methods give the same ouput and have similar restrictions, but their performance cost is very different. Adding a script tag is very fast and effective for small application and limits the number of HTTP requests, but loading templates in Ajax is a better solution for large application where the total weight of all templates is too much to load at first.

Once a template is loaded, it will be refered by its Id and should not need to be reloaded or recompiled.

If your curious about the mechanis of template compilation, you can jump to the "under the hood" section.


Tag Notation
-----------------

The syntax of Dali revolves mostly around the tag notation.

This notation has been choses because it is simple to understand, easy to remember and allows for great flexibility.

The basic constructs are :

An open "out" tag:

[code sample goes here...]

A self-closing tag with arguments:

[code sample goes here...]

A tag with additionnal alternate tags:

[code sample goes here...]

A tag with a filter:

[code sample goes here...]

A tag with linefeeds and whitespaces:

[code sample goes here...]



Comments and commenting-out tags
--------------------------------

Comment are usefull both for adding usefull information in your templates without being rendered.

But the Dali approach to commenting also allows you to comment-out your code quickly during development for doing tests or disabling features temporarilly.

Comments for documentation:

[code sample goes here...]

Commenting out a whole tag:

[code sample goes here...]

Commenting out only a tags content (while still parsing its arguments):

[code sample goes here...]


Note: When you comment-out a tag, it will be "completely ignored", meaning that it will not even be present in the compiled template.


Tag arguments and the execution scope
-------------------------------------

Most tags support arguments. Arguments are written immediatly after the name of the tag. Multiple arguments are separated by commas.

[Code samples here...]

Note that elements after the ">>" prefix used for filter will not be part of your arguments. For example, here we have only 1, 2 and 3 as arguments:

[Code samples here...]

Argument are evaluated as javascript expressions. When these arguments are evaluation during the rendering process, they have acces to the global scope of you application and to some objects specific to the rendering.

These objects are:
env: The environment object, which contains the overall execution context and global variables.
vars: All the variables defined during the rendering process. (See the var tag)
item : The current data being rendered. This will change when you use the "each" tag.
loop: A status object which informs you on where ou are in a "each" loop. (first item, last item, etc)
dali: A reference to the dali instance.

No that these expressions are prone to the same types of errors as any other javascript code, so make sure you account for most usage scenarios and handle empty values.


Global scope vs Environment variables
-----------------

Having access to the global scope of you app or document doesnt mean its a good idea to use it. It is tempting to just access everything globally and not worry too much, but this will make you template harder to reuse and is an error prone approach.

Instead, it is recommended that you pass your helper function and various variables into the environment object. This guaranties that all the dependencies of your templates are well understood and well managed.

Here is a sample scenario:

[Code sample goes here...]



Filters:
-----------------

A common feature of templating languages, is the notion of filters. In Dali, filter are used to transform the output of tag after they have been rendered. Filter are available on every tags and alternate tags.

A basic filter:

[Code sample goes here...]

A filter on an alternate tag:

[Code sample goes here...]

A custom filter with two argument:

[Code sample goes here...]

Two chained filters:

[Code sample goes here...]

Here is the list of built-in filters supplied in Dali:
- void : Intercept and cancels the output of a tag. The tag still executes, but it has not output.
- trim : Will remove whitespaces before and after the content.
- uppercase: Transform the output in lowecase
- lowercase : Transform the ouput in uppercase

While this first version of Dali comes with few filters, you can easilly define you own customs filters.



Tags:
-----------------

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

Template inheritance
-----------------

While many templating engines support partials and macros, very few have achieved true template inheritance.

Dali achieves this elegantly with a combination of the render tag and the template tag.

In the dali sample you will find a situation where a page is rendered by a basePage template which is in turn renderd in an html5 page template.

This scenario is in comparable to the complex templating found in server langauges.

[Template inheritance in the Dali Samples]



Creating custom tags and filters
--------------------------------

- Errors Handling
-----------------

To come... see samples.


MVC api
-----------------

To come... see samples.


Sample jquery.mobile mvc app
-----------------

To come... see samples.



Under the hood
--------------

When a template is loaded, it will go through a three step process, in the following order:
- Source is analysed and parser into a tree structure
- This tree structure is used to generate a function in javascript code
- The javascript code is compiled into a native object by using the "Function" constructor.

All this happens in the blink of an eye and should not affect your applications performance.

Future plans for optimization include:
- Option of running the template directly with the tree structure instead of relying on the "Function" constructor. This will allow cases where you are not allowed to use the "Function" constructor.
- Fetching and rendering templates only on demand instead of at load time.
- Caching templates
- Sanitizing helpers (utilities to remove JS from inputs)

Note on code safety:
Since we use the "Function" constructor for generating the template and evaluating expression, you should be carefull to sanitize any user input and use contributed content to prevent script injection for malicious purposes.






