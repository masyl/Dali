/*

	Dali - Javascript Templating Engine

	See readme.txt for documentation

*/
exports = (typeof exports === "object") ? exports : null;
(function (global, $, exports) {
	/**
	 * Create an Dali instance. Each instance has its own set templates and config.
	 * @constructor
	 */
	function Dali(options) {

		var dali = this;

		this.templates = {};
		this.tags = tags;
		this.decorators = decorators;
		this.version = "0.1";

		/**
		 * Constructor for individual templates
		 * @constructor
		 */
		this.Template = function Template(id, source, vars, options) {
			var template = this;
			this.id = id;
			this.source = source;
			this.handler = compile();
			this.vars = {};

			extend(this.vars, vars);

			this.render = function render(data, vars) {
				var newVars = {},
					output,
					env;
				extend(newVars, this.vars);
				extend(newVars, vars);
				env = new Env(newVars);
				try {
					output = this.handler.call(data, env);
				} catch(err) {
					throw(new Err("RenderingFailed", "Template rendering failed, with following error:\n" + err.name + "\n" + err.message));
				}
				return output;
			};

			function compile() {
				var
						fn,
						err,
						source =
						"var vars = env.vars;\n" +
						lexer(escape(template.source)) +
						"return env.stream();\n";
				//console.log("Template source: \n", source);
				try {
					fn = new Function("env", source);
				} catch(err) {
					throw(new Err("CompilationFailed", "Template compilation failed, with following error:\n" + err.name + "\n" + err.message));
				}
				return fn;
			}

		};

		/**
		 * Get a template by its id
		 * @param id
		 * @returns a template
		 */
		this.get = function(id) {
			return this.templates[id];
		};

		/**
		 * Add a new template instance and compile it
		 * @param id {string} he id by which this new tempalte can be called
		 * @param source {string} the source of the template to compile
		 * @param environParam {object} specific environment data to be made available during rendering
		 * @param optionsParam {object} options, none for now
		 */
		this.add = function add(id, source, environParam, optionsParam) {
			var options = {},
				environ = {
					Env: Env,
					dali: dali
				};
			extend(options, optionsParam);
			extend(environ, environParam);
			return dali.templates[id] = new dali.Template(id, source, environ, options);
		};

		/**
		 * Environment object available during the rendering process
		 * @constructor
		 * @param vars
		 */
		function Env(vars) {
			this.dali = dali;
			this.vars = vars || {};
			this.render = function (id, data, env) {
				return dali.get(id).render(data, env);
			};
			this.addTemplate = function (id, source, environParam, optionsParam) {
				return dali.add(id, source, environParam, optionsParam);
			};
			this._stream = [];
			/**
			 * Add content to the output stream
			 * @param content
			 */
			this.out = function (content) {
				this._stream.push(content);
			};
			/**
			 * Return the stream content as a string
			 */
			this.stream = function () {
				return this._stream.join("");
			};
			/**
			 * Render a tag with the available arguments, contextual data and block content
			 * @param tagName
			 * @param args
			 * @param data
			 * @param blockHandler
			 */
			this.applyTag = function (tagName, args, data, blockHandler) {
				var content,
					newEnv = new Env(vars),
					tag = tags[tagName].handler;
				content = tag.apply(data, [args, newEnv, blockHandler]);
				this.out(content);
			};
			/**
			 * Apply a decorator function to the available arguments
			 * @param decoratorName
			 * @param args
			 */
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
			decoratorTag,
			decoratorsTags,
			i,
			j,
			tagName,
			tagType,
			tree, // a tree representing the tag structure to be rendered
			treeStack, // A stack of tagNodePointers used during recursion
			tagNode, // to store newly created tagNodes
			tagNodePointer; // points to the last tagNode being processed

		tagsMatch = template.match(/{{(.*?)}}/gm) || [];
		lastTagEnd = 0;
		tree = [];
		treeStack = [];


		// Create the root TagNode
		tagNode = tagNodePointer = new TagNode("out", "", "");
		tree.push(tagNode);
		treeStack.push(tagNode);
		for (i in tagsMatch) {
			if (tagsMatch.hasOwnProperty(i)) {
				tag = tagsMatch[i];
				lastTagStart = template.indexOf(tag, lastTagEnd);
				before = template.substring(lastTagEnd, lastTagStart);
				if (before.length) {
					tagNodePointer.children.push(new TagNode("raw", "'" + escape(before) + "'", before));
				}
				tagName = tag.split(/ +/)[0];
				// If the braces and tag name are separated by spaces
				if (tagName === "{{") {
					tagName = tag.split(/ +/)[1];
				} else {
					tagName = tag.split(/ +/)[0].substring(2);
				}
				if (tagName.substring(0,3) === "end") {
					tagType = "closeTag";
					// Remove the trailing brace
					tagName = tagName.split("}}")[0];
					tagName = tagName.substring(3);
				} else if (tag.substring(tag.length -3) === "/}}") {
					tagType = "tag";
					tagName = tagName.split("/}}")[0];
				} else {
					tagName = tagName.split("}}")[0];
					tagType = "openTag";
				}

				var tagEnd = (tagType === "tag") ? "/}}" : "}}";
				content = tag.substring(tag.indexOf("{{")+2, tag.lastIndexOf(tagEnd));
				segments = content.split(">>");
				args = "";
				if (segments[0].trim().indexOf(" ") > -1) {
					args = segments[0].trim().substring(segments[0].trim().indexOf(" "));
				}

				// opening a new scope
				if (!tags[tagName])
					throw(new Err("UnknownTag", "Encountered unknown tag \"" + tagName + "\""));
				if (tagType === "tag") {
					tagNode = new TagNode(tagName, args, tag);
					tagNodePointer.children.push(tagNode);
				} else if (tagType === "openTag" || tagType === "closeTag") {
					if (tagType === "openTag") {
						tagNode = new TagNode(tagName, args, tag);
						tagNodePointer.children.push(tagNode);
						treeStack.push(tagNode);
						tagNodePointer = tagNode;
					} else {
						// temporarelly move the pointer to the exiting scope and test to
						// see if the tag was properly closed
						tagNodePointer = treeStack.pop();
						if (tagName !== tagNodePointer.name)
							throw(new Err("BadlyClosedTag", "Was expecting closing tag for \"" + tagNodePointer.name + "\" but encountered \"" + tagName + "\""));
						tagNodePointer = treeStack[treeStack.length-1];
					}
				}

				// Process chained decorators
				decoratorsTags = segments.slice(1);
				for (j in decoratorsTags) {
					decoratorTag = decoratorsTags[j].trim();
					if (decoratorTag.indexOf("(") > -1) {
						tagName = decoratorTag.substring(0, decoratorTag.indexOf("("));
						args = decoratorTag.substring(decoratorTag.indexOf("("));
						args = "[" + args.substring(1, args.lastIndexOf(")")) + "]";
					} else {
						// todo: setup a better and stricter parsing
						tagName = decoratorTag;
						args = "[]";
					}
					if (typeof(decorators[tagName]) !== "function") throw(new Err("UnknownDecorator", "Encountered unknown decorator \"" + tagName + "\""));
					tagNode.decorators.push(new TagNode(tagName, args, ""));

				}
				// move the cursor forward
				lastTagEnd = lastTagStart + tag.length;
			}
		}
		// Add a raw tag for the last piece to be renderec or if not tag are found
		before = template.substring(lastTagEnd, template.length);
		if (before.length) {
			tagNodePointer.children.push(new TagNode("raw", "'" + escape(before) + "'", before));
		}
		return compileNode(tree[0]);
	}

	/**
	 * Tag object used to populate the tagTree
	 * @param name
	 * @param argString
	 */
	function TagNode(name, argString, raw) {
		this.name = name;
		this.argString = argString;
		this.children = [];
		this.decorators = [];
		this.raw = raw;
	}

	function Tag(id, handler, options) {
		this.isInnert = false; // determines if the tags content should be parsed or not
		extend(this, options);
		// The following attributes cannot be overriden with the options param
		this.id = id;
		this.handler = handler;
	}

	/**
	 * Compile a tagNode and all its children into a javascript function
	 * @param node
	 */
	function compileNode(node) {
		var i,
			stream = [],
			content,
			tag,
			tagName,
			child,
			args,
			blockHandler;
		// Apply tags
		for (i in node.children) {
			child = node.children[i];
			tagName = child.name;
			tag = tags[tagName];
			if (tag) {
				if (tag.isInnert) {
					content = "'" + escape(compileInnertNode(child)) + "'";
				} else {
					content = (child.children.length || child.decorators.length) ? compileNode(child) : "";
					content = (content) ? "function (env, args, loop) {\nvar vars = env.vars;\n" + content + "}" : "null";
				}
				args = unescape(child.argString).trim();
				stream.push("env.applyTag('" + tagName + "', [" + args + "], this, " + content  + ");\n");
			}
		}
		// Apply decorator functions
		for (i in node.decorators) {
			child = node.decorators[i];
			stream.push("env.applyDecorator('" + child.name + "', " + child.argString + ");\n");
		}
		return stream.join("");
	}
	function compileInnertNode(node) {
		var i,
			stream = [],
			child;
		for (i in node.children) {
			child = node.children[i];
			stream.push(child.raw);
		}
		return stream.join("");
	}

	var tags = {
		"raw" : new Tag("raw", function(args, env, blockHandler) {
			return args.join("");
		}, {}),
		"if" : new Tag("if", function(args, env, blockHandler) {
			var output = "";
			if (args[0]) {
				output = output + (args[1] || "");
				if (typeof(blockHandler) === "function") {
					blockHandler.apply(this, [env, args]);
				}
			} else {
				output = output + (args[2] || "");
			}
			return output + env.stream();
		}, {}),
		"comment" : new Tag("comment", function(args, env, blockHandler) {
			return "";
		},{isInnert:true}),
		"each" : new Tag("each", function(args, env, blockHandler) {
			var i, item, items, loop;
			items = args[0];
			if (typeof(blockHandler) === "function") {
				loop = new Loop(items.length);
				for (i in items) {
					loop.step();
					item = items[i];
					blockHandler.apply(item, [env, args, loop]);
				}
			}
			return env.stream();
		}, {}),
		"out" : new Tag("out", function(args, env, blockHandler) {
			env.out(args.join(""));
			if (blockHandler) {
				blockHandler.apply(this, [env, args]);
			}
			return env.stream();
		}, {}),
		"template": new Tag("template", function(args, env, blockHandler) {
			var template,
				id = args[0],
				source = "",
				environParam = env, //todo: reuse env or instantiate a new one ??
				optionsParam = {};
			source = blockHandler;
			template = env.addTemplate(id, source, environParam, optionsParam);
			return "";
		}, {isInnert: true}),
		"render" : new Tag("render", function(args, env, blockHandler) {
			if (blockHandler) {
				blockHandler.apply(this, [env, args]);
			}
			var output = env.render(args[0], args[1], {
				"_body": env.stream()
			});
			return output;
		}, {}),
		"var" : new Tag("var", function(args, env, blockHandler) {
			var val;
			if (typeof(args[1]) !== "undefined") {
				val = args[1];
			}
			if (blockHandler) {
				blockHandler.apply(this, [env, args]);
				val = env.stream();
			}
			env.vars[args[0]] = val;
			return "";
		}, {})
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

	/**
	 * Error helper constructor
	 * @param name
	 * @param message
	 */
	function Err(name, message) {
		var err = new Error();
		err.name = name;
		err.message = message;
		return err;
	};

	/**
	 * Iterator state object
	 * @param count {number} The number of items in the iteration
	 */
	function Loop(count) {
		this.count = count;
		this.last = false;
		this.current = 0;
		this.step = function() {
			this.current = this.current + 1;
			if (this.current >= this.count) this.last = true;
		}
	}

	/**
	 * Extend an object with the properties of another
	 * @param obj
	 * @param extObj
	 */
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

	/**
	 * Escape special characters so that it doesnt come in conflits with parsing and compilation
	 * @param str
	 */
	function escape(str) {
		// Linefeeds
		str = (str+"").replace(/\n/g, "&#10;");
		str = str.replace(/'/g, "&rsquo;");
		return str;
	}

	/**
	 * Removed escaping rules that have been applied with the "escape" function
	 * @param str
	 */
	function unescape(str) {
		// Linefeeds
		str = (str+"").replace(/&#10;/g, "\\n");
		// html entities
		str = str.replace(/&gt;/g, ">").replace(/&lt;/g, "<");
		return str;
	}

	/**
	 * Makes Dali available as a jQuery plugin
	 * @param $ {jQuery} A jQuery instance
	 */
	function exportjQuery($) {
		$.dali = new Dali({});
		$.fn.extend({
			dali: function (environParam, options) {
				this.each(function () {
					$.dali.add(this.id, $(this).html());
				});
			}
		});
	}

	/**
	 * Export Dali as a JSCommons module
	 * @param exports Export object from the JSCommons api
	 */
	function exportJSCommons(exports) {
		exports.dali = function (options) {
			return new Dali(options)
		}
	}

	// apply exports
	if ($) exportjQuery($);
	if (exports) exportJSCommons(exports);
	global.Dali = Dali;

})(this, this.jQuery, exports);


