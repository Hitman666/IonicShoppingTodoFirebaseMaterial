/* global angular, document, window */
'use strict';

angular.module('auth', ['firebase'])

// create a custom Auth factory to handle $firebaseAuth
.factory('Auth', function($firebaseAuth, FDBRoot, $timeout){
  var auth = $firebaseAuth(FDBRoot);
  return {
    // helper method to login with multiple providers
    loginWithProvider: function loginWithProvider(provider, optionalSettings) {
        return auth.$authWithOAuthPopup(provider, optionalSettings || {});
    },
    // convenience method for logging in with Facebook
    loginWithFacebook: function login(optionalSettings) {
        return this.loginWithProvider("facebook", optionalSettings || {scope: 'email'});
    },
    loginWithGoogle: function login(optionalSettings) {
        return this.loginWithProvider("google", optionalSettings || {scope: 'email'});
    },
    loginWithTwitter: function login(optionalSettings) {
        return this.loginWithProvider("twitter", optionalSettings || {scope: 'include_email'});
    },
    // convenience method for logging in with Email
    loginWithEmail: function login(userEmail, userPassword) {
      return auth.$authWithPassword({
            email: userEmail,
            password: userPassword
        });
    },
    // wrapping the createUser function
    createUser: function createUser(userEmail, userPassword) {
      return auth.$createUser({
            email: userEmail,
            password: userPassword
        });
    },
    // wrapping the removeUser function
    removeUser: function removeUser(userEmail, userPassword) {
      return auth.$removeUser({
            email: userEmail,
            password: userPassword
        });
    },
    // wrapping the getAuth function
    getAuth: function getAuth() {
        return auth.$getAuth();
    },
    // wrapping the unauth function
    logout: function logout() {
        auth.$unauth();
    },
    // wrap the $onAuth function with $timeout so it processes
    // in the digest loop.
    onAuth: function onLoggedIn(callback) {
      auth.$onAuth(function(authData) {
        $timeout(function() {
            callback(authData);
        });
      });
    }
  };
})

;