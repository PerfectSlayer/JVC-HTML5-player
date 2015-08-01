// ==UserScript==
// @name        JVC HTML5 player
// @namespace   http://www.hardcoding.fr
// @description	Replace Flash players with native HTML5 player (without ads and with resolution chooser)
// @include     http://www.jeuxvideo.com/*
// @version     1
// @grant       none
// ==/UserScript==

// Load native player from a jv player element
function loadNativePlayer(element) {
	console.log('Replacing '+element.id);
	//var id = element.id.match('player-jv-([0-9]+)-[0-9]+_wrapper');
	/*
	 * Get the video id.
	 */
	// Get video id from element id
	var id = element.id.match('player-jv-([0-9]+)-');
	// Check id
	if (!id) {
		console.warn('Unable to get video ip.');
		// Stop player loading
		return;
	}
	id = id[1];
	/*
	 * Get the video parent element.
	 */
	// Declare parent found status
	var parentFound = false;
	// Declare parent element
	var parent = $('#'+element.id);
	// Look for player content parent element
	while (!parentFound && parent) {
		// Check parent class
		if (parent.hasClass('player-contenu')) {
			// Mark parent as found
			parentFound = true;
			// Stop looking for parent
			break;
		}
		// Get parent
		parent = parent.parent();
	}
	// Check parent
	if (!parent) {
		console.warn('Unable to found player parent.');
		// Stop player loading
		return;
	}
	/*
	 * Insert native player.
	 */
	// Get video configuration
	$.ajax('http://www.jeuxvideo.com/contenu/medias/video.php?q=config&id='+id)
	.done(function (data) {
		// Clear parent
		parent.empty();
		// Insert resolution div
		var resolutionDiv = $('<div id="native-player-'+id+'-resolutions" class="bloc-tags-default" style="position: absolute; margin: 0px 0px 0px 3px; display:none"></div>').appendTo(parent);
		// Insert video icon
		resolutionDiv.append('<div class="tag-arrow"><span class="icon-play" style="transform: none;"></span><div class="arrow"></div></div>');
		// Insert each resolution button
		for (var index in data.sources) {
			// Get source file and label
			var file = data.sources[index].file;
			var label = data.sources[index].label;
			// Check source file
			if (!file)
				continue;
			// Append source file button
			resolutionDiv.append('<a href="#" id="native-player-'+id+'-'+label+'"'+' class="btn-jv-tag" style="margin-left: 8px;" data-id="'+id+'" data-source="'+file+'"> '+label+' </a>');
			// Attach source file button handler
			$('#native-player-'+id+'-'+label).on('click', function (event) {
				// Fire load video action
				actionLoadVideo(event);
				// Prevent link loading
				return false;
			});
		}
		// Insert native player element
		var nativeVideo = parent.append('<video id="native-player-'+id+'" width="'+data.width+'" height="'+data.height+'" controls poster="'+data.image+'"></video>');
		// Bind hover callbacks
		nativeVideo.hover(function () {
			// Fade in resolution div
			$('#native-player-'+id+'-resolutions').fadeIn();
		}, function () {
			// Fade out resolution div
			$('#native-player-'+id+'-resolutions').fadeOut();
		});
		// Load default video
		var defaultSource = (data.sources.lenght > 1 && data.sources[0].label == '1080p') ? 1 : 0;
		loadVideo(id, data.sources[defaultSource].file);
	})
	.fail(function () {
		console.warn('Unable to get video configuration');
	});
}

// Handler to load a video
function actionLoadVideo(event) {
	// Check event target
	if (!event.target) {
		console.warn('No event target.');
		return;
	}
	var target = $(event.target);
	// Get native player id
	var id = target.attr('data-id');
	// Get video source
	var source = target.attr('data-source');
	// Check id and source
	if (!id || !source) {
		console.warn('Missing native player id or video source.');
		return;
	}
	// Load video
	loadVideo(id, source);
}

// Load a video to a native player
function loadVideo(id, source) {
	console.log('Load video '+source+' on player '+id);
	// Get native player element
	var nativePlayer = $('#native-player-'+id);
	var _nativePlayer = nativePlayer[0];
	// Get playing status
	var playing = !_nativePlayer.paused;
	// Get video current time
	var currentTime = 0;
	if (playing) {
		// Pause video
		_nativePlayer.pause();
		// Get video current time
		currentTime = _nativePlayer.currentTime;
	}
	// Change native player source
	nativePlayer.attr('src', source);
	if (playing) {
		// Load new source
		_nativePlayer.load();
		// Start playing video
		_nativePlayer.play();
		// Request to restore current time when video can play
		nativePlayer.one('canplay', function() {
			_nativePlayer.currentTime = currentTime
		});
	}
}

// Initialize the script
$(document).ready(function () {
	console.log('Looking for jv player.');
	// Look for player jv div
	$('div[id^=player-jv]').
	//Sfilter('[id$=_wrapper]').
	each(function (index, element) {
		// Load native player for each element found
		loadNativePlayer(element);
	});
});