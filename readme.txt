Copyright Mathieu Sylvain, 2009
This work is in the Public Domain. To view a copy of the public domain certification, visit http://creativecommons.org/licenses/publicdomain/ or send a letter to Creative Commons, 171 Second Street, Suite 300, San Francisco, California, 94105, USA.

-----

jquery.render

Descriptions:
	Template rendering engine
	
Usage:
	Render a template using the specified data:
		$(template).render(data, options)
	Set default options:
		$.render(options)

Author & Copyright:
	Mathieu Sylvain

License:
	Dual licensed under the MIT or GPL Version 2 licenses.

Why use this templating engine:
	- Syntax similar to other well known templating engines
	- Declarative and Functional syntax encourages a structured approach
	- Can produce any type of text output: html/json/xml/etc...
???		- Templates are compiled into fast javascript code
???		- Its fast! By default, templates are compiled once and then cached
???		- Its extensible. You can add your own filters, control statements.

Feature set:
???		- Support for simple and secure expressions for output values
	- Complete set of control statements: for, if
???		- Filters : uppercase, lowercase, trim /// NOT REALLY NEEDED ANYMORE ?
	- Raw output and comments
	- Create a templace from a jQuery request
	- Create a templace from a string: $.templates.add(id, source, environ, options)
	- Render a template from another template

ROADMAP
Release 0.1:
	- Support for lambda.eval expression library
???		- Ability to register new filters /// Still necessary ?
		SHOUL filters simply be functions added to the functions scope?
	- Ability to register new control statements

Release 0.2:
	- A "set (varName, value)" control statement to set a variable
	- Else and ElseIf statement
	- Tests with the "is" syntax

Release 0.3:
	- Shortcut syntax for FOR repeaters instead of data.items[item]
	- A "each (item in items)" statement 
	- "Loop" status object

Release 0.4:
	- Better "Macros/Call" or functions, similar to filters ?
	- A "filter" statement to apply a filter to a whole bock

Release 0.5:
	- Create a series of templace from an array of literal objects : [{id="", source="", options=""}];
	- Create a templace from a dom node

Release 0.6:
	- A "do" statement to run code without any output
	- Usefull error handling to debug broken templates upon compile or execution

Release 0.7:
	- i18n support via a standard callback function. Ex.: _("label")

Release 0.8:
	- Event triggering and callbacks for template compilation and rendering;

Release 1.0:
	- code functionnality independent from jquery
	- One or two level of fallaback template/output when a template fails to render properly

backlog:
	- A "while" control statement
	- A recursion control that can throw errors
	- Support both withspace and spaceless syntax: "{{ someexpression() }}" vs {{someexpression()}}
	- Template sourced from dom nodes are removed once cached to prevent id conflicts
	- Control statement for "blocks", for naming/reusing and applying filters to output
	- Create a templace from a callback function
	- Template inheritance (Is this realy necessary or useful?)
	- Whitespace control
	- Ability to turn on/off caching of compiled templates
	- Template redirection while rendering;

Requirements:
	- Small size
	- No dependencies except jquery
	- Support for callbacks and event binding

SAMPLE USAGE

Register one or many templates with additionnal environ variables
	$(selector).templates(environ, options);
Example:
	$(".templates").templates(environ, {
		precompile: false
	});

Obtain a template object Renders a template with a data set and additional environ variables
	$.templates(templateId);
Example:
	$.templates("storeList");

Renders a template with a data set and additional environ variables, and return the template object
	template.render(data, options);
Example:
	template.render({ stores: this.stores }, { whitespace: false });

Obtain the resulting output of the last render
	template.out(); // As a new dom node in jquery object
	template.out("jquery"); // As a new dom node in jquery object
	template.out("text"); // As a text stream
	template.out("dom"); // As a new dom node

A example of chained template rendering request
	$.templates("storeList").render({stores: this.stores}, { whitespace: false }).out(); // As a new dom node

