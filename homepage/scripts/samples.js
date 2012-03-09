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
		editorOutput;

	var sampleURL = "";
	var sampleIsDirty = false;

	dali.i18n = {
		"Yes": "Oui",
		"No": "Non"
	};

	$(function () {
		var JavaScriptMode = require("ace/mode/javascript").Mode;

		try {
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
				sampleIsDirty = true;
				runSample();
			});
			sampleTemplate.getSession().on('change', function(){
				sampleIsDirty = true;
				runSample();
			});
		} catch (err) {

		}

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

		$(window).triggerHandler("hashchange");
	});

	function onLoadEditor() {}

	function loadSample(url) {
		if (url !== sampleURL || !sampleIsDirty) {
			sampleURL = url;
			sampleIsDirty = false;
			var sample = new Sample(url);
			$.bbq.pushState({
				sample: url
			});
			$.ajax({
				url: url,
				dataType: "html",
				error: function () {
					alert("OUPS!\n\nIn order to view these samples, you must run this code on a web server. You can use the server of your choice, or use node along with the 'server.js' found in this project");
				},
				success: function(data) {
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
		pauseRunSample(true);
		if (sampleData && sampleTemplate) {
			sampleData.getSession().setValue(sample.data+"");
			sampleTemplate.getSession().setValue(sample.template+"");
		}
		pauseRunSample(false);
		$(".descriptionWrapper").html("<h2>" + sample.title + "</h2>" + sample.description);
	}
	var runSampleIsPaused = false;
	function pauseRunSample(isPaused) {
		runSampleIsPaused = isPaused;
		if (!isPaused) runSample();

	}
	function runSample() {
		if (!runSampleIsPaused) {
			var data, output, template, sampleDataInput, sampleTemplateInput;
			if (sampleDataInput && sampleTemplateInput) {
				sampleDataInput = sampleData.getSession().getValue();
				sampleTemplateInput = sampleTemplate.getSession().getValue();
			} else {
				sampleDataInput = sampleData.getSession().getValue();
				sampleTemplateInput = sampleTemplate.getSession().getValue();
			}
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
	}

}(jQuery));