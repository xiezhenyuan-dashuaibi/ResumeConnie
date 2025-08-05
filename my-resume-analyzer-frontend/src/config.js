// 配置API基础URL
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000'  // 本地开发
  : window.location.origin;  // 使用当前域名，因为是一体化部署

export { API_BASE_URL };