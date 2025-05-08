document.addEventListener('DOMContentLoaded', function() {
    const brandFilter = document.getElementById('brand-filter');
    const categoryFilter = document.getElementById('category-filter');
    const listCard = document.querySelector('.list-card');
    const cards = document.querySelectorAll('.card');

    // Function to filter products
    function filterProducts() {
        const selectedBrand = brandFilter.value;
        const selectedCategory = categoryFilter.value;
        
        // Show/hide cards based on selection
        cards.forEach(card => {
            const cardBrand = card.getAttribute('data-brand');
            const cardCategory = card.getAttribute('data-category');
            
            const brandMatch = !selectedBrand || cardBrand === selectedBrand;
            const categoryMatch = !selectedCategory || cardCategory === selectedCategory;
            
            if (brandMatch && categoryMatch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        // Show empty state if no cards are visible
        const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
        if (visibleCards.length === 0) {
            listCard.classList.add('empty');
        } else {
            listCard.classList.remove('empty');
        }
    }

    // Add event listeners to filters
    brandFilter.addEventListener('change', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);

    // Add hover effect to cards
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add smooth scroll to top when filters change
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Add scroll to top when filters change
    brandFilter.addEventListener('change', scrollToTop);
    categoryFilter.addEventListener('change', scrollToTop);
});
/**
 * 
 */