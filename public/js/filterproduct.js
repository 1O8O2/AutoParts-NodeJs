document.addEventListener('DOMContentLoaded', function() {
    const brandFilter = document.getElementById('brand');
    const categoryFilter = document.getElementById('category');
	
    const products = document.querySelectorAll('.card')
	console.log(products)

    function filterProducts() {
		console.log("change")
        const selectedBrand = brandFilter.value;
        const selectedCategory = categoryFilter.value;
       	for(let i=0;i<products.length;i++){
			console.log(products[i])
            const brandId = products[i].getAttribute('data-brand');
            const cateId = products[i].getAttribute('data-category');
			console.log(brandId,cateId)
			            if (brandId.includes(selectedBrand) && cateId.includes(selectedCategory)) {
                products[i].style.display = 'block';
            } else {
                products[i].style.display = 'none';
            }
        }
    }
	brandFilter.onchange = function(){
		filterProducts();
	}
	categoryFilter.onchange=function(){
		filterProducts();
	}
});
/**
 * 
 */