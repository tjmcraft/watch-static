function formatTime(e = 0) {
	var t, n, r, o = e < 0;
	return t = (n = (e = Math.round(o ? -e : e)) % 60) < 10 ? "0" + n : n,
		t = (r = (e = Math.floor(e / 60)) % 60) + ":" + t,
		(e = Math.floor(e / 60)) > 0 && (r < 10 && (t = "0" + t),
			t = e + ":" + t),
		o && (t = "-" + t),
		t
}

function getBrowserFullscreenElementProp() {
	if (typeof document.fullscreenElement !== 'undefined') {
		return 'fullscreenElement';
	} else if (typeof document.mozFullScreenElement !== 'undefined') {
		return 'mozFullScreenElement';
	} else if (typeof document.webkitFullscreenElement !== 'undefined') {
		return 'webkitFullscreenElement';
	}
	return '';
}
function checkIfFullscreen() {
	const fullscreenProp = getBrowserFullscreenElementProp();
	return Boolean(fullscreenProp && document[fullscreenProp]);
}
function safeRequestFullscreen(element) {
	if (element.requestFullscreen) {
		element.requestFullscreen();
	} else if (element.webkitRequestFullscreen) {
		element.webkitRequestFullscreen();
	} else if (element.webkitEnterFullscreen) {
		element.webkitEnterFullscreen();
	} else if (element.mozRequestFullScreen) {
		element.mozRequestFullScreen();
	}
}
function safeExitFullscreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.webkitCancelFullScreen) {
		document.webkitCancelFullScreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	}
}
function setFullscreen(element) {
	if (checkIfFullscreen()) {
		safeExitFullscreen();
	} else {
		safeRequestFullscreen(element);
	}
}

function fallbackCopyTextToClipboard(text) {
	var textArea = document.createElement("textarea");
	textArea.value = text;

	// Avoid scrolling to bottom
	textArea.style.top = "0";
	textArea.style.left = "0";
	textArea.style.position = "fixed";

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		var successful = document.execCommand('copy');
		var msg = successful ? 'successful' : 'unsuccessful';
		console.log('Fallback: Copying text command was ' + msg);
	} catch (err) {
		console.error('Fallback: Oops, unable to copy', err);
	}

	document.body.removeChild(textArea);
}
function copyTextToClipboard(text) {
	if (!navigator.clipboard) {
		fallbackCopyTextToClipboard(text);
		return;
	}
	navigator.clipboard.writeText(text).then(function () {
		console.log('Async: Copying to clipboard was successful!');
	}, function (err) {
		console.error('Async: Could not copy text: ', err);
	});
}
