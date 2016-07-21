#IonicShoppingTodoMaterial

Project accompanying the [tutorial written for Pluralsight](http://tutorials.pluralsight.com/front-end-javascript/how-to-build-a-shopping-app-with-ionic-firebase) on how to make your own Ionic Shopping TODO application with Firebase and Material design.

This project is based on the awesome Ionic Material template: https://github.com/zachsoft/Ionic-Material.

## Steps to get it working on your computer

+ clone this project
+ cd into the new folder
+ run ionic serve
+ you should see the login screen in your browser

In case you want to run it on your phone, you need to make sure the below listed plugins are installed (after adding the platform with `ionic platform add ios` or `ionic platform add android`). You can list the installed plugins by executing `ionic plugin list` in your project root directory (where your **ionic.project** file resides).

+ cordova-plugin-admobpro 2.11.1 "AdMob Plugin Pro"
+ cordova-plugin-extension 1.2.9 "Cordova Plugin Extension"
+ cordova-plugin-inappbrowser 1.2.1 "InAppBrowser"
+ cordova-plugin-splashscreen 3.2.0 "Splashscreen"
+ cordova-plugin-statusbar 2.1.1 "StatusBar"
+ cordova-plugin-whitelist 1.2.1 "Whitelist"
+ ionic-plugin-keyboard 1.0.8 "Keyboard"

To install the missing plugins, here's a copy/paste installation shortcut (execute this in your Command prompt/Terminal once in the root of your project):

+ cordova plugin add cordova-plugin-admobpro
+ cordova plugin add cordova-plugin-extension
+ cordova plugin add cordova-plugin-inappbrowser
+ cordova plugin add cordova-plugin-splashscreen
+ cordova plugin add cordova-plugin-statusbar
+ cordova plugin add cordova-plugin-whitelist
+ cordova plugin add ionic-plugin-keyboard