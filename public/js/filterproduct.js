document.addEventListener('DOMContentLoaded', function() {
    const brandFilter = document.getElementById('brand-filter');
    const categoryFilter = document.getElementById('category-filter');
	
    const products = document.querySelectorAll('.card')
    function filterProducts() {
        const selectedBrand = brandFilter.value;
        const selectedCategory = categoryFilter.value;
       	for(let i=0;i<products.length;i++){
            const brandId = products[i].getAttribute('data-brand');
            const cateId = products[i].getAttribute('data-category');
			if (brandId.includes(selectedBrand) && cateId.includes(selectedCategory)) {
                products[i].style.display = 'block';
            } else {
                products[i].style.display = 'none';
            }
        }
    }
    //get selected brand and category from url
    let urlParams = new URLSearchParams(window.location.search);
    let selectedBrand = urlParams.get('brand') || '';
    let selectedCategory = urlParams.get('group') || '';
    if(selectedBrand || selectedCategory){
        filterProducts();
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