/*

	Dali.auto - Automatic template rendering

*/
(function ($) {

	var dali = new Dali();

	loadTemplates(false);

	$(function() {
		loadTemplates(true);
	});

	function loadTemplates(async) {
		$("script[type='text/x-dali-template']").each(function() {
			var id = this.id;
			var responseText = $.ajax(this.src, {
				format: "text",
				async: async,
				complete: function(data) {
					if (data)
						add(id, data.responseText);
				}
			}).responseText;
			if (!async) {
				add(id, responseText);
			}
		});
	}
	function add(id, source) {
		if (source) {
			dali.add(id, source);
			renderTags(id);
		}
	}

	function renderTags(id) {
		$(".x-dali[data-template='" + id + "']").each(function() {
			var source = this.innerHTML;
			var template = dali.add(this.id, source);
			var output = template.render([]);
			console.log(">>> ", this,$(output));
			//$(this).html(output);
			$(this).replaceWith(output);
		});
	}

})(jQuery);
