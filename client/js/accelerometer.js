if (!window.DeviceMotionEvent) {
  alert("no accelerometer");
}
else {
  var axisY;
  var axisX;
  var axisZ;
  var interval = 0;
  var system = getMobileOperatingSystem();

  function accelerometerUpdate(event) {
    if (!axisX) {
      console.log(JSON.stringify(event));
    }
    axisX = event.accelerationIncludingGravity.x;
    axisY = event.accelerationIncludingGravity.y;
    axisZ = event.accelerationIncludingGravity.z;
    if (!system) {
      axisX = -axisX;
      axisY = -axisY;
      axisZ = -axisZ;
    }

    interval += event.interval;
    if (interval > 0.5) {
      interval %= 0.5;
      console.log("", "move Y", axisY, "move X", axisX, "move Z", axisZ);
    }
  }

  window.addEventListener("devicemotion", accelerometerUpdate, true);

}

function getMobileOperatingSystem() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if( userAgent.match( /iPad/i ) || userAgent.match( /iPhone/i ) || userAgent.match( /iPod/i ) )
  {
    return true;

  }
  else if( userAgent.match( /Android/i ) )
  {

    return false;
  }
  else
  {
    return false;
  }
}
/*function ChatController($scope) {
  var socket = io.connect();

  $scope.messages = [];
  $scope.roster = [];
  $scope.name = '';
  $scope.text = '';

  socket.on('connect', function () {
    $scope.setName();
  });

  socket.on('message', function (msg) {
    $scope.messages.push(msg);
    $scope.$apply();
  });

  socket.on('roster', function (names) {
    $scope.roster = names;
    $scope.$apply();
  });

  $scope.send = function send() {
    console.log('Sending message:', $scope.text);
    socket.emit('message', $scope.text);
    $scope.text = '';
  };

  $scope.setName = function setName() {
    socket.emit('identify', $scope.name);
  };
}
*/
