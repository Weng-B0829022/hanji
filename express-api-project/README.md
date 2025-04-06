# Express API 服务器

这是一个简单的Express API服务器，用于处理POST请求并返回JSON格式的数据。

## 功能

- 接收POST请求
- 处理JSON格式数据
- 返回JSON格式响应
- 跨域请求支持

## 安装

```bash
# 克隆仓库
git clone [仓库URL]

# 进入项目目录
cd express-api-project

# 安装依赖
npm install
```

## 使用方法

### 启动服务器

```bash
# 使用Node启动
npm start

# 或者使用nodemon（开发模式）
npm run dev
```

服务器将在 http://localhost:3000 上运行。

### API端点

#### GET /
- 返回欢迎信息
- 响应格式: `{ "message": "欢迎使用Express API服务器" }`

#### POST /api/data
- 接收任何JSON数据
- 返回接收到的数据及其他信息

#### 示例请求

使用curl:
```bash
curl -X POST -H "Content-Type: application/json" -d '{"name":"测试","value":123}' http://localhost:3000/api/data
```

使用JavaScript Fetch API:
```javascript
fetch('http://localhost:3000/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: '测试',
    value: 123
  }),
})
.then(response => response.json())
.then(data => console.log(data));
```

#### 示例响应

```json
{
  "success": true,
  "message": "数据已成功接收",
  "receivedData": {
    "name": "测试",
    "value": 123
  },
  "timestamp": "2023-04-01T12:34:56.789Z"
}
```

## 依赖

- express - Web服务器框架
- body-parser - 请求体解析
- cors - 跨域资源共享 