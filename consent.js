/* Shared cookie consent + Google Analytics for every public page except the
   home page, which has its own banner. Uses the same 'sp_cookie_consent' key,
   so a choice made on any page holds on all of them. Nothing loads until the
   visitor accepts. A Global Privacy Control signal counts as a decline. */
(function () {
  var KEY = 'sp_cookie_consent';
  var GA_ID = 'G-P40MQCBTP9';

  function loadAnalytics() {
    if (window.__spGaLoaded) return;
    window.__spGaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  function showBanner() {
    var css = '.spc{position:fixed;left:0;right:0;bottom:0;z-index:100000;background:#0F0B28;border-top:1px solid rgba(201,168,76,.3);padding:16px;box-shadow:0 -4px 24px rgba(0,0,0,.4);font-family:system-ui,sans-serif}' +
      '.spc-in{max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px}' +
      '.spc p{flex:1 1 300px;color:#F5EDD8;font-size:13px;line-height:1.6;margin:0}.spc a{color:#C9A84C;text-decoration:underline}' +
      '.spc-b{display:flex;gap:10px}.spc button{font:inherit;font-size:13px;font-weight:600;padding:10px 22px;border-radius:4px;cursor:pointer;border:1px solid rgba(245,237,216,.35);background:transparent;color:#F5EDD8}' +
      '.spc .ok{background:#C9A84C;color:#1C1812;border-color:#C9A84C}@media(max-width:640px){.spc-b{width:100%}.spc button{flex:1}}';
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    var b = document.createElement('div');
    b.className = 'spc';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookie consent');
    b.innerHTML = '<div class="spc-in"><p>We use cookies to see which pages help you most. Nothing loads until you choose. <a href="/privacy-policy">Privacy Policy</a></p>' +
      '<div class="spc-b"><button type="button" class="no">Decline</button><button type="button" class="ok">Accept</button></div></div>';
    document.body.appendChild(b);
    b.querySelector('.ok').addEventListener('click', function () {
      try { localStorage.setItem(KEY, 'accepted'); } catch (e) {}
      b.remove();
      loadAnalytics();
    });
    b.querySelector('.no').addEventListener('click', function () {
      try { localStorage.setItem(KEY, 'declined'); } catch (e) {}
      b.remove();
    });
  }

  var gpc = false;
  try { gpc = navigator.globalPrivacyControl === true; } catch (e) {}
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  if (gpc) {
    try { localStorage.setItem(KEY, 'declined'); } catch (e) {}
  } else if (stored === 'accepted') {
    loadAnalytics();
  } else if (stored !== 'declined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showBanner);
    else showBanner();
  }
})();
