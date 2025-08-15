(function (osimis) {
    'use strict';

    var getBoolFromLocalStorage = function (key, defaultValue) {
        var value = window.localStorage.getItem(key);
        if (value === null) return defaultValue;
        return value === "true";
    };

    /**
     * @ngdoc object
     * @name osimis
     * @description The POJO Web Viewer's module/package.
     */

    /**
     * @ngdoc overview
     * @name webviewer
     * @description The AngularJS Web Viewer's module/package.
     */
    angular
        .module('webviewer', [
            'webviewer.layout',
            'webviewer.toolbox',
            'webviewer.translation',
            'ngCookies',
            'ngResource',
            'ngSanitize',
            'mgcrea.ngStrap',
            'ngRangeFilter',
            'debounce'
        ])
        .config(function ($locationProvider, $compileProvider, $tooltipProvider) {
            // Warning: Web Viewer is uncompatible with <base> HTML element (due to SVG/XLink issue)! Don't use it!
            $locationProvider.html5Mode({
                enabled: true,
                requireBase: false
            });

            // Fix AngularJS 1.6 breaking change
            if ($compileProvider.preAssignBindingsEnabled) {
                $compileProvider.preAssignBindingsEnabled(true);
            }

            // Detect touch screen and disable tooltip if touch - Enhanced for Safari iOS
            window.addEventListener('touchstart', function onFirstTouch() {
                // Add class for touch devices
                document.body.classList.add('user-is-touching');

                // Set global variable
                window.USER_IS_TOUCHING = true;

                // Disable tooltips on touch devices
                $tooltipProvider.defaults.trigger = "dontTrigger";
                console.log('disabling tooltip', $tooltipProvider);

                // Remove event listener after first touch
                window.removeEventListener('touchstart', onFirstTouch, false);
            }, false);

            angular.extend($tooltipProvider.defaults, {
                trigger: "hover"
            });
        })
        // Configure with HttpRequest at init
        .run(function ($q) {
            // Use HttpRequest with $q as the promise library
            // @note This breaks usage of HttpRequest outside the angular scope (because $q requires
            //       $digest cycles). That situation is very unlikely to happen though.
            osimis.HttpRequest.Promise = $q;
            osimis.HttpRequest.timeout = 0; // No timeout
        })
        // Hook global: iOS + landscape → clases en <body> y reflow tras giro
        .run(function ($window, uaParser) {
            try {
                if ($window.__wvIOSLandscapeHookInstalled) return; // evita doble registro
                $window.__wvIOSLandscapeHookInstalled = true;

                var osInfo = (uaParser.getOS && uaParser.getOS()) || {};
                var osName = osInfo.name || '';
                var isIOS =
                    osName === 'iOS' ||
                    /iPad|iPhone|iPod/.test($window.navigator.userAgent) ||
                    ($window.navigator.platform === 'MacIntel' && $window.navigator.maxTouchPoints > 1); // iPadOS

                if (!isIOS) return;

                function applyIOSLandscapeClasses() {
                    try {
                        // Marca iOS
                        if (document && document.body) {
                            document.body.classList.add('is-ios');
                            // Marca/borra landscape
                            if ($window.innerWidth > $window.innerHeight) {
                                document.body.classList.add('is-landscape');
                            } else {
                                document.body.classList.remove('is-landscape');
                            }
                        }
                        // Reflow del visor tras el giro (Cornerstone/splitpanes escuchan 'resize')
                        setTimeout(function () {
                            try {
                                $window.dispatchEvent(new $window.Event('resize'));
                            } catch (e) { }
                        }, 150);
                    } catch (e) {
                        // no-op
                    }
                }

                // Aplica en arranque
                if (document.readyState === 'loading') {
                    $window.addEventListener('DOMContentLoaded', applyIOSLandscapeClasses, { passive: true });
                } else {
                    applyIOSLandscapeClasses();
                }

                // Escucha cambios de orientación/tamaño
                $window.addEventListener('orientationchange', applyIOSLandscapeClasses, { passive: true });
                $window.addEventListener('resize', applyIOSLandscapeClasses, { passive: true });
            } catch (e) {
                // no-op
            }
        })
        .constant('$', window.$)
        .constant('_', window._)
        .constant('pako', window.pako)
        .constant('JpegImage', window.JpegImage)
        .constant('hamster', window.Hamster)
        .constant('cornerstone', window.cornerstone)
        .constant('cornerstoneTools', window.cornerstoneTools)
        .constant('uaParser', new UAParser());

})(this.osimis || (this.osimis = {}));
