# Tài Liệu Mô Tả Hệ Thống Kiểm Thử - Dự Án AutoParts-NodeJs

## Tổng Quan

Dự án AutoParts-NodeJs sử dụng một hệ thống kiểm thử toàn diện được xây dựng dựa trên framework **Jest** với ba loại kiểm thử chính: **Unit Tests**, **Integration Tests**, và **Functional Tests**. Hệ thống này đảm bảo chất lượng code và độ tin cậy của ứng dụng thương mại điện tử bán phụ tùng xe hơi.

## Cấu Trúc Thư Mục Kiểm Thử

```
tests/
├── setup.js                    # Cấu hình và mock chung cho toàn bộ hệ thống test
├── helpers/                    # Các utility hỗ trợ kiểm thử
│   └── testApp.js              # Ứng dụng Express mock cho test
├── unit/                       # Kiểm thử đơn vị (Unit Tests)
├── integration/                # Kiểm thử tích hợp (Integration Tests)  
└── functional/                 # Kiểm thử chức năng (Functional Tests)
```

## 1. Cấu Hình Hệ Thống Kiểm Thử

### 1.1 File Cấu Hình Jest (`jest.config.json`)

```json
{
  "testEnvironment": "node",          // Môi trường test Node.js
  "collectCoverage": true,            // Thu thập thông tin độ phủ code
  "coverageDirectory": "coverage",    // Thư mục lưu báo cáo coverage
  "coverageReporters": ["text", "lcov", "html"], // Định dạng báo cáo
  "testMatch": ["**/tests/**/*.test.js"],        // Pattern file test
  "collectCoverageFrom": [            // Các thư mục cần đo coverage
    "helpers/**/*.js",
    "services/**/*.js", 
    "controller/**/*.js",
    "middlewares/**/*.js",
    "models/**/*.js",
    "public/js/**/*.js"
  ],
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"], // File setup
  "testTimeout": 30000,              // Timeout cho mỗi test
  "forceExit": true,                 // Thoát test sau khi hoàn thành
  "detectOpenHandles": true          // Phát hiện resource chưa đóng
}
```

### 1.2 File Setup (`tests/setup.js`)

File này chứa các cấu hình global cho toàn bộ hệ thống test:

**Chức năng chính:**
- Thiết lập môi trường test với `NODE_ENV = 'test'`
- Mock các biến môi trường cần thiết (database, cookie secret, etc.)
- Mock Sequelize để tránh kết nối database thật trong test
- Tắt console.log để giảm noise trong quá trình test
- Cung cấp các mock methods chuẩn cho database operations

**Mock Database Operations:**
```javascript
// Mock các phương thức database phổ biến
MockModel.findAll = jest.fn();
MockModel.findOne = jest.fn();
MockModel.findByPk = jest.fn();
MockModel.create = jest.fn();
MockModel.update = jest.fn();
MockModel.destroy = jest.fn();
MockModel.bulkCreate = jest.fn();
```

## 2. Kiểm Thử Đơn Vị (Unit Tests)

### 2.1 Mục Đích
Kiểm thử các thành phần riêng lẻ của hệ thống một cách độc lập, đảm bảo từng function hoạt động đúng logic thiết kế.

### 2.2 Danh Sách Các Unit Tests

#### 2.2.1 `accountController.test.js`
**Mô tả:** Kiểm thử module quản lý tài khoản và xác thực người dùng

**Chức năng được test:**
- `showRegister()`: Hiển thị trang đăng ký
- `showLogIn()`: Hiển thị trang đăng nhập  
- `register()`: Xử lý logic đăng ký người dùng mới
- `login()`: Xử lý logic đăng nhập
- `logout()`: Xử lý đăng xuất và xóa session
- Quản lý cookies và session sau authentication

**Kỹ thuật test:**
- Mock toàn bộ models (Account, Customer, Cart)
- Mock bcrypt để test hash password
- Kiểm tra redirect URLs và flash messages
- Validate dữ liệu đầu vào và error handling

#### 2.2.2 `generateToken.test.js`
**Mô tả:** Kiểm thử helper tạo token bảo mật

**Chức năng được test:**
- Tạo token ngẫu nhiên với độ dài khác nhau
- Đảm bảo tính duy nhất của token
- Validate format và charset của token

#### 2.2.3 `orderCalculation.test.js`
**Mô tả:** Kiểm thử logic tính toán đơn hàng

**Chức năng được test:**
- Tính tổng giá trị đơn hàng
- Áp dụng discount và coupon
- Tính phí vận chuyển
- Tính tax và các phí phụ
- Xử lý trường hợp giá âm hoặc invalid

#### 2.2.4 `otpManager.test.js`
**Mô tả:** Kiểm thử hệ thống quản lý OTP

**Chức năng được test:**
- Tạo OTP với expiry time
- Validate OTP
- Cleanup OTP hết hạn
- Rate limiting cho việc gửi OTP

#### 2.2.5 `productFilter.test.js`  
**Mô tả:** Kiểm thử logic lọc sản phẩm

**Chức năng được test:**
- Filter theo category, brand, price range
- Search theo keyword
- Pagination logic
- Sort theo các tiêu chí khác nhau

#### 2.2.6 `sessionManager.test.js`
**Mô tả:** Kiểm thử service quản lý session

**Chức năng được test:**
- Tạo và destroy session
- Kiểm tra session timeout
- Session security và validation
- Cleanup expired sessions

### 2.3 Cấu Trúc Chung Unit Test

```javascript
describe('Tên Module', () => {
  beforeEach(() => {
    // Reset mocks trước mỗi test
    jest.clearAllMocks();
  });

  describe('Tên Function', () => {
    it('should handle success case', async () => {
      // Arrange: Setup data và mocks
      // Act: Gọi function cần test
      // Assert: Kiểm tra kết quả
    });

    it('should handle error case', async () => {
      // Test error scenarios
    });
  });
});
```

## 3. Kiểm Thử Tích Hợp (Integration Tests)

### 3.1 Mục Đích
Kiểm thử sự tương tác giữa các module/component khác nhau, đảm bảo chúng hoạt động ăn ý với nhau.

### 3.2 Danh Sách Integration Tests

#### 3.2.1 `auth.integration.test.js`
**Mô tả:** Kiểm thử toàn bộ luồng xác thực người dùng

**Luồng được test:**
- **Đăng ký người dùng:** 
  - Validate input data
  - Tạo Account record
  - Tạo Customer record
  - Tạo Cart cho customer
  - Setup session
- **Đăng nhập:**
  - Xác thực credentials
  - Tạo session
  - Set cookies
- **Đăng xuất:**
  - Clear session
  - Clear cookies
- **Route Protection:**
  - Kiểm tra middleware authentication
  - Redirect về login page khi chưa auth

#### 3.2.2 `admin.dashboard.integration.test.js`
**Mô tả:** Kiểm thử dashboard admin với các thống kê tổng hợp

**Chức năng được test:**
- Load dữ liệu thống kê từ multiple models
- Tính toán metrics (doanh thu, đơn hàng, khách hàng mới)
- Render charts và graphs
- Permission checking cho admin

#### 3.2.3 `admin.product.integration.test.js`
**Mô tả:** Kiểm thử luồng quản lý sản phẩm của admin

**Luồng được test:**
- CRUD operations cho products
- Upload và quản lý hình ảnh
- Quản lý categories và brands
- Inventory management
- Product approval workflow

#### 3.2.4 `order.integration.test.js`
**Mô tả:** Kiểm thử quy trình đặt hàng end-to-end

**Luồng được test:**
- Thêm sản phẩm vào cart
- Apply discount codes
- Calculate shipping
- Process payment
- Create order records
- Update inventory
- Send confirmation emails

#### 3.2.5 `product.integration.test.js`
**Mô tả:** Kiểm thử tính năng sản phẩm phía client

**Chức năng được test:**
- Product listing với pagination
- Product detail view
- Related products
- Reviews và ratings
- Wishlist functionality

### 3.3 Đặc Điểm Integration Tests

- Sử dụng **supertest** để test HTTP endpoints
- Mock database nhưng giữ logic business
- Test real request/response cycle
- Kiểm tra middleware chain
- Validate session và cookie handling

## 4. Kiểm Thử Chức Năng (Functional Tests)

### 4.1 Mục Đích
Kiểm thử các tính năng business từ góc nhìn người dùng cuối, mô phỏng các user stories và use cases thực tế.

### 4.2 Danh Sách Functional Tests

#### 4.2.1 `cart.management.functional.test.js`
**Mô tả:** Kiểm thử toàn diện hệ thống quản lý giỏ hàng

**Scenarios được test:**

**User đã đăng nhập:**
- Thêm sản phẩm vào cart → Lưu vào database
- Update số lượng → Recalculate totals
- Remove sản phẩm → Update cart state
- Apply coupon code → Validate và calculate discount
- Proceed to checkout → Validate cart data

**Guest user:**
- Thêm sản phẩm → Lưu vào session/cookies
- Convert guest cart khi login
- Merge duplicate products
- Handle cart expiry

**Edge cases:**
- Out of stock products
- Invalid quantities
- Expired discounts
- Cart với mixed product types

#### 4.2.2 `product.search.functional.test.js`
**Mô tả:** Kiểm thử tính năng tìm kiếm sản phẩm

**Test scenarios:**
- Search by keyword
- Filter theo multiple criteria
- Sort results
- Pagination
- No results handling
- Search suggestions
- Recently viewed products

#### 4.2.3 `customer.profile.functional.test.js`
**Mô tả:** Kiểm thử quản lý profile khách hàng

**Chức năng được test:**
- Update thông tin cá nhân
- Change password
- Manage addresses
- Order history
- Wishlist management
- Account settings

#### 4.2.4 `discount.system.functional.test.js`
**Mô tả:** Kiểm thử hệ thống khuyến mãi và discount

**Test scenarios:**
- Apply percentage discount
- Apply fixed amount discount
- Minimum order value requirements
- User-specific coupons
- Time-limited promotions
- Stacking multiple discounts
- Invalid/expired codes

#### 4.2.5 `admin.order.status.functional.test.js`
**Mô tả:** Kiểm thử workflow quản lý đơn hàng

**Luồng được test:**
- Order creation
- Status transitions (Pending → Processing → Shipped → Delivered)
- Cancel orders
- Refund processing
- Inventory updates
- Customer notifications
- Admin notifications

### 4.3 Đặc Điểm Functional Tests

- Test complete user journeys
- Focus on business value
- Include error scenarios and edge cases
- Validate UI/UX behaviors
- Test cross-functional requirements

## 5. Coverage và Metrics

### 5.1 Thư Mục Coverage
Hệ thống tự động tạo báo cáo coverage tại `coverage/`:

```
coverage/
├── lcov-report/           # Báo cáo HTML chi tiết
├── index.html            # Trang tổng quan coverage
└── lcov.info            # Raw coverage data
```

### 5.2 Modules Được Đo Coverage

- `helpers/`: Utility functions
- `services/`: Business logic services  
- `controller/`: Request handlers
- `middlewares/`: Express middlewares
- `models/`: Database models
- `public/js/`: Client-side JavaScript

### 5.3 Metrics Quan Trọng

- **Line Coverage**: % dòng code được test
- **Function Coverage**: % functions được test
- **Branch Coverage**: % nhánh logic được test
- **Statement Coverage**: % statements được test

## 6. Quy Trình Chạy Tests

### 6.1 Commands Cơ Bản

```bash
# Chạy tất cả tests
npm test

# Chạy với coverage
npm run test:coverage

# Chạy specific test file
npm test -- accountController.test.js

# Chạy tests trong watch mode
npm test -- --watch
```

### 6.2 Test Development Workflow

1. **Viết test trước** (TDD approach)
2. **Implement feature** để pass tests
3. **Refactor** với sự bảo vệ của tests
4. **Check coverage** và thêm tests nếu cần
5. **Review** và merge code

## 7. Best Practices

### 7.1 Naming Conventions
- File test: `[module].test.js`
- Describe blocks: Mô tả module/function
- Test cases: `should [expected behavior] when [condition]`

### 7.2 Test Structure
- **Arrange**: Setup data và mocks
- **Act**: Execute function under test  
- **Assert**: Verify expected outcomes

### 7.3 Mock Strategy
- Mock external dependencies
- Keep business logic testable
- Use realistic test data
- Clean up mocks between tests

### 7.4 Error Testing
- Test happy path và error scenarios
- Validate error messages
- Check proper HTTP status codes
- Test edge cases và boundary conditions

## 8. Maintenance và Troubleshooting

### 8.1 Common Issues

**Test timeout:** Tăng timeout trong jest.config.json
**Memory leaks:** Đảm bảo cleanup trong afterEach/afterAll
**Flaky tests:** Review async operations và timing issues
**Coverage gaps:** Thêm tests cho uncovered branches

### 8.2 Test Data Management

- Sử dụng factory functions cho test data
- Reset database state giữa các tests
- Mock time-dependent operations
- Isolate tests từ external services

## 9. Tương Lai và Mở Rộng

### 9.1 Planned Improvements

- **E2E Tests**: Thêm Cypress/Playwright tests
- **Performance Tests**: Load testing với Artillery
- **Visual Regression**: Screenshot comparison tests
- **API Contract Tests**: OpenAPI validation

### 9.2 Monitoring

- Track test execution time
- Monitor flaky test frequency  
- Coverage trend analysis
- Test maintenance overhead

---

*Tài liệu này được cập nhật thường xuyên để phản ánh các thay đổi trong hệ thống kiểm thử.*
