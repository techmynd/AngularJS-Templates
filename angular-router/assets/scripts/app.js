var routerApp = angular.module('routerApp', ['ui.router']);

routerApp.config(function($stateProvider, $urlRouterProvider) {
    
    $urlRouterProvider.otherwise('/index');
    
    $stateProvider
        
        // HOME STATES AND NESTED VIEWS ========================================

        .state('home', {
            url: '/index',
            templateUrl: 'partial-home.html',
            conteroler: 'MyCtrl'
        })
        
        // nested list with custom controller
        .state('home.list', {
            url: '/list',
            templateUrl: 'partial-home-list.html',
            controller: function($scope) {
                $scope.dogs = ['Bernese', 'Husky', 'Goldendoodle'];
            }
        })
        
        // nested list with just some random string data
        .state('home.paragraph', {
            url: '/paragraph',
            template: 'I could sure use a drink right now. Additional text....'
        })
        
        // ABOUT PAGE AND MULTIPLE NAMED VIEWS =================================
        .state('about', {
            url: '/about',
            views: {
                '': { templateUrl: 'partial-about.html' },
                'columnOne@about': { template: '<br><br>This is left column. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Iure repellat consequuntur dolorum, magnam alias aperiam ex doloremque itaque nulla quae aspernatur nam ipsa neque officiis officia id possimus distinctio est temporibus atque, beatae! Molestiae odit, quibusdam nihil labore nisi pariatur accusamus vitae facere ipsa, earum repellendus rem rerum officia ea.' },
                'columnTwo@about': { 
                    templateUrl: 'table-data.html',
                    controller: 'scotchController'
                }
            }
            
        })

        .state('controls', {
            url: '/controls',
            templateUrl: 'partial-controls.html'
        })

        .state('contact', {
            url: '/contact',
            templateUrl: 'partial-contact.html'
        });

});

routerApp.controller('scotchController', function($scope) {
    
    $scope.message = 'test';
   
    $scope.scotches = [
        {
            name: 'Product 1',
            price: 50
        },
        {
            name: 'Product 2',
            price: 10000
        },
        {
            name: 'Product 3',
            price: 20000
        }
    ];
    
});

routerApp.controller('MyCtrl', function($scope, $location) {
    $scope.isActive = function(route) {
        return route === $location.path();
    }
});

