'use strict';

const copyButton = document.getElementById('copyButton');

const textAreas = document.querySelectorAll('.input');

copyButton.addEventListener('click', function () {
	const customer = document.getElementById('nameText').value;

	const issue = document.getElementById('issueText').value;

	const action = document.getElementById('actionText').value;

	const resolution = document.getElementById('resolutionText').value;

	const textToCopy = `${customer}\n\nIssue: \n${issue}\n\nAction: \n${action}\n\nResolution: \n${resolution}`;

	navigator.clipboard.writeText(textToCopy).then(function () {
		return navigator.clipboard.readText();
	});
	// .then(function (copiedToClipboard) {
	// 	alert(
	// 		'successfully copied to clipboard this: \n' +
	// 			copiedToClipboard
	// 	);
	// });

	copyButton.textContent = 'Copied   ✅';
});

textAreas.forEach(function (textAreas) {
	textAreas.addEventListener('input', function () {
		copyButton.textContent = 'Copy';
	});
});
