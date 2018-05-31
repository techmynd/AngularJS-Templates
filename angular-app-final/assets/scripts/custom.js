// wowjs initialization
new WOW().init();

// Could not use flexslider - Don't like to use jQuery with this project
// var mainApp = angular.module("mainApp", ['ngRoute' , 'ui.bootstrap' , 'angular-flexslider']);
// ngAnimate is messing with my main navigation onload
// var mainApp = angular.module("mainApp", ['ngRoute' , 'ui.bootstrap' , 'ngAnimate']);

var mainApp = angular.module("mainApp", ['ngRoute' , 'ui.bootstrap']);

// Routing
mainApp.config(function($routeProvider) {

    $routeProvider
        .when('/', {
            templateUrl: 'home.html',
        })
        .when('/home', {
            templateUrl: 'home.html',
        })
        .when('/elements', {
            templateUrl: 'elements.html',
        })
        .when('/components', {
            templateUrl: 'components.html',
        })
        .when('/bs-components', {
            templateUrl: 'bs-components.html',
        })
        .when('/bs-carousel', {
            templateUrl: 'bs-carousel.html',
        })
        .when('/todo', {
            templateUrl: 'todo.html',
        })
        .when('/contact', {
            templateUrl: 'contact.html',
        })
        .when('/404', {
            templateUrl: '404.html',
        })
        .otherwise({
            redirectTo: '/404'
        });

});




mainApp.controller("showHide", ['$scope', function($scope) {
  // show hide via angular
  $scope.visibilityAng= true;
}]);

angular.module('mainApp').controller('CollapseCtrl', function ($scope) {
  // collapse control 1
  $scope.isCollapsed = false;
});

angular.module('mainApp').controller('collapseCustom', function ($scope) {
  // collapse control 2
  $scope.isCollapsed = false;
});


// courses ng-repeat
mainApp.controller("CourseController", ['$scope', function($scope) {
    $scope.courses = [
        { id:1, name:"Java", duration:"1 Year" },
        { id:2, name:"iOS", duration:"2 Years" },
        { id:3, name:"Web Designing", duration:"6 Months" }, 
        { id:4, name:"Web Development", duration:"1 Year" }, 
        { id:5, name:"PHP", duration:"1 Year" }, 
        { id:6, name:"Rails", duration:"2 Years" } 
    ];
}]);



// bootstrap accordian
angular.module('mainApp').controller('AccordionCtrl', function ($scope) {
  $scope.oneAtATime = true;
  $scope.groups = [
    {
      title: 'Dynamic Group Header - 1',
      content: 'Dynamic Group Body - 1'
    },
    {
      title: 'Dynamic Group Header - 2',
      content: 'Dynamic Group Body - 2'
    }
  ];

  $scope.items = ['Item 1', 'Item 2'];

  $scope.addItem = function() {
    var newItemNo = $scope.items.length + 1;
    $scope.items.push('Item ' + newItemNo);
  };

  $scope.status = {
    isFirstOpen: true,
    isFirstDisabled: false
  };
});



// bootstrap carousel
angular.module('mainApp').controller('CarouselCtrl', function ($scope) {
  $scope.myInterval = 5000;
  $scope.noWrapSlides = false;
  $scope.active = 0;
  var slides = $scope.slides = [];
  var currIndex = 0;

  $scope.addSlide = function() {
    var newWidth = 600 + slides.length + 1;
    slides.push({
      image: 'http://lorempixel.com/' + newWidth + '/300',
      text: ['Nice image','Awesome photograph','That is so cool','I love that'][slides.length % 4],
      id: currIndex++
    });
  };

  for (var i = 0; i < 4; i++) {
    $scope.addSlide();
  }

  function generateIndexesArray() {
    var indexes = [];
    for (var i = 0; i < currIndex; ++i) {
      indexes[i] = i;
    }
    return shuffle(indexes);
  }
 
  function shuffle(array) {
    var tmp, current, top = array.length;

    if (top) {
      while (--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
      }
    }

    return array;
  }
});




// to do list
angular.module('mainApp').controller('myList', function ($scope) {

   $scope.todos = ["Get Flying Lessons", "Download All Songs from the Internet", "Eat More Vegetables"];
   
    $scope.addItem = function () {
        $scope.errortext = "";
        if (!$scope.addMe) {return;}
        if ($scope.todos.indexOf($scope.addMe) == -1) {
            $scope.todos.push($scope.addMe);
        } else {
            $scope.errortext = "The item is already in your todo list.";
        }
    }

    $scope.removeItem = function (x) {
        $scope.errortext = "";    
        $scope.todos.splice(x, 1);
    }

});



// contact form
angular.module('mainApp').controller('contactCtrl', function ($scope) {
   $scope.submitForm = function(isValid) {
       if (isValid) {
         alert('Form submitted');
       }
   };
});








// Modals

angular.module('mainApp').controller('ModalDemoCtrl', function ($scope, $uibModal, $log) {

  $scope.items = ['item1', 'item2', 'item3'];

  $scope.animationsEnabled = true;

  $scope.open = function (size) {

    var modalInstance = $uibModal.open({
      animation: $scope.animationsEnabled,
      templateUrl: 'myModalContent.html',
      controller: 'ModalInstanceCtrl',
      size: size,
      resolve: {
        items: function () {
          return $scope.items;
        }
      }
    });

    modalInstance.result.then(function (selectedItem) {
      $scope.selected = selectedItem;
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };


});

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

angular.module('mainApp').controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, items) {

  $scope.items = items;
  $scope.selected = {
    item: $scope.items[0]
  };

  $scope.ok = function () {
    $uibModalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
});







// Date Picker
angular.module('mainApp').controller('DatepickerCtrl', function ($scope) {
  $scope.today = function() {
    $scope.dt = new Date();
  };
  $scope.today();

  $scope.clear = function() {
    $scope.dt = null;
  };

  $scope.inlineOptions = {
    customClass: getDayClass,
    minDate: new Date(),
    showWeeks: true
  };

  $scope.dateOptions = {
    dateDisabled: disabled,
    formatYear: 'yy',
    maxDate: new Date(2020, 5, 22),
    minDate: new Date(),
    startingDay: 1
  };

  // Disable weekend selection
  function disabled(data) {
    var date = data.date,
      mode = data.mode;
    return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
  }

  $scope.toggleMin = function() {
    $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
    $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
  };

  $scope.toggleMin();

  $scope.open1 = function() {
    $scope.popup1.opened = true;
  };

  $scope.open2 = function() {
    $scope.popup2.opened = true;
  };

  $scope.setDate = function(year, month, day) {
    $scope.dt = new Date(year, month, day);
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];
  $scope.altInputFormats = ['M!/d!/yyyy'];

  $scope.popup1 = {
    opened: false
  };

  $scope.popup2 = {
    opened: false
  };

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var afterTomorrow = new Date();
  afterTomorrow.setDate(tomorrow.getDate() + 1);
  $scope.events = [
    {
      date: tomorrow,
      status: 'full'
    },
    {
      date: afterTomorrow,
      status: 'partially'
    }
  ];

  function getDayClass(data) {
    var date = data.date,
      mode = data.mode;
    if (mode === 'day') {
      var dayToCheck = new Date(date).setHours(0,0,0,0);

      for (var i = 0; i < $scope.events.length; i++) {
        var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

        if (dayToCheck === currentDay) {
          return $scope.events[i].status;
        }
      }
    }

    return '';
  }
});




// Dropdowns
angular.module('mainApp').controller('DropdownCtrl', function ($scope, $log) {
  $scope.items = [
    'The first choice!',
    'And another choice for you.',
    'but wait! A third!'
  ];

  $scope.status = {
    isopen: false
  };

  $scope.toggled = function(open) {
    $log.log('Dropdown is now: ', open);
  };

  $scope.toggleDropdown = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.status.isopen = !$scope.status.isopen;
  };

  $scope.appendToEl = angular.element(document.querySelector('#dropdown-long-content'));
});





// Time Picker
angular.module('mainApp').controller('TimepickerCtrl', function ($scope, $log) {
  $scope.mytime = new Date();

  $scope.hstep = 1;
  $scope.mstep = 15;

  $scope.options = {
    hstep: [1, 2, 3],
    mstep: [1, 5, 10, 15, 25, 30]
  };

  $scope.ismeridian = true;
  $scope.toggleMode = function() {
    $scope.ismeridian = ! $scope.ismeridian;
  };

  $scope.update = function() {
    var d = new Date();
    d.setHours( 14 );
    d.setMinutes( 0 );
    $scope.mytime = d;
  };

  $scope.changed = function () {
    $log.log('Time changed to: ' + $scope.mytime);
  };

  $scope.clear = function() {
    $scope.mytime = null;
  };
});



