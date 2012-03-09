/*

	Dali - Javascript Templating Engine

	See readme.txt for documentation

*/
/*jslint evil: true, forin: true, maxerr: 100, indent: 4 */

// todo: consider replacing vars with a "set" that acts on the model
var global = (typeof (window) === "object") ? window : this;
(function (global, $, undefined) {

	var Filters,
		lexer,
		template,
		Err,
		Env,
		extend,
		TagNode,
		i18n,
		Utils;

	/**
	 * Create an Dali instance. Each instance has its own set templates and config.
	 * @constructor
	 */
	function Dali(options) {

		var dali = this;

		this.templates = {};
		this.tags = Tags;
		this.filters = Filters;
		this.version = "1.0.1";

		this.unescape = unescape;

		/**
		 * Constructor for individual templates
		 * @constructor
		 */
		this.Template = function Template(id, source, vars, options) {

			function compile() {
				var fn,
					source;
					//console.log("Template source: \n", source);

				try {
					source =
						"var vars = env.vars;\n" +
						"var data = this;\n" +
						lexer(template.source) +
						"return env.stream();\n";
						source = source.replace(/[\n\r]+/gm, ''); // Patch required for IE which doesn't handler carriage returns correctly
				} catch (err) {
					/*
					throw (new Err("TemplateParsingFailed", "Template parsing failed, with following error:\n" +
						"error: " + err.name + "\n" +
						"message: " + err.message + "\n\n" +
						"Failed Template source: \n" + template.source));
					*/
					throw (new Err("TemplateParsingFailed", err.name + "\n" +
						"m: " + err.message + "\n\n" +
						"s: \n" + template.source));
				}

				try {
					fn = new Function("env", source);
				} catch (err2) {
					throw (new Err("TemplateCompilationFailed", "Template compilation failed, with following error:\n" +
						"error: " + err2.name + "\n" +
						"message: " + err2.message + "\n\n" +
						"Compiled template source: \n" + source));
				}
				return fn;
			}

			var template = this;
			this.id = id;
			this.source = source;
			this.handler = compile();
			this.i18n = {};
			extend(this.vars, vars);

			this.render = function render(data, vars, env) {
				if (typeof data.partial === "function") {
					Dali.partial = data.partial;
				}
				var newVars = {},
					output;
				extend(newVars, this.vars);
				extend(newVars, vars);
				if (env) {
					// Use environment provided
					extend(env.vars, vars);
				} else {
					// Create new environment
					env = new Env(newVars);
				}
				try {
					output = this.handler.call(data, env);
				} catch (err) {
					logError(err);
					throw (new Err("RenderingFailed", "Template rendering failed, with following error:\n" +
						"error: " + err.name + "\n" +
						"message: " + err.message + "\n\n" +
						"Failed template name: \n" + this.id));
				}
				return output;
			};



		};

		/**
		 * Get a template by its id
		 * @param id
		 * @returns a template
		 */
		this.get = function (id) {
			return this.templates[id];
		};

		/**
		 * Add a new template instance and compile it
		 * @param id {string} he id by which this new tempalte can be called
		 * @param source {string} the source of the template to compile
		 * @param _vars {object} specific environment data to be made available during rendering
		 * @param optionsParam {object} options, none for now
		 */
		this.add = function add(id, source, _vars, optionsParam) {
			var template,
				options = {},
				vars = {};
			extend(options, optionsParam);
			extend(vars, _vars);
			template = dali.templates[id] = new dali.Template(id, source, vars, options);
			return template;
		};

		/**
		 * Environment object available during the rendering process
		 * @constructor
		 * @param vars
		 */
		function Env(vars, parentEnv) {
			this.dali = dali;
			this.vars = vars || {};
			// TODO: REFACTOR: Should this be extended? And restricted to local scope ?
			this.parent = parentEnv || null;
			if (this.parent) {
				this.loop = parentEnv.loop;
			} else {
				this.loop = new Loop();
			}

			this.render = function (id, data, vars, env) {
				var template = dali.get(id);
				if (!template) {
					throw new Err("TemplateNotFound", "Template not found: " + id);
				}
				return template.render(data, vars, env);
			};
			this.addTemplate = function (id, source, vars, optionsParam) {
				return dali.add(id, source, vars, optionsParam);
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
				var value;
				if (this._stream.length > 1) {
					value = this._stream.join("");
				} else {
					value = this._stream[0];
				}
				return value;
			};
			this.flush = function () {
				this._stream = [];
				return this;
			};
			/**
			 * Render a tag with the available arguments, contextual data and block content
			 * @param tagName
			 * @param argString
			 * @param data
			 * @param blockHandler
			 * @param alternateBlocks
			 */
			this.applyTag = function (tagName, argString, data, blockHandler, alternateBlocks, filtersHandler) {
				var content, newEnv, args, tag, tagHandler;
				newEnv = new Env(this.vars, this);
				newEnv.item = data;
				args = function (_argString) {
					var val = evaluateExpressions(_argString || argString, newEnv);
					return val[0];
				};


				// bug: args only contain the first argument
				// In this case, the "test" var receives "undefined" :
				// {{var "test" , 123 /}}



				tag = Tags[tagName];
				content = tag.handler(data, args, newEnv, blockHandler, alternateBlocks, filtersHandler);
				if (content !== undefined) {
					this.out(content);
				}
				return this;
			};

			/**
			 * Apply a filter function to the available arguments
			 * @param filterName
			 * @param argString
			 */
			this.applyFilter = function (filterName, argString) {
				var str,
					filter = Filters[filterName],
					newArray = [],
					args,
					newEnv;
				newEnv = new Env(this.vars, this);
				args = evaluateExpressions(argString, newEnv);
				str = filter.call(newEnv, this._stream.join(""), args[0]);
				this._stream = [str];
				return this;
			};
		}

	}

	/**
	 * The collection of filters available during rendering
	 */
	Filters = Dali.Filters = {};

	/**
	 * The collection of tags available during rendering
	 */
	var Tags = Dali.Tags = {};

	/**
	 * Register custom addons such as filters and tags
	 * @param addons
	 */
	Dali.register = function (addons) {
		addons = addons || {};
		extend(this.Filters, addons.Filters || {});
		extend(this.Tags, addons.Tags || {});
	};

	/**
	 * The tag object used to page the templates
	 * @constructor
	 */
	var Tag = Dali.Tag = function (id, handler, options) {
		this.isInnert = false; // determines if the tags content should be parsed or not
		this.alternateBlocks = {};
		extend(this, options);
		// The following attributes cannot be overriden with the options param
		this.id = id;
		this.handler = handler;
	};


	// todo: Refactor: Cut the lexer in smaller functions
	/**
	 * The lexer is used to cut a template into smaller pieces and convert it into a logical tree structure.
	 * @param template

	 */
	lexer = function (template) {
		var tag,
			tagsMatch,
			before,
			lastTagStart,
			lastTagEnd,
			endSplit,
			content,
			segments,
			args,
			filterTag,
			filtersTags,
			i,
			j,
			ignoreBlock,
			ignoreTag,
			tagName,  // ex.: if, endif
			tagNameExtension, // ex.: if-elseif, if-else
			tagType,
			linefeedCount,
			tree, // a tree representing the tag structure to be rendered
			treeStack, // A stack of tagNodePointers used during recursion
			tagNode, // to store newly created tagNodes
			tagNodePointer; // points to the last tagNode being processed

		tagsMatch = template.match(/\{\{([\s\S]*?)\}\}/gm) || [];
		lastTagEnd = 0;
		tree = [];
		treeStack = [];

		// Create the root TagNode
		tagNode = tagNodePointer = new TagNode("out", "", "", "", false, false);
		tree.push(tagNode);
		treeStack.push(tagNode);
		if (tagsMatch) {
			for (i in tagsMatch) {
				if (tagsMatch.hasOwnProperty(i)) {
					tag = tagsMatch[i];
					// Replace all "whitespaces" characters with normal spaces for easier
					// parsing of multiline tags
					tag = tag.replace(/\s/g, " ");
					lastTagStart = template.replace(/\s/g, " ").indexOf(tag, lastTagEnd);
					before = template.substring(lastTagEnd, lastTagStart);
					if (before.length) {
						tagNodePointer.children.push(new TagNode("raw", "", '"' + escape(before) + '"', before, false, false));
					}
					tagName = tag.split(/ +/)[0];
					// If the braces and tag name are separated by spaces
					if (tagName === "{{") {
						tagName = tag.split(/ +/)[1];
					} else {
						tagName = tag.split(/ +/)[0].substring(2);
					}
					ignoreTag = false;
					if (tagName.substring(0, 3) === "end") {
						tagType = "closeTag";
						// Remove the trailing brace
						tagName = tagName.split("}}")[0];
						tagName = tagName.substring(3);
					} else if (tag.substring(tag.length - 3) === "/}}") {
						tagType = "tag";
						tagName = tagName.split("/}}")[0];
					} else {
						tagName = tagName.split("}}")[0];
						tagType = "openTag";
					}

					var tagEnd = (tagType === "tag") ? "/}}" : "}}";
					content = tag.substring(tag.indexOf("{{") + 2, tag.lastIndexOf(tagEnd));

					// See if the "#" comment character has been used to comment out the tag
					ignoreBlock = false;
					if (content[content.length - 1] === "#") {
						ignoreBlock = true;
						content = content.substring(0, content.length - 1);
					}

					// See if the "#" comment character has been used to comment out the tag
					ignoreTag = false;
					if (tagName[0] === "#") {
						ignoreTag = true;
						tagName = tagName.substring(1);
					}

					// Parse segments for filters
					segments = content.split(">>");

					// Parse arguments
					args = "";
					if (segments[0].trim().indexOf(" ") > -1) {
						args = segments[0].trim().substring(segments[0].trim().indexOf(" "));
					}

					// split the tagName and and the tagNameExtension
					tagNameExtension = tagName.split("-").slice(1).join("");
					tagName = tagName.split("-")[0];

					// Test if tag exists
					if (!Tags[tagName]) {
						throw (new Err("UnknownTag", "Encountered unknown tag \"" + tagName + "\""));
					}
					// If the tag is an alternate tag, test if it is applicable
					if (tagNameExtension && !Tags[tagName].alternateBlocks[tagNameExtension]) {
						throw (new Err("UnknownAlternateTag", "Encountered unknown alternate tag \"" + tagName + "-" + tagNameExtension + "\""));
					}

	// TODO: HANDLE CASE OF SELF-CLOSING ALT TAGS
	// TODO: HANDLE CASE OF CLOSE-TAG + ALT-TAG

					if (tagType === "tag") {
						tagNode = new TagNode(tagName, "", args, tag, ignoreTag, ignoreBlock);
						tagNodePointer.children.push(tagNode);
					} else if (tagType === "openTag" || tagType === "closeTag") {
						if (tagType === "openTag") {
							if (tagNameExtension) {
								// Both close the current tag and open a new one.
								tagNodePointer = treeStack.pop();
								tagNodePointer = treeStack[treeStack.length - 1];
								tagNode = new TagNode(tagName, tagNameExtension, args, tag, ignoreTag, ignoreBlock);
								tagNode.xyz = 0;
								tagNodePointer.children.push(tagNode);
								treeStack.push(tagNode);
								tagNodePointer = tagNode;

							} else {
								tagNode = new TagNode(tagName, "", args, tag, ignoreTag, ignoreBlock);
								tagNodePointer.children.push(tagNode);
								treeStack.push(tagNode);
								tagNodePointer = tagNode;
							}
						} else {
							// temporarelly move the pointer to the exiting scope and test to
							// see if the tag was properly closed
							tagNodePointer = treeStack.pop();
							if (tagName !== tagNodePointer.name) {
								throw (new Err("BadlyClosedTag", "Was expecting closing tag for \"" + tagNodePointer.name + "\" but encountered \"" + tagName + "\""));
							}
							tagNodePointer.rawEnd = tag;
							tagNodePointer = treeStack[treeStack.length - 1];
						}
					}

					// Process chained filters
					filtersTags = segments.slice(1);
					for (j in filtersTags) {
						if (filtersTags.hasOwnProperty(j)) {
							filterTag = filtersTags[j].trim();
							if (filterTag.indexOf("(") > -1) {
								tagName = filterTag.substring(0, filterTag.indexOf("("));
								args = filterTag.substring(filterTag.indexOf("("));
								args = "[" + args.substring(1, args.lastIndexOf(")")) + "]";
							} else {
								// todo: setup a better and stricter parsing
								tagName = filterTag;
								args = "[]";
							}
							if (typeof (Filters[tagName]) !== "function") {
								throw (new Err("UnknownFilter", "Encountered unknown filter \"" + tagName + "\""));
							}
							tagNode.filters.push(new TagNode(tagName, "", args, "", false, false));
						}
					}
					// move the cursor forward
					lastTagEnd = lastTagStart + tag.length;
				}
			}
		}
		// Add a raw tag for the last piece to be renderec or if not tag are found
		before = template.substring(lastTagEnd, template.length);
		if (before.length) {
			tagNodePointer.children.push(new TagNode("raw", "", '"' + escape(before) + '"', before, false, false));
		}
		return compileNode(tree[0]);
	};

	/**
	 * Tag object used to populate the tagTree
	 * @param name
	 * @param argString
	 */
	TagNode = function (name, nameExtension, argString, raw, ignoreTag, ignoreBlock) {
		this.name = name;
		this.nameExtension = nameExtension;
		this.argString = argString;
		this.children = [];
		this.filters = [];
		this.alternateBlocks = [];
		this.raw = raw;
		this.rawEnd = "";
		this.ignoreBlock = ignoreBlock;
		this.ignoreTag = ignoreTag;
	};

	/**
	 * Compile a tagNode and all its children into a javascript function
	 * @param node
	 */
	function compileNode(node) {
		var i,
			i2,
			stream = [],
			block,
			filtersHandler,
			alternateBlock,
			alternateBlocks,
			tag,
			tagName,
			child,
			child2,
			nextChild, // used to peek ahead for alternate tags
			args,
			blockHandler;

		// Apply tags
		for (i = 0; i < node.children.length; i = i + 1) {
			child = node.children[i];

			// Get filters
			filtersHandler = "";
			for (i2 in child.filters) {
				child2 = child.filters[i2];
				filtersHandler = filtersHandler + "env.applyFilter('" + child2.name + "', '[" + child2.argString + "]');\n";
			}
			filtersHandler = (filtersHandler) ? "function (env, args) {\nvar data = this[0];\nvar vars = env.vars;\n" + filtersHandler + "}" : "null";


			tagName = child.name;
			tag = Tags[tagName];
			if (tag.isInnert) {
//				args = unescape(child.argString).trim();
				args = child.argString.trim();
				block = "'" + escape(compileInnertNode(child)) + "'";
			} else {
				// process alternate tag which might follow in the tag sequence
				// and collapse them into alternateBlocks to pass as arguments to
				// the parent tag
				alternateBlocks = "";
				nextChild = node.children[i + 1];
				while (nextChild && nextChild.nameExtension) {
//					args = unescape(nextChild.argString).trim();
					args = nextChild.argString.trim();
					if (!nextChild.ignoreBlock) {
						alternateBlock = (nextChild.children.length || nextChild.filters.length) ? compileNode(nextChild) : "";
						alternateBlock = (block) ? "function (env, args) {\nvar data = this[0];\nvar vars = env.vars;\n" + alternateBlock + "}" : "null";
					} else {
						alternateBlock = "function () {}";
					}
					alternateBlock =
						"{\nname: '" + nextChild.nameExtension + "',\n" +
						"args: '[" + args + "]',\n" +
						"handler: " + alternateBlock + "\n" +
						"}";
					alternateBlocks = alternateBlocks + ", " + alternateBlock;

					i = i + 1;
					nextChild = node.children[i + 1];
				}
				alternateBlocks = "[" + alternateBlocks.substring(2) + "]";

				// If there is no "#" ignore, process the tags main block.
				// Otherwise, the block is rendered as null
				if (child.ignoreBlock) {
					block = "null";
				} else {
					block = (child.children.length || child.filters.length) ? compileNode(child) : "";
					block = (block) ? "function (env, args) {\nvar data = this[0];\nvar vars = env.vars;\n" + block + "}" : "null";
				}
			}
			if (!child.ignoreTag) {
//				args = unescape(child.argString).trim();
				args = child.argString.trim();
//				console.log("=======", args);
				stream.push("env.applyTag('" + tagName + "', '[" + args + "]', data, " + block  + ", " + alternateBlocks + ", " + filtersHandler + ");\n");
			}
		}
		// Apply filter functions
		/*
		for (i in node.filters) {
			child = node.filters[i];
			stream.push("env.applyFilter('" + child.name + "', '[" + child.argString + "]');\n");
		}
		*/
//		console.log("--------------------------------");
//		console.log(stream.join(""));
//		console.log("--------------------------------");
		return stream.join("");

	}


	/**
	 * Used to compile an innert node, which content doesnt need parsing.
	 * @param node
	 */
	function compileInnertNode(node) {
		var i,
			stream = [],
			child;
		if (node.children) {
			for (i in node.children) {
				if (node.children.hasOwnProperty(i)) {
					child = node.children[i];
					stream.push(child.raw);
					if (child.children) {
						stream.push(compileInnertNode(child));
					}
					stream.push(child.rawEnd);
				}
			}
		}
		return stream.join("");
	}

	/**
	 * Convert an array of alternate tags to an dictionnary object
	 * @param blocks
	 * @param _obj
	 */
	function objectfyAlternateBlocks(blocks, _obj) {
		var iBlock, block;
		var obj = {};
		extend(obj, _obj);
		if (blocks) {
			for (iBlock in blocks) {
				if (blocks.hasOwnProperty(iBlock)) {
					block = blocks[iBlock];
					if (obj[block.name]) {
						obj[block.name].push(block);
					}
				}
			}
			return obj;
		}
	}

	/**
	 * Error helper constructor
	 * @param name
	 * @param message
	 */
	Err = function (name, message) {
		var err = new Error();
		err.name = name;
		err.message = message;
		return err;
	};

	/**
	 * Iterator state object
	 */
	function Loop() {
		var key,
			keys = [],
			items,
			length,
			index,
			parent = {};

		this.items = function (_items) {
			var i;
			if (_items) {
				items = _items;
				length = 0;
				index = -1;
				keys = [];
				key = null;
				// count how many items there are
				if (items) {
					for (i in items) {
						if (items.hasOwnProperty(i)) {
							length = length + 1;
							keys.push(i);
						}
					}
				}
			}
			return items;
		};
		/**
		 * Create a new Loop instance with its parent as the current one
		 */
		this.iterate = function (items) {
			var loop = new Loop();
			loop.items(items);
			return loop;
		};
		this.key = function () {
			return keys[index];
		};
		this.keys = function () {
			return keys;
		};
		this.isOdd = function () {
			return this.isNth(2, 0);
		};
		this.isNth = function (nth, offset) {
			var isNth;
			offset = offset || 0;
			isNth = ((index + 1 - offset) % nth) === 0;
			return isNth;
		};
		this.first = function () {
			return items[0];
		};
		this.last = function () {
			return items[length - 1];
		};
		this.isFirst = function () {
			return index === 0;
		};
		this.isLast = function () {
			var isLast;
			isLast = (index + 1) === length;
			return isLast;
		};
		this.length = function () {
			return length;
		};
		this.counter = function () {
			return index;
		};
		this.revCounter = function () {
			var value;
			value = length - (index + 1);
			return value;
		};
		this.step = function () {
			index = index + 1;
			key = keys[index];
			return this;
		};
	}


	/**
	 * Evaluates a string expression as if it was a series of javascription expressions
	 * This evaluation is done in a specific set of local variables simulated using function arguments
	 * Should return an array containing the list of evaluated expressions.
	 * A single expression return an array with a single item.
	 * A list of comma separated expressions will yeld an array with multiple items.
	 * @param expression
	 * @param _context
	 */
	function evaluateExpressions(expression, _context) {
		var context = {},
			fn,
			i,
			code,
			results = null;
		expression = expression || "";
		expression = expression.replace(/\n/gm, " ");
		extend(context, _context);

		var argNames = [],
			argValues = [];
		for (i in context) {
			if (context.hasOwnProperty(i)) {
				argNames.push(i);
				argValues.push(context[i]);
			}
		}
//console.log("expression: ", expression);
//		code = "return [this.dali.unescape(" + expression + "[0])];";

		// todo: remvoe comment: FIXED FOR RETURNING MULTIPLE EXPRESSIONS
		code = "return [" + expression + "];";
		argNames.push(code);
		try {
			fn = Function.apply(this, argNames);
		} catch (err) {
			logError(err);
			throw (new Err("ExpressionCompilationFailed", "Failed to compile an expression into proper javascript.\n\n" +
					"error: " + err.name + "\n" +
					"message: " + err.message + "\n\n" +
					"Expression to compile: \n" + expression));
		}

		try {
			results = fn.apply(context, argValues);
		} catch (err2) {
			logError(err2);
			throw (new Err("ExpressionEvaluationFailed", "An exception occured while evaluating a javascript expression.\n\n" +
					"error: " + err2.name + "\n" +
					"message: " + err2.message + "\n\n" +
					"Expression to evaluate: \n" + expression));
		}
		for (var i=0; i < results[0].length; i = i + 1) {
			results[0][i] = unescape(results[0][i]);
		}
		return results;
	}

	/**
	 * Escape special characters so that it doesnt come in conflits with parsing and compilation
	 * @param str
	 */
	function escape(str) {
		// Linefeeds
		if (typeof(str) === "string") {
			str = str.replace(/\n/g, "&#10;");
	//		str = str.replace(/'/g, "&rsquo;");
			str = str.replace(/"/g, "[[::rdquo::]]");
			str = str.replace(/'/g, "[[::rsquo::]]");
		}
		return str;
	}

	/**
	 * Removed escaping rules that have been applied with the "escape" function
	 * @param str
	 */
	function unescape(str) {
		if (typeof(str) === "string") {
			str = str.replace(/\[\[\:\:rsquo\:\:\]\]/g, "'");
			str = str.replace(/\[\[\:\:rdquo\:\:\]\]/g, "\"");
			// Linefeeds
			str = str.replace(/&#10;/g, "\n");
			// html entities
			str = str.replace(/&gt;/g, ">").replace(/&lt;/g, "<");
		}
		return str;
	}


	/**
	 * Extend an object with the properties of another
	 * @param obj
	 * @param extObj
	 */
	Utils = Dali.Utils = {};
	extend = Utils.extend = function (obj, extObj) {
		var i;
		if (arguments.length > 2) {
			for (i = 1; i < arguments.length; i = i + 1) {
				extend(obj, arguments[i]);
			}
		} else {
			for (i in extObj) {
				if (extObj.hasOwnProperty(i)) {
					obj[i] = extObj[i];
				}
			}
		}
		return obj;
	};
	var clone;
	clone = Utils.clone = function (obj) {
		var key;
		if (obj === null || typeof (obj) !== 'object') {
			return obj;
		}
		var temp = obj.constructor(); // changed
		if (obj) {
			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					temp[key] = clone(obj[key]);
				}
			}
		}
		return temp;
	};

	/**
	 * Makes Dali available as a jQuery plugin
	 * @param $ {jQuery} A jQuery instance
	 */
	function exportjQuery($) {
		$.dali = dali;
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
	function exportJSCommons() {
		if (module) {
			module.exports.Dali = Dali;
			module.exports.dali = dali;
			module.exports.compile = function(str, options) {
				var mainTmpl = new dali.Template("main", str, {}, options)
				return function(locals) {
					return mainTmpl.render(locals, {});
				}
			}
		}
	}

	/**
	 * Log errors if a console is available
	 * @param err Error object to throw
	 */
	function logError(err) {
		if (console !== undefined) {
			console.error(err);
		}
	}

	// apply exports
	global.Dali = Dali;
	var dali = global.dali = new Dali({});
	if ($) {
		exportjQuery($);
	}
	exportJSCommons();



	/**
	 * Register core filters
	 */

	Dali.register({
		Filters: {
			"void": function (stream, args) {
				return "";
			},
			"trim": function (stream, args) {
				return (stream).trim();
			},
			"uppercase": function (stream, args) {
				return (stream).toUpperCase();
			},
			"lowercase": function (stream, args) {
				return (stream).toLowerCase();
			},
			"log": function (stream, args) {
				if (console !== undefined) {
					console.info(stream);
				}
				return stream;
			},
			"debug": function (stream, args) {
				if (console !== undefined) {
					if (args.length) {
						console.log.apply(args);
					}
					console.log("stream: ", stream);
					console.log("args: ", args);
					console.info("item:");
					console.dir(this.item || this.parent.item);
					console.info("vars: ");
					console.dir(this.vars);
					console.info("env: ");
					console.dir(this);
				}
				return stream;
			},
			"i18n": function (stream, args) {
				return i18n(stream, this.dali.i18n || {});
			},
			"json": function (stream, args) {
				var json;
				json = eval("(" + stream + ")");
				return json;
			}
		}
	});

	i18n = function (content, i18nData) {
		var output = content,
			i18nItem = i18nData[content];
		if (i18nItem !== undefined) {
			output = i18nItem;
		}
		return output;
	};

	/**
	 * Register core tags
	 */

	Dali.register({
		Tags: {
			"raw" : new Tag("raw", function (data, _args, env, block, alternateBlocks, filters) {
				var output,
					args = _args();
				output = args.join("");
				return output;
			}, {}),
			"log" : new Tag("log", function (data, _args, env, block, alternateBlocks, filters) {
				var output,
					args = _args();
				if (console !== undefined) {
					console.log(args);
				}
				return "";
			}, {}),
			"debug" : new Tag("debug", function (data, _args, env, block, alternateBlocks, filters) {
				var output,
					args = _args();
				output = args.join("");
				if (console !== undefined) {
					console.log("output: ", output);
					console.info("item:");
					console.dir(env.item || env.parent.item);
					console.info("vars: ");
					console.dir(env.vars);
					console.info("env: ");
					console.dir(env);
				}
				return "";
			}, {}),
			"if" : new Tag("if", function (data, _args, env, block, alternateBlocks, filters) {
				//TODO: objectfyAlternateBlocks shouldnt hav to be manual called in each tag
				var i, altBlocksObj, elseBlocks, notBlock, args;
				args = _args();
				altBlocksObj = objectfyAlternateBlocks(alternateBlocks, clone(this.alternateBlocks));
				elseBlocks = altBlocksObj["else"];
				notBlock = altBlocksObj.not[0];

				if (args[0]) {
					env.out(args[1] || "");
					if (typeof (block) === "function") {
						//note: data is passed in an array to prevent if from being converted
						// into a weird "true {}" object
						//note: UNLESS block.apply is triggered, filters are not applied to the stream
						block.apply([data], [env, args]);
					}
				} else {
					var isTrue, elseBlock;
					for (i in elseBlocks) {
						if (elseBlocks.hasOwnProperty(i)) {
							elseBlock = elseBlocks[i];
							if (elseBlock) {
								if (elseBlock.args[0]) {
									isTrue = true;
									env.out(args[1] || "");
									elseBlock.handler.apply([data], [env, args]);
									break;
								}
							}
						}
					}
					if (!isTrue) {
						// If no if-else tag was true, apply any if-not tag and/or
						// secondary param
						if (args[2] !== undefined) {
							env.out(args[2] || "");
						}
						if (notBlock) {
							notBlock.handler.apply([data], [env, args]);
						}
					}
				}
				if (filters) {
					filters.apply([data], [env, args]);
				}
				return env.stream();
			}, {
				"alternateBlocks": {
					"not": [],
					"else": []
				}
			}),
			// Empty tag... form comment sytax {{# /}} {{#}}!
			"" : new Tag("comment",
				function (data, args, env, block, alternateBlocks, filters) {
					return "";
				}, {
					isInnert: true
				}),
			"each" : new Tag("each",
				function (data, _args, env, _block, alternateBlocks, filters) {
					var key,
						oldKey,
						itemCount = 0,
						item,
						items,
						block,
						loop,
						altBlocksObj,
						altBlock,
						altArgs,
						args,
						varName,
						newEnv,
						oldItem = env.item;
					altBlocksObj = objectfyAlternateBlocks(alternateBlocks, clone(this.alternateBlocks));
					args = _args();
					if (typeof (_block) === "function") {
						// Create a new Loop status object
						items = args[0];
						varName = args[1];
						loop = env.loop = env.loop.iterate(items);
						// to insert before all items
						if (altBlocksObj.begin[0]) {
							altBlocksObj.begin[0].handler.apply([{}], [env, args, loop]);
						}
						for (key in items) {
							if (items.hasOwnProperty(key)) {
								itemCount = itemCount + 1;
								item = items[key];
								env.item = item;
								env.key = key;
								if (varName !== undefined) {
									env.vars[varName] = item;
								}
								loop.step();
								block = null;
								if (key === 0 && items.length === 1) {
									// Is single item
									block = altBlocksObj.single[0];
								} else if (key === 0) {
									// Is first item
									block = altBlocksObj.first[0];
								} else if (key === items.length - 1) {
									// Is last item
									block = altBlocksObj.last[0];
								} else if (key % 2) {
									// Is odd item
									block = altBlocksObj.odd[0];
								}
								if (!block) {
									block = _block;
								} else {
									altArgs = _args(block.args);
									env.out(altArgs.join(""));
								}

								block = (block.handler || block);

								//args = _args();

								//note: item is passed in an array to prevent if from being converted
								// into a weird "true {}" object
								block.apply([item], [env, args, loop]);

								// to insert between each item
								altBlock = altBlocksObj.between[0];
								if (altBlock) {
									if (key < items.length - 1) {
										altArgs = _args(altBlock.args);
										env.out(altArgs.join(""));
										altBlock.handler.apply([{}], [env, args]);
									}
								}
							}
						}

						// to insert after all items
						var endBlock = altBlocksObj.end[0];
						if (endBlock) {
							altArgs = _args(endBlock.args);
							env.out(altArgs.join(""));
							endBlock.handler.apply([{}], [env, args]);
						}

						// Alt tag when empty
						if (!itemCount) {
							altBlock = altBlocksObj.empty[0];
							if (altBlock) {
								altArgs = _args(altBlock.args);
								env.out(altArgs.join(""));
								altBlock.handler.apply([{}], [env, args, null]);
							}
						}
					}
					// Reset to the old item before iterating
					env.item = oldItem;
					env.key = oldKey;
//					env.loop = loop.parent;
					if (filters) {
						filters.apply([data], [env, args]);
					}
					return env.stream();
				}, {
					"alternateBlocks": {
						"empty": [],
						"single": [],
						"begin": [],
						"end": [],
						"first": [],
						"odd": [],
						"between": [],
						"last": []
					}
				}),
			"out" : new Tag("out", function (data, _args, env, block, alternateBlocks, filters) {
				var args = _args();
				env.out(args.join(""));
				if (block) {
					block.apply([data], [env, args]);
				}
				if (filters) {
					filters.apply([data], [env, args]);
				}
				return env.stream();
			}, {}),
			"template": new Tag("template", function (data, _args, env, block, alternateBlocks, filters) {
				var args = _args(),
					template,
					id = args[0],
					source = "", //todo: reuse env or instantiate a new one ??
					optionsParam = {};

				var vars = {};
				extend(vars, env.vars);
				source = block;
				template = env.addTemplate(id, source, vars, optionsParam);
				return "";
			}, {
				isInnert: true
			}),
			"render" : new Tag("render", function (data, _args, env, block, alternateBlocks, filters) {
				var i, output, blockArgs, vars, varName, varBlocks, varBlock, altBlocksObj, args = _args();
				altBlocksObj = objectfyAlternateBlocks(alternateBlocks, {
					"var": []
				});
				varBlocks = altBlocksObj["var"];
				for (i in varBlocks) {
					if (varBlocks.hasOwnProperty(i)) {
						varBlock = varBlocks[i];
						blockArgs = evaluateExpressions(varBlock.args);
						varName = blockArgs[0][0];
						env.flush();
						varBlock.handler.apply([{}], [env, args]);
						env.vars[varName] = env.stream();

					}
				}
				if (block) {
					env.flush();
					block.apply([data], [env, args]);
				}
				env.vars._output = env.stream();

				//todo: first try to find the template in the local store
				// otherwise, try to parse a partial
				if (typeof Dali.partial === "function") {
					var partialData = {
						// todo: by PM, Verify if this line is OK
						/* Modified value: args[1] by
						 * value: (args[1])?args[1]:{}
						 * because value should never be undefined to limit errors in templates using value
						 */
						value: (args[1])?args[1]:{}
					};
			
					// todo: by PM, Verify if this line is OK
					// the purpose is not to loose the _output variable from the reuse in templates
					/* PM WAS HERE */partialData.vars = clone(env.vars);
					output = Dali.partial(args[0], partialData); // todo: pass vars
				} else {
					output = env.render(args[0], args[1], env.vars);
				}
				return output;
			}, {
				"alternateBlocks": {
					"var": []
				}
			}),
			"load" : new Tag("load", function (data, _args, env, block, alternateBlocks, filters) {
				var i,
					output,
					vars,
					varName,
					args = _args();
				if (block) {
					env.flush();
					block.apply([data], [env, args]);
				}
				// render the template with current environment
				// and disregard its output
				env.render(args[0], args[1], {}, env);
				return "";
			}, {}),
			"var" : new Tag("var", function (data, _args, env, block, alternateBlocks, filters) {
				var val,
					args = _args();
				if (args[1] !== undefined) {
					env.out(args[1]);
				}
				if (block) {
					block.apply([data], [env, args]);
				}
				if (filters) {
					filters.apply([data], [env, args]);
				}
				val = env.stream();
				env.vars[args[0]] = val;
				return "";
			}, {})
		}
	});

		
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/g,"");
	};



}(global, this.jQuery));

