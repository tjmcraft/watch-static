{
	var shareBtn = document.querySelector('#share-link');
	var shareIcon = shareBtn.querySelector('i');
	const debounceEnd = debounce(() => {
		shareIcon.className = "icon-reply";
	}, 1000, false, true);
	shareBtn.addEventListener('click', function (event) {
		shareIcon.className = "icon-reply-filled";
		debounceEnd();
		copyTextToClipboard(location.href);
	});
}
(() => {
	var editBtn = document.querySelector('#edit-link');
	if (!editBtn) return;
	editBtn.addEventListener('click', function (event) {
		location.href = "/video/" + vid + "/edit";
	});
})();