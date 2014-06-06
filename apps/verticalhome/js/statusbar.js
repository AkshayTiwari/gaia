'use strict';

/* global appManager */

(function(exports) {

  const APPEARANCE = {
    OPAQUE: 'opaque',
    SEMI_TRANSPARENT: 'semi-transparent'
  };

  function StatusBar() {
    this.scrollable = document.querySelector('.scrollable');
    this.threshold = document.getElementById('search').clientHeight;

    if (!appManager.app) {
      window.addEventListener('appmanager-ready', function onReady() {
        window.removeEventListener('appmanager-ready', onReady);
        this.onAppReady();
      }.bind(this));
    } else {
      this.onAppReady();
    }
  }

  StatusBar.prototype = {
    /**
     * General event handler.
     */
    handleEvent: function(e) {
      switch(e.type) {
        case 'scroll':
          var scrollTop = this.scrollable.scrollTop;
          this.setAppearance(scrollTop > this.threshold ? APPEARANCE.OPAQUE :
                                         APPEARANCE.SEMI_TRANSPARENT);
          break;
      }
    },

    onAppReady: function() {
      appManager.app.connect('change-appearance-statusbar').then(
        function ok(ports) {
          ports.forEach(function(port) {
            this.port = port;
          }.bind(this));
          this.scrollable.addEventListener('scroll', this);
          this.setAppearance(APPEARANCE.SEMI_TRANSPARENT);
        }.bind(this), function fail(reason) {
          console.error('Cannot notify changes of appearance: ', reason);
        }
      );
    },

    setAppearance: function(value) {
      if (this.appearance === value) {
        return;
      }

      this.appearance = value;
      this.port.postMessage(value);
    }
  };

  exports.statusBar = new StatusBar();

}(window));