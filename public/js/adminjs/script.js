// Show alert
const showAlert = document.querySelector("[show-alert]");

if (showAlert) {
    const time = parseInt(showAlert.getAttribute("data-time"));
    const closeAlert = showAlert.querySelector("[close-alert]");

    setTimeout(() => {
        showAlert.classList.add("alert-hidden");
    }, time);

    closeAlert.addEventListener("click", () => {
        showAlert.classList.add("alert-hidden");
    });
}
// End Show alert

$(document).ready(function () {
    // Delete item
    $('#dataTable').on('click', '.delete-blog-btn', function() {
        const blogId = $(this).data('blog-id');
        $('#delete-link').on('click', function(e) {
            e.preventDefault(); 
            $('#delete-blog-item').attr('action', `/AutoParts/admin/blog/delete/${blogId}?_method=DELETE`);
            $('#delete-blog-item').submit(); 
        });
    });

    $('#dataTable').on('click', '.delete-discount-btn', function() {
        const discountId = $(this).data('discount-id');
        $('#delete-link').on('click', function(e) {
            e.preventDefault(); 
            $('#delete-discount-item').attr('action', `/AutoParts/admin/discount/delete/${discountId}?_method=DELETE`);
            $('#delete-discount-item').submit(); 
        });
    });

    $('#dataTable').on('click', '.delete-roleGroup-btn', function() {
        const roleGroupId = $(this).data('role-id');
        $('#delete-link').on('click', function(e) {
            e.preventDefault(); 
            $('#delete-roleGroup-item').attr('action', `/AutoParts/admin/role/delete/${roleGroupId}?_method=DELETE`);
            $('#delete-roleGroup-item').submit(); 
        });
    });
    // End delete item

    // Change Status item
    $('#dataTable').on('click', '[class^="change-status-blog"], [class^="change-status-discount"]', function(e) {
        e.preventDefault();
        const $link = $(this);// Lấy phần tử <a> hiện tại
        const fullClassName = $link.attr('class');
        const subPath = fullClassName.split('-')[2]; 
        
        const id = $link.data('id');
        const currentStatus = $link.data('status');
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        
        $.ajax({
            url: `/AutoParts/admin/${subPath}/change-status/${newStatus}/${id}?_method=PATCH`,
            type: 'POST',
            success: function(response) {
                // Tìm badge trong phần tử hiện tại
                const $badge = $link.find('.badge');

                // Cập nhật giao diện và data
                if (currentStatus === 'Inactive') {
                    $badge.removeClass('badge-danger').addClass('badge-success').text('Hoạt động');
                    $link.data('status', 'Active'); 
                } else {
                    $badge.removeClass('badge-success').addClass('badge-danger').text('Ngừng hoạt động');
                    $link.data('status', 'Inactive'); 
                }
            },
            error: function(error) {
                alert("Lỗi khi thay đổi trạng thái.");
            }
        });
    });
    // End Change Status item

    // Show detail discount modal
    $('#dataTable').on('click', '.detail-discount-btn', function() {
        const discountId = $(this).data('discount-id');

        // Load the detail modal content
        $('#DetailModal .modal-content').load(`/AutoParts/admin/discount/detail/${discountId}`, function() {
            $('#DetailModal').modal('show');
        });
    });
    // End Show detail discount modal

    // Show edit account modal
    $('#dataTable').on('click', '.edit-account-btn', function() {
        const accPhone = $(this).data('acc-phone');
        $('#EditModal .modal-content').load(`/AutoParts/admin/account/edit/${accPhone}`, function() {
            $('#EditModal').modal('show');
        });
    });
    // End Show edit account modal

    // Show edit role modal
    $('#dataTable').on('click', '.edit-btn', function() {
        const roleGroupId = $(this).data('role-id');
        $('#EditModal .modal-content').load(`/AutoParts/admin/role/edit/${roleGroupId}`, function() {
            $('#EditModal').modal('show');
        });
    });
    // End Show edit role modal
});
