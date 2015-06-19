'use strict';

/* Controllers */

var testControllers = angular.module('testControllers', []);

testControllers.controller('UserListCtrl', [
    '$scope',
    '$window',
    '$filter',
    'ngTableParams',
    'Users',
    function($scope, $window, $filter, ngTableParams, Users) {
      // use in html like this ng-repeat="user in $data". see
      // https://github.com/esvit/ng-table/issues/464#issuecomment-64247038
      $scope.tableParams = new ngTableParams({
        page : 1, // show first page
        count : 10, // count per page
        sorting : {
          id : 'asc' // initial sorting
        }
      }, {
        getData : function($defer, params) {
          var page = params.page() - 1, count = params.count(), sort = '';
          _.each(params.sorting(), function(n, key) {
            sort += key + ',' + n + ';'
          });
          Users.getList({
            page : page,
            size : count,
            sort : sort
          }).then(
              function(users) {
                params.total(users.page.totalElements);
                // use build-in angular filter
                // sort
                var orderedData = params.sorting() ? $filter('orderBy')(users,
                    params.orderBy()) : users;
                // filter
                orderedData = params.filter() ? $filter('filter')(orderedData,
                    params.filter()) : orderedData;
                $defer.resolve($scope.users = orderedData);
              });
        }
      });
      $scope.checkboxes = {
        'checked' : false,
        items : {}
      };

      // watch for check all checkbox
      $scope.$watch('checkboxes.checked', function(value) {
        angular.forEach($scope.users, function(item) {
          if (angular.isDefined(item.id)) {
            $scope.checkboxes.items[item.id] = value;
          }
        });
      });

      // watch for data checkboxes
      $scope.$watch('checkboxes.items', function(values) {
        if (!$scope.users) {
          return;
        }
        var checked = 0, unchecked = 0, total = $scope.users.length;
        angular.forEach($scope.users, function(item) {
          checked += ($scope.checkboxes.items[item.id]) || 0;
          unchecked += (!$scope.checkboxes.items[item.id]) || 0;
        });
        if ((unchecked == 0) || (checked == 0)) {
          $scope.checkboxes.checked = (checked == total);
        }
        // grayed checkbox
        angular.element(document.getElementById("select_all")).prop(
            "indeterminate", (checked != 0 && unchecked != 0));
      }, true);

      $scope.deleteSelected = function() {
        var selected = _.map($scope.checkboxes.items, function(num, key) {
          if (num === true)
            return key;
        });
        if (selected.length > 0) { // should have selected some items
          Users.removeSelected(selected).then(function(){
            $scope.tableParams.reload();
          });
        }
      };
      $scope.deleteUser = function(userToDelete) {
        userToDelete.remove().then(function() {
          $window.alert('用户 ' + userToDelete.username + ' 已删除');
          // see https://github.com/esvit/ng-table/issues/322
          $scope.tableParams.reload();
        });
      };
      $scope.updateUser = function(userToUpdate) {
        userToUpdate.put().then(function() {
          $window.alert('用户 ' + userToUpdate.username + ' 已更新');
          $scope.tableParams.reload();
        }, function(){
          userToUpdate.$edit = false;
        });
      };
    } ]);

testControllers.controller('UserDetailCtrl', [ '$scope', '$window',
    '$stateParams', '$state', 'usersRes',
    function($scope, $window, $stateParams, $state, usersRes) {
      $scope.user = usersRes;

      $scope.deleteUser = function() {
        $scope.user.remove().then(function() {
          $window.alert('用户 ' + $scope.user.username + ' 已删除');
          $state.go('users');
        });
      };
      $scope.cancel = function() {
        $state.go('users');
      };
      $scope.updateUser = function() {
        $scope.user.put().then(function() {
          $window.alert('用户 ' + $scope.user.username + ' 已更新');
          $state.go('users');
        });
      };
    } ]);

testControllers.controller('UserCreationCtrl', [ '$scope', '$location',
    '$window', 'Users', function($scope, $location, $window, Users) {

      $scope.createUser = function() {
        Users.post($scope.user).then(function() {
          $window.alert('用户 ' + $scope.user.username + ' 已添加');
        });
      };
    } ]);