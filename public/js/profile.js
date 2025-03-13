let inputs = document.querySelectorAll(".input-field input[type='text']");
let phoneInput = document.querySelector(".input-field input[type='phone']")
let editBtn = document.querySelector(".edit-btn");
let form = document.querySelector("form"); // Assuming your form element is present

console.log(inputs, editBtn, form, phoneInput);

editBtn.onclick = function(event) {
	event.preventDefault();
	if (editBtn.innerHTML == "Lưu") {
		phoneInput.disabled = false;
		form.submit(); // Submit the form
	} else {
		for (let i = 0; i < inputs.length; i++) {
			console.log(inputs[i]);
			inputs[i].disabled = false;
		}
		editBtn.innerHTML = "Lưu";
	}
};

let orderLst = document.querySelector(".orders");
let changePassForm = document.querySelector(".change-password");
let changePassBtn = document.querySelector('.menu .setting');
let showOrderBtn = document.querySelector('.menu .order');

changePassBtn.onclick = function() {
	orderLst.classList.add('hide');
	changePassForm.classList.remove('hide');
	changePassBtn.classList.add('choosed');
	showOrderBtn.classList.remove('choosed');

	// reset all input
	let inputs = changePassForm.querySelectorAll("input")
	for (let i = 0; i < inputs.length; i++) {
		inputs[i].value = "";
	}

};

showOrderBtn.onclick = function() {
	orderLst.classList.remove('hide');
	changePassForm.classList.add('hide');
	showOrderBtn.classList.add('choosed');
	changePassBtn.classList.remove('choosed');
};



// show/hide password
const togglePasswordVisibility = (input, eyeIcon, eyeSlashIcon) => {
	if (input.type === "password") {
		input.type = "text";
		eyeIcon.style.display = "inline";
		eyeSlashIcon.style.display = "none";
	} else {
		input.type = "password";
		eyeIcon.style.display = "none";
		eyeSlashIcon.style.display = "inline";
	}
};

const passwordInputs = document.querySelectorAll(".change-password .form-item input[type='password']");
passwordInputs.forEach((input, index) => {
	const eyeIcon = document.querySelectorAll(".change-password .form-item .fa-eye")[index];
	const eyeSlashIcon = document.querySelectorAll(".change-password .form-item .fa-eye-slash")[index];

	// initial state: show slash-eye
	eyeIcon.style.display = "none";
	eyeSlashIcon.style.display = "inline";

	eyeIcon.onclick = () => togglePasswordVisibility(input, eyeIcon, eyeSlashIcon);
	eyeSlashIcon.onclick = () => togglePasswordVisibility(input, eyeIcon, eyeSlashIcon);
});


