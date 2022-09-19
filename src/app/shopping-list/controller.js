(function () {
	angular.module('app')
		.controller('ShoppingListController', ShoppingListController);

	function ShoppingListController(items) {
		var vm = this;
		vm.list = [];
		vm.newItem;
		vm.add = add;
		vm.edit = edit;
		vm.acceptEdition = acceptEdition;
		vm.cancelEdition = cancelEdition;
		vm.remove = remove;

		function add(name) {
			name = name || vm.newItem;
			if (name) {
				vm.list.push({
					name: name,
					isEditing: false
				});
				clear();
			}
		}

		function edit(i) {
			var item = vm.list[i];
			item.$$old = item.name;
			item.isEditing = true;
		}

		function acceptEdition(i) {
			finishEdition(i);
		}

		function cancelEdition(i) {
			var item = vm.list[i];
			if (item.name != item.$$old && !confirmForSure())
				return;
			item.name = item.$$old;
			finishEdition(i);
		}

		function remove(i) {
			if (confirmForSure())
				vm.list.splice(i, 1);
		}

		function clear() {
			vm.newItem = '';
		}

		function finishEdition(i) {
			var item = vm.list[i];
			delete item.$$old;
			item.isEditing = false;
		}

		function confirmForSure() {
			return confirm('Are you sure?');
		}

		function activate() {
			angular.forEach(items, function (item) {
				add(item);
			});
			clear();
		}

		activate();
	}
})();