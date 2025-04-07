$(document).ready(function () {
    // Initialize DataTable only if it exists and hasn't been initialized
    if ($.fn.DataTable.isDataTable('#dataTable')) {
        $('#dataTable').DataTable().destroy();
    }
    
    $('#dataTable').DataTable({
        "language": {
            "search": "Tìm kiếm",
            "lengthMenu": "Hiển thị _MENU_ dòng",
            "info": "Hiển thị từ _START_ đến _END_ trên tổng số _TOTAL_ dòng",
            "paginate": {
                "previous": "Trước", 
                "next": "Tiếp" 
            }
        }
    });

    // Handle delete button click
    $('#dataTable').on('click', '.delete-btn', function() {
        var productId = $(this).data('product-id');
        $('#delete-link').attr('href', `${prefixAdmin}/product/delete/${productId}`);
    });
}); 