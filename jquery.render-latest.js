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
		/*
		render: function (data, options) {
			var output = "";
			var environ = {
				$: $,
				render: render,
				data: data
			}
			this.each(function () {
				var compiledTemplate = compile($(this).html());
//				console.log(compiledTemplate.toString());
				output = compiledTemplate.call(environ, options);
			});
			return output;
		}
		*/
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
	var Templates = function Templates(options) {
		/*
		Root function which returns an already compiled template from its cache
		*/
		var templates = function templates(templateId) {
			return templates.templates[templateId] || null;
		};
		templates.templates = {};
		templates.add = function add(id, source, environParam, optionsParam) {
			var options = $.extend({}, optionsParam);
			var environ = $.extend({
				$: $,
				render: render
			}, environParam);
			this.templates[id] = new Templates.Template(id, source, environ, options);
		};
		return templates;
	};

	var templates = new Templates();
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
		this.handler = compile(source);
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
		/*
		write: function write(str) {
			this.stream = this.stream + jEscape.unescape(str+"");
		},
		writeSafe: function writeSafe(str) {
			this.stream = this.stream + str;
		},
		*/
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
//			console.log(templates(id), id, templates(id).render(data));
			console.log("output:", templates(id).render(data));
			return templates(id).render(data);
		}
	};

	var codeStream = [];

	var code = function (code) {
		codeStream = codeStream.concat(code);
	};

	var compile = function compile(template, options) {
		var parsedTemplate = parse(template, options);
		console.log("Template source: ", parsedTemplate);
		var templateFunction = new Function(parsedTemplate);
//		console.log("templateFunction", templateFunction, [templateFunction.toString()]);
		return templateFunction;
	};

	var lexer = function lexer(template, options) {
		var delimitersSet, // Should be in options/config
			delimitersRegexp,
			delimiters,
			matches,
			stack,
			isEndToken,
			match,
			before,
			lastMatchStart,
			lastMatchEnd,
			codeStream,
			statementToken,
			args,
			endSplit,
			content,
			segments,
			expression,
			filters,
			compiledExpression,
			i,
			tokenHandler,
			typeToken;
		delimitersSet = ["{%(.*?) (.*?)%}", "{{(.*?)}}", "{#(.*?)#}"];
		delimitersRegexp = delimitersSet.join("|");
		delimiters = new RegExp(delimitersRegexp, "gm");
		matches = template.match(delimiters) || [];
		matches.push(null); // Add a null value to signify the end of the matches
		lastMatchEnd = 0;
		stack = [];
		codeStream = "";

		for (i in matches) {
			if (matches.hasOwnProperty(i)) {
				match = matches[i];
				if (!match) {
					before = template.substring(lastMatchEnd, template.length);
					if (before.length) {
						codeStream = codeStream + tokenHandlers._raw(before);
					}
				} else {
					lastMatchStart = template.indexOf(match, lastMatchEnd);
					before = template.substring(lastMatchEnd, lastMatchStart);
					if (before.length) {
						codeStream = codeStream + tokenHandlers._raw(before);
					}
					typeToken = match[1];
					if (typeToken=="%") {
						statementToken = match.split(" ")[1];
						args = match.substring(match.indexOf("(")+1, match.lastIndexOf(")")).split(",");
						if (statementToken.substring(0, 3) == "end") {
							isEndToken = true;
							statementToken = statementToken.substring(3);
						} else {
							isEndToken = false;
						}
						endSplit = statementToken.substring(3);
						if (isEndToken) {
							if (statementToken==stack[stack.length-1]) {
								// closing a scope
								codeStream = codeStream + tokenHandlers["end"+statementToken](args);
								stack.pop();
							} else {
								throw("wrong end of scope!");
							}
						} else {
							// opening a new scope
							tokenHandler = tokenHandlers[statementToken];
							if (typeof(tokenHandler)==="function") {
								codeStream = codeStream + tokenHandler(args);
								stack.push(statementToken);
							} else {
								throw("Statement [" + statementToken + "] cannot be parsed!");
							}
						}
					} else if(typeToken=="{") {
						content = match.substring(match.indexOf("{")+2, match.lastIndexOf("}")-1);
						segments = content.split("}{");
						expression = segments[0];
						filters = segments.slice(1);
						compiledExpression = tokenHandlers._expression(expression, filters);
						codeStream = codeStream + compiledExpression;
					} else if(typeToken=="#") {
						content = match.substring(match.indexOf("#")+1, match.lastIndexOf("#"));
						codeStream = codeStream + tokenHandlers._comments(content);
					}
					lastMatchEnd = lastMatchStart + match.length;
				}
			}
		}
		return codeStream;
	};

	var parse = function parse(template, options) {
		//todo: codeStream should not be a global var
		codeStream = [];
		//todo: the render object should be scope to each templates, not the whole library
		code(["var render=this.render;\n var data=this.data;\n var $=this.$;\n"]);
		code(["var output = '';\n"]);
		template = jEscape.escape(template);
		code([lexer(template, options)]);
		code(["return output;\n"]);
		return codeStream.join("");
	};

	var jEscape = {
		escape: function escape(str) {
			// Linefeeds
			str = str.replace(new RegExp( "\\n", "g" ), "{\\n}");
			return str;
		},
		unescapeWithLinefeeds: function unescape(str) {
			// Linefeeds
			str = str.replace(new RegExp( "{\\\\n}", "g" ), "\n");
			// html entities
			str = str.replace("&gt;", ">").replace("&lt;", "<");
			return str;
		},
		unescape: function unescape(str) {
			// Linefeeds
			str = str.replace(new RegExp( "{\\\\n}", "g" ), "\\n");
			// html entities
			str = str.replace("&gt;", ">").replace("&lt;", "<");
			return str;
		}
	};
	var tokenHandlers = {
		_raw: function(content) {
			return "output = output + '" + jEscape.unescape(content) + "';\n";
		},
		_expression: function(content, filters) {
			var code = "";
			if (filters.length) {
				code = code + "var filters = ['" + filters.join("','") + "'];\n";
			}
			code = code + "var content = " + jEscape.unescape(content) + ";\n";
			if (filters.length) {
				code = code + "content = render.applyFilters(content, filters);\n";
			}
			code = code + "output = output + content;\n";
			return code;
		},
		_comments: function(content) {
			return "/* " + jEscape.unescapeWithLinefeeds(content) + " */\n";
		},
		"if": function(args) {
			return "if (" + jEscape.unescape(args[0]) + ") {\n";
		},
		"endif": function() {
			return "};\n";
		},
		"for": function(args) {
			return "for (" + jEscape.unescape(args[0]) + ") {\n";
		},
		endfor: function() {
			return "};\n";
		},
		render: function(args) {
			return "output = output + render.render(" + args[0] + ", " + jEscape.unescape(args[1]) + ");\n";
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



