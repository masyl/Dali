/*

	Dali - Javascript Templating Engine

	See readme.txt for documentation

*/
(function(){

	/*
	Main constructor which creates an instance of the root method
	*/

	this.Dali = Dali;

	function Dali(options) {
		// todo: simplify the dali constructor... less like jQuery
		/*
		Root function which returns an already compiled template from its cache
		*/
		function dali(templateId) {
			return dali.templates[templateId] || null;
		}

		extend(dali, {
			templates: {},
			tags: tags,
			decorators: decorators,
			version: "0.1"
		});

		/*
		Constructor for individual templates
		*/
		dali.Template = function Template(id, source, environ, options) {
			var template = this;
			this.id = id;
			this.source = source;
			this.environ = new Env();
			this.handler = compile();

			this.render = function render(data) {
				return this.handler.call(data, this.environ);
			};

			function compile() {
				//console.log("Template source: \n", source);
				var source = lexer(escape(template.source)) +
						"return env.stream();\n";
				return new Function("env", source);
			}

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

		function Env() {
			this.dali = dali;
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
					newEnv = new Env(),
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

		return dali;
	}


	// todo: Refactor: Cut the lexer in smaller functions
	function lexer(template) {
		var tag,
			tagsMatch,
			before,
			lastTagStart,
			lastTagEnd,
			endSplit,
			content,
			segments,
			args,
			decorator,
			decorators,
			i,
			j,
			tagName,
			tagType,
			tree, // a tree representing the tag structure to be rendered
			treeStack, // A stack of tagNodePointers used during recursion
			tagNode, // to store newly created tagNodes
			tagNodePointer; // points to the last tagNode being processed

		tagsMatch = template.match(/{(.*?)}/gm) || [];
		lastTagEnd = 0;
		tree = [];
		treeStack = [];


		// Create the root TagNode
		tagNode = tagNodePointer = new TagNode("out", "");
		tree.push(tagNode);
		treeStack.push(tagNode);

		for (i in tagsMatch) {
			if (tagsMatch.hasOwnProperty(i)) {
				tag = tagsMatch[i];
				lastTagStart = template.indexOf(tag, lastTagEnd);
				before = template.substring(lastTagEnd, lastTagStart);
				if (before.length) {
					tagNodePointer.children.push(new TagNode("raw", "'" + escape(before) + "'"));
				}
				tagName = tag.split(" ")[0].substring(1);
				if (tagName[0] === "/") {
					tagType = "closeTag";
					// Remove the trailing brace
					tagName = tagName.split("}")[0];
					tagName = tagName.substring(1);
				} else if (tag.substring(tag.length -2) === "/}") {
					tagType = "tag";
					tagName = tagName.split("/}")[0];
				} else {
					tagName = tagName.split("}")[0];
					tagType = "openTag";
				}

				var tagEnd = (tagType === "tag") ? "/}" : "}";
				content = tag.substring(tag.indexOf("{")+1, tag.lastIndexOf(tagEnd));
				segments = content.split("&gt;&gt;");
				args = "";
				if (segments[0].indexOf(" ") > -1) {
					args = segments[0].substring(segments[0].indexOf(" "));
				}
				decorators = segments.slice(1);

				//console.log("tagToken: ", tagTokenType, tagToken, match, decorators);
				//console.log("content: ", content);

				// opening a new scope
				if (typeof(tags[tagName])!=="function")
					throw("Unknown tag:  " + tagName);
				if (tagType === "tag") {
					tagNode = new TagNode(tagName, args);
					tagNodePointer.children.push(tagNode);
				} else if (tagType === "openTag" || tagType === "closeTag") {
					if (tagType === "openTag") {
						tagNode = new TagNode(tagName, args);
						tagNodePointer.children.push(tagNode);
						treeStack.push(tagNode);
						tagNodePointer = tagNode;
					} else {
						// temporarelly move the pointer to the exiting scope and test to
						// see if the tag was properly closed
						tagNodePointer = treeStack.pop();
						if (tagName !== tagNodePointer.name)
							throw("Badly closed tag: expecter '" + tagNodePointer.name + "' but got '" + tagName + "'");
						tagNodePointer = treeStack[treeStack.length-1];
					}
				}

				// Process chained decorators
				var targetNode;
				for (j in decorators) {
					decorator = decorators[i].trim();
					if (decorator.indexOf("(") > -1) {
						tagName = decorator.substring(0, decorator.indexOf("("));
						args = decorator.substring(decorator.indexOf("("));
						args = "[" + args.substring(1, args.lastIndexOf(")")) + "]";
					} else {
						// todo: setup a better and stricter parsing
						tagName = decorator;
						args = "[]";
					}
					tagNode.decorators.push(new TagNode(tagName, args));

				}
				// move the cursor forward
				lastTagEnd = lastTagStart + tag.length;
			}
		}
		// Add a raw tag for the last piece to be renderec or if not tag are found
		before = template.substring(lastTagEnd, template.length);
		if (before.length) {
			tagNodePointer.children.push(new TagNode("raw", "'" + escape(before) + "'"));
		}
		return compileNode(tree[0]);
	}

	function TagNode(name, argString) {
		this.name = name;
		this.argString = argString;
		this.children = [];
		this.decorators = [];
	}

	// compile a tagNode and all its children into a javascript function
	function compileNode(node) {
		var i,
			stream = [],
			content,
			tagName,
			child,
			args,
			blockHandler;
		// Apply tags
		for (i in node.children) {
			child = node.children[i];
			tagName = child.name;
			content = (child.children.length || child.decorators.length) ? compileNode(child) : "";
			args = unescape(child.argString).trim();
			blockHandler = (content) ? "function (env, args) {\n" + content + "}" : null;
			stream.push("env.applyTag('" + tagName + "', [" + args + "], this, " + blockHandler + ");\n");
		}
		// Apply decorator functions
		for (i in node.decorators) {
			child = node.decorators[i];
			stream.push("env.applyDecorator('" + child.name + "', " + child.argString + ");\n");
		}
		return stream.join("");
	}

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
		"render" : function(args, env, blockHandler) {
			env.out(env.render(args[0], args[1]));
			return env.stream();
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
	}

	function escape(str) {
		// Linefeeds
		str = str.replace(/\n/g, "%lf%");
		return str;
	}

	function unescape(str) {
		// Linefeeds
		str = str.replace(/%lf%/g, "\\n");
		// html entities
		str = str.replace(/&gt;/g, ">").replace(/&lt;/g, "<");
		return str;
	}

})();
