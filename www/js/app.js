// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic','ngCordova'])

.run(function($ionicPlatform,$rootScope) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.controller('MapController', function($scope, $ionicLoading,$cordovaDevice) {

    var posOptions = {timeout: 2000, enableHighAccuracy: true}; // map option, set time out 100 msand high accuracy

    var myLatlng = new google.maps.LatLng(37.3000, -120.4833), // random initial location
        mapOptions = {
            center: myLatlng,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        },

    map = new google.maps.Map(document.getElementById("map"), mapOptions); // initialize the map
    $scope.data = {"success":true,"ErrCode":0,"lat":0,"lng":0,timeStamp:new Date()}; // initialize data object to send
    var myLocation = new  google.maps.Marker()
   $scope.toggleTracking = function()
   {
      /*navigator.geolocation.getCurrentPosition(updateLocationData,errorOccured,posOptions);
      console.log($scope.data);*/
      if ($scope.watchID) {
        navigator.geolocation.clearWatch($scope.watchID); // unwatch the 
        $scope.watchID=null;

        $scope.data={"success":false,"ErrCode":3,"lat":0,"lng":0,"timeStamp":new Date()};

        myLocation.setMap(null); // remove marker from map
      }else{
        $scope.watchID = navigator.geolocation.watchPosition(updateLocationData, errorOccured, posOptions);
      }

      return $scope;
   }
   // initialize the map
   google.maps.event.addDomListener(window, 'load', function() {
        
        $scope.watchID = navigator.geolocation.watchPosition(updateLocationData, errorOccured, posOptions);
    
        $scope.map = map;
    });

   // this call backfunction is used to update data object 
   var updateLocationData= function(pos){
      // update the data json info
      $scope.data.success= true;
      $scope.data.ErrCode = 0;
      $scope.data.lat = pos.coords.latitude;
      $scope.data.lng = pos.coords.longitude;
      $scope.data.timeStamp = new Date();
      // update display map
      map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
      // update marker
      myLocation.setMap(null); // unset the old one
      myLocation = new google.maps.Marker({ 
          position: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude),
          map: map,
          title: "Current Location"
      });
      $scope.$apply()
      // testing this
      //$scope.S3.upload($scope.data);
      var bucketParams = {
        Bucket:"argotraqloctest",
        Key:$scope.deviceId+"/"+$scope.data.timeStamp.valueOf(),
        ACL:'bucket-owner-full-control',
        Body:JSON.stringify($scope.data)
      }
      S3.putObject(bucketParams,function(err,data){
        if (err) {console.log(err, err.stack); $scope.uploaded=false;} // an error occurred
        else     {console.log(data);$scope.uploaded=true;}           // successful response
      });
   }


   // this callback is used to handle error when pull notifaction
   var errorOccured= function(err){
      $scope.data.success= false;
      $scope.data.ErrCode= err.code;
      $scope.data.lat = "0";
      $scope.data.lng = "0";
      $scope.data.timeStamp = new Date();
      $scope.$apply()
   }

   //------ AWS SERVICE HERE
   var params = {
       IdentityPoolId: 'us-east-1:712f1858-07f9-424a-8a6a-48e0c467da7e',
       IdentityId:"us-east-1:bac8ffda-07a0-4c8b-b96c-cb77aad22edb"
   };
   AWS.config.region = 'us-east-1';
   AWS.config.credentials = new AWS.CognitoIdentityCredentials(params);

   AWS.config.credentials.get(function(err) {
       if (!err) {
           console.log("Cognito Identity Id: " + AWS.config.credentials.identityId);
           $scope.cognigtoIdentity = AWS.config.credentials.identityId;
           $scope.awsCredentials = AWS.config.credentials;
       }
   });
   console.log($scope.awsCredentials);
   //console.log($cordovaDevice.getUUID());
   //$scope.deviceId = window.device.uuid;

  document.addEventListener("deviceready", function () {
     console.log($cordovaDevice);
     $scope.deviceId= $cordovaDevice.getUUID();
  }, false);

  S3 = new AWS.S3($scope.awsCredentials);
  console.log(S3);
});


