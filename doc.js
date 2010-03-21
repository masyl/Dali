/*

	Register one or many templates with additionnal environ variables
		$(selector).templates(environ, options);
	Example:
		$(".templates").templates(environ, {
			precompile: false
		});

	Obtain a template object Renders a template with a data set and additional environ variables
		$.templates(templateId);
	Example:
		$.templates("storeList");

	Renders a template with a data set and additional environ variables, and return the template object
		template.render(data, options);
	Example:
		template.render({ stores: this.stores }, { whitespace: false });

	Obtain the resulting output of the last render
		template.out(); // As a new dom node in jquery object
		template.out("jquery"); // As a new dom node in jquery object
		template.out("text"); // As a text stream
		template.out("dom"); // As a new dom node

	A example of chained template rendering request
		$.templates("storeList").render({stores: this.stores}, { whitespace: false }).out(); // As a new dom node

*/