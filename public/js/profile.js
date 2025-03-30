// Select DOM elements
let inputs = document.querySelectorAll(".input-field input[type='text']");
let phoneInput = document.querySelector(".input-field input[type='tel']"); // Fixed typo from 'phone' to 'tel'
let editBtn = document.querySelector(".edit-btn");
let form = document.querySelector("form[action='/AutoParts/account/edit']"); // Specific to edit form

console.log(inputs, phoneInput, editBtn, form);

// Edit button toggle and form submission
editBtn.onclick = function(event) {
    event.preventDefault(); // Prevent default form submission initially
    if (editBtn.innerHTML === "Lưu") {
        // Enable phone input (though it’s typically read-only in your setup)
        phoneInput.disabled = false;
        form.submit(); // Submit the form to /AutoParts/account/edit
    } else {
        // Enable text inputs for editing
        inputs.forEach(input => {
            console.log(input);
            input.disabled = false;
        });
        editBtn.innerHTML = "Lưu"; // Change button text to "Save"
    }
};

// Tab switching between orders and change password
let orderLst = document.querySelector(".orders");
let changePassForm = document.querySelector(".change-password");
let changePassBtn = document.querySelector('.menu .setting');
let showOrderBtn = document.querySelector('.menu .order');

changePassBtn.onclick = function() {
    orderLst.classList.add('hide');
    changePassForm.classList.remove('hide');
    changePassBtn.classList.add('choosed');
    showOrderBtn.classList.remove('choosed');

    // Reset all inputs in the change password form
    let inputs = changePassForm.querySelectorAll("input");
    inputs.forEach(input => input.value = "");
};

showOrderBtn.onclick = function() {
    orderLst.classList.remove('hide');
    changePassForm.classList.add('hide');
    showOrderBtn.classList.add('choosed');
    changePassBtn.classList.remove('choosed');
};

// Show/hide password functionality
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

    // Initial state: show slash-eye (password hidden)
    eyeIcon.style.display = "none";
    eyeSlashIcon.style.display = "inline";

    eyeIcon.onclick = () => togglePasswordVisibility(input, eyeIcon, eyeSlashIcon);
    eyeSlashIcon.onclick = () => togglePasswordVisibility(input, eyeIcon, eyeSlashIcon);
});

// Optional: Handle form submission with fetch (if you want AJAX instead of full page reload)
form.onsubmit = async function(event) {
    if (editBtn.innerHTML === "Lưu") { // Only submit when "Lưu" is clicked
        event.preventDefault();
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/AutoParts/account/edit', {
                method: 'POST',
                body: formData
            });
            if (response.redirected) {
                window.location.href = response.url; // Follow redirect to /profile
            } else {
                const text = await response.text();
                console.log('Edit response:', text);
                // Optionally update UI with error message if needed
            }
        } catch (error) {
            console.error('Error submitting edit form:', error);
        }
    }
};

// Optional: Handle change password form with fetch
const changePassFormElement = document.querySelector(".change-password");
changePassFormElement.onsubmit = async function(event) {
    event.preventDefault();
    const formData = new FormData(changePassFormElement);
    const newPass = formData.get('newpass');
    const confirmPass = formData.getAll('password')[1]; // Third password input (confirmation)

    if (newPass !== confirmPass) {
        alert('Mật khẩu mới và xác nhận không khớp');
        return;
    }

    try {
        const response = await fetch('/AutoParts/account/changepass', {
            method: 'POST',
            body: formData
        });
        if (response.redirected) {
            window.location.href = response.url; // Follow redirect to /profile
        } else {
            const text = await response.text();
            console.log('Change password response:', text);
            alert('Đổi mật khẩu thất bại'); // Show error if not redirected
        }
    } catch (error) {
        console.error('Error submitting change password:', error);
        alert('Đã xảy ra lỗi');
    }
};