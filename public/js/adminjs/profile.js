let inputs= document.querySelectorAll('form input')
let genderInput =document.querySelector('#gender')
let formInfo = document.querySelector(".user-form")
let formPass = document.querySelector(".pass-form")
let editBtn = document.querySelector("#edit")
let passBtn = document.querySelector("#change-pass")
let backBtn = document.querySelector("#back")

console.log(inputs)

function editAccount(){
	if(!inputs[0].classList.contains("active")){
		for(let i =0;i< inputs.length;i++){
			if(inputs[i].name=="phone"){
				continue;
			}
			inputs[i].removeAttribute('readonly');
			inputs[i].classList.add('active')
			
		}
		genderInput.removeAttribute('disabled');
		editBtn.innerText="Lưu"
		passBtn.style.display="none";
	}
	else{
		formInfo.submit();
	}
}

function showPassForm(){
	passBtn.style.display="none";
	formPass.style.display="block";
	formInfo.style.display="none";
	backBtn.style.display="block";
	editBtn.style.display="none";
}

function showInfoForm(){
	passBtn.style.display="block";
	formPass.style.display="none";
	formInfo.style.display="block";
	backBtn.style.display="none";
	editBtn.style.display="block";
}


function validateInputs() {
    let newpass = document.getElementById("newpass").value;
    let confirmpass = document.getElementById("confirmpass").value;
    let warning = document.getElementById("warning");

    if (newpass !== confirmpass && confirmpass !== "") {
        warning.style.display = "block"; // Hiện thông báo
    } else {
        warning.style.display = "none"; // Ẩn thông báo
    }
}
