/**
 * @ngdoc directive
 * @name webviewer.directive:wvWebviewer
 * Enhanced Safari/iOS compatibility version
 **/
(function () {
    'use strict';

    angular
        .module('webviewer')
        .directive('wvWebviewer', wvWebviewer);

    /* @ngInject */
    function wvWebviewer($rootScope, $timeout, $translate, wvStudyManager, wvAnnotationManager, wvImageManager, wvPaneManager, wvWindowingViewportTool, wvSynchronizer, wvReferenceLines, wvViewerController, wvConfig) {
        var directive = {
            bindToController: true,
            controller: Controller,
            controllerAs: 'vm',
            link: link,
            restrict: 'E',
            scope: {
                readonly: '=?wvReadonly',
                pickableStudyIdLabels: '=?wvPickableStudyIdLabels',
                pickableStudyIds: '=wvPickableStudyIds',
                selectedStudyIds: '=?wvSelectedStudyIds',
                seriesId: '=?wvSeriesId',
                tools: '=?wvTools',
                toolbarEnabled: '=?wvToolbarEnabled',
                toolbarPosition: '=?wvToolbarPosition',
                toolbarLayoutMode: '=?wvToolbarLayoutMode',
                toolbarDefaultTool: '=?wvToolbarDefaultTool',
                serieslistEnabled: '=?wvSerieslistEnabled',
                studyinformationEnabled: '=?wvStudyinformationEnabled',
                leftHandlesEnabled: '=?wvLefthandlesEnabled',
                noticeEnabled: '=?wvNoticeEnabled',
                noticeText: '=?wvNoticeText',
                windowingPresets: '=wvWindowingPresets',
                annotationStorageEnabled: '=?wvAnnotationstorageEnabled',
                studyDownloadEnabled: '=?wvStudyDownloadEnabled',
                videoDisplayEnabled: '=?wvVideoDisplayEnabled',
                keyImageCaptureEnabled: '=?wvKeyImageCaptureEnabled',
                showInfoPopupButtonEnabled: '=?wvShowInfoPopupButtonEnabled',
                downloadAsJpegEnabled: '=?wvDownloadAsJpegEnabled',
                combinedToolEnabled: '=?wvCombinedToolEnabled',
                showNoReportIconInSeriesList: '=?wvShowNoReportIconInSeriesList',
                reduceTimelineHeightOnSingleFrameSeries: '=?wvReduceTimelineHeightOnSingleFrameSeries',
                buttonsSize: '=?wvButtonsSize',
                studyIslandsDisplayMode: '=?wvStudyIslandsDisplayMode',
                displayDisclaimer: '=?wvDisplayDisclaimer',
                toolboxButtonsOrdering: '=?wvToolboxButtonsOrdering',
                seriesItemSelectionEnabled: '=?wvSeriesItemSelectionEnabled',
                selectedSeriesItems: '=?wvSelectedSeriesItems',
                isAsideClosed: '=?wvIsAsideClosed'
            },
            transclude: {
                wvLayoutTopLeft: '?wvLayoutTopLeft',
                wvLayoutTopRight: '?wvLayoutTopRight',
                wvLayoutRight: '?wvLayoutRight',
                wvLayoutLeftBottom: '?wvLayoutLeftBottom',
                wvLayoutLeftTop: '?wvLayoutLeftTop'
            },
            templateUrl: 'app/webviewer.directive.html'
        };
        return directive;

        function link(scope, element, attrs, ctrls, transcludeFn) {
            var vm = scope.vm;

            // --- iOS landscape scroll + relayout helper ---------------------------------
            (function iosLandscapeHelper() {
                // Detecta iOS (incluye iPadOS que se reporta como Mac con touch)
                var ua = navigator.userAgent;
                var isiPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                var isIOS = (wvConfig.browser && wvConfig.browser.os && wvConfig.browser.os.name === 'iOS') ||
                    /iPad|iPhone|iPod/.test(ua) || isiPadOS;
                if (!isIOS) return;

                var rootEl = element[0]; // <wv-webviewer> host

                function isLandscape() {
                    return window.innerWidth > window.innerHeight;
                }

                function applyIOSLandscapeFix() {
                    try {
                        if (isLandscape()) {
                            rootEl.classList.add('ios-scroll-container');
                        } else {
                            rootEl.classList.remove('ios-scroll-container');
                        }
                        // Re-layout del visor tras el giro para recalcular tamaños de canvas
                        setTimeout(function () {
                            // Cornerstone/splitpane suelen escuchar 'resize'
                            if (window && window.dispatchEvent) {
                                window.dispatchEvent(new Event('resize'));
                            }
                            if (typeof $ !== 'undefined' && $.fn) {
                                $(window).trigger('resize');
                            }
                        }, 150);
                    } catch (e) {
                        // no-op
                    }
                }

                // Aplica en arranque y ante cambios de orientación/resize
                applyIOSLandscapeFix();
                window.addEventListener('orientationchange', applyIOSLandscapeFix, { passive: true });
                window.addEventListener('resize', applyIOSLandscapeFix, { passive: true });
            })();
            // ---------------------------------------------------------------------------

            { // Enhanced browser compatibility check - Safari/iOS support
                var browserName = wvConfig.browser.browser.name;
                var browserMajorVersion = wvConfig.browser.browser.major;
                var osName = wvConfig.browser.os.name;

                vm.openIncompatibleBrowserModal = false;
                console.log("Checking browser compatibility:", wvConfig.browser);

                var minimalChromeVersion = 45;
                var minimalSafariVersion = 9;
                var minimalFirefoxVersion = 48;
                var minimalTizenVersion = 3;
                var minimalEdgeVersion = 14;
                var minimalIEVersion = 11;

                if (osName === "Mac OS") {
                    minimalChromeVersion = 48;
                    minimalFirefoxVersion = 28;
                }

                // ENHANCED: Safari iOS support - no longer blocked
                if (osName === "iOS" && wvConfig.browser.device.model === "iPhone") {
                    minimalChromeVersion = 45;    // Now supported
                    minimalFirefoxVersion = 48;   // Now supported
                    minimalSafariVersion = 9;     // Now supported
                }

                // ENHANCED: Extended browser support including Mobile Safari and Tizen
                if ((browserName === "Chrome" && browserMajorVersion >= minimalChromeVersion)
                    || (browserName === "Mobile Safari" && browserMajorVersion >= minimalSafariVersion)
                    || (browserName === "Safari" && browserMajorVersion >= minimalSafariVersion)
                    || (browserName === "Firefox" && browserMajorVersion >= minimalFirefoxVersion)
                    || (browserName === "TizenBrowser" && browserMajorVersion >= minimalTizenVersion)
                    || (browserName === "Edge" && browserMajorVersion >= minimalEdgeVersion)
                    || (browserName === "IE" && browserMajorVersion >= minimalIEVersion)) {
                    console.log(browserName + " Supported");
                }
                else {
                    vm.openIncompatibleBrowserModal = true;
                    vm.incompatibleBrowserErrorMessage = browserName + " version " + browserMajorVersion + " is not supported. You might expect inconsistent behaviours and shall not use the viewer to produce a diagnostic.";
                    console.log(vm.incompatibleBrowserErrorMessage);
                }

                vm.onCloseWarning = function () {
                    vm.openIncompatibleBrowserModal = false;
                }
            }

            vm.paneManager = wvPaneManager;
            vm.synchronizer = wvSynchronizer;
            vm.referenceLines = wvReferenceLines;
            vm.wvWindowingViewportTool = wvWindowingViewportTool;

            // Configure attributes default values
            vm.toolbarEnabled = typeof vm.toolbarEnabled !== 'undefined' ? vm.toolbarEnabled : true;
            vm.toolbarPosition = typeof vm.toolbarPosition !== 'undefined' ? vm.toolbarPosition : 'top';
            vm.buttonsSize = typeof vm.buttonsSize !== 'undefined' ? vm.buttonsSize : 'small';
            vm.customCommandIconLabel = typeof vm.customCommandIconLabel !== 'undefined' ? vm.customCommandIconLabel : 'custom command';
            vm.customCommandIconClass = typeof vm.customCommandIconClass !== 'undefined' ? vm.customCommandIconClass : 'fa fa-exclamation';
            vm.serieslistEnabled = typeof vm.serieslistEnabled !== 'undefined' ? vm.serieslistEnabled : true;
            vm.studyinformationEnabled = typeof vm.studyinformationEnabled !== 'undefined' ? vm.studyinformationEnabled : true;
            vm.leftHandlesEnabled = typeof vm.leftHandlesEnabled !== 'undefined' ? vm.leftHandlesEnabled : true;
            vm.noticeEnabled = typeof vm.noticeEnabled !== 'undefined' ? vm.noticeEnabled : false;
            vm.noticeText = typeof vm.noticeText !== 'undefined' ? vm.noticeText : undefined;
            vm.infoPopupIsStartup = true;
            vm.infoPopupEnabled = true;
            vm.readonly = typeof vm.readonly !== 'undefined' ? vm.readonly : false;
            vm.wvViewerController = wvViewerController;

            vm.tools = typeof vm.tools !== 'undefined' ? vm.tools : {
                windowing: false,
                zoom: false,
                pan: false,
                invert: false,
                magnify: {
                    magnificationLevel: 5,
                    magnifyingGlassSize: 300
                },
                lengthMeasure: false,
                angleMeasure: false,
                simpleAngleMeasure: false,
                pixelProbe: false,
                ellipticalRoi: false,
                rectangleRoi: false,
                layout: {
                    x: vm.wvViewerController.getLayout().x,
                    y: vm.wvViewerController.getLayout().y
                },
                play: false,
                overlay: true,
                vflip: false,
                hflip: false,
                rotateLeft: false,
                rotateRight: false,
                arrowAnnotate: false,
                nextSeries: false,
                previousSeries: false
            };

            if (vm.keyImageCaptureEnabled) {
                vm.tools.keyImageCapture = false;
            }
            if (vm.showInfoPopupButtonEnabled) {
                vm.tools.showInfoPopup = false;
            }
            if (vm.downloadAsJpegEnabled) {
                vm.tools.downloadAsJpeg = false;
            }
            if (vm.combinedToolEnabled) {
                vm.tools.combinedTool = false;
            }
            if (__webViewerConfig.printEnabled) {
                if (wvConfig.browser.browser.name == "IE") {
                    console.log("Internet Explorer does not support printing -> this feature will be disabled");
                } else {
                    vm.tools.print = false;
                }
            }
            if (__webViewerConfig.toggleOverlayTextButtonEnabled) {
                vm.tools.toggleOverlayText = false;
            }
            if (__webViewerConfig.toggleOverlayIconsButtonEnabled) {
                vm.tools.toggleOverlayIcons = false;
            }
            if (__webViewerConfig.synchronizedBrowsingEnabled) {
                vm.tools.toggleSynchro = false;
            } else {
                vm.synchronizer.enable(false);
            }
            if (__webViewerConfig.referenceLinesEnabled) {
                vm.tools.toggleReferenceLines = false;
            } else {
                vm.referenceLines.enable(false);
            }
            if (__webViewerConfig.crossHairEnabled) {
                vm.tools.crossHair = false;
            }
            if (__webViewerConfig.customCommandEnabled) {
                vm.tools.customCommand = false;
                vm.customCommandIconLabel = __webViewerConfig.customCommandIconLabel;
                vm.customCommandIconClass = __webViewerConfig.customCommandIconClass;
            }

            console.log('default tool: ', vm.toolbarDefaultTool)
            if (vm.toolbarDefaultTool) {
                vm.tools[vm.toolbarDefaultTool] = true;
                vm.activeTool = vm.toolbarDefaultTool;
            }

            if (vm.toolboxButtonsOrdering === undefined) {
                vm.toolboxButtonsOrdering = [
                    { type: "button", tool: "combinedTool" },
                    { type: "button", tool: "zoom" },
                    { type: "button", tool: "pan" },
                    { type: "button", tool: "invert" },
                    { type: "button", tool: "crossHair" },
                    { type: "button", tool: "toggleOverlayText" },
                    { type: "button", tool: "toggleOverlayIcons" },
                    { type: "button", tool: "arrowAnnotate" },
                    { type: "button", tool: "keyImageCapture" },
                    { type: "button", tool: "toggleSynchro" },
                    { type: "button", tool: "toggleReferenceLines" },
                    { type: "button", tool: "lengthMeasure" },
                    { type: "button", tool: "simpleAngleMeasure" },
                    { type: "button", tool: "angleMeasure" },
                    { type: "button", tool: "pixelProbe" },
                    { type: "button", tool: "ellipticalRoi" },
                    { type: "button", tool: "rectangleRoi" },
                    {
                        type: "group",
                        iconClasses: "fa fa-pen-square",
                        title: "manipulation",
                        buttons: [
                            { type: "button", tool: "rotateLeft" },
                            { type: "button", tool: "rotateRight" },
                            { type: "button", tool: "hflip" },
                            { type: "button", tool: "vflip" },
                        ]
                    },
                    { type: "button", tool: "magnify" },
                    { type: "button", tool: "windowing" },
                    { type: "button", tool: "layout" },
                    { type: "button", tool: "print" },
                    { type: "button", tool: "downloadAsJpeg" },
                    { type: "button", tool: "customCommand" }
                ]
            }

            vm.viewports = {};
            vm.pickableStudyIds = typeof vm.pickableStudyIds !== 'undefined' ? vm.pickableStudyIds : [];
            vm.selectedStudyIds = typeof vm.selectedStudyIds !== 'undefined' ? vm.selectedStudyIds : [];
            vm.studyDownloadEnabled = typeof vm.studyDownloadEnabled !== 'undefined' ? vm.studyDownloadEnabled : false;
            vm.videoDisplayEnabled = typeof vm.videoDisplayEnabled !== 'undefined' ? vm.videoDisplayEnabled : true;
            vm.keyImageCaptureEnabled = typeof vm.keyImageCaptureEnabled !== 'undefined' ? vm.keyImageCaptureEnabled : false;
            vm.downloadAsJpegEnabled = typeof vm.downloadAsJpegEnabled !== 'undefined' ? vm.downloadAsJpegEnabled : false;
            vm.combinedToolEnabled = typeof vm.combinedToolEnabled !== 'undefined' ? vm.combinedToolEnabled : false;
            vm.showInfoPopupButtonEnabled = typeof vm.showInfoPopupButtonEnabled !== 'undefined' ? vm.showInfoPopupButtonEnabled : false;
            vm.studyIslandsDisplayMode = vm.wvViewerController.getStudyIslandDisplayMode(__webViewerConfig.defaultStudyIslandsDisplayMode || "grid");

            if (!__webViewerConfig.toggleOverlayIconsButtonEnabled) {
                vm.wvViewerController.setOverlayIconsVisible(__webViewerConfig.displayOverlayIcons);
            }
            if (!__webViewerConfig.toggleOverlayTextButtonEnabled) {
                vm.wvViewerController.setOverlayTextVisible(__webViewerConfig.displayOverlayText);
            }
            vm.wvViewerController.setSelectedStudyIds(vm.selectedStudyIds);

            // Selection-related
            vm.seriesItemSelectionEnabled = typeof vm.seriesItemSelectionEnabled !== 'undefined' ? vm.seriesItemSelectionEnabled : false;
            vm.selectedSeriesIds = vm.selectedSeriesIds || {};
            vm.selectedReportIds = vm.selectedReportIds || {};
            vm.selectedVideoIds = vm.selectedVideoIds || {};
            vm.selectedSeriesItems = vm.selectedSeriesItems || [];

            // Update selected***Ids based on selectedSeriesItems
            scope.$watch('vm.selectedSeriesItems', function (newValues, oldValues) {
                vm.selectedSeriesIds = vm.selectedSeriesIds || {};
                _.forEach(vm.selectedSeriesIds, function (items, studyId) {
                    vm.selectedSeriesIds[studyId] = [];
                });
                vm.selectedVideoIds = vm.selectedVideoIds || {};
                _.forEach(vm.selectedVideoIds, function (items, studyId) {
                    vm.selectedVideoIds[studyId] = [];
                });
                vm.selectedReportIds = vm.selectedReportIds || {};
                _.forEach(vm.selectedReportIds, function (items, studyId) {
                    vm.selectedReportIds[studyId] = [];
                });

                newValues && newValues.forEach(function (newValue) {
                    var studyId = newValue.studyId;
                    switch (newValue.type) {
                        case 'series':
                            vm.selectedSeriesIds[studyId] = vm.selectedSeriesIds[studyId] || [];
                            vm.selectedSeriesIds[studyId].push(newValue.seriesId + ':' + newValue.instanceIndex);
                            break;
                        case 'report/pdf':
                            vm.selectedReportIds[studyId] = vm.selectedReportIds[studyId] || [];
                            vm.selectedReportIds[studyId].push(newValue.instanceId);
                            break;
                        case 'video/mpeg4':
                            vm.selectedVideoIds[studyId] = vm.selectedVideoIds[studyId] || [];
                            vm.selectedVideoIds[studyId].push(newValue.instanceId);
                            break;
                    }
                });
            }, true);

            // Update selectedSeriesItems based on selected***Ids
            scope.$watch(function () {
                return {
                    series: vm.selectedSeriesIds,
                    reports: vm.selectedReportIds,
                    videos: vm.selectedVideoIds
                }
            }, function (newValues, oldValues) {
                var series = _.flatMap(newValues.series, function (seriesIds, studyId) {
                    return seriesIds.map(function (seriesId) {
                        var arr = seriesId.split(':');
                        var orthancSeriesId = arr[0];
                        var instanceIndex = arr[1];
                        return {
                            seriesId: orthancSeriesId,
                            studyId: studyId,
                            instanceIndex: instanceIndex,
                            type: 'series'
                        }
                    });
                });

                var reports = _.flatMap(newValues.reports, function (reportIds, studyId) {
                    return reportIds.map(function (instanceId) {
                        return {
                            instanceId: instanceId,
                            studyId: studyId,
                            type: 'report/pdf'
                        }
                    });
                });

                var videos = _.flatMap(newValues.videos, function (videoIds, studyId) {
                    return videoIds.map(function (instanceId) {
                        return {
                            instanceId: instanceId,
                            studyId: studyId,
                            type: 'video/mpeg4'
                        }
                    });
                });

                vm.selectedSeriesItems = [].concat(series).concat(reports).concat(videos);
            }, true);

            // Activate mobile interaction tools on mobile (not tablet)
            var uaParser = new UAParser();
            vm.mobileInteraction = uaParser.getDevice().type === 'mobile';
            if (vm.mobileInteraction) {
                vm.tools.combinedTool = true;
                vm.activeTool = 'combinedTool';
            }

            // Adapt breadcrumb displayed info based on the selected pane
            wvPaneManager.getSelectedPane().getStudy().then(function (study) {
                vm.selectedPaneStudyId = study && study.id;
            });
            wvPaneManager.onSelectedPaneChanged(function (pane) {
                pane.getStudy().then(function (study) {
                    vm.selectedPaneStudyId = study && study.id;
                });
            });

            // Apply viewport changes when toolbox actions are clicked
            vm.onActionClicked = function (action) {
                var selectedPane = wvPaneManager.getSelectedPane();

                if (this.readonly) {
                    return;
                }
                if (selectedPane.csViewport) {
                    switch (action) {
                        case 'invert':
                            selectedPane.invertColor();
                            break;
                        case 'vflip':
                            selectedPane.flipVertical();
                            break;
                        case 'hflip':
                            selectedPane.flipHorizontal();
                            break;
                        case 'rotateLeft':
                            selectedPane.rotateLeft();
                            break;
                        case 'rotateRight':
                            selectedPane.rotateRight();
                            break;
                        case 'toggleSynchro':
                            vm.synchronizer.enable(!vm.synchronizer.isEnabled());
                            break;
                        case 'toggleReferenceLines':
                            vm.referenceLines.enable(!vm.referenceLines.isEnabled());
                            break;
                        case 'toggleOverlayText':
                            vm.wvViewerController.toggleOverlayText();
                            break;
                        case 'toggleOverlayIcons':
                            vm.wvViewerController.toggleOverlayIcons();
                            break;
                        case 'previousSeries':
                            vm.wvViewerController.previousSeries();
                            break;
                        case 'nextSeries':
                            vm.wvViewerController.nextSeries();
                            break;
                        case 'print':
                            window.print();
                            break;
                        case 'downloadAsJpeg':
                            selectedPane.downloadAsJpeg(wvImageManager);
                            break;
                        case 'customCommand':
                            vm.wvViewerController.executeCustomCommand();
                            break;
                        case 'showInfoPopup':
                            vm.infoPopupIsStartup = false;
                            vm.infoPopupEnabled = true;
                            break;
                        default:
                            throw new Error('Unknown toolbar action.');
                    }
                } else {
                    switch (action) {
                        case 'showInfoPopup':
                            vm.infoPopupIsStartup = false;
                            vm.infoPopupEnabled = true;
                            break;
                        default:
                            throw new Error('Unknown toolbar action.');
                    }
                }
            };

            // Apply viewport change when windowing preset is selected
            vm.onWindowingPresetSelected = function (windowWidth, windowCenter) {
                if (this.readonly) {
                    return;
                }
                var selectedPane = wvPaneManager.getSelectedPane();
                vm.wvWindowingViewportTool.applyWindowingToPane(selectedPane, windowWidth, windowCenter, false);
            };

            // Store each panes' states
            vm.panes = wvPaneManager.panes;

            // Keep pane layout model in sync
            scope.$watch('vm.tools.layout', function (layout) {
                vm.wvViewerController.setLayout(layout.x, layout.y);
            }, true);

            vm.onItemDroppedToPane = function (x, y, config) {
                config.isSelected = true;
                wvViewerController.setPane(x, y, config);
            };

            // Enable/Disable annotation storage/retrieval from backend
            scope.$watch('vm.annotationStorageEnabled', function (isEnabled, wasEnabled) {
                if (isEnabled) {
                    wvAnnotationManager.enableAnnotationStorage();
                } else {
                    wvAnnotationManager.disableAnnotationStorage();
                }
            });

            vm.studiesColors = {
                blue: [],
                red: [],
                green: [],
                yellow: [],
                violet: []
            };

            scope.$watch('vm.selectedStudyIds', function (newValues, oldValues) {
                console.log('selected studies ids: ', newValues);
                wvViewerController.setSelectedStudyIds(newValues);

                if (_.isEqual(newValues, oldValues)) {
                    oldValues = [];
                }

                if (_.intersection(newValues, vm.pickableStudyIds).length !== newValues.length) {
                    vm.pickableStudyIds = newValues;
                }

                // Cancel previous preloading, reset studies colors & remove study items' selection
                oldValues.filter(function (newStudyId) {
                    return newValues.indexOf(newStudyId) === -1;
                }).forEach(function (oldStudyId) {
                    wvStudyManager.abortStudyLoading(oldStudyId);

                    wvStudyManager.get(oldStudyId).then(function (study) {
                        vm.studiesColors[study.color].splice(vm.studiesColors[study.color].indexOf(study.id), 1);
                        study.setColor('gray');
                    });

                    if (vm.selectedSeriesIds.hasOwnProperty(oldStudyId)) {
                        delete vm.selectedSeriesIds[oldStudyId];
                    }
                    if (vm.selectedReportIds.hasOwnProperty(oldStudyId)) {
                        delete vm.selectedReportIds[oldStudyId];
                    }
                    if (vm.selectedVideoIds.hasOwnProperty(oldStudyId)) {
                        delete vm.selectedVideoIds[oldStudyId];
                    }
                    vm.selectedSeriesItems = vm.selectedSeriesItems.filter(function (seriesItem) {
                        return seriesItem.studyId !== oldStudyId;
                    });
                });

                // Preload studies, set studies color & fill first pane if empty
                newValues.filter(function (newStudyId) {
                    return oldValues.indexOf(newStudyId) === -1;
                }).forEach(function (newStudyId) {
                    wvStudyManager.loadStudy(newStudyId);
                    wvAnnotationManager.loadStudyAnnotations(newStudyId);

                    wvStudyManager.get(newStudyId).then(function (study) {
                        if (!study.hasColor()) {
                            var availableColors = Object.keys(vm.studiesColors);
                            var minColorUsageCount = undefined;
                            var minColorUsageName;
                            for (var i = 0; i < availableColors.length; ++i) {
                                var colorName = availableColors[i];
                                var colorUsageCount = vm.studiesColors[colorName].length;
                                if (typeof minColorUsageCount === 'undefined' || colorUsageCount < minColorUsageCount) {
                                    minColorUsageCount = colorUsageCount;
                                    minColorUsageName = colorName;
                                }
                            }
                            study.setColor(minColorUsageName);
                            vm.studiesColors[minColorUsageName].push(study.id);
                        }
                    });
                });

                // If first pane is empty, set the first series in the first study
                if (newValues && newValues[0]) {
                    wvStudyManager.get(newValues[0]).then(function (firstStudy) {
                        var firstPane = wvPaneManager.getPane(0, 0);
                        if (firstStudy && firstPane.isEmpty()) {
                            wvViewerController.setPane(0, 0, { seriesId: firstStudy.series[0], isSelected: true, studyColor: firstStudy.color })
                        };
                    });
                }
            }, true);

            // Propagate series preloading events
            scope.$watch('vm.panes', function (newViewports, oldViewports) {
                for (var i = 0; i < newViewports.length || i < oldViewports.length; ++i) {
                    if (oldViewports[i] && newViewports[i] && oldViewports[i].seriesId === newViewports[i].seriesId
                        || !oldViewports[i] && !newViewports[i]) {
                        continue;
                    }

                    if (!oldViewports[i] && newViewports[i]) {
                        if (newViewports[i].seriesId) {
                            $rootScope.$emit('UserSelectedSeriesId', newViewports[i].seriesId);
                        }
                    }
                    else if (oldViewports[i] && !newViewports[i]) {
                        if (oldViewports[i].seriesId) {
                            $rootScope.$emit('UserUnSelectedSeriesId', oldViewports[i].seriesId);
                        }
                    }
                    else if (oldViewports[i] && newViewports[i] && oldViewports[i].seriesId !== newViewports[i].seriesId) {
                        if (oldViewports[i].seriesId) {
                            $rootScope.$emit('UserUnSelectedSeriesId', oldViewports[i].seriesId);
                        }
                        if (newViewports[i].seriesId) {
                            $rootScope.$emit('UserSelectedSeriesId', newViewports[i].seriesId);
                        }
                    }
                }
            }, true);

            // Adapt the first viewport to new seriesId
            scope.$watch('vm.seriesId', function (newSeriesId, oldSeriesId) {
                if (vm.panes[0]) {
                    vm.panes[0].seriesId = newSeriesId;
                    vm.panes[0].imageIndex = 0;
                    vm.panes[0].csViewport = null;
                }
            });

            // When studyIslandsDisplayMode changes, trigger window resize event
            scope.$watch('vm.studyIslandsDisplayMode', function (newValue, oldValue) {
                vm.wvViewerController.saveStudyIslandDisplayMode(newValue);
                window.localStorage.setItem("studyIslandsDisplayMode", newValue);
                asap(function () {
                    $(window).trigger("resize");
                });

                $timeout(function () {
                    $(window).trigger("resize");
                });
            });

            console.log('registering media change events');

            function beforePrint(event) {
                console.log('beforePrint');
                var $body = $('body');
                $body.addClass("print");

                var uaParser = new UAParser();
                var isFirefox = (uaParser.getBrowser().name === 'Firefox');
                var isIE = (uaParser.getBrowser().name === 'IE');
                var isEdge = (uaParser.getBrowser().name === 'Edge');
                console.log("ua parser", uaParser.getBrowser());
                $body.css('width', '8.5in');
                $body.css('height', '11in');

                if (isIE) {
                    window.alert($translate.instant('GENERAL_PARAGRAPHS.INCOMPATIBLE_PRINT_BROWSER'));
                }

                console.log('body size', $body.width(), $body.height());

                var panes = vm.paneManager.getAllPanes();
                var $splitpane = $("wv-splitpane");
                var splitpaneSize = { width: $splitpane.width(), height: $splitpane.height() }
                var panesCount = {
                    x: vm.tools.layout.x,
                    y: vm.tools.layout.y
                }

                for (var i = 0; i < panes.length; i++) {
                    var $pane = panes[i];
                    var viewport = vm.viewports[$pane.$$hashKey];
                    var paneSize = {
                        originalWidth: viewport.getCanvasSize().width,
                        originalHeight: viewport.getCanvasSize().height,
                        originalRatio: 0,
                        paneFinalWidth: splitpaneSize.width / panesCount.x,
                        paneFinalHeight: splitpaneSize.height / panesCount.y,
                        paneFinalRatio: 0,
                        canvasFinalWidth: 0,
                        canvasFinalHeight: 0,
                        canvasFinalRatio: 0
                    };
                    paneSize.originalRatio = paneSize.originalWidth / paneSize.originalHeight;
                    paneSize.paneFinalRatio = paneSize.paneFinalWidth / paneSize.paneFinalHeight;

                    if (paneSize.paneFinalRatio > 1) {
                        if (paneSize.paneFinalRatio > paneSize.originalRatio) {
                            console.log('case 1');
                            paneSize.canvasFinalHeight = paneSize.paneFinalHeight;
                            paneSize.canvasFinalWidth = paneSize.canvasFinalHeight * paneSize.originalRatio;
                        } else {
                            console.log('case 2');
                            paneSize.canvasFinalWidth = paneSize.paneFinalWidth;
                            paneSize.canvasFinalHeight = paneSize.canvasFinalWidth / paneSize.originalRatio;
                        }
                    } else {
                        if (paneSize.paneFinalRatio > paneSize.originalRatio) {
                            console.log('case 3');
                            paneSize.canvasFinalHeight = paneSize.paneFinalHeight;
                            paneSize.canvasFinalWidth = paneSize.canvasFinalHeight * paneSize.originalRatio;
                        } else {
                            console.log('case 4');
                            paneSize.canvasFinalWidth = paneSize.paneFinalWidth;
                            paneSize.canvasFinalHeight = paneSize.canvasFinalWidth / paneSize.originalRatio;
                        }
                    }

                    paneSize.canvasFinalRatio = paneSize.canvasFinalWidth / paneSize.canvasFinalHeight;
                    console.log('paneSizes:', paneSize, 'splitpaneSize:', splitpaneSize, "panesCount:", panesCount);
                    var $canvas = $("[data-pane-hashkey='" + $pane.$$hashKey + "']").find('canvas');
                    $canvas.width(paneSize.canvasFinalWidth);
                    $canvas.height(paneSize.canvasFinalHeight);
                }
            };

            function afterPrint() {
                console.log("afterprint");
                var $body = $('body');
                $body.removeClass("print");
                $body.css('width', '100%');
                $body.css('height', '100%');
                $(".wv-cornerstone-enabled-image canvas").css('width', 'auto');
                $(".wv-cornerstone-enabled-image canvas").css('height', 'auto');
                $(window).trigger('resize');
            }

            window.addEventListener("beforeprint", function (event) {
                beforePrint(event)
            })
            var printMedia = window.matchMedia('print');
            printMedia.addListener(function (mql) {
                if (mql.matches) {
                    console.log('webkit equivalent of onbeforeprint');
                    beforePrint();
                }
            });

            window.addEventListener("afterprint", function () {
                afterPrint();
            });

            vm.cancelPrintMode = function () {
                afterPrint();
            }
        }
    }

    /* @ngInject */
    function Controller($rootScope, $scope, $window) {
        var vm = this;
        vm.window = $window;
    }

})();
