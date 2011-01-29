/*

	jquery.render

	Template rendering engine

	See readme.txt for documentation

*/
(function(scope){

	/*
	Main constructor which creates an instance of the root method
	*/
	scope.Dali = Dali;
	function Dali(options) {

		/*
		Root function which returns an already compiled template from its cache
		*/
		function dali(templateId) {
			return dali.templates[templateId] || null;
		}

		dali.templates = {};

		/*
		Constructor for individual templates
		*/
		dali.Template = function Template(id, source, environ, options) {
			this.id = id;
			this.source = source;
			this.environ = environ;
			this.handler = compile(source, {});
			this.render = function render(data, options) {
				var environ = {};
				extend(environ, this.environ)
				extend(environ, {
					options: options, // todo: see if deep extend is needed here
					data: data
				});
				//console.log("this.render: ", this.handler, this.id, environ, data, options);
				var output=this.handler.call(environ);
				//console.log("output2", output);
				return output;
			};
		};

		dali.add = function add(id, source, environParam, optionsParam) {
			var options = {},
				environ = {
					Env: Env,
					dali: dali
				};
			extend(options, optionsParam);
			extend(environ, environParam);
			dali.templates[id] = new dali.Template(id, source, environ, options);
		};
		return dali;
	}

	function Env(dali) {
		this.stream = "";
		this.version = "0.1";
		this.render = function (id, data) {
			return dali(id).render(data);
		};
		this._stream = [];
		this.out = function (content) {
			this._stream.push(content);
		};
		this.stream = function () {
			return this._stream.join("");
		};
		this.applyTag = function (tagName, args, data, blockHandler) {
			var content,
				newEnv = new Env(dali),
				tag = tags[tagName];
			content = tag.apply(data, [args, newEnv, blockHandler]);
			this.out(content);
		};
		this.applyDecorator = function(decoratorName, args) {
			var str,
				decorator = decorators[decoratorName],
				oldArray = this._stream,
				newArray = [];
			for (var i in oldArray) {
				str = decorator.apply(oldArray[i] + "", args);
				newArray.push(str);
			}
			this._stream = newArray;
		};
	}



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
			argSring,
			decorator,
			decorators,
			i,
			tagToken,
			tagTokenType,
			tree, // a tree representing the tag structure to be rendered
			treeStack, // A stack of tagNodePointers used during recursion
			tagNode, // to store newly created tagNodes
			tagNodePointer; // points to the last tagNode being processed

		delimiters = /{(.*?)}/gm;
		matches = template.match(delimiters) || [];
		//console.log("MATCHES: ", matches, template);
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
						tagNodePointer.children.push(new TagNode("raw", "'" + jEscape.escape(before) + "'"));
					}
				} else {
					lastMatchStart = template.indexOf(match, lastMatchEnd);
					before = template.substring(lastMatchEnd, lastMatchStart);
					if (before.length) {
						tagNodePointer.children.push(new TagNode("raw", "'" + jEscape.escape(before) + "'"));
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
						tagToken = tagToken.split("}")[0];
						tagTokenType = "openTag";
					}

					// todo: trigger the appropriate tag handler
					var tagEnd = (tagTokenType === "tag") ? "/}" : "}";
					content = match.substring(match.indexOf("{")+1, match.lastIndexOf(tagEnd));
					segments = content.split("&gt;&gt;");
					if (segments[0].indexOf(" ") > -1) {
						argSring = segments[0].substring(segments[0].indexOf(" "));
					} else {
						argSring = ""
					}
					decorators = segments.slice(1);

					//console.log("tagToken: ", tagTokenType, tagToken, match, decorators);
					//console.log("content: ", content);

					// opening a new scope
					if (typeof(tags[tagToken])!=="function")
						throw("Statement [" + tagToken + "] cannot be parsed!");
					if (tagTokenType === "tag") {
						tagNode = new TagNode(tagToken, argSring);
						tagNodePointer.children.push(tagNode);
					} else if (tagTokenType === "openTag" || tagTokenType === "closeTag") {
						// todo: refactor: make statementToken and tagToken the same var
						if (tagTokenType === "openTag") {
							tagNode = new TagNode(tagToken, argSring);
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

						//console.log("decorator: ", decorator);
						//console.log("decoratorName: ", decoratorName);
						//console.log("decoratorArguments: ", decoratorArguments);
					}
					lastMatchEnd = lastMatchStart + match.length;
				}
			}
		}
		//console.dir(tree);
		return compileTree(tree[0]);
	}

	function compileTree (tree) {
		// todo: clean-up and simplify env & var
		// todo: use a function with params, instead of var declarations
		return "var Env=this.Env;\n" +
				"var env = new Env(this.dali);\n" +
				"var data = this.data;\n" +
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
			str = str.replace(/\n/g, "%lf%");
			return str;
		},
		unescapeWithLinefeeds: function unescape(str) {
			// Linefeeds
			str = str.replace(/%lf%/g, "\\n");
			// html entities
			str = str.replace(/%gt%/g, ">").replace(/&lt;/g, "<");
			return str;
		},
		unescape: function unescape(str) {
			// Linefeeds
			str = str.replace(/%lf%/g, "\\n");
			// html entities
			str = str.replace(/&gt;/g, ">").replace(/&lt;/g, "<");
			return str;
		}
	};
	var tags = {
		"raw" : function(args, env, blockHandler) {
			return args.join("");
		},
		"if" : function(args, env, blockHandler) {
			if (args[0]) {
				blockHandler.apply(this, [env, args]);
			}
			return env.stream();
		},
		"#" : function(args, env, blockHandler) {
			return "";
		},
		"each" : function(args, env, blockHandler) {
			var i, item, items;
			items = args[0];
			if (typeof(blockHandler) === "function") {
				for (i in items) {
					item = items[i];
					blockHandler.apply(item, [env, args]);
				}
			}
			return env.stream();
		},
		"out" : function(args, env, blockHandler) {
			env.out(args.join(""));
			if (blockHandler) {
				blockHandler.apply(this, [env, args]);
			}
			return env.stream();
		},
		"var" : function(args, env, blockHandler) {
			//return "var " + jEscape.unescape(args) +  ";\n";
			// todo: NOT WORKING YE
		},
		"render" : function(args, env, blockHandler) {
			env.out(env.render(args[0], args[1]));
			return env.stream();
			// todo: handle template source from tag content
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

	// Create Global "extend" method
	function extend(obj, extObj) {
		if (arguments.length > 2) {
			for (var a = 1; a < arguments.length; a++) {
				extend(obj, arguments[a]);
			}
		} else {
			for (var i in extObj) {
				obj[i] = extObj[i];
			}
		}
		return obj;
	};

})(this);
