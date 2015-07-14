var requestToken = "";
var idToken = "";
var clientId = "1062303130230-6qnv8dn2tlfib1jt1v003go8rder63qn.apps.googleusercontent.com";
var clientSecret = "0H1D0K4lJXmrFDerpEiHxcQg";
var googleResponse = {};
var identityPoolId = "us-east-1:409dad3a-5fd7-4449-b07d-c57bd1df768d";
var accountID = "940653267411";

// MAP PARAMETER HERE
var posOptions = {timeout: 5000, enableHighAccuracy: true}; 

var locationUpdateInterval = 5000; // in ms
var locationUploadInterval = 30000;
var syncInstance = locationUploadInterval/locationUpdateInterval;
    // initialized default location and map options


// map option, set time out sand high accuracy



// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic',"ngCordova"])

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

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'login.html',
            controller: 'LoginController'
        })
        .state('secure', {
            url: '/map',
            templateUrl: 'map.html',
            controller: 'MapController'
        });
    $urlRouterProvider.otherwise('/login');
})

.controller('LoginController', function($scope, $http, $location) {
 
    $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

    $scope.login = function() {
      // create an in app browser and listen to the call back
        var ref = window.open('https://accounts.google.com/o/oauth2/auth?client_id=' + clientId + '&redirect_uri=http://localhost/callback&scope=https://www.googleapis.com/auth/userinfo.email&approval_prompt=force&response_type=code&access_type=offline', '_blank', 'location=no');
        ref.addEventListener('loadstart', function(event) { 
            if((event.url).startsWith("http://localhost/callback")) {
                requestToken = (event.url).split("code=")[1];
                $http({method: "post", url: "https://www.googleapis.com/oauth2/v3/token", data: "client_id=" + clientId + "&client_secret=" + clientSecret + "&redirect_uri=http://localhost/callback" + "&grant_type=authorization_code" + "&code=" + requestToken })
                    .success(function(data) {
                        // assign token to global variable

                        idToken = data.id_token;
                        googleResponse = data;
                        // access 2nd route
                        $location.path("/map");
                    })
                    .error(function(data, status) {
                        alert("ERROR: " + data);
                    });
                ref.close();
            }
        });
    }
 
    if (typeof String.prototype.startsWith != 'function') {
        String.prototype.startsWith = function (str){
            return this.indexOf(str) == 0;
        };
    }
    
})

.controller('MapController', function($scope, $ionicLoading,$cordovaDevice,$ionicPlatform) {
    // initial device 
    $scope.gpsInstance = {'coords':{},};
    $scope.maxA = -32768;
    $scope.minA =  32768;
    $scope.maxAWithG = -32768;
    $scope.minAWithG =  32768;
    //start tracking 
    $scope.deviceId=null;    
    // get id token to display
    $scope.idToken = idToken;
    // initialize the map with map option global
    $scope.mapObject = new mapObject(); 
    // initalize cognitoObject with idToken
    $scope.cognitoObject = new cognitoObject(idToken);
    $scope.deviceMotion={a:'1'};
    // initialize data object to send
    $scope.data = {"lat":0,"lng":0,maxAcceleration:0,minAcceleration:0,maxAccelerationWithG:0,minAccelerationWithG:0,maxSpeed:0,minSpeed:0,timeStamp:new Date()}; 
    $scope.prettyData = JSON.stringify($scope.data,null,4);
    $scope.initialized = false;
    $scope.maxChangedDistance = 0;
    // initialize allowing upload
    $scope.debugInfo = true;
    $scope.uploading=true;
    $scope.uploaded = "Movement not detected";
    $scope.metaUploaded = "Movement not detected";
    // get google response for debugging purpose
    $scope.googleResponse = googleResponse;
    $scope.maxSpeed= -32768;
    $scope.minSpeed= 32768;
    $scope.metaInf = {deviceId:"",deviceModel:"",email:"",lastTracked:"",lastObject:{}}

    $scope.s3Object = new s3Object($scope.cognitoObject.awsCredentials);
    $scope.metaInf.email=$scope.cognitoObject.userEmail;
    $scope.updateCount =0;
    // END INITIALIZATION

    //console.log( $scope.s3Object)
  // calculate distance moved
    function getDistanceFromLatLon(lat1,lon1,lat2,lon2) {
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(lat2-lat1);  // deg2rad below
      var dLon = deg2rad(lon2-lon1); 
      var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      var d = R * c*1000; // Distance in m
      return d;
    }

    function deg2rad(deg) {
      return deg * (Math.PI/180)
    }
  //
  var uploadLocationData = function(){
    // reseting variable
    $scope.maxAWithG = -32768;
    $scope.minAWithG =  32768;
    $scope.maxA = -32768;
    $scope.minA =  32768;
    $scope.dataName = $scope.data.timeStamp.valueOf()+"-"+$scope.metaInf.deviceId;
    $scope.metaName = "meta-"+$scope.metaInf.deviceId
    //uploading
    if (($scope.uploading == true) && ($scope.maxChangedDistance>10)){
      $scope.uploaded = $scope.s3Object.upload($scope.cognitoObject.cognigtoIdentity+"/"+$scope.dataName,$scope.data);
      $scope.metaUploaded=$scope.s3Object.upload($scope.cognitoObject.cognigtoIdentity+"/"+$scope.metaName,$scope.metaInf);
      $scope.errorMessage = "None"
    }else{
      $scope.uploaded = "Movement not detected";
    }
    // reset speed after upload    
    $scope.maxSpeed = -32768;
    $scope.minSpeed = 32768;
    $scope.maxChangedDistance = 0;
    getMetas();  
   } 
  // this call backfunction is used to update data object 
   var updateLocationData= function(pos){
      //Debug info for GPS accuracy
     //console.log(pos);
      $scope.gpsInstance.timeInteval = pos.timestamp - $scope.gpsInstance.timeStamp;
      $scope.gpsInstance.timeStamp = pos.timestamp;
      $scope.gpsInstance.coords.lat = pos.coords.lat;
      $scope.gpsInstance.coords.lng = pos.coords.lng;
      $scope.gpsInstance.coords.accuracy = pos.coords.accuracy;
      $scope.gpsInstancePretty = JSON.stringify($scope.gpsInstance,null,4);
      
      // need this to do first
      if ($scope.gpsInstance.timeInteval > 1000) { // valid time interval
         $scope.averageSpeed = Math.round($scope.changedDistance*1000/$scope.gpsInstance.timeInteval*3.6) // m/s to something;
      }
     
      // Initialize parameter for S3 bucket 
      if ($scope.averageSpeed>$scope.maxSpeed){
       $scope.maxSpeed = $scope.averageSpeed;
      }
      if ($scope.averageSpeed<$scope.minSpeed){
       $scope.minSpeed = $scope.averageSpeed;
      }

      $scope.data.maxSpeed = $scope.maxSpeed;
      $scope.data.minSpeed = $scope.minSpeed;
      $scope.data.maxAcceleration = $scope.maxA;
      $scope.data.minAcceleration = $scope.minA;
      $scope.data.maxAccelerationWithG = $scope.maxAWithG;
      $scope.data.minAccelerationWithG = $scope.minAWithG;
      //$scope.data.maxZ = $scope.maxZ;
      //$scope.data.minZ = $scope.minZ;



      //$scope.data.success= true;
      $scope.errCode = 0;

      $scope.prevLat = $scope.data.lat;
      $scope.prevLng = $scope.data.lng;
      $scope.data.lat = pos.coords.latitude;
      $scope.data.lng = pos.coords.longitude;
      $scope.data.timeStamp = new Date();
      $scope.metaInf.lastTracked = $scope.data.timeStamp.valueOf();
      $scope.metaInf.lastObject = $scope.data;
      $scope.prettyData = JSON.stringify($scope.data,null,4);
      $scope.prettyMetaData = JSON.stringify($scope.metaInf,null,4);
      // update display map
      $scope.mapObject.updateMap(pos);

      //propagate change through the scope
      $scope.$apply();
      if ($scope.prevLat==0){ // special case initialization
        $scope.changedDistance =0;
      }else{
        $scope.changedDistance= Math.round(getDistanceFromLatLon($scope.data.lat,$scope.data.lng,$scope.prevLat,$scope.prevLng)*10)/10;
      }
      if ($scope.changedDistance>$scope.maxChangedDistance){
        $scope.maxChangedDistance = $scope.changedDistance;
      }

      $scope.updateCount= ($scope.updateCount+1)%syncInstance;
      if ($scope.updateCount == 0){
        uploadLocationData();
        $scope.triggerUpload = true;
      }else{
        $scope.triggerUpload = false;
      }
   }

   var getMetas = function(callback){
   
     $scope.metas = []; // empty the metas object
     $scope.mapObject.clearAllMarkers();
     // list all the objects from the identity folder
     $scope.s3Object.S3.listObjects({Bucket:$scope.s3Object.bucket,Prefix:$scope.cognitoObject.cognigtoIdentity+'/meta'},function(err,data){
         $scope.metaKeys = data.Contents.map(function(object){ // maping call back to translate meta object to meta object keys
           return object.Key;
         });
         console.log($scope.metaKeys);
         metaStr = "meta-"
         angular.forEach($scope.metaKeys,function(value){
           if (value != metaStr.concat($scope.metaInf.deviceId) ) {
             $scope.s3Object.getObject(value,function(meta){
               $scope.metas.push(meta);
               $scope.mapObject.displayValidMarker(meta);
             });
           }  
         });
    });
   } 
   // this callback is used to handle error when pull notifaction
   var errorOccured= function(err){

      //$scope.data.success= false;
      $scope.errCode= err.code;

      $scope.data.lat = "0";
      $scope.data.lng = "0";
      $scope.data.timeStamp = new Date();
      $scope.$apply()
   }


    // function wrapper to put into
    function trackFunction() {
      navigator.geolocation.getCurrentPosition(updateLocationData, errorOccured, posOptions);
    };

   // TOGGLE TRACKING METHOD

   trackFunction();
   // reinitialize a watch for location
   $scope.watchID =  setInterval(trackFunction,locationUpdateInterval);
   //setInterval(uploadLocationData,locationUploadInterval);
   
   $scope.devMotionHandler = function(data){
     $scope.deviceAccleration = '{x: '+Math.round(data.acceleration.x*10)/10 + '\n'+ ',y: '+Math.round(data.acceleration.y*10)/10 + '\n'+ ',z: '+Math.round(data.acceleration.z*10)/10+'}';
     $scope.deviceAcclerationWithG = '{x: '+Math.round(data.accelerationIncludingGravity.x*10)/10 + '\n'+ ',y: '+Math.round(data.accelerationIncludingGravity.y*10)/10 + '\n'+ ',z: '+Math.round(data.accelerationIncludingGravity.z*10)/10+'}';
     $scope.amplitude = Math.round(Math.sqrt(data.acceleration.x*data.acceleration.x+data.acceleration.y*data.acceleration.y+data.acceleration.z*data.acceleration.z)*10)/10;
     $scope.amplitudeWithG = Math.round(Math.sqrt(data.accelerationIncludingGravity.x*data.accelerationIncludingGravity.x+data.accelerationIncludingGravity.y*data.accelerationIncludingGravity.y+data.accelerationIncludingGravity.z*data.accelerationIncludingGravity.z)*10)/10;
     
     if ($scope.amplitude > $scope.maxA) {
       $scope.maxA = $scope.amplitude;
     }
     if ($scope.amplitude < $scope.minA) {
       $scope.minA = $scope.amplitude;
     }
     if ($scope.amplitudeWithG > $scope.maxAWithG) {
       $scope.maxAWithG = $scope.amplitudeWithG;
     }
     if ($scope.amplitudeWithG < $scope.minAWithG) {
       $scope.minAWithG = $scope.amplitudeWithG;
     }

     $scope.$apply();
   }


  if (window.DeviceMotionEvent) {
    $scope.motionSupport = "DeviceMotion is supported";
     window.addEventListener('devicemotion', $scope.devMotionHandler);
  }else{
    $scope.motionSupport = "DeviceMotion is supported";
  }
  $ionicPlatform.registerBackButtonAction(function () {
    if (1>2) {
      navigator.app.exitApp();
    } else {
     
    }
  }, 100);

  document.addEventListener("deviceready", function () {
     cordova.plugins.backgroundMode.enable();
     document.addEventListener("backbutton", function (e) {
                 e.preventDefault();
             }, false );
     $scope.metaInf.deviceId= $cordovaDevice.getUUID();
     $scope.metaInf.deviceModel= $cordovaDevice.getModel();
  }, false);
});



//--------MAP PART-----------------------------
// declare map object
var mapObject = function() {
      //--------Map config and method------------------
    var vm = this;
    vm.myLatlng = new google.maps.LatLng(37.3000, -120.4833), 
    vm.mapOptions = {center: vm.myLatlng,
                  zoom: 16,
                  mapTypeId: google.maps.MapTypeId.ROADMAP
                };

    vm.markers =[];            
    // initialize the map with map option
    vm.map=new google.maps.Map(document.getElementById("map"), vm.mapOptions);
    vm.markerTitle = "Current Location";
    // initalize marker
    vm.myLocation = new  google.maps.Marker();
    // helper method to update local map
    vm.initializeMap =function(){
      console.log('initialize');
       vm.map=new google.maps.Map(document.getElementById("map"), vm.mapOptions);
    };
    vm.updateMap = function(pos){
      vm.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));

      // update marker
      vm.myLocation.setMap(null); // unset the old one
      vm.myLocation = new google.maps.Marker({ 
          position: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude),
          map: vm.map,
          title: vm.markerTitle
      });
    };

    vm.displayValidMarker = function(meta){
      var dateDiff = new Date()-new Date(meta.lastTracked);
      console.log(dateDiff);
      var dateThreshold = 24*60*60*1000;
      if (dateDiff< dateThreshold){
        marker = new google.maps.Marker({
          position : new google.maps.LatLng(meta.lastObject.lat,meta.lastObject.lng),
          map:vm.map,
          title:meta.deviceID
        }) 
        vm.markers.push(marker)
      }

    } 
    vm.clearAllMarkers = function(){ // manually clear marker
      vm.markers.forEach(function(marker){
        marker.setMap(null);
      })
    }

    vm.setMarkerTitle = function(markerTitle){
      vm.markerTitle = markerTitle;
    }
    vm.stopTracking =function(){
      vm.myLocation.setMap(null);
    }

    return vm;

    vm.setMarkerTitle = function(markerTitle){
      vm.markerTitle = markerTitle;
    }
    vm.stopTracking =function(){
      vm.myLocation.setMap(null);
    }

    return vm;
}


//-------- COGNITO PART-----------------------------
// helper method to decode JWT from google
var decodeIdToken = function(id_token){
  var tokenSegment = id_token.split('.'); //split string based on. 
  // convert according to standard and parse JSON back
  return [JSON.parse(b64utoutf8(tokenSegment[0])),JSON.parse(b64utoutf8(tokenSegment[1])),b64utohex(tokenSegment[2])]; 
}
// extract email value from decoded 2nd segment of id_token 
var getEmailFromToken=function (id_token){
    var userInfo = decodeIdToken(id_token)[1]; // user info in 2nd segment
    return userInfo.email;

}



// declare cognito Object
var cognitoObject = function(id_token){
  var vm = this
      vm.params = {
       IdentityPoolId:identityPoolId,
       AccountId:accountID,
        Logins: { 
          'accounts.google.com':id_token
        }
      },
      vm.cognigtoIdentity = "";
      vm.awsCredentials="";
      vm.errMessage = "";

      vm.userEmail ="";
      if (id_token != undefined && id_token != "" ){
        vm.userEmail = getEmailFromToken(id_token);
      }

   AWS.config.region = 'us-east-1';
   AWS.config.credentials = new AWS.CognitoIdentityCredentials(vm.params);

   AWS.config.credentials.get(function(err) {
       if (!err) {
            vm.cognigtoIdentity = AWS.config.credentials.identityId;
            vm.awsCredentials = AWS.config.credentials;
            vm.errMessage="Success!";
       }else{
        vm.errMessage =err.message;
       }
   });

   return vm;
}

var s3Object = function(awsCredentials){
  var vm = this;
  vm.S3 = new AWS.S3(awsCredentials);
  vm.bucket = "argotraq-data"
  vm.path = "";
  vm.filename= '';
  vm.data='';
  vm.uploadResult ="";
  vm.bucketParams = {
        // bucket name
        Bucket:vm.bucket, 
        // key of opject to put data in ( will be directory/filename on s3) 
        //,in this case store in a file whose name is device'sID

        Key: vm.path+vm.filename,
        
        // full access for testing
        ACL:'bucket-owner-full-control', // full access for testing

        // Json version of data
        Body:JSON.stringify(vm.data) 

      } ;
  vm.setBucket =function(bucket){
    vm.bucket = bucket
  }
  vm.setFileName = function(filename){
    vm.bucketParams.Key = vm.path+filename;
  }

  vm.setPath = function(path){
    vm.path = path; // this will be appply to
  }
  vm.setData = function(data){
     vm.bucketParams.Body = JSON.stringify(data);
  }

  vm.upload= function(filename,file){
      vm.setFileName(filename);
      vm.setData(file);
      vm.S3.putObject(vm.bucketParams,function(err,data){
        if (err) {vm.uploadResult=err.message} // an error occurred
        else     {vm.uploadResult="Success!";} // successful response
       
      });
     return vm.uploadResult    
  }
  return vm      
}