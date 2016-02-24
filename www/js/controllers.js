'use strict';

angular.module('ShoppingToDo.controllers', [])

.controller('AppCtrl', function($scope, $rootScope, $ionicModal, $ionicPopover, $timeout, User, Auth) {
    // Form data for the login modal
    $scope.isExpanded = false;
    $scope.hasHeaderFabLeft = false;
    $scope.hasHeaderFabRight = false;

    var navIcons = document.getElementsByClassName('ion-navicon');
    for (var i = 0; i < navIcons.length; i++) {
        navIcons.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    }

    ////////////////////////////////////////
    // Layout Methods
    ////////////////////////////////////////

    $scope.hideNavBar = function() {
        document.getElementsByTagName('ion-nav-bar')[0].style.display = 'none';
    };

    $scope.showNavBar = function() {
        document.getElementsByTagName('ion-nav-bar')[0].style.display = 'block';
    };

    $scope.noHeader = function() {
        var content = document.getElementsByTagName('ion-content');
        for (var i = 0; i < content.length; i++) {
            if (content[i].classList.contains('has-header')) {
                content[i].classList.toggle('has-header');
            }
        }
    };

    $scope.setExpanded = function(bool) {
        $scope.isExpanded = bool;
    };

    $scope.setHeaderFab = function(location) {
        var hasHeaderFabLeft = false;
        var hasHeaderFabRight = false;

        switch (location) {
            case 'left':
                hasHeaderFabLeft = true;
                break;
            case 'right':
                hasHeaderFabRight = true;
                break;
        }

        $scope.hasHeaderFabLeft = hasHeaderFabLeft;
        $scope.hasHeaderFabRight = hasHeaderFabRight;
    };

    $scope.hasHeader = function() {
        var content = document.getElementsByTagName('ion-content');
        for (var i = 0; i < content.length; i++) {
            if (!content[i].classList.contains('has-header')) {
                content[i].classList.toggle('has-header');
            }
        }

    };

    $scope.hideHeader = function() {
        $scope.hideNavBar();
        $scope.noHeader();
    };

    $scope.showHeader = function() {
        $scope.showNavBar();
        $scope.hasHeader();
    };

    $scope.clearFabs = function() {
        var fabs = document.getElementsByClassName('button-fab');
        if (fabs.length && fabs.length > 1) {
            fabs[0].remove();
        }
    };

    $scope.logout = function(){
        Auth.logout();
    }
})

.controller('LoginCtrl', function($scope, $rootScope, $timeout, $stateParams, Auth, ionicMaterialInk, $ionicLoading, $ionicPopup) {
    $scope.user = {
        email: "",
        password: ""
    };

    $scope.$parent.clearFabs();
    $timeout(function() {
        $scope.$parent.hideHeader();
    }, 0);
    ionicMaterialInk.displayEffect();

    $scope.validateUser = function() {
        $rootScope.showLoading('Logging you in...');
        
        Auth.loginWithEmail(this.user.email, this.user.password)
        .then(function(user) {
                //do nothing and wait for onAuth

            }, function(error) {
                var errMsg = '';

                if (error.code == 'INVALID_EMAIL' || error.code == 'INVALID_PASSWORD') {
                    errMsg = 'Invalid Email/Password combination';
                }
                else if (error.code == 'INVALID_USER') {
                    errMsg = 'Invalid User';
                }
                else {
                    errMsg = 'Oops something went wrong. Please try again later';
                }

                $rootScope.hideLoading();

                $rootScope.alert('<b><i class="icon ion-person"></i> Login error</b>', errMsg);
            });
    }

    $scope.oauthLogin = function(provider) {
        if(provider=='facebook') {
            Auth.loginWithFacebook()
                .then(function(authData) {
                    $rootScope.clog('oauthLogin');
                })
                .catch(function(error) {
                    $rootScope.clog('Oops something went wrong. Please try again later');
                    console.dir(error);
                });
        }
        else if (provider=='google') {
            Auth.loginWithGoogle()
                .then(function(authData) {
                    $rootScope.clog('oauthLogin');
                })
                .catch(function(error) {
                    $rootScope.clog('Oops something went wrong. Please try again later');
                    $rootScope.clog(error);
                });
        }
        else if (provider=='twitter') {
            Auth.loginWithTwitter()
                .then(function(authData) {
                    $rootScope.clog('oauthLogin');
                })
                .catch(function(error) {
                    $rootScope.clog('Oops something went wrong. Please try again later');
                    $rootScope.clog(error);
                });
        }
        else {
            $rootScope.hideLoading();
        }
    };

    $scope.testAppWithoutLogin = function(){
        $scope.user = {
            email: "test@testings.com",
            password: "test"
        };

        $scope.validateUser();
    }
})

.controller('ListCtrl', function($scope, $rootScope, $stateParams, $timeout, $firebaseObject, Groups, Users, ionicMaterialInk, ionicMaterialMotion, $ionicPopup, $http) {
    $scope.ime = $stateParams.ime;
    
    $scope.groupId = $stateParams.id;
    Groups.setCurrentGroupId($scope.groupId);

    $scope.items ={};
    $scope.total = 0;

    // Set Header
    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();
    $scope.$parent.setHeaderFab('right');

    // Delay expansion
    /*$timeout(function() {
        $scope.isExpanded = true;
        $scope.$parent.setExpanded(true);
    }, 300);*/

    $timeout(function () {
        $scope.showFabButton = true;
    }, 900);

    // Set Motion
    /*$timeout(function() {
        ionicMaterialMotion.fadeSlideInRight({
            startVelocity: 3000
        });
    }, 700);*/

    $rootScope.showLoading("Loading data...");

    // Set Ink
    ionicMaterialInk.displayEffect();

    var syncGroupItems = $firebaseObject(Groups.GroupItems($scope.groupId));
    syncGroupItems.$bindTo($scope, "items");

    syncGroupItems.$loaded(
        function(data) {
            $scope.calcTotals();
            $rootScope.hideLoading();
        },
        function(error) {
            console.error("Error:", error);
            $rootScope.hideLoading();
        }
    );

    syncGroupItems.$watch(function(snap, snap2) {
        $scope.calcTotals();
    });

    $scope.Remove = function(item){
        Groups.GroupItem($scope.groupId, item).remove(function(err) {
            if(err) {
                console.error(err);
            }
        });
    };

    $scope.CheckOrUncheck = function(item){
        Groups.GroupItem($scope.groupId, item)
            .transaction(
                function(currentData) {
                    if (currentData !== null) {
                        currentData.isCompleted = !currentData.isCompleted;
                        currentData.updated = Firebase.ServerValue.TIMESTAMP;
                        return currentData;
                    } else {
                        return; // Abort the transaction.
                    }
                }, 
                function(error, committed, snapshot) {
                    if (error) {
                        $rootScope.clog('Transaction failed abnormally!', error);
                    } else if (!committed) {
                        $rootScope.clog('No data.');
                    } else {
                        $rootScope.clog('Updated!');
                    }
                    if(snapshot) {
                        $rootScope.clog("New data: ", snapshot.val());
                    }
                }
            );
    };

    $scope.calcTotals = function(){
        var total = {
            ToBuy: 0,
            Bought: 0
        }
        for (var itemKey in $scope.items){
            if($scope.items.hasOwnProperty(itemKey) && $scope.items[itemKey] && $scope.items[itemKey].hasOwnProperty('price')) {
                var item = $scope.items[itemKey];
                if(item.isCompleted) {
                    total.Bought += item.price * item.quantity; 
                } else {
                    total.ToBuy += item.price * item.quantity; 
                }
                
            }
        }

        $scope.total = total;
    };

    $scope.addUserToGroup = function() {
        $rootScope.clog("Adding user to group screen");

        $scope.newUser = {};

        var myPopup = $ionicPopup.show({
            template: '<input class="item myNumberInput" type="text" ng-model="newUser.email" placeholder="Friend email" style="background: white;"/>',
            title: '<b>Add a new user to this list</b>',
            subTitle: 'Share you list with someone',
            scope: $scope,
            buttons: [
                { 
                    text: '<i class="icon ion-close"></i>',
                    type: 'button',
                    onTap: function(e) {
                        return null;
                    }
                },
                {
                    text: '<i class="icon ion-checkmark"></i>',
                    type: 'button-positive',
                    onTap: function(e) {
                        if (! $scope.newUser.email) {
                            //don't allow the user to close unless he enters price and 
                            e.preventDefault();
                        }
                        else {
                            return $scope.newUser;
                        }
                    }
                }
            ]
        });

        myPopup.then(function(newUser){
            if (!newUser){
                return;
            }
            newUser.email = newUser.email.trim().toLowerCase();

            if(!$rootScope.User || !$rootScope.User.GetAuthData() || newUser.email == $rootScope.User.GetEmail().trim().toLowerCase()) {
                return;  
            }

            Users.InviteUserToGroupByEmail(newUser.email, Groups.getCurrentGroupId(), $rootScope.User.GetAuthData().uid).then( function(transactionStatus) {
                if (transactionStatus.error) {
                    $rootScope.alert("User invitation", "Error during invite! [" + error + "]");
                }
                else if (!transactionStatus.committed) {
                    $rootScope.alert("User invitation", "This user is already added to your project!");
                }
                else {
                    
                    var link = 'http://shopping-todo.com/_api/sender.php?emailKey='+ Users.EmailToKey(newUser.email) +'&groupId=' + Groups.getCurrentGroupId();
                    $http.get(link).then(function(data){
                        if (data){
                            $rootScope.alert("User invitation", "User was successfully invited and will receive an email confirmation.");  
                        }
                    });
                }
            });
        });
    };

})

.controller('ListCtrlFabButton', function($scope, $rootScope, $stateParams, $timeout, ionicMaterialInk, ionicMaterialMotion, $ionicPopup, Groups) {
    $timeout(function () {
        $scope.showFabButton = true;
    }, 900);

   
    $scope.add = function(){
        $scope.newItem = {};

        $scope.newItem.price = 1;
        $scope.newItem.quantity = 1;

        var myPopup = $ionicPopup.show({
            templateUrl: 'templates/listAdd.html',
            title: '<b>Add a new item to buy</b>',
            subTitle: 'Never forget to buy anything, and never be surprised at the checkout',
            scope: $scope,
            buttons: [
                { 
                    text: '<i class="icon ion-close"></i>',
                    type: 'button',
                    onTap: function(e) {
                        return null;
                    }
                },
                {
                    text: '<i class="icon ion-checkmark"></i>',
                    type: 'button-positive',
                    onTap: function(e) {
                        if (! $scope.newItem.name) {
                            //don't allow the user to close unless he enters price and 
                            e.preventDefault();
                        }
                        else {
                            return $scope.newItem;
                        }
                    }
                }
            ]
        });

        myPopup.then(function(newItem){
            if(!newItem || !newItem.name || !newItem.price || !newItem.quantity) {
                return;  
            }

            Groups.GroupItemAdd($rootScope.User.GetAuthData().uid, Groups.getCurrentGroupId(), newItem.name, newItem.price, newItem.quantity);
        });
    };
})

.controller('ProfileCtrl', function($scope, $rootScope, $stateParams, $timeout, Groups, Users, ionicMaterialMotion, ionicMaterialInk, $ionicPopup) {
    $scope.groups = [];

    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();
    $scope.isExpanded = false;
    $scope.$parent.setExpanded(false);
    $scope.$parent.setHeaderFab(false);

    $scope.MetaData = $rootScope.User.GetMetadata();
    $scope.userForRemoveFromGroup = null;

    //http://stackoverflow.com/questions/18484919/adding-background-image-with-ng-style-in-angularjs
    $scope.profileImage = {
        'background-image': 'url('+ $scope.MetaData.profileImageURL +')'
    };

    // Set Motion
    $timeout(function() {
        ionicMaterialMotion.slideUp({
            selector: '.slide-up'
        });
    }, 300);

    /*$timeout(function() {
        ionicMaterialMotion.fadeSlideInRight({
            startVelocity: 3000
        });
    }, 700);*/

    // Set Ink
    ionicMaterialInk.displayEffect();    

    // Set Header
    $scope.init = function(){
        $rootScope.showLoading("Loading data...");
        Groups.byUser($rootScope.User.GetAuthData().uid, false)
            .then(function(groupData) {
                $scope.groups = groupData;
                $scope.$apply();
                $rootScope.hideLoading();
            }, function(error) {
                // Something went wrong.
                console.error(error);
                $rootScope.hideLoading();
            });
    };


    $scope.Remove = function(groupId) {
        Groups.GroupRemove($rootScope.User.GetAuthData().uid, groupId);
        $scope.init();
    }

    $scope.RemoveUserFromGroup = function(userData, groupData) {
        $scope.userForRemoveFromGroup = {
                                            userData: userData, 
                                            groupData: groupData
                                        };

        var myPopup = $ionicPopup.show({
            template: 'Are you sure?<br><br>Group:<b>{{userForRemoveFromGroup.groupData.name}}</b><br>User:<b>{{userForRemoveFromGroup.userData.name}}</b>',
            title: '<b>Remove user from group</b>',
            subTitle: '',
            scope: $scope,
            buttons: [
                { 
                    text: '<i class="icon ion-close"></i>',
                    type: 'button',
                    onTap: function(e) {
                        return null;
                    }
                },
                {
                    text: '<i class="icon ion-checkmark"></i>',
                    type: 'button-positive',
                    onTap: function(e) {
                        return $scope.userForRemoveFromGroup;
                    }
                }
            ]
        });


        myPopup.then(function(userForRemoveFromGroup){
            if(!userForRemoveFromGroup || !userForRemoveFromGroup.userData || !userForRemoveFromGroup.groupData) return;

            Groups.GroupRemoveMember(userForRemoveFromGroup.userData.id, userForRemoveFromGroup.groupData.id)
            .then(function(err) {
                $scope.userForRemoveFromGroup = null;
                if (err) {
                    console.error('GroupRemoveMember', err);
                } else {
                    console.log('GroupRemoveMember succeeded');
                    $scope.init();
                }
            });
        });
    }

    $scope.Edit = function(groupId, groupName) {
        $scope.editGroup = {id: groupId, name: groupName};

        var myPopup = $ionicPopup.show({
            template: '<input class="item myNumberInput" type="text" ng-model="editGroup.name" placeholder="Group name" style="background: white;"/>',
            title: '<b>Add a new project</b>',
            subTitle: 'Name your group',
            scope: $scope,
            buttons: [
                { 
                    text: '<i class="icon ion-close"></i>',
                    type: 'button',
                    onTap: function(e) {
                        return null;
                    }
                },
                {
                    text: '<i class="icon ion-checkmark"></i>',
                    type: 'button-positive',
                    onTap: function(e) {
                        if (! $scope.editGroup.name || ! $scope.editGroup.id) {
                            e.preventDefault();
                        }
                        else {
                            return $scope.editGroup;
                        }
                    }
                }
            ]
        });

        myPopup.then(function(editGroup){
            if(!editGroup || !editGroup.id) return;

            Groups.Group(editGroup.id) 
            .transaction(
                function(currentData) {
                    if (currentData !== null) {
                        currentData.name = editGroup.name;
                        currentData.updated = Firebase.ServerValue.TIMESTAMP;
                        return currentData;
                    } else {
                        return currentData;
                    }
                }, 
                function(error, committed, snapshot) {
                    if (error) {
                        $rootScope.clog('Transaction failed abnormally!', error);
                    } else if (!committed) {
                        $rootScope.clog('No data.');
                    } else {
                        $rootScope.clog('Updated!');
                        $scope.init();
                    }
                }
            );
        });
    }

    $scope.init();

    $scope.$on("refreshGroups", function () {
        $scope.init();    
    });
})

.controller('ProfileCtrlFabButton', function($scope, $stateParams, $timeout, ionicMaterialInk, ionicMaterialMotion, $ionicPopup, Groups, $rootScope) {
    // Set Header
    $scope.$parent.showHeader();
    $scope.$parent.clearFabs();
    //$scope.$parent.setHeaderFab('left');

    $timeout(function () {
        $scope.showFabButton = true;
    }, 900);

    $scope.add = function() {
        $scope.newGroup = {};

        var myPopup = $ionicPopup.show({
            template: '<input class="item myNumberInput" type="text" ng-model="newGroup.name" placeholder="Project name" style="background: white;"/>',
            title: '<b>Add a new project</b>',
            subTitle: 'Name your project',
            scope: $scope,
            buttons: [
                { 
                    text: '<i class="icon ion-close"></i>',
                    type: 'button',
                    onTap: function(e) {
                        return null;
                    }
                },
                {
                    text: '<i class="icon ion-checkmark"></i>',
                    type: 'button-positive',
                    onTap: function(e) {
                        if (! $scope.newGroup.name) {
                            //don't allow the user to close unless he enters price and 
                            e.preventDefault();
                        }
                        else {
                            return $scope.newGroup;
                        }
                    }
                }
            ]
        });

        myPopup.then(function(newGroup){
            if(!newGroup || !newGroup.name) return;

            Groups.GroupAdd($rootScope.User.GetAuthData().uid, newGroup.name);

            $rootScope.$broadcast("refreshGroups");
        });
    }
})
;