/*

	Episodes
	htmlMap Sample App

*/
(function ($) {


	function EpisodesApp() {
		var App, app, mvc, controllers, Controller;

		// Create a new App from the Dali app class
		App = EpisodesApp;
		app = new Dali.App();

		// Create a few shortcut vars for convenience
		mvc = app.mvc;
		controllers = {};
		Controller = mvc.Controller;


		/**
		 * Attach jQuery.mobile pages to the mvc controllers
		 */
		// TODO: Attach to hashchange instead
		/*
		function attach() {
			$("[data-role='page'][data-controller]").live('pagebeforeshow', function (event, ui) {
				var page, controller, view, model;
				page = $(this);
				controller = page.data("controller");
				view = page.data("view");
				model = {
					app: app.environ,
					params: $.url.parse(ui.url).params
				};
				mvc.run(model, view, controller, output);

				function output(source) {
					page.html(source)
						.parent()
						.page()
						.page("refresh");
				}
			});
		}
		*/

		function initHtmlMap() {
			/**
			 * Define the type of object to be loaded from the html
			 */
			$.htmlMap({
				types: {
					"episodes": function(map) {
						return new App.Episodes(map("episode"));
					},
					"episode": function(map) {
						var episode = new App.Episode(map("id"), map("title"), map("description"));
						episode.videoLength = map("videoLength");
						return episode;
					}
				}
			});
		}

		app.bind = function() {
			/**
			 * Event for showing selected episode
			 */
			$(window).delegate("[data-episode]", "click", function(e) {
				e.preventDefault();
				var $this = $(this),
					episodeId = $this.data("episode"),
					episode = app.environ.episodes.get(episodeId) || {};
				var data = {
					"episode": episode
				};
			});
		};


		/**
		 * Define controllers
		 */
		// This controlle handler the homepage
		controllers.home = new Controller("home", function(model, view, callback) {

			//$(".episodeList").html(dali.get("view-episodeList").render(app.environ.episodes));

			callback(view.render(model));
		});
		// Controler to show more details on an episode, when the user clicks on an epidose
		controllers.episodeDetails = new Controller("episodeDetails", function(model, view, callback) {

			//$(".episodeDetails").html(dali.get("view-episodeDetails").render(data));

			callback(view.render(model));
		});

		// Define all the routes and match them to controllers
		app.routes = {
			"/": controllers.home,
			"/episode": controllers.episodeDetails
		};


		/**
		 * Start the application
		 */
		app.start = function () {

			// Register all controllers with the mvc
			mvc.register(controllers);

			// Load the episode data from the html
			initHtmlMap();
			app.model.episodes = $("#allEpisodes").htmlMap()[0];

			// Add the templates
			dali.add("episodeList", $("#view-episodeList").html());
			dali.add("episodeDetails", $("#view-episodeDetails").html());


//			app.render();
//			app.bind();

			// Attach jqm pages to the mvc
			//attach();
		};

		return app;
	}

	/**
	 * Collection of episodes
	 * @constructor
	 * @param episodes
	 */
	EpisodesApp.Episodes = function (episodes) {
		var items = episodes;
		this.all = function () {
			return items;
		};
		this.get = function (id) {
			for (var i in items) {
				if (items[i].id == id) return items[i];
			}
			return null;
		};
	};

	/**
	 * The Episode class
	 * @constructor
	 * @param id
	 * @param title
	 * @param description
	 */
	EpisodesApp.Episode = function (id, title, description) {
		this.id = id;
		this.title = title;
		this.description = description;
		this.videoLength = "";
	};

	// Expose the app to the global scope
	window.EpisodesApp = EpisodesApp;


})(jQuery);
