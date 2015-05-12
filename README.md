#AgroTraq Location test

##Requirement:
- Ionic Framework
- Cordova
- Android SDK
- NPM (optional)

##Instruction
+ To compile and install on your native android device, first install ionic, cordova using `npm install -g cordova ionic`, then run `ionic platform add android` and `ionic run android`
+ Alternatively, if you want to extract the .apk and install it on your device, go to `argoTraq_test\platforms\android\ant-build` and extract the `MainActivity-debug.apk` , copy it to your device and install. Remember to activate developer mode and install from unknown source since this is an unsigned package

