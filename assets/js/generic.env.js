function getPlatform() {
  const { userAgent, platform } = window.navigator;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
  let os;
  if (iosPlatforms.indexOf(platform) !== -1
    // For new IPads with M1 chip and IPadOS platform returns "MacIntel"
    || (platform === 'MacIntel' && ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 2))) {
    os = 'iOS';
  } else if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'macOS';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'Windows';
  } else if (/Android/.test(userAgent)) {
    os = 'Android';
  } else if (/Linux/.test(platform)) {
    os = 'Linux';
  }
  return os;
}

window.IS_TOUCH_ENV = window.matchMedia('(pointer: coarse)').matches;

window.PLATFORM_ENV = getPlatform();
window.IS_MAC_OS = PLATFORM_ENV === 'macOS';
window.IS_IOS = PLATFORM_ENV === 'iOS';
window.IS_ANDROID = PLATFORM_ENV === 'Android';
window.IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
window.IS_PWA = (
  window.matchMedia('(display-mode: standalone)').matches
  || (window.navigator).standalone
  || document.referrer.includes('android-app://')
);
window.IS_MOBILE = (IS_IOS || IS_ANDROID || (IS_SAFARI && IS_TOUCH_ENV));
