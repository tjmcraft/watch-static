function debounce(fn,
	ms,
	shouldRunFirst = true,
	shouldRunLast = true,) {
	let waitingTimeout;

	return (...args) => {
		if (waitingTimeout) {
			clearTimeout(waitingTimeout);
			waitingTimeout = undefined;
		} else if (shouldRunFirst) {
			fn(...args);
		}

		// eslint-disable-next-line no-restricted-globals
		waitingTimeout = self.setTimeout(() => {
			if (shouldRunLast) {
				fn(...args);
			}

			waitingTimeout = undefined;
		}, ms);
	};
}

function throttle(fn = () => {},
	ms = 500,
	shouldRunFirst = true,) {
	let interval;
	let isPending;
	let args;

	return (..._args) => {
		isPending = true;
		args = _args;

		if (!interval) {
			if (shouldRunFirst) {
				isPending = false;
				fn(...args);
			}

			// eslint-disable-next-line no-restricted-globals
			interval = self.setInterval(() => {
				if (!isPending) {
					// eslint-disable-next-line no-restricted-globals
					self.clearInterval(interval);
					interval = undefined;
					return;
				}

				isPending = false;
				fn(...args);
			}, ms);
		}
	};
}

const handleDoubleClick = (time = 400, singleClickCallback, doubleClickCallback, doubleClickReject = undefined) => {
	let clicks = 0, timeout;
	return function () {
		clicks++;
		if (clicks == 1) {
			singleClickCallback && singleClickCallback.apply(this, arguments);
			timeout = setTimeout(() => {
				clicks = 0;
				doubleClickReject && doubleClickReject.apply(this, arguments);
			}, time);
		} else {
			timeout && clearTimeout(timeout);
			doubleClickCallback && doubleClickCallback.apply(this, arguments);
			clicks = 0;
		}
	};
};