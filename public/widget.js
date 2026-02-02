(function() {
  'use strict';

  // Find the script tag that loaded this file
  var scripts = document.querySelectorAll('script[data-widget-id]');

  scripts.forEach(function(script) {
    var widgetId = script.getAttribute('data-widget-id');
    if (!widgetId) return;

    // Find the container div
    var container = document.getElementById('moving-widget-' + widgetId);
    if (!container) {
      console.error('Moving Widget: Container div not found for widget ' + widgetId);
      return;
    }

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.src = 'https://booking-tool-new.vercel.app/widget/' + widgetId + '?embed=true';
    iframe.style.width = '100%';
    iframe.style.minHeight = '600px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    iframe.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    iframe.style.backgroundColor = '#ffffff';
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('title', 'Moving Quote Widget');

    // Style the container
    container.style.backgroundColor = '#f9fafb';
    container.style.borderRadius = '12px';
    container.style.overflow = 'hidden';

    // Insert iframe into container
    container.innerHTML = '';
    container.appendChild(iframe);

    // Listen for height updates from the iframe
    window.addEventListener('message', function(event) {
      // Verify origin for security
      if (event.origin !== 'https://booking-tool-new.vercel.app') return;

      if (event.data && event.data.type === 'resize' && event.data.widgetId === widgetId) {
        iframe.style.height = event.data.height + 'px';
      }
    });
  });
})();
