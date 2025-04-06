const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 根路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST请求处理
app.post('/api/data', (req, res) => {
  // 获取请求体中的数据
  const requestData = req.body;
  
  // 创建响应数据
  const responseData = {
    success: true,
    message: '数据已成功接收',
    receivedData: requestData,
    timestamp: new Date().toISOString()
  };
  
  // 返回JSON格式的响应
  res.json(responseData);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 