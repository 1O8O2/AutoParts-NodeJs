document.addEventListener('DOMContentLoaded', function() {
  // Make group items clickable
  const groupItems = document.querySelectorAll('.header_menu-list li:first-child .item');
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

  // Make brand items clickable
  const brandItems = document.querySelectorAll('#brand .item');
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
  const miniItems = document.querySelectorAll('.mini-item');
  miniItems.forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent triggering parent item click
      const childName = item.textContent.trim();
      window.location.href = `/AutoParts/product/search?category=${encodeURIComponent(childName)}`;
    });
  });
});