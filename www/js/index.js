// (c) 2014 Don Coleman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global mainPage, deviceList, refreshButton */
/* global detailPage, resultDiv, messageInput, sendButton, disresultdiv */
/* global ble  */
/* jshint browser: true , devel: true*/
// 'use strict';

// ASCII only
var currentWeather;
var cityName;

var deviceId;

function bytesToString(buffer) {
  return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

// ASCII only
function stringToBytes(string) {
  var array = new Uint8Array(string.length);
  for (var i = 0, l = string.length; i < l; i++) {
    array[i] = string.charCodeAt(i);
  }
  return array.buffer;
}

function sendMsg(message) {
  console.log("start send");
  var success = function() {
    console.log("success");
    // resultDiv.innerHTML = "";
    // resultDiv.scrollTop = resultDiv.scrollHeight;
  };

  var failure = function(err) {
    alert("Failed writing data to the bluefruit le");
    console.log(err);

  };

  console.log(message);
  ble.writeWithoutResponse(deviceId, bluefruit.serviceUUID, bluefruit.txCharacteristic, stringToBytes(message), success, failure);
  console.log("send!");
}

// this is Nordic's UART service
var bluefruit = {
  serviceUUID: "6E400001-B5A3-F393-E0A9-E50E24DCCA9E",
  txCharacteristic: "6E400002-B5A3-F393-E0A9-E50E24DCCA9E", // transmit is from the phone's perspective
  rxCharacteristic: "6E400003-B5A3-F393-E0A9-E50E24DCCA9E" // receive is from the phone's perspective
};

var app = {
  initialize: function() {
    this.bindEvents();
    mainPage.hidden = false;
    detailPage.hidden = true;
    weatherDescription.hidden = true;
    icecreamDescription.hidden = true;
    movieDescription.hidden = true;
    coffeeDescription.hidden = true;
    beerDescription.hidden = true;
  },
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    refreshButton.addEventListener('touchend', this.refreshDeviceList, false);
    // disconnectButton.addEventListener('touchend', this.disconnect, false);
    deviceList.addEventListener('touchend', this.connect, false); // assume not scrolling
    offButton.addEventListener('touchend', function() {
      weatherDescription.hidden = true;
      icecreamDescription.hidden = true;
      movieDescription.hidden = true;
      coffeeDescription.hidden = true;
      beerDescription.hidden = true;
      sendMsg("f");
    }, false);
    weatherButton.addEventListener('touchend', function() {
      var url = "http://api.openweathermap.org/data/2.5/weather?zip=11205,us&APPID=17060a8ebc4b87eb8d24f1988ac08f95";
      $.get(url, function(response) {
        // console.log(response.weather[0].description);
        if (response.weather[0].id >= 800 && response.weather[0].id < 900) {
          currentWeather = 'c';
        } else if (response.weather[0].id >= 300 && response.weather[0].id < 600) {
          currentWeather = 'z';
        } else if (response.weather[0].id >= 900 && response.weather[0].id < 1000) {
          currentWeather = 'w';
        } else {
          currentWeather = 'r';
        }
        console.log(currentWeather);
        icecreamDescription.hidden = true;
        movieDescription.hidden = true;
        coffeeDescription.hidden = true;
        beerDescription.hidden = true;
        weatherDescription.hidden = false;
        $("#weatherDescription").html("Weather in Brooklyn today is " + response.weather[0].description + ".");
      });
      sendMsg(currentWeather);
    }, false);
    icecreamButton.addEventListener('touchend', function() {
      weatherDescription.hidden = true;
      movieDescription.hidden = true;
      coffeeDescription.hidden = true;
      beerDescription.hidden = true;
      icecreamDescription.hidden = false;
      $("#icecreamDescription").html("When you are approaching an ice-cream shop, Whitedress will turn to the color of strawberry flavor.");
      sendMsg("i");
    }, false);
    movieButton.addEventListener('touchend', function() {
      weatherDescription.hidden = true;
      icecreamDescription.hidden = true;
      coffeeDescription.hidden = true;
      beerDescription.hidden = true;
      movieDescription.hidden = false;
      $("#movieDescription").html("Whitedress can visualize your heartbeat when connected to a wearable device.");
      sendMsg("h");
    }, false);
    coffeeButton.addEventListener('touchend', function() {
      weatherDescription.hidden = true;
      icecreamDescription.hidden = true;
      movieDescription.hidden = true;
      beerDescription.hidden = true;
      coffeeDescription.hidden = false;
      $("#coffeeDescription").html("Breathing following Whitedress to calm down");
      sendMsg("b");
    }, false);
    beerButton.addEventListener('touchend', function() {
      weatherDescription.hidden = true;
      icecreamDescription.hidden = true;
      movieDescription.hidden = true;
      coffeeDescription.hidden = true;
      beerDescription.hidden = false;
      $("#beerDescription").html("Let's party!");
      sendMsg("r");
    }, false);
  },
  onDeviceReady: function() {
    app.refreshDeviceList();
  },
  refreshDeviceList: function() {
    console.log("refresh");
    deviceList.innerHTML = ''; // empties the list
    if (cordova.platformId === 'android') { // Android filtering is broken
      ble.scan([], 5, app.onDiscoverDevice, app.onError);
    } else {
      ble.scan([bluefruit.serviceUUID], 5, app.onDiscoverDevice, app.onError);

    }
  },
  onDiscoverDevice: function(device) {
    console.log("device discovered");
    var listItem = document.createElement('li'),
      // html = '<b>' + device.name + '</b><br/>' +
      //     'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
      //     device.id;
      html = "Connect Dress";

    listItem.dataset.deviceId = device.id;
    listItem.innerHTML = html;
    listItem.id = 'dressButton';
    deviceList.appendChild(listItem);
  },
  connect: function(e) {
    console.log("connect");
    deviceId = e.target.dataset.deviceId,
      onConnect = function() {
        console.log("onConnect");
        // subscribe for incoming data
        ble.startNotification(deviceId, bluefruit.serviceUUID, bluefruit.rxCharacteristic, app.onData, app.onError);
        //sendButton.dataset.deviceId = deviceId;
        // disconnectButton.dataset.deviceId = deviceId;
        app.showDetailPage();
      };

    ble.connect(deviceId, onConnect, app.onError);
  },
  onData: function(data) { // data received from Arduino
    console.log(data);
    // resultDiv.innerHTML = resultDiv.innerHTML + "Received: " + bytesToString(data) + "<br/>";
    // resultDiv.scrollTop = resultDiv.scrollHeight;
  },
  sendData: function(event) { // send data to Arduino

    var success = function() {
      console.log("success");
      // resultDiv.innerHTML = messageInput.value + "is raining";
      // resultDiv.scrollTop = resultDiv.scrollHeight;
    };

    var failure = function(err) {
      alert("Failed writing data to the bluefruit le");
      console.log(err);

    };

    var data = stringToBytes(messageInput.value);
    var deviceId = event.target.dataset.deviceId;
    ble.writeWithoutResponse(deviceId, bluefruit.serviceUUID, bluefruit.txCharacteristic, stringToBytes('e'), success, failure);
  },


  disconnect: function(event) {
    var deviceId = event.target.dataset.deviceId;
    ble.disconnect(deviceId, app.showMainPage, app.onError);
  },
  showMainPage: function() {
    mainPage.hidden = false;
    detailPage.hidden = true;
    weatherPage.hidden = true;

  },
  showDetailPage: function() {
    mainPage.hidden = true;
    detailPage.hidden = false;
    weatherPage.hidden = true;
  },
  backDetail: function() {
    mainPage.hidden = true;
    detailPage.hidden = false;
    weatherPage.hidden = true;
  },
  onError: function(reason) {
    alert("ERROR: " + reason); // real apps should use notification.alert
  }
};
