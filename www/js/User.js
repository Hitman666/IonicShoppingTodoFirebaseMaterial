angular.module('user', [])

.factory('User', function(Users, Groups, $rootScope) {
    var User = function() {
        var that = {};

        that._init = function(){
            that._authData = null;
            that._metaData = null;
        };

        that._init();

        that.SetUserAuthData = function(authData, callbackFinish){
            that._authData = authData;
            that._insertUserDataIfUserDontExists(authData, callbackFinish);
            that._getMetadata();
        };

        that.Reset = function(){
            that._init();
        };

        that.GetAuthData = function() {
            return that._authData;
        };

        that.GetDisplayName = function() {
            return that._getNameFromAuthData(that._authData);
        };

        that.GetProfileImageURL = function() {
            return that._authData[that._authData.provider].profileImageURL;
        };

        that.GetEmail = function() {
            return that._authData[that._authData.provider].email;
        };

        that.GetMetadata = function() {
            return that._metaData;
        }

        that._getMetadata = function() {
            if(that._authData) {
                Users.UserMetadata(that._authData.uid).once('value', function (metaDataSnapshot) {
                    that._metaData = metaDataSnapshot.val();
                }, function (err) {
                    $rootScope.clog(err);
                });
            } else {
                return {profileImageURL: ''};
            }
        }

        that._insertUserDataIfUserDontExists = function(authData, callbackFinish) {
            var outStatus = {ok: false, msg: 'Unknown error.'};

            Users.User(authData.uid)
            .transaction(
                function(currentData) {
                    //write initial data only if data dont exists
                    if (currentData === null && authData && authData.hasOwnProperty("provider") && authData[authData.provider].hasOwnProperty("email") && authData[authData.provider].email) {
                        return {
                            id: authData.uid,
                            provider: authData.provider,
                            groups: {} 
                        };
                    } else {
                        return; // Abort the transaction if user data exists.
                    }
                }, 
                function(error, committed, snapshot) {
                    if (error) {
                        outStatus.msg = 'Transaction failed abnormally! [' + error + ']';
                        callbackFinish && callbackFinish(outStatus);
                    } else if (!committed) {
                        if(!authData || !authData.hasOwnProperty("provider") || !authData[authData.provider].hasOwnProperty("email")) {
                            outStatus.msg = 'Wrong user data!';
                            callbackFinish && callbackFinish(outStatus);
                        } else {
                            outStatus.ok = true;
                            outStatus.msg = '';
                            that._checkInvites(authData.uid, authData[authData.provider].email)
                            .then(function() {
                                that._cleanUserGroupMembership(authData.uid);
                                callbackFinish && callbackFinish(outStatus);
                            },
                            function(error) {
                                // Something went wrong.
                                console.error(error);
                                callbackFinish && callbackFinish(outStatus);
                            });
                        }
                    } else {

                        Users.UserByEmail(Users.EmailToKey(authData[authData.provider].email)).update({
                            user_id: authData.uid
                        }, function(error) {
                            if (error) {
                                outStatus.msg = 'Error:' + error;
                                callbackFinish && callbackFinish(outStatus);
                            } else {
                                 Users.UserMetadata(authData.uid).set({
                                    id: authData.uid,
                                    email: authData[authData.provider].email,
                                    name: that._getNameFromAuthData(authData),
                                    profileImageURL: authData[authData.provider].profileImageURL || '',
                                    created: Firebase.ServerValue.TIMESTAMP,
                                    updated: Firebase.ServerValue.TIMESTAMP     
                                }, function(error) {
                                    if (error) {
                                        outStatus.msg = 'Error:' + error;
                                    } else {
                                        that._getMetadata();
                                        outStatus.ok = true;
                                        outStatus.msg = '';
                                    }
                                    that._checkInvites(authData.uid, authData[authData.provider].email)
                                    .then(function() {
                                        that._cleanUserGroupMembership(authData.uid);
                                        callbackFinish && callbackFinish(outStatus);
                                    },
                                    function(error) {
                                        // Something went wrong.
                                        console.error(error);
                                        callbackFinish && callbackFinish(outStatus);
                                    });
                                });
                            }
                        });

                    }
                }
            );
        };

        that._checkInvites = function(userId, userEmail) {
            return Users.UserByEmail(Users.EmailToKey(userEmail))
                .once("value")
                .then(function(dataSnapshot) {
                    if(dataSnapshot && dataSnapshot.val().hasOwnProperty("invites")) {
                        return dataSnapshot;
                    } else {
                        return null;
                    }
                })
                .then(function(invitesSnapshot) {
                    if(invitesSnapshot) {
                        for(var groupId in invitesSnapshot.val().invites) {
                            Groups.Group(groupId)
                                .once("value")
                                .then(function(dataSnapshot) {
                                    var snapVal = dataSnapshot.val();
                                    if(snapVal) {
                                        if(snapVal.hasOwnProperty("members") && snapVal.members.hasOwnProperty(invitesSnapshot.val().user_id)) {
                                            $rootScope.clog("User existed in group!");
                                        } else {
                                            Groups.GroupAddMember(invitesSnapshot.val().user_id, groupId);
                                        }
                                        invitesSnapshot.ref().child("invites").child(groupId).remove();

                                        return;
                                    }
                                });
                        }
                    }
                });
        };

        that._cleanUserGroupMembership = function(userId) {
            console.log(userId);
            if(!userId) return;

            var userGroupsRef = Users.User(userId).child("groups");

            userGroupsRef.once("value")
                .then(function(userGroupsSnapshot) {
                    var groupsMemberPromises = [];
                    if(userGroupsSnapshot && userGroupsSnapshot.val()) {
                        userGroupsSnapshot.forEach(function (userGroupSnapshot) {
                            groupsMemberPromises.push(
                                Groups.Group(userGroupSnapshot.key())
                                    .child("members")
                                    .child(userId)
                                    .once("value")
                            );
                        });
                        return groupsMemberPromises;
                    } else {
                        return null;
                    }
                })
                .then(function (groupsMemberPromises) {
                    if(groupsMemberPromises) {
                        return Promise.all(groupsMemberPromises);
                    } else {
                        return null;
                    }
                })
                .then(function (groupsMember) {
                    if(!groupsMember) return null;

                    groupsMember.forEach(function (groupUserSnapshot) {
                        if(groupUserSnapshot.val() === null || groupUserSnapshot.val() === false) {
                            var groupId = groupUserSnapshot.ref().path.u[1];
                            userGroupsRef.child(groupId).remove(function(err) {
                                if(err) {
                                    console.error("_cleanUserGroupMembership", err);
                                } else {
                                    console.log("Group " + groupId + " removed from users groups.");
                                }
                            });
                        }
                    });
                },
                function(err) {
                    if(err) {
                        console.error("_cleanUserGroupMembership", err);
                    }
                })
        };

        that._getNameFromAuthData = function(authData) {
            if(authData) {
                switch(authData.provider) {
                    case 'password':
                        return authData.password.email.replace(/@.*/, '');
                    default:
                        return authData[authData.provider].displayName;
                }
            } else {
                throw new Error("_getNameFromAuthData(): Argument authData is not set!");
            }
        };

        return that;
    };

    return {
        get: function() {
            return User();
        }
    };
});