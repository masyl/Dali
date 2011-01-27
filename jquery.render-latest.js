/*

	jquery.render

	Template rendering engine

	See readme.txt for documentation

*/
(function($){
	/*
	Extend jQuery with the StoreLocator application
	*/

	$.fn.extend({
		templates: function (environParam, options) {
			//todo: include environParam in environ
			var environ = {
				$: $,
				render: render
			};
			return this.each(function () {
				$.templates.add(this.id, $(this).html());
			});
		}
	});

	/*
	Main constructor which creates an instance of the root method
	*/
	function Templates(options) {
		/*
		Root function which returns an already compiled template from its cache
		*/
		function templates(templateId) {
			return templates.templates[templateId] || null;
		};
		templates.templates = {};
		templates.add = function add(id, source, environParam, optionsParam) {
			var options = $.extend({}, optionsParam);
			var environ = $.extend({
				$: $,
				render: render,
				Env: function() {
					this.stream = "";
					this.out = function (content) {
						this.stream = this.stream + content
					};
				}
			}, environParam);
			this.templates[id] = new Templates.Template(id, source, environ, options);
		};
		return templates;
	}

	var templates = new Templates({});
	console.log("templates", templates);
	// Set the root function
	$.extend({
		templates: templates
	});

	/*
	Constructor for individual templates
	*/
	Templates.Template = function Template(id, source, environ, options) {
		this.id = id;
		this.source = source;
		this.environ = environ;
		this.handler = compile(source, {});
		this.render = function render(data, options) {
			var environ = $.extend({}, this.environ, {options: options, data:data});
			console.log("this.render: ", this.handler, this.id, environ, data, options);
			var output=this.handler.call(environ);
			console.log("output2", output);
			return output;
		};
	};


	var render = {
		stream: "",
		version: "0.1",
		applyFilters: function applyFilters(content, filters) {
			var filter,
				filterId;
			for (var iFilter in filters) {
				if (filters.hasOwnProperty(iFilter)) {
					filterId = filters[iFilter].trim();
					filter = filterHandlers[filterId];
					if (typeof(filter)==="function") {
						content = filter(content);
					}
				}
			}
			return content;
		},
		render: function render(id, data) {
//			console.log("output:", templates(id).render(data));
			return templates(id).render(data);
		}
	};

	function compile(template, options) {
		var parsedTemplate = parse(template, options);
//		console.log("Template source: ", parsedTemplate);
		var templateFunction = new Function(parsedTemplate);
//		console.log("templateFunction", templateFunction, [templateFunction.toString()]);
		return templateFunction;
	};


	function lexer(template, options) {
		var delimitersSet, // Should be in options/config
			delimitersRegexp,
			delimiters,
			matches,
			match,
			before,
			lastMatchStart,
			lastMatchEnd,
			args,
			endSplit,
			content,
			segments,
			expression,
			filters,
			compiledExpression,
			i,
			tagToken,
			tagTokenType,
			tree, // a tree representing the tag structure to be rendered
			treeStack,
			tagNode, // to store newly created tagNodes
			tagNodePointer; // points to the last tagNode being processed

		delimitersSet = ["{(.*?)}"];
//		delimitersSet = ["{%(.*?) (.*?)%}", "{{(.*?)}}", "{#(.*?)#}"];
		delimitersRegexp = delimitersSet.join("|");
		delimiters = new RegExp(delimitersRegexp, "gm");
		matches = template.match(delimiters) || [];
		console.log("MATCHES: ", matches, template);
		matches.push(null); // Add a null value to signify the end of the matches
		lastMatchEnd = 0;
		tree = [];
		treeStack = [];

		function TagNode(name, argString) {
			this.name = name;
			this.argString = argString;
			this.children = [];
		}

		// Create the root TagNode
		tagNode = tagNodePointer = new TagNode("out", "");
		tree.push(tagNode);
		treeStack.push(tagNode);

		for (i in matches) {
			if (matches.hasOwnProperty(i)) {
				match = matches[i];
				if (!match) {
					before = template.substring(lastMatchEnd, template.length);
					if (before.length) {
						tagNodePointer.children.push(new TagNode("raw", before))
					}
				} else {
					lastMatchStart = template.indexOf(match, lastMatchEnd);
					before = template.substring(lastMatchEnd, lastMatchStart);
					if (before.length) {
						tagNodePointer.children.push(new TagNode("raw", before))
					}

					tagToken = match.split(" ")[0].substring(1);
					// todo: check the type of tag match (openTag, closeTag, tag)

					if (tagToken[0] === "/") {
						tagTokenType = "closeTag";
						// Remove the trailing brace
						tagToken = tagToken.split("}")[0];
						tagToken = tagToken.substring(1);
					} else if (match.substring(match.length -2) === "/}") {
						tagTokenType = "tag";
						tagToken = tagToken.split("/}")[0];
					} else {
						tagTokenType = "openTag";
					}


					// todo: trigger the appropriate tag handler
					var tagEnd = (tagTokenType === "tag") ? "/}" : "}";
					content = match.substring(match.indexOf("{")+1, match.lastIndexOf(tagEnd));
					segments = content.split(">>");
					expression = segments[0].substring(segments[0].indexOf(" "));
					filters = segments.slice(1);

					//console.log("tagToken: ", tagTokenType, tagToken, match, content, filters);

					if (tagTokenType === "tag") {
						tagNodePointer.children.push(new TagNode(tagToken, expression))
					} else if (tagTokenType === "openTag" || tagTokenType === "closeTag") {
						// todo: refactor: make statementToken and tagToken the same var
						if (tagTokenType === "openTag") {
							// opening a new scope
							if (typeof(tags[tagToken].openTag)!=="function")
								throw("Statement [" + tagToken + "] cannot be parsed!");
							tagNode = new TagNode(tagToken, expression);
							tagNodePointer.children.push(tagNode);
							treeStack.push(tagNode);
							tagNodePointer = tagNode;
						} else {
							if (tagToken!==treeStack[treeStack.length-1].name)
								throw("wrong end of scope!");
							// closing a tag
							treeStack.pop();
							tagNodePointer = treeStack[treeStack.length-1];
						}
					} else {
						throw("Unknown tag construct!");
					}
					lastMatchEnd = lastMatchStart + match.length;
				}
			}
		}
		return compileTree(tree[0]);
	};


	function compileTree (tree) {
		return "" +
				"var Env=this.Env;\nvar env = new Env();\nvar render=this.render;\n var data=this.data;\n var $=this.$;\n" +
				compileNode(tree) +
				"return env.stream;\n";
	}

	// compile a tagNode and all its children into a javascript function
	function compileNode(node) {
		var content,
			stream = "",
			child,
			i;
		for (i in node.children) {
			child = node.children[i];
			content = "";
			if (child.children.length) content = compileNode(child);
			stream = stream + tags[child.name].tag(child.argString, content);
		}
		return stream;
	}


	var parse = function parse(template, options) {
		//todo: the render object should be scope to each templates, not the whole library
		template = jEscape.escape(template);
		return lexer(template, options);
	};

	var jEscape = {
		escape: function escape(str) {
			// Linefeeds
			str = str.replace(new RegExp( "\\n", "g" ), "%%linefeed%%");
			return str;
		},
		unescapeWithLinefeeds: function unescape(str) {
			// Linefeeds
			str = str.replace(new RegExp( "%%linefeed%%", "g" ), "\\n");
			// html entities
			str = str.replace(new RegExp("&gt;", "g"), ">").replace(new RegExp("&gt;", "g"), "<");
			return str;
		},
		unescape: function unescape(str) {
			// Linefeeds
			str = str.replace(new RegExp( "%%linefeed%%", "g" ), "\\n");
			// html entities
			str = str.replace(new RegExp("&gt;", "g"), ">").replace(new RegExp("&gt;", "g"), "<");
			return str;
		}
	};
	var tags = {
		"raw" : {
			tag: function(args) {
				return "env.out('" + jEscape.unescape(args) + "');\n";
			}
		},
		"if" : {
			openTag: function(args) {
				return "if (" + jEscape.unescape(args) + ") {\n";
			},
			closeTag: function() {
				return "};\n";
			},
			tag: function(args, content) {
				return "if (" + jEscape.unescape(args) + ") {\n" +
					content + "};\n";
			}
		},
		"#" : {
			openTag: function(args) {
				return "/* ";
			},
			closeTag: function() {
				return " */\n";
			},
			tag: function(args, content) {
				var stream = "";
				stream = "/* " + jEscape.unescapeWithLinefeeds(args) + " */\n";
				if (content) stream = stream + "/* " + jEscape.unescapeWithLinefeeds(content) + " */\n";
				return stream;
			}
		},
		"each" : {
			openTag: function(args) {
				return "$.each(" + jEscape.unescape(args) + ", function() {\n";
			},
			closeTag: function() {
				return "});\n";
			},
			tag: function(args, content) {
				return "env.out((function (env) {\n" +
							"$.each(" + jEscape.unescape(args) + ", function(key, value) {\n" +
								content + "\n" +
							"});\n" +
							"return env.stream;\n" +
						"}).call(this, new Env()));\n";
			}
		},
		"out" : {
			tag: function(args, content) {
				var argStr = (args) ? "env.out(" + jEscape.unescape(args) + ");\n" : "";
				var contentStr = (content) ? jEscape.unescape(content) : "";
				return "env.out((function(env) {\n" +
							argStr +
							contentStr +
							"return env.stream;\n" +
						"}).call(this, new Env()));\n";
			}
		},
		"var" : {
			tag: function(args, content) {
				return "var " + jEscape.unescape(args) +  ";\n";
			}
		},
		"render" : {
			tag: function(args, content) {
				return "env.out(render.render(" + args + "));\n";
				// todo: handle template source from tag content
			}
		}
	};

	var filterHandlers = {
		trim: function(content) {
			return content.trim();
		},
		uppercase: function(content) {
			return content.toUpperCase();
		},
		lowercase: function(content) {
			return content.toLowerCase();
		}
	};

})(jQuery);

/*

DEVELOPEMENT NOTES

	Adopt a "everything is a function) approach...

	{% foreach(item, _sort(items, 'asc', 'num')) %}
		<li>{{ pad(item.prefix, '0', 9) + "" + _escape(item.value) }}</li>
	{% endforeach %}

to be lexed/tokenized as:

	statement.foreach.handler("foreach", ["item", "_sort(items, 'asc', 'num')"]);
	statement.foreach.handler("endfor", []);

COMPLEX IF STATEMENT

	Template is...

		{% if (item.length>0) %}
			<li>{{ pad(item.prefix, '0', 9) + "" + escape(item.value) }}</li>
		{% elseif (item.length==1) %}
			<li>One</li>
		{% else %}
			<li>None!</li>
		{% endif %}

	... is tokenized as:

		statement("if", ["item.length>0"]);
		statement("elseif", ["item.length==1"]);
		statement("else", []);
		statement("endif", []);

	... and rendered as :

		if (item.length > 0) {
		} else if (item.length == 1) {
		} else {
		}

	... or what if the template was rendered as series of commands instead of actual javascript...
		statement["if"](
			[
				context["item"]["length"]
			],
			[
			]
		);
		{% if (item.length>0) %}
			<li>{{ pad(item.prefix, '0', 9) + "" + escape(item.value) }}</li>
		{% elseif (item.length==1) %}
			<li>One</li>
		{% else %}
			<li>None!</li>
		{% endif %}





*/

