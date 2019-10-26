global.button = function(name, command, primary = true) {
	let btnClass = primary ? 'md-primary ' : '';
	let action = `angular.element(document.body).injector().get('Console').sendCommand('${command}', 0)`;
	return `<button class="md-button md-raised ${btnClass}md-ink-ripple" onclick="${action}">${name}</button>`;
};

global.testAction = function() {
	console.log('Test!');
};

// usage:
console.log(`Test this button: ${button('Press me', 'testAction()')}`);
console.log(`Grey button: ${button('Press me', 'testAction()', false)}`);
