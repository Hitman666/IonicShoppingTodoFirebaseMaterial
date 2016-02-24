// Ionic ShoppingToDo App

angular.module('ShoppingToDo', ['ionic', 'ShoppingToDo.controllers', 'ShoppingToDo.data', 'auth', 'user', 'ionic-material', 'ionMdInput'])

// change this URL to your Firebase
.constant('FBURL', 'https://intense-torch-4465.firebaseio.com/')

// constructor injection for a Firebase reference
.service('FDBRoot', ['FBURL', Firebase])

.run(function($ionicPlatform, $rootScope, $state, Auth, User, $timeout, $ionicLoading, $ionicPopup) {
    $rootScope.showLoading = function(msg) {
        $ionicLoading.show({
            //template: '<ion-spinner icon="bubbles" class="spinner-calm"></ion-spinner><br/>' + msg
            template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div><br>' + msg
        });
    };

    $rootScope.hideLoading = function() {
        $ionicLoading.hide();
    };

    $rootScope.showLoading("Loading the app...");

    $ionicPlatform.ready(function() {
        $rootScope.User = User.get();

        $rootScope.err = '';

        $rootScope.DEBUG = true;
        $rootScope.clog = function(msg){
            if ($rootScope.DEBUG){
                console.log(msg);
            }
        }

        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

        var admobid = {
            banner: 'ca-app-pub-7957971173858308/5730886968'
        };

        if (window.AdMob) {
            AdMob.createBanner({
                adId: admobid.banner,
                position: AdMob.AD_POSITION.BOTTOM_CENTER,
                autoShow: true
            });
        }

        $rootScope.checkSession = function(resetView) {
            $rootScope.clog("doso sam tu s: " + resetView);

            if($rootScope.User && $rootScope.User.GetAuthData()) {
                $state.go('app.profile');
            }
            else if(resetView) {
                $timeout(function(){
                    $state.go('app.login', {}, {reload: false});
                });
            }

            $rootScope.hideLoading();
        };

        

        $rootScope.alert = function (errTitle, errMsg){
            $ionicPopup.alert({
                title: errTitle,
                template: errMsg
            });
        };

        Auth.onAuth(function(authData) {
            $rootScope.hideLoading();

            if (! authData) {
                $rootScope.User && $rootScope.User.Reset();

                $rootScope.clog("Not logged in yet");

                $rootScope.checkSession(true);
            } else {
                $rootScope.userAuth = authData;

                $rootScope.User.SetUserAuthData(
                    authData, 
                    function(status) {
                        if(!status.ok) {
                            $rootScope.User.Reset();
                        }

                        $rootScope.checkSession(true);
                    }
                );
            }
        });

        $state.go('app.login');
    });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

    // Turn off caching for demo simplicity's sake
    $ionicConfigProvider.views.maxCache(0);

    /*
    // Turn off back button text
    $ionicConfigProvider.backButton.previousTitleText(false);
    */

    $stateProvider.state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
    })

    .state('app.list', {
        url: '/list/:id/:ime',
        views: {
            'menuContent': {
                templateUrl: 'templates/list.html',
                controller: 'ListCtrl'
            },
            'fabContent': {
                templateUrl: 'templates/listFabButtonAdd.html',
                controller: 'ListCtrlFabButton'
            }
        }
    })

    .state('app.login', {
        url: '/login',
        views: {
            'menuContent': {
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl'
            },
            'fabContent': {
                template: ''
            }
        }
    })

    .state('app.profile', {
        url: '/profile',
        views: {
            'menuContent': {
                templateUrl: 'templates/profile.html',
                controller: 'ProfileCtrl'
            },
            'fabContent': {
                templateUrl: 'templates/profileFabButtonAdd.html',
                controller: 'ProfileCtrlFabButton'
            }
        }
    })
    ;

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/login');
})
.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    for(var itemKey in items) {
        if(items.hasOwnProperty(itemKey) && items[itemKey] && items[itemKey].hasOwnProperty(field)) {
            filtered.push(items[itemKey]);
        }
    }
    if(filtered.length > 0) {
        filtered.sort(function (a, b) {
            return (a[field] > b[field] ? 1 : -1);
        });
        if(reverse) filtered.reverse();
    }
    return filtered;
  };
})
;