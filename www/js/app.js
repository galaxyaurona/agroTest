// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic','ngMap'])

.run(function($ionicPlatform) {
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

.controller('MapController', function($scope, $ionicLoading) {
    var posOptions = {timeout: 10000, enableHighAccuracy: true};
    var myLatlng = new google.maps.LatLng(37.3000, -120.4833),
        mapOptions = {
            center: myLatlng,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        },
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    $scope.data = {"success":true,"ErrCode":0,"lat":0,"lng":0,timeStamp:new Date()};

   $scope.getLocation = function()
   {
      navigator.geolocation.getCurrentPosition(updateLocationData,errorOccured,posOptions);
      console.log($scope.data);
      return $scope;
   }
   // initialize the map
   google.maps.event.addDomListener(window, 'load', function() {
        
        $scope.getLocation().$apply();
    
        $scope.map = map;
    });

   // this call backfunction is used to update data object 
   var updateLocationData= function(pos){
      $scope.data.success= true;
      $scope.data.ErrCode = 0;
      $scope.data.lat = pos.coords.latitude;
      $scope.data.lng = pos.coords.longitude;
      $scope.data.timeStamp = new Date();
      map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
      // marker here
      var myLocation = new google.maps.Marker({
          position: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude),
          map: map,
          title: "My Location"
      });
   }


   // this callback is used to handle error when pull notifaction
   var errorOccured= function(err){
      $scope.data.success= false;
      $scope.data.ErrCode= err.code;
      $scope.data.lat = "0";
      $scope.data.lng = "0";
      $scope.data.timeStamp = new Date();
      $scope.data.error
   }

});