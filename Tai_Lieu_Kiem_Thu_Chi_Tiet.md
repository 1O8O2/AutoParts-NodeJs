# TÀI LIỆU KIỂM THỬ PHẦN MỀM - HỆ THỐNG AUTOPARTS

## Tổng quan
Tài liệu này mô tả chi tiết các test cases được thiết kế để kiểm thử hệ thống AutoParts, bao gồm:
- **Unit Tests**: Kiểm thử từng đơn vị chức năng độc lập
- **Integration Tests**: Kiểm thử tích hợp giữa các module
- **Functional Tests**: Kiểm thử toàn bộ luồng nghiệp vụ

---

## 1. UNIT TESTS

### Bảng 1.1: Unit Test - Module Quản lý Tài khoản & Xác thực

| STT | Tên Test Case | Mô tả | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi |
|-----|---------------|-------|----------------|----------------|------------------|
| 1 | TC-AUTH-001 | Render trang đăng ký thành công | - Module accountController đã được import<br>- Mock req, res objects đã sẵn sàng | 1. Gọi accountController.showRegister(req, res)<br>2. Kiểm tra phương thức render được gọi | - res.render được gọi với tham số 'client/pages/user/register' |
| 2 | TC-AUTH-002 | Redirect về profile khi đã đăng nhập | - User đã có tokenUser hợp lệ<br>- req.cookies.tokenUser = 'valid_token' | 1. Gọi accountController.showLogIn(req, res)<br>2. Kiểm tra redirect | - res.redirect được gọi với '/client/account/profile' |
| 3 | TC-AUTH-003 | Render trang login khi chưa đăng nhập | - req.cookies.tokenUser = undefined | 1. Gọi accountController.showLogIn(req, res)<br>2. Kiểm tra render | - res.render được gọi với 'client/pages/user/login' và messagelist |
| 4 | TC-AUTH-004 | Đăng xuất thành công | - Mock res.clearCookie và req.flash | 1. Gọi accountController.logOut(req, res)<br>2. Kiểm tra cookies bị xóa | - res.clearCookie được gọi cho 'tokenUser' và 'cartId'<br>- Flash message success<br>- Redirect về '/client' |
| 5 | TC-AUTH-005 | Đăng ký thất bại với mật khẩu không khớp | - req.body chứa password ≠ repassword | 1. Set req.body với mật khẩu không khớp<br>2. Gọi register function | - req.flash được gọi với error 'Passwords do not match'<br>- res.redirect('back') |
| 6 | TC-AUTH-006 | Đăng ký thất bại với email đã tồn tại | - Customer.findOne mock return existing user | 1. Mock Customer.findOne trả về user đã tồn tại<br>2. Gọi register với email đã có | - req.flash với error 'Email already exists'<br>- res.redirect('back') |
| 7 | TC-AUTH-007 | Đăng ký thành công với dữ liệu hợp lệ | - Tất cả mock functions sẵn sàng<br>- Dữ liệu đầu vào hợp lệ | 1. Mock Customer.findOne return null<br>2. Mock Cart.create thành công<br>3. Mock Account.create thành công<br>4. Gọi register | - Cart.create được gọi<br>- Account.create được gọi<br>- res.cookie set tokenUser<br>- Flash success message |

### Bảng 1.2: Unit Test - Hàm Tạo Chuỗi/Số Ngẫu nhiên

| STT | Tên Test Case | Mô tả | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi |
|-----|---------------|-------|----------------|----------------|------------------|
| 1 | TC-TOKEN-001 | Kiểm tra độ dài chuỗi sinh ra | - generateRandomString function khả dụng | 1. Gọi generateRandomString(10)<br>2. Kiểm tra length của kết quả | - result.length === 10<br>- typeof result === 'string' |
| 2 | TC-TOKEN-002 | Đảm bảo tính ngẫu nhiên | - Hàm hoạt động bình thường | 1. Gọi generateRandomString(8) 2 lần<br>2. So sánh kết quả | - result1 ≠ result2 |
| 3 | TC-TOKEN-003 | Xác thực ký tự hợp lệ | - Pattern regex /^[A-Za-z0-9]+$/ | 1. Gọi generateRandomString(50)<br>2. Test với regex pattern | - validPattern.test(result) === true |
| 4 | TC-TOKEN-004 | Kiểm thử độ dài = 1 | - Function sẵn sàng | 1. Gọi generateRandomString(1)<br>2. Kiểm tra length và type | - result.length === 1<br>- typeof result === 'string' |
| 5 | TC-TOKEN-005 | Đánh giá hiệu suất với độ dài lớn | - performance.now() khả dụng | 1. Đo thời gian bắt đầu<br>2. Gọi generateRandomString(1000)<br>3. Đo thời gian kết thúc | - result.length === 1000<br>- Thời gian thực hiện < 100ms |
| 6 | TC-TOKEN-006 | Tạo số ngẫu nhiên với độ dài chính xác | - generateRandomNumber function khả dụng | 1. Gọi generateRandomNumber(6)<br>2. Kiểm tra length và type | - result.length === 6<br>- typeof result === 'string' |
| 7 | TC-TOKEN-007 | Chỉ chứa ký tự số | - Pattern /^[0-9]+$/ | 1. Gọi generateRandomNumber(10)<br>2. Test với numeric pattern | - numericPattern.test(result) === true |

### Bảng 1.3: Unit Test - Quản lý Mã OTP

| STT | Tên Test Case | Mô tả | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi |
|-----|---------------|-------|----------------|----------------|------------------|
| 1 | TC-OTP-001 | Tạo OTP với độ dài mặc định | - OTPManager module khả dụng<br>- generateRandomNumber mock sẵn sàng | 1. Gọi OTPManager.generateOTP()<br>2. Kiểm tra kết quả | - otp === '123456'<br>- otp.length === 6 |
| 2 | TC-OTP-002 | Tạo OTP với độ dài tùy chỉnh | - generateRandomNumber mock return '12345' | 1. Gọi OTPManager.generateOTP(5)<br>2. Verify mock được gọi với đúng tham số | - generateRandomNumber called with 5<br>- otp === '12345' |
| 3 | TC-OTP-003 | Xác thực thành công khi OTP khớp | - mockReq với cookies chứa OTP và email | 1. Setup mockReq.cookies với otp='123456', email='test@example.com'<br>2. Gọi verifyOTP với '123456' | - result.isValid === true<br>- result.email === 'test@example.com' |
| 4 | TC-OTP-004 | Xác thực thất bại khi OTP sai | - mockReq với OTP khác với input | 1. Setup cookies với otp='123456'<br>2. Gọi verifyOTP với '654321' | - result.isValid === false<br>- result.message === 'Invalid OTP' |
| 5 | TC-OTP-005 | Xử lý khi không có OTP được lưu | - mockReq.cookies = {} | 1. Gọi verifyOTP với OTP bất kỳ<br>2. Kiểm tra response | - result.isValid === false<br>- result.message === 'OTP has expired or is invalid' |
| 6 | TC-OTP-006 | Xóa OTP cookies | - mockRes với clearCookie method | 1. Gọi OTPManager.clearOTPCookies(mockRes)<br>2. Verify clearCookie calls | - clearCookie called 2 times<br>- Called với 'otp' và 'otp_email' |
| 7 | TC-OTP-007 | Set OTP cookie với options đúng | - mockRes với cookie method | 1. Gọi setOTPCookie với OTP, email, 5 phút<br>2. Verify cookie calls | - Cookie set với maxAge = 5*60*1000ms<br>- httpOnly: true, secure: false |

### Bảng 1.4: Unit Test - Logic Lọc Sản phẩm

| STT | Tên Test Case | Mô tả | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi |
|-----|---------------|-------|----------------|----------------|------------------|
| 1 | TC-FILTER-001 | Hiển thị tất cả sản phẩm khi không có filter | - mockProducts array với 6 sản phẩm<br>- filterProducts function khả dụng | 1. Gọi filterProducts(mockProducts)<br>2. Kiểm tra length và content | - result.length === 6<br>- result === mockProducts |
| 2 | TC-FILTER-002 | Lọc sản phẩm theo thương hiệu Toyota | - mockProducts chứa 2 sản phẩm Toyota | 1. Gọi filterProducts(mockProducts, 'Toyota')<br>2. Verify brand matching | - result.length === 2<br>- Tất cả products có brand === 'Toyota' |
| 3 | TC-FILTER-003 | Lọc theo thương hiệu không tồn tại | - mockProducts không chứa thương hiệu 'Mazda' | 1. Gọi filterProducts(mockProducts, 'Mazda')<br>2. Kiểm tra kết quả | - result.length === 0 |
| 4 | TC-FILTER-004 | Lọc theo danh mục Engine | - mockProducts chứa 3 sản phẩm Engine | 1. Gọi filterProducts(mockProducts, '', 'Engine')<br>2. Verify category matching | - result.length === 3<br>- Tất cả có category === 'Engine' |
| 5 | TC-FILTER-005 | Lọc kết hợp thương hiệu và danh mục | - Data chứa 1 sản phẩm Toyota Brake | 1. Gọi filterProducts(mockProducts, 'Toyota', 'Brake')<br>2. Verify cả 2 điều kiện | - result.length === 1<br>- brand === 'Toyota' && category === 'Brake' |
| 6 | TC-FILTER-006 | Xử lý mảng rỗng | - products = [] | 1. Gọi filterProducts([], 'Toyota', 'Engine')<br>2. Kiểm tra kết quả | - result.length === 0<br>- Array.isArray(result) === true |
| 7 | TC-FILTER-007 | Không thay đổi mảng gốc | - mockProducts original array | 1. Lưu originalLength và originalFirstProduct<br>2. Gọi filterProducts<br>3. Kiểm tra mảng gốc | - mockProducts không thay đổi<br>- result ≠ mockProducts (instance khác) |

### Bảng 1.5: Unit Test - Logic Tính toán Đơn hàng

| STT | Tên Test Case | Mô tả | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi |
|-----|---------------|-------|----------------|----------------|------------------|
| 1 | TC-ORDER-001 | Thêm sản phẩm vào đơn hàng | - OrderCalculator instance<br>- Mock product data | 1. Tạo calculator = new OrderCalculator()<br>2. Tạo product với giá 50000, quantity 2<br>3. Gọi addProduct | - selectedProducts.length === 1<br>- baseTotal === 100000 |
| 2 | TC-ORDER-002 | Tăng số lượng khi thêm sản phẩm trùng | - Calculator với sản phẩm đã có | 1. Thêm product P001 quantity 2<br>2. Thêm lại P001 quantity 1<br>3. Kiểm tra quantity tổng | - selectedProducts.length === 1<br>- quantity === 3<br>- baseTotal === 150000 |
| 3 | TC-ORDER-003 | Xóa sản phẩm khỏi đơn hàng | - Calculator với 2 sản phẩm | 1. Thêm 2 products khác nhau<br>2. Gọi removeProduct('P001')<br>3. Verify kết quả | - selectedProducts.length === 1<br>- Chỉ còn P002<br>- baseTotal cập nhật đúng |
| 4 | TC-ORDER-004 | Cập nhật số lượng sản phẩm | - Calculator với product quantity 2 | 1. Thêm product với quantity 2<br>2. Gọi updateQuantity('P001', 5)<br>3. Kiểm tra changes | - quantity === 5<br>- baseTotal === 250000 |
| 5 | TC-ORDER-005 | Tính tổng tiền không có giảm giá | - Calculator với 2 products | 1. Thêm P001 (50000*2) và P002 (30000*1)<br>2. Gọi calculateTotal()<br>3. Verify total | - total === 130000 |
| 6 | TC-ORDER-006 | Áp dụng giảm giá 10% | - Calculator với product 100000 | 1. Thêm product giá 100000<br>2. Gọi calculateTotal(10)<br>3. Kiểm tra discount | - total === 90000 (giảm 10%) |
| 7 | TC-ORDER-007 | Thêm phí vận chuyển sau giảm giá | - Product 100000, giảm giá 10%, ship 20000 | 1. calculateTotal(10, 20000)<br>2. Verify calculation order | - total === 110000<br>- (100000*0.9) + 20000 |
| 8 | TC-ORDER-008 | Validate discount hợp lệ | - Mock discount với minimum amount | 1. Tạo valid discount<br>2. Gọi validateDiscount với order đủ điều kiện<br>3. Check validation | - return true<br>- Thỏa mãn tất cả điều kiện |

---

## 2. INTEGRATION TESTS

### Bảng 2.1: Integration Test - Luồng Xác thực Người dùng

| STT | Tên Test Case | Mô tả | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi |
|-----|---------------|-------|----------------|----------------|------------------|
| 1 | IT-AUTH-001 | Đăng ký người dùng thành công với dữ liệu hợp lệ | - Express app với routes đã setup<br>- Database mocks configured<br>- Customer.findOne return null | 1. POST request đến /register<br>2. Send valid user data<br>3. Verify database calls | - response.status === 302<br>- Account.create được gọi<br>- Customer.create được gọi<br>- Cart.create được gọi |
| 2 | IT-AUTH-002 | Đăng ký thất bại với mật khẩu không khớp | - App setup với route /register | 1. POST /register với password ≠ repassword<br>2. Check response và side effects | - response.status === 302<br>- Account.create KHÔNG được gọi |
| 3 | IT-AUTH-003 | Đăng ký thất bại với email đã tồn tại | - Customer.findOne mock return existing user | 1. POST /register với email đã có<br>2. Verify rejection | - response.status === 302<br>- Account.create KHÔNG được gọi |
| 4 | IT-AUTH-004 | Đăng nhập thành công với credentials hợp lệ | - Account.findOne return valid account<br>- Customer.findByPk return user data | 1. POST /login với email và password đúng<br>2. Verify authentication flow | - response.status === 302<br>- Account.findOne called với đúng email |
| 5 | IT-AUTH-005 | Đăng nhập thất bại với credentials sai | - Account.findOne return null | 1. POST /login với thông tin sai<br>2. Check failure handling | - response.status === 302<br>- Account.findOne được gọi |
| 6 | IT-AUTH-006 | Đăng nhập thất bại với thông tin thiếu | - No mock setup needed | 1. POST /login với email/password rỗng<br>2. Verify validation | - response.status === 302 |
| 7 | IT-AUTH-007 | Đăng xuất người dùng thành công | - Valid user session | 1. GET /logout với tokenUser cookie<br>2. Check logout process | - response.status === 302 |
| 8 | IT-AUTH-008 | Truy cập profile khi chưa đăng nhập | - Account.findOne return null | 1. GET /profile không có authentication<br>2. Verify redirect | - response.status === 302 (redirect to login) |
| 9 | IT-AUTH-009 | Truy cập profile khi đã đăng nhập | - Valid account và customer data mocked | 1. GET /profile với valid tokenUser<br>2. Setup Order.findAll mock<br>3. Check access | - response.status === 302<br>- Account.findOne được gọi |

### Bảng 2.2: Integration Test - Quản lý Sản phẩm và Giỏ hàng

| STT | Tên Test Case | Mô tả | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi |
|-----|---------------|-------|----------------|----------------|------------------|
| 1 | IT-PROD-001 | Hiển thị chi tiết sản phẩm với thông tin đầy đủ | - Product, Brand, ProductGroup mocks setup | 1. Mock Product.findByPk return product data<br>2. Mock Brand.findByPk return brand info<br>3. Mock ProductGroup.findByPk return group<br>4. GET /product/detail | - Các findByPk methods được gọi<br>- Response chứa đầy đủ thông tin |
| 2 | IT-PROD-002 | Thêm sản phẩm vào giỏ hàng (user đã đăng nhập) | - Valid account và customer<br>- Product tồn tại<br>- Cart đã được tạo | 1. Mock authentication success<br>2. Mock Product.findByPk return product<br>3. Mock Cart operations<br>4. POST /product/add | - Product được thêm vào cart<br>- Cart.save được gọi |
| 3 | IT-PROD-003 | Tìm kiếm sản phẩm với filter | - Products data mocked<br>- Search parameters | 1. Mock Product.findAll với search criteria<br>2. GET /product/search với query params<br>3. Verify filtering logic | - Product.findAll called với đúng where clause<br>- Response chứa filtered products |
| 4 | IT-PROD-004 | Xóa sản phẩm khỏi giỏ hàng | - User có sản phẩm trong cart<br>- ProductsInCart setup | 1. Mock ProductsInCart.findOne return item<br>2. Mock destroy method<br>3. GET /product/remove | - ProductsInCart.destroy được gọi<br>- Item removed from cart |
| 5 | IT-PROD-005 | Kiểm tra stock khi thêm sản phẩm | - Product với stock limited<br>- User cart có item cùng loại | 1. Mock product với stock = 5<br>2. Mock cart có 3 items cùng loại<br>3. Try add 5 more items | - Check stock validation<br>- Reject nếu vượt quá stock |

---

## 3. FUNCTIONAL TESTS

### Bảng 3.1: Functional Test - Hệ thống Quản lý Giỏ hàng

| STT | Tên Test Case | Mô tả | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi |
|-----|---------------|-------|----------------|----------------|------------------|
| 1 | FT-CART-001 | Thêm sản phẩm vào giỏ hàng (user đã đăng nhập) | - User có token hợp lệ<br>- Product PRD001 tồn tại với stock = 50<br>- Cart CART001 đã được tạo | 1. Set cookie tokenUser=valid_token<br>2. Mock Account.findOne return user<br>3. Mock Customer.findByPk return customer với cartId<br>4. Mock Product.findByPk return product info<br>5. POST /AutoParts/product/add với productId, quantity | - response.status === 302<br>- Product.findByPk called với 'PRD001'<br>- mockCart.save được gọi<br>- Sản phẩm được thêm vào cart |
| 2 | FT-CART-002 | Thêm sản phẩm vào giỏ hàng (khách vãng lai) | - User không có token<br>- Product PRD001 tồn tại<br>- Guest cart GUEST_CART | 1. Set cookie cartId=GUEST_CART<br>2. Mock Account.findOne return null<br>3. Mock Product.findByPk return product<br>4. Mock Cart.findByPk return guest cart<br>5. POST /AutoParts/product/add | - response.status === 302<br>- Product.findByPk called với 'PRD001'<br>- Cart.findByPk called với 'GUEST_CART'<br>- Guest cart được cập nhật |
| 3 | FT-CART-003 | Cập nhật số lượng khi thêm sản phẩm đã có | - User đã có sản phẩm P001 với quantity = 2<br>- Thêm 3 items nữa | 1. Setup cart với existing product (amount=2)<br>2. Mock Product.findByPk return same product<br>3. POST add product với quantity=3<br>4. Verify quantity update | - response.status === 302<br>- mockCart.save được gọi<br>- products[0].amount === 5 (2+3) |
| 4 | FT-CART-004 | Từ chối thêm sản phẩm khi không đủ stock | - Product có stock = 5<br>- Cart đã có 3 items cùng loại<br>- Request thêm 5 items nữa | 1. Setup product với stock=5<br>2. Setup cart với existing amount=3<br>3. POST add với quantity=5<br>4. Check stock validation | - Từ chối request (vượt quá stock 5)<br>- Error message về insufficient stock |
| 5 | FT-CART-005 | Xóa sản phẩm khỏi giỏ hàng | - User có sản phẩm trong cart<br>- ProductsInCart setup properly | 1. Mock ProductsInCart.findOne return item<br>2. Mock destroy method success<br>3. GET /product/remove với productId<br>4. Verify removal | - ProductsInCart.destroy được gọi<br>- Item removed successfully<br>- Cart total updated |
| 6 | FT-CART-006 | Cập nhật số lượng sản phẩm trong cart | - Cart có sản phẩm với quantity hiện tại<br>- User request update quantity | 1. Setup cart với product quantity=2<br>2. POST update với newQuantity=5<br>3. Verify database update<br>4. Check total recalculation | - Quantity updated to 5<br>- Total price recalculated<br>- Database persisted |
| 7 | FT-CART-007 | Kiểm tra tính toán tổng tiền cart | - Cart có multiple products<br>- Khác nhau về giá và số lượng | 1. Add product A (50000 x 2)<br>2. Add product B (30000 x 1)<br>3. Calculate total<br>4. Verify calculation | - Total = (50000*2) + (30000*1) = 130000<br>- Calculation chính xác |

### Bảng 3.2: Functional Test - Workflow Quản lý Trạng thái Đơn hàng (Admin)

| STT | Tên Test Case | Mô tả | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi |
|-----|---------------|-------|----------------|----------------|------------------|
| 1 | FT-ADMIN-001 | Hiển thị danh sách đơn hàng với filter trạng thái | - Admin đã đăng nhập<br>- Database có orders với các trạng thái khác nhau | 1. Mock admin authentication<br>2. Mock Order.findAll với status filter<br>3. GET /admin/order với status parameter<br>4. Verify filtered results | - Order.findAll called với đúng where clause<br>- Chỉ orders với status được chọn<br>- Response chứa filtered orders |
| 2 | FT-ADMIN-002 | Cập nhật trạng thái đơn hàng từ Pending sang Processing | - Order tồn tại với status = 'Pending'<br>- Admin có quyền update | 1. Mock Order.findByPk return pending order<br>2. Mock update method success<br>3. PUT /admin/order/update-status<br>4. Send {status: 'Processing'} | - Order.update called với status='Processing'<br>- Success response<br>- Status changed in database |
| 3 | FT-ADMIN-003 | Cập nhật trạng thái sang Shipped và gửi email | - Order status = 'Processing'<br>- Customer email valid<br>- Mail service configured | 1. Mock order với customer info<br>2. Mock mailSend success<br>3. PUT update status='Shipped'<br>4. Verify email sent | - Status updated to 'Shipped'<br>- mailSend called với customer email<br>- Email notification sent |
| 4 | FT-ADMIN-004 | Cập nhật trạng thái sang Delivered | - Order status = 'Shipped'<br>- Delivery confirmation | 1. Mock shipped order<br>2. PUT status='Delivered'<br>3. Verify completion workflow | - Status = 'Delivered'<br>- Order marked as completed<br>- Timestamp updated |
| 5 | FT-ADMIN-005 | Hủy đơn hàng và hoàn trả stock | - Order status = 'Pending' hoặc 'Processing'<br>- Products trong order<br>- Stock cần được restore | 1. Mock order với order details<br>2. Mock Product.update để restore stock<br>3. PUT status='Cancelled'<br>4. Verify stock restoration | - Status = 'Cancelled'<br>- Product stock được hoàn trả<br>- Order details updated |
| 6 | FT-ADMIN-006 | Tìm kiếm đơn hàng theo mã đơn hàng | - Database có multiple orders<br>- Admin search bằng order ID | 1. Mock Order.findAll với where orderId<br>2. GET /admin/order/search?orderId=ORD001<br>3. Verify search results | - Chỉ order có ID matching được trả về<br>- Search query chính xác |
| 7 | FT-ADMIN-007 | Xem chi tiết đơn hàng đầy đủ | - Order tồn tại với order details<br>- Customer và product info | 1. Mock Order.findByPk với include relations<br>2. Mock Customer và Product data<br>3. GET /admin/order/detail/:id<br>4. Verify complete data | - Order details với customer info<br>- Products trong order<br>- Pricing và discount info |
| 8 | FT-ADMIN-008 | Không cho phép cập nhật order đã hoàn thành | - Order status = 'Delivered' hoặc 'Cancelled' | 1. Mock completed order<br>2. Try PUT update status<br>3. Verify rejection | - Update bị từ chối<br>- Error message appropriate<br>- Status không thay đổi |

### Bảng 3.3: Functional Test - Hệ thống Tìm kiếm Sản phẩm

| STT | Tên Test Case | Mô tả | Tiền điều kiện | Bước thực hiện | Kết quả mong đợi |
|-----|---------------|-------|----------------|----------------|------------------|
| 1 | FT-SEARCH-001 | Tìm kiếm sản phẩm theo từ khóa | - Database có products với tên khác nhau<br>- Search functionality active | 1. Mock Product.findAll với LIKE operator<br>2. GET /product/search?keyword=engine<br>3. Verify search results | - Products có tên chứa 'engine'<br>- Case-insensitive search<br>- Relevant results returned |
| 2 | FT-SEARCH-002 | Lọc sản phẩm theo thương hiệu | - Products thuộc nhiều brands khác nhau | 1. Mock Brand.findAll<br>2. Mock Product.findAll với brand filter<br>3. GET /product/filter?brand=Toyota<br>4. Verify filtering | - Chỉ products của Toyota<br>- Brand information included |
| 3 | FT-SEARCH-003 | Lọc sản phẩm theo danh mục | - Products thuộc nhiều categories | 1. Mock ProductGroup.findAll<br>2. Mock products với category filter<br>3. Apply category filter<br>4. Check results | - Products trong category được chọn<br>- Category hierarchy respected |
| 4 | FT-SEARCH-004 | Lọc kết hợp nhiều tiêu chí | - Products với brands và categories khác nhau | 1. Apply multiple filters đồng thời<br>2. Brand + Category + Price range<br>3. Verify combined filtering | - Products thỏa mãn TẤT CẢ điều kiện<br>- Complex query executed correctly |
| 5 | FT-SEARCH-005 | Sắp xếp kết quả tìm kiếm | - Search results cần được sort | 1. GET products với sort parameter<br>2. Sort by price, name, popularity<br>3. Verify ordering | - Results sorted theo criteria<br>- Consistent ordering |
| 6 | FT-SEARCH-006 | Phân trang kết quả tìm kiếm | - Large number of search results | 1. Mock products với pagination<br>2. GET với page và limit params<br>3. Verify pagination logic | - Correct number per page<br>- Pagination metadata<br>- Navigation working |
| 7 | FT-SEARCH-007 | Xử lý tìm kiếm không có kết quả | - Search keyword không match product nào | 1. Mock Product.findAll return empty<br>2. Search với từ khóa không tồn tại<br>3. Verify empty state handling | - Empty results handled gracefully<br>- Appropriate message displayed<br>- No errors thrown |

---

## KẾT LUẬN

Tài liệu này cung cấp bộ test cases toàn diện cho hệ thống AutoParts, đảm bảo:

### Độ phủ kiểm thử (Test Coverage):
- **Unit Tests**: 35 test cases kiểm thử các đơn vị chức năng nhỏ nhất
- **Integration Tests**: 14 test cases kiểm thử tích hợp giữa các module  
- **Functional Tests**: 22 test cases kiểm thử toàn bộ luồng nghiệp vụ

### Phạm vi kiểm thử:
- Xác thực và quản lý tài khoản người dùng
- Quản lý sản phẩm và giỏ hàng
- Tìm kiếm và lọc sản phẩm  
- Quy trình đặt hàng và quản lý đơn hàng
- Tính toán giá và áp dụng khuyến mãi
- Bảo mật và phân quyền

### Tiêu chuẩn chất lượng:
- Mỗi test case có mô tả rõ ràng mục đích và kết quả mong đợi
- Tiền điều kiện và bước thực hiện được định nghĩa cụ thể
- Bao phủ cả test cases tích cực (positive) và tiêu cực (negative)
- Kiểm thử edge cases và error handling

Bộ test cases này đảm bảo hệ thống AutoParts hoạt động đúng, ổn định và đáp ứng yêu cầu nghiệp vụ.
