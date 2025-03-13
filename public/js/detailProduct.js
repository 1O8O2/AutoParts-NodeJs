let minusBtn=document.getElementById('button-minus')

let plusBtn = document.getElementById('button-plus');

if(plusBtn!=null && minusBtn!=null ){
	document.getElementById('button-plus').addEventListener('click', function () {
	    var quantity = document.getElementById('quantity');
	    quantity.value = parseInt(quantity.value) + 1;
	});

	document.getElementById('button-minus').addEventListener('click', function () {
	    var quantity = document.getElementById('quantity');
	    if (quantity.value > 1) {
	        quantity.value = parseInt(quantity.value) - 1;
	    }
	});
}


let mainImg = document.getElementById('main-image')

function updateMainImg(element) {
	
	let current = document.querySelector('.image-item.active');
    if (current) {
        current.classList.remove('active');
        element.classList.add('active');
    }
	mainImg.src = element.src;
	console.log(mainImg.src)
}