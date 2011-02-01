/*

	Test Suite for the jquery.render templating library

*/
with(QUnit) {

	test("Rendering templates inside templates", function() {
		$.dali.add("parseList", "{each this}{out this /}, {/each}");
		$.dali.add("test", "Items: {render 'parseList', this.fruits /}");
		equals($.dali("test").render(sampleData), "Items: Orange, Banana, Apple, ");
	});

	module("Expressions");

	test("Simple expressions", function() {
		$("<div id='test'><div>{out this.ok /}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>All Ok!</div>", "Wrong output");
	});

	module("Statements");

	// Todo: test "each" statement
	// Todo: test multiple "each" statement hierarchy
	// Todo: test "if" statement
	// Todo: test multiple "if" statement hierarchy
	// Todo: test comments

	test("each Statement", function() {
		$("<div id='test'><div>{each this.fruits }{out this /} {/each}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>Orange Banana Apple </div>");

		$("<div id='test'><div>{each this.loremItems }{out this.label /}={each this.referenceNumbers}{out this /},{/each} - {/each}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>lorem ipsum=156,282,133, - dolor sit=8990,387,5822, - amet aridom=2209,849,437, - </div>");
	});

	test("if Statement", function() {
		$("<div id='test'><div>{if this.alwaysTrue }True{/if}{if this.alwaysFalse}False{/if}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>True</div>");
	});

	test("Raw and unchanged output", function() {
		$("<div id='test'>Just some text with no templating!</div>").dali();
		equals($.dali("test").render(sampleData), "Just some text with no templating!", "single line!");

		$("<div id='test'>Just some text\n with no\n templating and some line feeds!</div>").dali();
		equals($.dali("test").render(sampleData), "Just some text\n with no\n templating and some line feeds!", "Multiple lines!");
	});

	module("Filters");

	test("Text manipulation filters", function() {

		$("<div id='test'><div>{out this.ok >> uppercase /}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>ALL OK!</div>", "uppercase filter");
		$("<div id='test'><div>{out this.ok >> lowercase /}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>all ok!</div>", "lowercase filter");

		$("<div id='test'><div>{out this.okWithWhitespaces >> trim /}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>All Ok!</div>", "trim filter");

		$("<div id='test'><div>{if this.alwaysTrue >> uppercase}True{/if}{if this.alwaysFalse}False{/if}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>TRUE</div>", "uppercase filter inside if statement");

		$("<div id='test'><div>{if this.alwaysTrue >> uppercase}True {out}is{/out} True{/if}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>TRUE IS TRUE</div>", "uppercase filter inside if statement");

	});

//	module("jquery.render - complex template");

};