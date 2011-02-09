/*

TODO:
- Navigation to move to next/previous sample
- Local storage for template edited by user
- Output of custom template as an HTML fragment
- Save multiple templates from user in local storage
- View output as HTML
- Support for multiple templates scenarios and custom code
- Support for custom environment data

*/
(function ($) {

	var sampleCache,
		newSampleCache,
		sampleTemplate,
		sampleData,
		sampleOutput,
		err,
		editorData,
		editorTemplate,
		editorOutput,
		dali = new Dali();

	$(function () {
		var JavaScriptMode = require("ace/mode/javascript").Mode;

		sampleData = ace.edit("sampleData");
		sampleData.setTheme("ace/theme/twilight");
		sampleData.getSession().setMode(new JavaScriptMode());

		sampleTemplate = ace.edit("sampleTemplate");
		sampleTemplate.setTheme("ace/theme/twilight");
		sampleTemplate.getSession().setMode(new JavaScriptMode());

		sampleOutput = ace.edit("sampleOutput");
		sampleOutput.setTheme("ace/theme/twilight");
		sampleOutput.setReadOnly(true);
		sampleOutput.getSession().setMode(new JavaScriptMode());

		sampleData.getSession().on('change', function(){
			runSample();
		});
		sampleTemplate.getSession().on('change', function(){
			runSample();
		});

		$(".sampleList a").click(function (e) {
			e.preventDefault();
			loadSample($(this).attr("href"));
		});

		$(window).bind("hashchange", function (e) {
			var sample = $.bbq.getState( "sample" );
			if (!sample) {
				sample = $(".defaultSample").attr("href");
			}
			loadSample(sample);
		});

		$(window).trigger("hashchange");
	});

	function onLoadEditor() {}

	function loadSample(url) {
		var sample = new Sample(url);
		$.bbq.pushState({
					sample: url
				});
		$.ajax({
			url: url,
			dataType: "html",
			complete: function(data) {
				var id,
					root = $(data.responseText);
				id = sample.id = root.attr("id");
				$("body").append(root);
				root = $("#" + id);
				sample.title = root.find(".title").text();
				sample.description = root.find(".description").html();
				sample.data = $("#" + id + "-data").text();
				sample.template = $("#" + id + "-template").text();
				applySample(sample);
			}
		});
	}

	function Sample(url) {
		this.id = "";
		this.url = url;
		this.title = "";
		this.description = "";
		this.data = "";
		this.template = "";
	}

	function applySample(sample) {
		sampleData.getSession().setValue(sample.data+"");
		sampleTemplate.getSession().setValue(sample.template+"");
		$(".descriptionWrapper").html("<h2>" + sample.title + "</h2>" + sample.description);
	}
	function runSample() {
		var data, output, template, sampleDataInput, sampleTemplateInput;
		sampleDataInput = sampleData.getSession().getValue();
		sampleTemplateInput = sampleTemplate.getSession().getValue();
		newSampleCache = sampleDataInput + sampleTemplateInput;
		if (sampleCache !== newSampleCache) {
			sampleCache = newSampleCache;
			try {
				data = eval("(" + sampleDataInput + ")");
				template = dali.add("sample", sampleTemplateInput);
				output = template.render(data);
			} catch (err) {
				output = "<h2>An error occured:</h2><strong><pre>" + err.name + "\n" + "</pre></strong><pre>" + err.message +"</pre>";
			}
			sampleOutput.getSession().setValue(output);
			$("#sampleOutputHTML").html(output);
		}
	}

}(jQuery));