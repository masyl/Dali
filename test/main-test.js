
// Todo: test "each" statement
// Todo: test multiple "each" statement hierarchy
// Todo: test "if" statement
// Todo: test multiple "if" statement hierarchy
// Todo: test comments

var Dali = require("../src/dali"),
	vows = require("vows"),
	assert = require("assert");

dali = Dali.dali();

var sampleData  = {
	ok: "All Ok!",
	alwaysFalse: false,
	alwaysTrue: true,
	okWithWhitespaces: "   All Ok!   ",
	fruits: ["Orange", "Banana", "Apple"],
	fruitsObj: {"Orange": "Orange", "Banana":"Banana", "Apple":"Apple"},
	loremItems: [
		{id:1, label: "lorem ipsum", referenceNumbers: [156,282,133]},
		{id:2, label: "dolor sit", referenceNumbers: [8990,387,5822]},
		{id:3, label: "amet aridom", referenceNumbers: [2209,849,437]}
	],
	fooBar: {
		foo: "foo!",
		bar: "bar!"
	}
};

vows.describe("Core Features").addBatch({
	'A tempalte created using ".add" with the source as a parameter': {
		topic: function () {
			return dali.add("test", "<div>{out this.ok /}</div>");
		},
		"should be outputed as a return value": function(template) {
			assert.equal(typeof(template), "object");
			assert.equal(template.id, "test");
		},
		"when fetched by that same id using '.get'": {
			topic: function(template) {
				return dali.get("test");
			},
			"should be an object": function(template) {
				assert.equal(typeof(template), "object");
			},
			"should have the expected source and id": function(template) {
				assert.equal(template.source, "<div>{out this.ok /}</div>");
				assert.equal(template.id, "test");
			}
		}
	}
}).export(module);

vows.describe("Expressions").addBatch({
	'A simple template': {
		topic: function() {
			return dali.add("test", "<div>{out this.ok /}</div>");
		},
		'can render simple expressions': function(template) {
			assert.equal(template.render(sampleData), "<div>All Ok!</div>");
		}

	}
}).export(module);

vows.describe("Reusability").addBatch({
	'A template': {
		topic: function() {
			dali.add("parseList", "{each this}{out this /}, {/each}");
			dali.add("test", "Items: {render 'parseList', this.fruits /}");
			return dali.get("test");
		},
		'can render data using another template inside an iterator': function (template) {
			assert.equal(template.render(sampleData), "Items: Orange, Banana, Apple, ");
		}
	}
}).export(module);

vows.describe("Each Statement").addBatch({
	'A template containing the "each" statement': {
		topic: function() {
			return dali.add("test", "<div>{each this}{out this /} {/each}</div>");
		},
		'can render values from an object': function (template) {
			assert.equal(template.render(sampleData.fruitsObj), "<div>Orange Banana Apple </div>");
		},
		'can render values from an array': function (template) {
			assert.equal(template.render(sampleData.fruits), "<div>Orange Banana Apple </div>");
		}
	},
	'A template containting two each statements, one inside the other': {
		topic: function() {
			return dali.add("test", "<div>{each this.loremItems }{out this.label /}={each this.referenceNumbers}{out this /},{/each} - {/each}</div>");
		},
		'can render collections inside collections': function (template) {
			assert.equal(template.render(sampleData), "<div>lorem ipsum=156,282,133, - dolor sit=8990,387,5822, - amet aridom=2209,849,437, - </div>");
		}
	}
}).export(module);

vows.describe("If Statement").addBatch({
	'A template containing the "if" statement': {
		topic: function() {
			return dali.add("test", "<div>{if this.alwaysTrue }True{/if}{if this.alwaysFalse}False{/if}</div>");
		},
		'can render output conditionnaly': function (template) {
			assert.equal(template.render(sampleData), "<div>True</div>");
		}
	}
}).export(module);

vows.describe("Raw Output").addBatch({
	'A template containing no tags': {
		topic: function() {
			return dali.add("test", "Just some text with no templating!");
		},
		'can render identical raw output correctly': function (template) {
			assert.equal(template.render(sampleData), "Just some text with no templating!");
		}
	},
	'A template containing no tags on multiple lines': {
		topic: function() {
			return dali.add("test", "Just some text\n with no\n templating and some line feeds!");
		},
		'can render identical raw output correctly': function (template) {
			assert.equal(template.render(sampleData), "Just some text\n with no\n templating and some line feeds!");
		}
	}
}).export(module);

vows.describe("Decorators").addBatch({
	'A template containing a "uppercase" decorator': {
		topic: function() {
			return dali.add("test", "<div>{out this.ok >> uppercase /}</div>");
		},
		'can render correctly': function (template) {
			assert.equal(template.render(sampleData), "<div>ALL OK!</div>");
		}
	},
	'A template containing a "lowercase" decorator': {
		topic: function() {
			return dali.add("test", "<div>{out this.ok >> lowercase /}</div>");
		},
		'can render correctly': function (template) {
			assert.equal(template.render(sampleData), "<div>all ok!</div>");
		}
	},
	'A template containing a "trim" decorator': {
		topic: function() {
			return dali.add("test", "<div>{out this.okWithWhitespaces >> trim /}</div>");
		},
		'can render correctly': function (template) {
			assert.equal(template.render(sampleData), "<div>All Ok!</div>");
		}
	},
	'A template containing a "uppercase" decorator inside an "if" statement': {
		topic: function() {
			return dali.add("test", "<div>{if this.alwaysTrue >> uppercase}True{/if}{if this.alwaysFalse}False{/if}</div>");
		},
		'can render correctly': function (template) {
			assert.equal(template.render(sampleData), "<div>TRUE</div>");
		}
	}
}).export(module);
