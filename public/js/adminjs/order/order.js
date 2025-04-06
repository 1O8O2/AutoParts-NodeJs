let selectedProducts = [];

function formatCurrency(amount) {
    const number = Number(amount);
    if (isNaN(number)) return "0₫";
    let formattedNumber = number.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return formattedNumber.replace(/\./g, '.') + '₫';
}

function addProduct(product) {
    if (!selectedProducts.some(p => p.productId === product.productId)) {
        selectedProducts.push({ ...product, quantity: 1 });
        updateSelectedProducts();
        calculateTotal();
        updateDiscountOptions();
    } else {
        alert('Sản phẩm đã được chọn!');
    }
}

function removeProduct(productId) {
    productId = String(productId);
    selectedProducts = selectedProducts.filter(p => p.productId != productId);
    updateSelectedProducts();
    calculateTotal();
    updateDiscountOptions();
}

function updateSelectedProducts() {
    let html = '';
    let inputsHtml = '';
    selectedProducts.forEach((product, index) => {
        html += `<div class="selected-item">
                    <div>
                        <div>${product.productName}</div>
                        <div> Giá: ${formatCurrency(product.salePrice)}</div>
                    </div>
                    <div class="d-flex justify-content-end">
                        <input type="number" class="quantity-input" min="1" max="${product.productStock}" value="${product.quantity}" onchange="updateQuantity('${product.productId}', this.value)">
                        <button type="button" class="btn btn-danger btn-sm" onclick="removeProduct('${product.productId}')">Xóa</button>
                    </div>
                </div>`;
        inputsHtml += `<input type="hidden" name="orderDetails[${index}].productId" value="${product.productId}" />
                        <input type="hidden" name="orderDetails[${index}].productName" value="${product.productName}" />
                        <input type="hidden" name="orderDetails[${index}].amount" value="${product.quantity}" />
                        <input type="hidden" name="orderDetails[${index}].unitPrice" value="${product.salePrice}" />`;
    });
    $('#selectedProducts').html(html);
    $('#selectedProductsInputs').html(inputsHtml);
}

function updateQuantity(productId, newQuantity) {
    selectedProducts = selectedProducts.map(p => {
        if (p.productId === productId) p.quantity = parseInt(newQuantity) || 1;
        return p;
    });
    updateSelectedProducts();
    calculateTotal();
    updateDiscountOptions();
}

function calculateTotal(discountAmount = 0) {
    let total = selectedProducts.reduce((sum, product) => sum + (product.salePrice * product.quantity), 0);
    if (discountAmount != 0) total *= (100 - discountAmount) / 100;
    $('#totalCostlbl').text(formatCurrency(total));
    $('#totalCost').val(total);
}

function updateDiscountOptions() {
    const totalCost = Number($('#totalCost').val());
    const currentDate = new Date();
    const orderDiscountId = $('#discountSelect').attr('data-order-discount-id') || ''; 

    // Lưu trạng thái ban đầu của option được chọn từ order
    const $initialSelectedOption = $('#discountSelect option[value="' + orderDiscountId + '"]');
    const hasInitialSelection = $initialSelectedOption.length > 0 && orderDiscountId !== '';
    let initialVal;

    $('#discountSelect option').each(function() {
        const $this = $(this);
        const discountId = $this.val();

        if (discountId === '') {
            $this.prop('disabled', false);
            $this.show();
            return; 
        }

        const minimumAmount = Number($this.data('minimum-amount'));
        const status = $this.data('status');
        const usageLimit = Number($this.data('usage-limit'));
        const applyStart = new Date($this.data('apply-start'));
        const applyEnd = new Date($this.data('apply-end'));
        const isValid = totalCost >= minimumAmount && 
                       status === 'Active' && 
                       currentDate >= applyStart && 
                       currentDate <= applyEnd && 
                       usageLimit > 0;

        if (hasInitialSelection && discountId === orderDiscountId) {
            initialVal = $this.data('discount-amount');
            calculateTotal(initialVal);
            $this.prop('disabled', false);
            $this.show();
        } else {
            $this.prop('disabled', !isValid);
            $this.toggle(isValid);
        }
    });

    // Kiểm tra giá trị hiện tại của #discountSelect
    const selectedDiscount = $('#discountSelect').val();
    if (!selectedDiscount || $('#discountSelect option[value="' + selectedDiscount + '"]').is(':hidden')) {
        // Chỉ đặt lại về '' nếu không có orderDiscountId hoặc option ban đầu không hợp lệ
        if (!hasInitialSelection) {
            $('#discountSelect').val('');
        }
    } else if (hasInitialSelection && selectedDiscount !== orderDiscountId) {
        // Đảm bảo giữ nguyên orderDiscountId nếu nó vẫn hiển thị
        $('#discountSelect').val(orderDiscountId);
    }
}

$(document).ready(function() {
    $('.selected-item').each(function() {
        var index = $(this).data('index');
        var product = {
            productId: $(this).data('product-id'),
            productName: $(this).data('product-name'),
            salePrice: $(this).data('unit-price'),
            quantity: parseInt($(this).data('amount')) || 1
        };
        selectedProducts.push(product);
        updateSelectedProducts();
        calculateTotal();
        updateDiscountOptions();
    });

    $('#discountSelect').on('change', function() {
        const selectedOption = $(this).find('option:selected');
        const discountAmount = parseFloat(selectedOption.attr('data-discount-amount')) || 0;
        calculateTotal(discountAmount); 
    });

    $('#productSearch').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('.product-detail-item').each(function() {
            const productName = $(this).data('product-name').toLowerCase();
            $(this).toggle(productName.includes(searchTerm));
        });
    });

    $(document).on('click', '.product-detail-item', function() {
        const product = {
            productId: $(this).data('product-id'),
            productName: $(this).data('product-name'),
            salePrice: $(this).data('sale-price'),
            productStock: $(this).data('product-stock')
        };
        addProduct(product);
    });

    $('form').on('submit', function(e) {
        if (selectedProducts.length === 0) {
            e.preventDefault();
            alert('Vui lòng chọn ít nhất một sản phẩm trước khi lưu đơn hàng!');
            return false;
        }
        updateSelectedProducts();
    });
});

