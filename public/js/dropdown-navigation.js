document.addEventListener('DOMContentLoaded', function() {
  // Only handle navigation menu items, not filter form items
  const headerMenu = document.querySelector('.header_menu');
  if (!headerMenu) return; // Exit if not on a page with the header menu

  // Make group items clickable in the navigation menu only
  const groupItems = headerMenu.querySelectorAll('li:nth-child(2) .items .item');
  groupItems.forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', function(e) {
      // Only navigate if clicking on the item itself, not its children
      if (e.target === item || e.target.textContent.trim() === item.childNodes[0].textContent.trim()) {
        const groupName = item.childNodes[0].textContent.trim();
        window.location.href = `/AutoParts/product/search?group=${encodeURIComponent(groupName)}`;
      }
    });
  });

  // Make brand items clickable in the navigation menu only
  const brandItems = headerMenu.querySelectorAll('#brand .items .item');
  brandItems.forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', function(e) {
      // Only navigate if clicking on the item itself, not its children
      if (e.target === item || e.target.textContent.trim() === item.textContent.trim()) {
        const brandName = item.textContent.trim();
        window.location.href = `/AutoParts/product/search?brand=${encodeURIComponent(brandName)}`;
      }
    });
  });

  // Make mini-items clickable (for submenu items)
  const miniItems = headerMenu.querySelectorAll('.mini-item');
  miniItems.forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent triggering parent item click
      const childName = item.textContent.trim();
      window.location.href = `/AutoParts/product/search?category=${encodeURIComponent(childName)}`;
    });
  });
});