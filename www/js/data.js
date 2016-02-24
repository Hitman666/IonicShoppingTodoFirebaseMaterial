'use strict';

angular.module('ShoppingToDo.data', [])

.factory('Users', ['FDBRoot', function(FDBRoot) {
	var usersRef = FDBRoot.child("users");
	var usersMetadataRef = FDBRoot.child("users-metadata");
	var usersByEmailRef = FDBRoot.child("users-byemail");

	var retObj = {};

	retObj.All = function() {
		return $firebaseArray(usersRef);
	};
	retObj.User = function(userId) {
		return usersRef.child(userId);
	};
	retObj.UserMetadata = function(userId) {
		return usersMetadataRef.child(userId);
	};
	retObj.UserByEmail = function(emailKey) {
		return usersByEmailRef.child(emailKey);
	};
	retObj.InviteUserToGroupByEmail = function(emailAddress, groupId, userId) {
		if (!emailAddress || !groupId || !userId) return;

		return usersByEmailRef.child(retObj.EmailToKey(emailAddress))
			.child("invites")
			.child(groupId)
			.transaction(
                function(currentData) {
                	if (currentData === null) {
                		return {
							fromUserId: userId,
							groupId: groupId,
							created: Firebase.ServerValue.TIMESTAMP
						};
                	} else {
                		return;
                	}
                }
            );
	};
	retObj.EmailToKey = function(emailAddress) {
        if(emailAddress) {
            return btoa(emailAddress);
        } else {
            throw new Error("_emailToKey(): Argument emailAdrress is not set!");
        }
    };

	return retObj;
}])

.factory('Groups', ['FDBRoot', 'Users', function(FDBRoot, Users) {
	var groupsRef = FDBRoot.child("groups");
	var groupItemsRef = FDBRoot.child("group-items");
	var usersMetadata = FDBRoot.child("users-metadata");
	var currentGroupId = null;

	var retObj = {};

	retObj.byUser = function(userId, archivedGroups) {
		return Users.User(userId).child("groups").once("value")
		.then(function(userGroupsSnapshot) {
			var groupPromises = [];

			userGroupsSnapshot.forEach(function (userGroupSnapshot) {
				var groupData = {};
				groupPromises.push(
					retObj.Group(userGroupSnapshot.key()).once("value")
					.then(function (groupSnap) {
						groupData = groupSnap.val();
						if(groupData && groupData.isArchived == archivedGroups) {
							return retObj.GroupItems(groupSnap.key()).once("value");
						} else {
							groupData = null;
							return null;
						}
					})
					.then(function (groupItems) {
						if(!groupItems) return null;

						groupData.subItems = [];
						groupItems.forEach(function(childItemSnapshot) {
							var childData = childItemSnapshot.val();
							childData['id'] = childItemSnapshot.key();
							groupData.subItems.push(childData);
						});

						var memberListPromises = [];

						for(var member in groupData.members) {
							if(member !== userId && groupData.members.hasOwnProperty(member)) { //get user data for all users except ME
								memberListPromises.push(
									usersMetadata.child(member).once("value")
									.then(function (memberMetadata) {
										return memberMetadata.val();
									})
								);
							}
						}

						return Promise.all(memberListPromises);
					})
					.then(function (memberList) {
						if(!memberList) return null;

						groupData.memberList = memberList;
						return groupData;
					})
				);
			});

			return groupPromises;
		})
		.then(function(groupDataPromises) {
			return Promise.all(groupDataPromises);
		});
	};

	retObj.Group = function(groupId) {
		return groupsRef.child(groupId);
	};

	retObj.GroupAdd = function(userId, groupName) {
		if (!userId || !groupName) return;

		var addedGroup = groupsRef.push();

		if(!addedGroup) return;

		var form = {
            id: addedGroup.key(),
            owner: userId,
            name: groupName,
            isArchived: false,
            created: Firebase.ServerValue.TIMESTAMP,
            updated: Firebase.ServerValue.TIMESTAMP,
            members: {}
        };
        form.members[userId] = true;

        //set group value
        addedGroup.set(form, function(err) {
        	if(err) {
        		console.error(err);
        	} else {
				//add group to user
    			Users.User(userId).child("groups").child(addedGroup.key()).set(true);
        	}
        });
	};

	retObj.GroupAddMember = function(userId, groupId) {
		if (!userId || !groupId) return;

		Users.User(userId)
			.child("groups")
			.child(groupId)
			.set(true, function(err) {
				if (err) {
					console.error('GroupAddMember', err);
				} else {
					retObj.Group(groupId)
						.child("members")
						.child(userId)
						.set(true, function(err) {
							if (err) {
								console.error('GroupAddMember', err);
							} else {
								console.log('GroupAddMember succeeded');
							}
						});
				}
			});
	};

	retObj.GroupRemoveMember = function(userId, groupId) {
		if (!userId || !groupId) return;

		return retObj.Group(groupId)
			.child("members")
			.child(userId)
			.remove();
	};

	retObj.GroupRemove = function(userId, groupId) {
		if (!userId || !groupId) return;

		retObj.GroupItems(groupId)
		.remove(function(err) {
            if (err) {
                console.error(err);
            } else {
                retObj.Group(groupId).remove(function(err) {
                    if (err) {
                        console.error(err);
                    } else {
                        Users.User(userId).child("groups").child(groupId).remove(function(err) {
                            if (err) {
                                console.error(err);
                            }
                        });
                    }
                });
            }
        });
	};

	retObj.GroupItems = function(groupId) {
		return groupItemsRef.child(groupId);
	};

	retObj.GroupItem = function(groupId, itemId) {
		return retObj.GroupItems(groupId).child(itemId);
	};

	retObj.GroupItemAdd = function(userId, groupId, itemName, itemPrice, itemQuantity) {
		if (!userId || !groupId || !itemName || !itemPrice || !itemQuantity) return;

		var addedItem = retObj.GroupItems(groupId).push();

		if(!addedItem) return;

		var form = {
			id: addedItem.key(),
            groupId: groupId,
            createdByUserId: userId,
            name: itemName,
            price: parseFloat(itemPrice),
            quantity: parseFloat(itemQuantity),
            isCompleted: false,
            created: Firebase.ServerValue.TIMESTAMP,
            updated: Firebase.ServerValue.TIMESTAMP,
        };

		addedItem.set(form, function(err) {
				if(err) {
					console.error(err);
					return false;
				} else {
					return true;
				}
			}
		);
	};

	retObj.GroupItemRemove = function(groupId, itemId) {
		if (!groupId || !itemId) return;

		retObj.GroupItems(groupId).remove(itemId, 
			function(err) {
				if(err) {
					console.error(err);
					return false;
				} else {
					return true;
				}
			}
		);
	};

	retObj.setCurrentGroupId = function(groupId){
		currentGroupId = groupId;
	};
	
	retObj.getCurrentGroupId = function(){
		return currentGroupId;
	};

	return retObj;
}])
;