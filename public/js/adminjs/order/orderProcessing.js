$(document).ready(function() {
    $("#dataTable").on('click', '.confirm-btn', function() {
        let orderId = $(this).data('order-id');
        let orderStatus = $(this).data('order-status');
        $('#ConfirmModal').modal('show');
        $('#ConfirmModal .confirm-order-btn').data('order-id', orderId);
        $('#ConfirmModal .confirm-order-btn').data('order-status', orderStatus);
    });

    $('#ConfirmModal').on('click', '.confirm-order-btn', function() {
        let orderId = $(this).data('order-id');
        let orderStatus = $(this).data('order-status');
        $.ajax({
            url: '/AutoParts/admin/order/changeStatus?_method=PATCH',
            type: 'POST',
            data: { orderId: orderId, status: orderStatus },
            success: function(response) {
                $('#ConfirmModal').modal('hide');
                window.location.href = '/AutoParts/admin/order/Delivery';
            },
            error: function(xhr, status, error) {
                $('#ConfirmModal .modal-body').html('<p class="text-danger">Có lỗi xảy ra khi xác nhận đơn hàng.</p>');
                $('#ConfirmModal .modal-footer').html('<button type="button" class="btn btn-danger" data-dismiss="modal">Đóng</button>');
            }
        });
    });
});