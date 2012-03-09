
# Dali Roadmap

## Dali 2.0

### Features:
- Use expression parser instead of Function constructor
- Uniform usage between client and server
- Render without having to rely on a "env" environment var (didnt mix well with express). Instead take a single object in argument.
- An event API for onTag, onFilter, onWhatever, onError, etc
- Support for either plugins or middleware
- Better/simpler tag syntax?  single stash?

### Housekeeping:
- More comments in the code
- Simplified codebase (reduce cyclomatic complexity)
- More detailed unit tests
- More integration tests in node
- Simple codebase
- Tests and samples with express and other popular frameworks
- Tests and samples with jquery, mootools, yui and other popular frameworks
- Performance benchmark
- Complete documentation
- Easier to browse samples

### VERSIONS 1.X

TO BE DOCUMENTED  >>>>
Completed for next release:
* Multiple bug fixes
* i18n tags and filters
* Logging and debugging tags and filters
* json filter and support for filters that output data (use with var tag)
		{{var "legumes" >> json }}
			{patate: "Yata!"}
		{{endvar}}
		{{out vars.legumes.patate /}}
* Each tag argument to output iterated items in vars for easy access in nested each statements
	{{each item.items, "dad"}}
		{{each vars.dad.children, "child"}}
			{{out vars.parentItem.name /}} is parent of {{out vars.child.name /}}
		{{/each}}
	{{/each}}



Objectives:
* API method to provide helper/util functions
* Be 99% backward compatible to 1.0
* Richer API for full control and ease of use
* Better performance
* Simpler loading of resources
* Richer syntax to do more with less code
* More unit tests and integration tests
* Even better error reporting
* Better debugging

Various housekeeping:

* Homepage
* Documented API
* Generated JSDoc
* Repo in order
* Fully documented code
* Minified sources witj JS Uglify
* Link doc to samples
* Clean Up code tree


----

## Backlog

---

### Error Handling

* Error messages that behave as a sort of stack-trace
* Error on "too many recursion" or MaxiumRecursionDepth

### Loading and resource Handling

* Load/parse/compile templates "on demand"
* More options/api calls for auto-loading templates
* Loading of templates in ajax using empty script tags

	<script id="templateABC" src="templateABC.dali.html" type="text/x-dali-template"></script>

### Performance optimization

* Implement caching
* Test asynchronous execution

-----------

### Packaging

* Ability to choose the delimiter and set single braces as the default.

### Flexibility

* A set of external filters, with a tool to select/build a custom set.
* Access to parent data and environment
	vars._parent	The parent data context
	env._parent		The parent environement ?


### Coherence

* Find out and document what the "this" reference should be... since the data is now "item" [NEXT RELEASE]

-----------
Filters

* Integrate Showdown as a filter : http://softwaremaniacs.org/playground/showdown-highlight/
* A filter to send tag output into a var [NEXT RELEASE]

	{{out >> var "dontCareMessage"}}
		Yeah whatever dude... I dont care!
	{{endout}}

---------

## Tag for Custom Tags [NEXT RELEASE]

* The this object is the collection of named arguments
* arguments and alternate blocks for passing prefixed vars

	data= {
		first: "John",
		last: "Doe",
		favoriteColor: "green",
		unreadMessages: 4
	}

	{{tag "welcomeBox", "first", "last", "color"}}
		<p>Welcome {{out this.first + " " + this.last /}}</p>
		<div style="padding:20px; border:1px solid; background: #fff;">
			{{out vars._output /}}
		</div>
	{{endtag}}

	{{var "messageCount", this.unreadMessages /}}
	{{welcomeBox this.firstname, this.lastname, this.favoriteColor }}
		<p style="color:{{out this.color /}}">You have {{out vars.messageCount /}} new messages in your inbox!</p>
	{{endwelcomeBox}}

-----------

Ability to use any tag as functions:
* last argument can be used to pass vars

	{{var "welcomeMessage"}}
		<p style="color:{{out this.color /}}">You have {{out vars.messageCount /}} new messages in your inbox!</p>
	{{/var}}

	{{out tags.welcomeBox("John", "Doe", 4, {_output: welcomeMessage}) >> uppercase /}}

-----------

Ability to use any filter as functions: [NEXT RELEASE]

	{{out filters.uppercase(this.value) /}}

-----------

Syntax for progressive enhancement inside HTML

	<!--{{render "commons" >> uppercase}}-->
	<!--{{rendervar "test"}}-->
	<!--{{endrendervar}}-->

or

	<dali:render args="commons">
		<dali:filter name="uppercase" />
		<dali:render-var args="test">
			Alternate tags like this
		</dali:render-var>
		Default output goest here...
	</dali:render>

-----------

-----------
### Escaping

* Support for double quotes and single quotes in expression evaluation [NEXT RELEASE]
* Better, more diverse character espcaping filters (encoreIRI, escape, htmlEncode, etc).
* filters should be applied "before" linefeeds are converted to white spaces
* Tag instruction for different way out outscaping linefeeds (keep tag instructions for internal features)

	 Tag instructions come in the form of a list of coma separated keywords
	that appear after arguments and filters. Simply user the doulbe @.
	Ex.:

	{{out "these line feeds\n will not\n be escaped" >> lowersace @@ keeplinefeeds /}}

-----------

### Looping

* Cycle tag
	{{cycle "odd", "even" }}  (like django)

* Alternating tag
	{{each-every 4, -1}}

* Collection generator for looping [NEXT RELEASE]
 	{{each loop.for(31) }} or similar ?

-----------

"with" tag

Is a with statement usefull ?
Could it have practical alternateTags.

	{{with this.reservation.days }}
		{{out this.length /}} days left
	{{with-empty}}
		No days left!
	{{endwith}}


------------------------------------------
SYNTAXIC EQUIVALENCIES - To make as sample
Whay to emulate behavior of other templating engine without using
special purpose tags, and favor standard javascript
------------------------------------------

Example for this syntax:

	{{ firstof var1, var2, var3, "fallback value" /}}  from django

done like this :

	{{ out (0 || 0 || 0 || 2 || 1) }}

-------

Doument techniquess for trimming whitespaces:

	{{if true >> trim }}this will not output whitespaces before and after!{{endif}}

	{{if true >> trim }}
		this will not output whitespaces before and after!
	{{endif}}

	{{if true
		}}this will not output whitespaces before and after!{{
	endif}}

----

