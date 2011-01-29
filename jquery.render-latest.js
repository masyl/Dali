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
				Env: Env
			}, environParam);
			this.templates[id] = new Templates.Template(id, source, environ, options);
		};
		return templates;
	}

	function Env() {
		this.streamArray = [];
		this.out = function (content) {
			this.streamArray.push(content);
		};
		this.stream = function () {
			return this.streamArray.join("");
		};
		this.applyTag = function (tagName, args, data, blockHandler) {
			var content,
				newEnv = new Env(),
				tag = tags[tagName];
			content = tag.handler.apply(data, [args, newEnv, blockHandler]);
			this.out(content);
		};
		this.applyDecorator = function(decoratorName, args) {
			var str,
				decorator = decorators[decoratorName],
				oldArray = this.streamArray,
				newArray = [];
			for (var i in oldArray) {
				str = decorator.apply(oldArray[i] + "", args);
				newArray.push(str);
			}
			this.streamArray = newArray;
		};
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
		applyDecorators: function (content, decorators) {
			var decorator,
				id;
			for (var i in decorators) {
				if (decorators.hasOwnProperty(i)) {
					id = decorators[i].trim();
					decorator = decorators[id];
					if (typeof(decorator)==="function") {
						content = decorator(content);
					}
				}
			}
			return content;
		},
		render: function (id, data) {
//			console.log("output:", templates(id).render(data));
			return templates(id).render(data);
		}
	};

	function compile(template, options) {
		var parsedTemplate = parse(template, options);
		console.log("Template source: \n", parsedTemplate);
		return new Function(parsedTemplate);
	}


	function lexer(template, options) {
		var delimiters,
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
			decorator,
			decorators,
			i,
			tagToken,
			tagTokenType,
			tree, // a tree representing the tag structure to be rendered
			treeStack, // A stack of tagNodePointers used during recursion
			tagNode, // to store newly created tagNodes
			tagNodePointer; // points to the last tagNode being processed

		delimiters = new RegExp("{(.*?)}", "gm");
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
			this.decorators = [];
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
						tagNodePointer.children.push(new TagNode("raw", "'" + before + "'"));
					}
				} else {
					lastMatchStart = template.indexOf(match, lastMatchEnd);
					before = template.substring(lastMatchEnd, lastMatchStart);
					if (before.length) {
						tagNodePointer.children.push(new TagNode("raw", "'" + before + "'"));
					}
					tagToken = match.split(" ")[0].substring(1);
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
					segments = content.split("&gt;&gt;");
					expression = segments[0].substring(segments[0].indexOf(" "));
					decorators = segments.slice(1);

					console.log("tagToken: ", tagTokenType, tagToken, match, decorators);
					console.log("content: ", content);

					// opening a new scope
					if (typeof(tags[tagToken].handler)!=="function")
						throw("Statement [" + tagToken + "] cannot be parsed!");
					if (tagTokenType === "tag") {
						tagNode = new TagNode(tagToken, expression);
						tagNodePointer.children.push(tagNode);
					} else if (tagTokenType === "openTag" || tagTokenType === "closeTag") {
						// todo: refactor: make statementToken and tagToken the same var
						if (tagTokenType === "openTag") {
							tagNode = new TagNode(tagToken, expression);
							tagNodePointer.children.push(tagNode);
							treeStack.push(tagNode);
							tagNodePointer = tagNode;
						} else {
							if (tagToken!==treeStack[treeStack.length-1].name)
								throw("wrong end of scope!");
							treeStack.pop();
							tagNodePointer = treeStack[treeStack.length-1];
						}
					}

					
					var targetNode,
						decoratorName,
						decoratorArguments;
					for (i in decorators) {
						decorator = decorators[i].trim();
						if (decorator.indexOf("(") > -1) {
							decoratorName = decorator.substring(0, decorator.indexOf("("));
							decoratorArguments = decorator.substring(decorator.indexOf("("));
							decoratorArguments = "[" + decoratorArguments.substring(1, decoratorArguments.lastIndexOf(")")) + "]";
						} else {
							// todo: setup a better and stricter parsing
							decoratorName = decorator;
							decoratorArguments = "[]";
						}
						tagNode.decorators.push(new TagNode(decoratorName, decoratorArguments));

						console.log("decorator: ", decorator);
						console.log("decoratorName: ", decoratorName);
						console.log("decoratorArguments: ", decoratorArguments);
					}
					lastMatchEnd = lastMatchStart + match.length;
				}
			}
		}
		console.dir(tree);
		return compileTree(tree[0]);
	}


	function compileTree (tree) {
		return "var Env=this.Env;\nvar env = new Env();\nvar render=this.render;\n var data=this.data;\n var $=this.$;\n" +
				compileNode(tree) +
				"return env.stream();\n";
	}

	// compile a tagNode and all its children into a javascript function
	function compileNode(node) {
		var i,
			stream = "",
			content,
			tagName,
			child,
			args,
			blockHandler;
		for (i in node.children) {
			child = node.children[i];
			content = (child.children.length || child.decorators) ? compileNode(child) : "";
			args = jEscape.unescape(child.argString).trim();
			tagName = child.name;
			blockHandler = (content) ? "function (env, args) {\n" + content + "}" : null;
			stream = stream + "env.applyTag('" + tagName + "', [" + args + "], this, " + blockHandler + ");\n";
		}
		for (i in node.decorators) {
			child = node.decorators[i];
			stream = stream + "env.applyDecorator('" + child.name + "', " + child.argString + ");\n";
		}
		return stream;
	}


	function parse(template, options) {
		//todo: the render object should be scope to each templates, not the whole library
		template = jEscape.escape(template);
		return lexer(template, options);
	}

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
			handler: function(args, env, blockHandler) {
				return args.join("");
			}
		},
		"if" : {
			handler: function(args, env, blockHandler) {
				if (args[0]) {
					blockHandler.apply(this, [env, args]);
				}
				return env.stream();
			}
		},
		"#" : {
			handler: function(args, env, blockHandler) {
				return "";
			}
		},
		"each" : {
			handler: function(args, env, blockHandler) {
				var i, item, items;
				items = args[0];
				if (typeof(blockHandler) === "function") {
					for (i in items) {
						item = items[i];
						blockHandler.apply(item, [env, args]);
					}
				}
				return env.stream();
			}
		},
		"out" : {
			handler: function(args, env, blockHandler) {
				env.out(args.join(""));
				if (blockHandler) {
					blockHandler.apply(this, [env, args]);
				}
				return env.stream();
			}
		},
		"var" : {
			// todo: NOT WORKING YET
			handler: function(args, env, blockHandler) {
				//return "var " + jEscape.unescape(args) +  ";\n";
			}
		},
		"render" : {
			handler: function(args, env, blockHandler) {
				env.out(render.render(args[0], args[1]));
				return env.stream();
				// todo: handle template source from tag content
			}
		}
	};

	var decorators = {
		trim: function(args) {
			return (this+"").trim();
		},
		uppercase: function(args) {
			return (this+"").toUpperCase();
		},
		lowercase: function(args) {
			return (this+"").toLowerCase();
		}
	};

})(jQuery);
