(function ($) {

	var sampleCache,
		newSampleCache,
		sampleTemplateInput,
		sampleDataInput,
		err,
		dali = new Dali();

	$(function () {
		$('#sampleData, #sampleTemplate').bind('keyup blur', $.debounce(300, function() {
			runSample();
		}));
		runSample();
	});

	function runSample() {
		var data, output;
		sampleDataInput = $('#sampleData').val();
		sampleTemplateInput = $("#sampleTemplate").val();
		newSampleCache = sampleDataInput + sampleTemplateInput;
		if (sampleCache !== newSampleCache) {
			sampleCache = newSampleCache;
			try {
				data = eval("(" + sampleDataInput + ")");
				dali.add("sample", sampleTemplateInput);
				output = dali("sample").render(data);
				$("#sampleOutput").val(output);
			} catch (err) {
				console.log(err);
				$("#sampleOutput").val("An error occured: \n" + err.name + "\n" + err.message);
			}
		}
	}

}(jQuery));