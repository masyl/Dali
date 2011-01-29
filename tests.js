/*

	Test Suite for the jquery.render templating library

*/
with(QUnit) {

	var sampleData  = {
		ok: "All Ok!",
		alwaysFalse: false,
		alwaysTrue: true,
		okWithWhitespaces: "   All Ok!   ",
		fruits: ["Orange", "Banana", "Apple"],
		loremItems: [
			{id:1, label: "lorem ipsum", referenceNumbers: [156,282,133]},
			{id:2, label: "dolor sit", referenceNumbers: [8990,387,5822]},
			{id:3, label: "amet aridom", referenceNumbers: [2209,849,437]},
		],
		fooBar: {
			foo: "foo!",
			bar: "bar!"
		}
	}


	module("Core");

	test("Instantiate template", function() {
		var template;
		template = "<div id='test'><div>{{ data.ok }}</div></div>";
		$(template).dali();
		equals($.dali("test").source, "<div>{{ data.ok }}</div>", "Instantiate using a jQuery selector");

		template = "<div>{{ data.ok }}</div>";
		$.dali.add("test", template);
		equals($.dali("test").source, template, "Instantiate using string input and an id");
	});

	test("Rendering templates inside templates", function() {
		$.dali.add("parseList", "{% for (i in data) %}{{ data[i] }}, {% endfor %}");
		$.dali.add("test", "Items: {% render ('parseList', data.fruits) %}");
		equals($.dali("test").render(sampleData), "Items: Orange, Banana, Apple, ");
	});

	module("Expressions");

	test("Simple expressions", function() {
		$("<div id='test'><div>{{ data.ok }}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>All Ok!</div>", "Wrong output");
	});

	module("Statements");

	// Todo: test "for" statement
	// Todo: test multiple "for" statement hierarchy
	// Todo: test "if" statement
	// Todo: test multiple "if" statement hierarchy
	// Todo: test comments

	test("for Statement", function() {
		$("<div id='test'><div>{% for (fruit in data.fruits) %}{{ data.fruits[fruit] }} {% endfor %}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>Orange Banana Apple </div>");

		$("<div id='test'><div>{% for (var item in data.loremItems) %}{{ data.loremItems[item].label }}={% for (var number in data.loremItems[item].referenceNumbers) %}{{ data.loremItems[item].referenceNumbers[number] }},{% endfor %} - {% endfor %}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>lorem ipsum=156,282,133, - dolor sit=8990,387,5822, - amet aridom=2209,849,437, - </div>");
	});

	test("if Statement", function() {
		$("<div id='test'><div>{% if (data.alwaysTrue) %}True{% endif %}{% if (data.alwaysFalse) %}False{% endif %}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>True</div>");
	});

	test("Raw and unchanged output", function() {
		$("<div id='test'>Just some text with no templating!</div>").dali();
		equals($.dali("test").render(sampleData), "Just some text with no templating!", "single line!");

		$("<div id='test'>Just some text\n with no\n templating!</div>").dali();
		equals($.dali("test").render(sampleData), "Just some text\n with no\n templating!", "Multiple lines!");
	});

	module("Filters");

	test("Text manipulation filters", function() {
		$("<div id='test'><div>{{ data.ok }{ uppercase }}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>ALL OK!</div>", "uppercase filter");

		$("<div id='test'><div>{{ data.ok }{ lowercase }}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>all ok!</div>", "lowercase filter");

		$("<div id='test'><div>{{ data.okWithWhitespaces }{ trim }}</div></div>").dali();
		equals($.dali("test").render(sampleData), "<div>All Ok!</div>", "trim filter");
	});

	module("jquery.render - complex template");

};