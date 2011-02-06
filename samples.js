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
	});

	$(window).load(function() {
		var url = $(".defaultSample").attr("href");
		loadSample(url);
	});

	function onLoadEditor() {}

	function loadSample(url) {
		var sample = new Sample(url);
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
				sampleOutput.getSession().setValue(output);
			} catch (err) {
				output = "An error occured: \n" + err.name + "\n" + err.message;
				sampleOutput.getSession().setValue(output);
			}
		}
	}

}(jQuery));