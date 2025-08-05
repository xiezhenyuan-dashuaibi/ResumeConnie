
import React, { useState, useEffect ,useRef} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResumeEditor.css';
import ReactMarkdown from 'react-markdown';
import { API_BASE_URL } from './config.js';


function ResumeEditor() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 从路由状态中获取数据（现在主要用于显示确认）
  const { jobTitle, resumeText, initialResults, allRateResults } = location.state || {};
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState([0]);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [polishResult, setPolishResult] = useState(null); // 保存第二步优化结果
  const [optimizationResult, setOptimizationResult] = useState(null); // 新增：保存第四步优化结果
  const [currentRowIndex, setCurrentRowIndex] = useState(0); // 新增：当前显示的表格行索引
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const textareaRef = useRef(null); 
  const [projectChatInput, setProjectChatInput] = useState(""); // 重命名为更明确的名称
  const [isProjectChatSending, setIsProjectChatSending] = useState(false); // 独立的发送状态
  // 添加页面状态
  const [currentPage, setCurrentPage] = useState(1);
  // 新增：添加header状态变量
  const [currentHeader, setCurrentHeader] = useState("项目经历优化");
  // 添加左右文本容器的状态
  const [leftTextContent, setLeftTextContent] = useState("");
  const [rightTextContent, setRightTextContent] = useState("");
  

  const [isPageChanging, setIsPageChanging] = useState(false); // 新增状态，用于防止重复点击
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(0); // 0: 完成按钮, 1: 确认完成按钮, 2: 进入思考状态
  const finishButtonRef = useRef(null);

  // 新增：对话相关状态
  const [chatInput, setChatInput] = useState(''); // 对话输入框内容
  const [isFirstCardThinking, setIsFirstCardThinking] = useState(false); // 第一张卡片AI思考中状态
  // 在现有状态变量后添加动画状态
  const [isContentAnimating, setIsContentAnimating] = useState(false);
  const [leftTextAnimationClass, setLeftTextAnimationClass] = useState('');
  const [rightTextAnimationClass, setRightTextAnimationClass] = useState('');
  const [centerTextAnimationClass, setCenterTextAnimationClass] = useState('');
  // 第一张卡片的设置状态
  const [settings, setSettings] = useState({
    setting1: 1, // 默认选择"适度包装"
    setting2: 1, // 默认选择"保持"
    setting3: 1, // 默认选择"专业"
  });

  // 选项映射
  const optionMappings = {
    setting1: ['高风险', '适度包装', '真实模式'],
    setting2: ['扩写', '保持', '精干'],
    setting3: ['小白', '专业', '转行']
  };

  const placeholderTexts = [
    "对方案不满意？向AI提出你的建议或不满，AI自动优化方案。",
    "AI很笨，因此你的想法很重要，请告诉AI更多！",
    "AI此处仅给出大致方案，若差强人意，即可进入后续步骤具体修改。",
    "注意：此功能AI无记忆。",
    "“这个方案对我来说太过大胆了”",
    "“这个方案有点脱离实际，请提供更踏实的方案”",
    "“你遗漏了一些项目！”"
  ];

  // 选项详细解释
  const optionDescriptions = {
    setting1: [
      '允许在原经历的基础上适度延展虚构，尽量贴合岗位目标求职者画像，但存在一定风险',
      '保持原经历的核心内容并进行一定的修饰、改写与迁移，不过度包装，使内容更契合岗位的同时难以被质疑',
      '尽量真实地保持原有内容，仅优化语言表达'
    ],
    setting2: [
      '略扩充经历描述长度，适用于原简历内容不够充足、缺乏细节的情况',
      '修改后的经历描述尽量维持原简历长度，仅对内容进行优化与整改',
      '在不失去重要细节的前提下略缩减描述长度，适用于原简历内容充足甚至略冗长的情况'
    ],
    setting3: [
      '适合经历较少的求职者，突出在校经历与技能特长，AI辅助挖掘经历亮点',
      '适合有较多对口经历的求职者，强调专业技能与经验，表述风格贴合岗位需求',
      '对经历进行调整与迁移，凸显可转移技能和学习能力'
    ]
  };

  
  // 处理焦点进入（开始编辑）
  const handleFocus = () => {
    setIsEditing(true);
  };

  // 处理焦点离开（结束编辑，渲染 Markdown）
  const handleBlur = () => {
    setIsEditing(false);
  };

  // 处理文本变化
  const handleTextChange = (e) => {
    setMarkdownContent(e.target.value);
  };


  
  // 自动滚动提示语的useEffect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => 
        (prevIndex + 1) % placeholderTexts.length
      );
    }, 5000); 
        
    return () => clearInterval(interval);
  }, [placeholderTexts.length]);

  // 当用户点击"完成"按钮后，如果点击页面其他地方，则恢复按钮状态
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (finishButtonRef.current && !finishButtonRef.current.contains(event.target)) {
        // 只有在确认状态（状态1）时才重置，思考状态（状态2）时不重置
        if (isConfirmingFinish === 1) {
          setIsConfirmingFinish(0);
        }
      }
    };

    // 只有在确认状态时才添加事件监听器
    if (isConfirmingFinish === 1) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isConfirmingFinish]);


  // 内容动画更新函数
  const updateContentWithAnimation = (newLeftContent, newRightContent, newCenterContent) => {
    setIsContentAnimating(true);
    
    // 立即清除内容并设置淡出动画
    setLeftTextContent('');
    setRightTextContent('');
    setMarkdownContent('');
    
    setLeftTextAnimationClass('fadeOutText');
    setRightTextAnimationClass('fadeOutText');
    setCenterTextAnimationClass('fadeOutText');
    
    // 调整延迟时间：从300ms改为600ms（与fadeOut动画时间一致）
    setTimeout(() => {
      setLeftTextContent(newLeftContent);
      setRightTextContent(newRightContent);
      setMarkdownContent(newCenterContent);
      
      setLeftTextAnimationClass('fadeInText');
      setRightTextAnimationClass('fadeInText');
      setCenterTextAnimationClass('fadeInText');
      
      // 调整延迟时间：从500ms改为1000ms（与fadeIn动画时间一致）
      setTimeout(() => {
        setLeftTextAnimationClass('');
        setRightTextAnimationClass('');
        setCenterTextAnimationClass('');
        setIsContentAnimating(false);
      }, 1000);
    }, 600);
  };



  // 上一页处理函数
  const handlePreviousPage = async () => {
    if (isPageChanging) return; // 如果正在切换，则直接返回
    setIsPageChanging(true); // 开始切换
    console.log('点击上一项按钮');
    
    try {
      // 获取当前中间容器的内容
      const currentCenterContent = markdownContent || '';
      
      // 立即触发卡片切换动画和页面状态更新
      setCards(prev => [...prev, prev.length]);
      setCurrentIndex(prev => prev + 1);
      setCurrentPage(prev => prev - 1);
      
      // 立即清除内容
      setLeftTextContent('');
      setRightTextContent('');
      setMarkdownContent('');
      
      // 并行执行API调用，传递中间容器内容
      const response = await fetch(`${API_BASE_URL}/previous_item/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'previous',
          center_content: currentCenterContent  // 传递中间容器内容
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('上一项结果:', result);
      
      if (result.success === true) {
        // 更新优化结果数据
        setOptimizationResult(result);
        
        // 更新current_index和header
        if (result.current_index !== undefined) {
          setCurrentPage(result.current_index);
        }
        if (result.header) {
          setCurrentHeader(result.header);
        }
        
        // 使用相同的填充逻辑填充三个容器
        const currentIndex = result.current_index;
        
        let newLeftContent = '';
        let newRightContent = '';
        let newCenterContent = '';
        
        // 填充中间容器
        if (result.memory_dict && result.memory_dict[currentIndex] && result.memory_dict[currentIndex]['polished_project']) {
          newCenterContent = result.memory_dict[currentIndex]['polished_project'];
        }
        
        // 填充左侧和右侧容器
        if (result.desc_polished_all_project && result.desc_polished_all_project[currentIndex]) {
          const content = result.desc_polished_all_project[currentIndex];
          const firstDashIndex = content.indexOf('---');
          const lastDashIndex = content.lastIndexOf('---');
          
          // 填充左侧容器
          if (firstDashIndex !== -1) {
            newLeftContent = content.substring(0, firstDashIndex);
          } else {
            newLeftContent = content;
          }
          
          // 填充右侧容器
          if (lastDashIndex !== -1 && firstDashIndex !== lastDashIndex) {
            newRightContent = content.substring(lastDashIndex + 3);
          } else {
            newRightContent = '';
          }
        }
        
        // 延迟填充新内容并应用淡入动画
        setTimeout(() => {
          // 填充内容
          setLeftTextContent(newLeftContent);
          setRightTextContent(newRightContent);
          setMarkdownContent(newCenterContent);
          
          // 立即应用淡入动画
          setLeftTextAnimationClass('fadeInText');
          setRightTextAnimationClass('fadeInText');
          setCenterTextAnimationClass('fadeInText');
          
          // 动画完成后清除动画类
          setTimeout(() => {
            setLeftTextAnimationClass('');
            setRightTextAnimationClass('');
            setCenterTextAnimationClass('');
          }, 1000); // 与fadeIn动画时间一致
        }, 300);
      } else {
        throw new Error(result.message || '切换失败');
      }
      
    } catch (error) {
      console.error('切换上一项时发生错误:', error);
      alert(`切换上一项时发生错误：${error.message}`);
      // 发生错误时回退卡片状态
      setCurrentIndex(prev => prev - 1);
      setCards(prev => prev.slice(0, -1));
      setCurrentPage(prev => prev + 1);
    } finally {
      setTimeout(() => {
        setIsPageChanging(false); // 1秒后解除禁用
      }, 1000);
    }
  };
  
  // 下一页处理函数
  const handleNextPage = async () => {
    if (isPageChanging) return; // 如果正在切换，则直接返回
    setIsPageChanging(true); // 开始切换
    console.log('点击下一项按钮');
    
    try {
      // 获取当前中间容器的内容
      const currentCenterContent = markdownContent || '';
      
      // 立即触发卡片切换动画和页面状态更新
      setCards(prev => [...prev, prev.length]);
      setCurrentIndex(prev => prev + 1);
      setCurrentPage(prev => prev + 1);
      
      // 立即清除内容
      setLeftTextContent('');
      setRightTextContent('');
      setMarkdownContent('');
      
      // 并行执行API调用，传递中间容器内容
      const response = await fetch(`${API_BASE_URL}/next_item/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'next',
          center_content: currentCenterContent  // 传递中间容器内容
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('下一项结果:', result);
      
      if (result.success === true) {
        // 更新优化结果数据
        setOptimizationResult(result);
        
        // 更新current_index和header
        if (result.current_index !== undefined) {
          setCurrentPage(result.current_index);
        }
        if (result.header) {
          setCurrentHeader(result.header);
        }
        
        // 使用相同的填充逻辑填充三个容器
        const currentIndex = result.current_index;
        
        let newLeftContent = '';
        let newRightContent = '';
        let newCenterContent = '';
        
        // 填充中间容器
        if (result.memory_dict && result.memory_dict[currentIndex] && result.memory_dict[currentIndex]['polished_project']) {
          newCenterContent = result.memory_dict[currentIndex]['polished_project'];
        }
        
        // 填充左侧和右侧容器
        if (result.desc_polished_all_project && result.desc_polished_all_project[currentIndex]) {
          const content = result.desc_polished_all_project[currentIndex];
          const firstDashIndex = content.indexOf('---');
          const lastDashIndex = content.lastIndexOf('---');
          
          // 填充左侧容器
          if (firstDashIndex !== -1) {
            newLeftContent = content.substring(0, firstDashIndex);
          } else {
            newLeftContent = content;
          }
          
          // 填充右侧容器
          if (lastDashIndex !== -1 && firstDashIndex !== lastDashIndex) {
            newRightContent = content.substring(lastDashIndex + 3);
          } else {
            newRightContent = '';
          }
        }
        
        // 延迟填充新内容并应用淡入动画
        setTimeout(() => {
          // 填充内容
          setLeftTextContent(newLeftContent);
          setRightTextContent(newRightContent);
          setMarkdownContent(newCenterContent);
          
          // 立即应用淡入动画
          setLeftTextAnimationClass('fadeInText');
          setRightTextAnimationClass('fadeInText');
          setCenterTextAnimationClass('fadeInText');
          
          // 动画完成后清除动画类
          setTimeout(() => {
            setLeftTextAnimationClass('');
            setRightTextAnimationClass('');
            setCenterTextAnimationClass('');
          }, 1000); // 与fadeIn动画时间一致
        }, 300);
      } else {
        throw new Error(result.message || '切换失败');
      }
      
    } catch (error) {
      console.error('切换下一项时发生错误:', error);
      alert(`切换下一项时发生错误：${error.message}`);
      // 发生错误时回退卡片状态
      setCurrentIndex(prev => prev - 1);
      setCards(prev => prev.slice(0, -1));
      setCurrentPage(prev => prev - 1);
    } finally {
      setTimeout(() => {
        setIsPageChanging(false); // 1秒后解除禁用
      }, 1200);
    }
  };
  
  const preprocessText = (text) => {
    if (!text) return "";
    // 将单个换行符（不是连续的双换行符）替换为双换行符
    return text.replace(/(?<!\n)\n(?!\n)/g, '\n');
  };


  // 解析MD表格数据
  const parseMarkdownTable = (markdownText) => {
    if (!markdownText) return [];
    
    const lines = markdownText.split('\n').filter(line => line.trim());
    const tableLines = lines.filter(line => line.includes('|'));
    
    if (tableLines.length < 3) return []; // 至少需要标题行、分隔行和一行数据
    
    // 跳过标题行和分隔行，从第三行开始解析数据
    const dataRows = tableLines.slice(2);
    
    return dataRows.map(line => {
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
      return {
        index: cells[0] || '',
        original: cells[1] || '',
        suggestion: cells[2] || ''
      };
    });
  };

  // 获取解析后的表格数据
  const getTableData = () => {
    if (!polishResult || !polishResult.polish_suggestions) return [];
    return parseMarkdownTable(polishResult.polish_suggestions);
  };


  // 处理对话发送
  const handleChatSend = async () => {
    if (!chatInput.trim()) return; // 如果输入为空，不执行任何操作
    
    const userMessage = chatInput.trim();
    const tableData = getTableData();
    const currentRow = tableData[currentRowIndex];
    const currentMarker = currentRow?.index || ''; // 获取当前页面的数字标签marker
    
    // 清空输入框
    setChatInput('');
    
    // 显示AI思考中状态
    setIsFirstCardThinking(true);
    
    try {
      // 向后端发送请求
      const response = await fetch(`${API_BASE_URL}/chat_feedback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_message: userMessage,
          current_marker: currentMarker,
          current_row_index: currentRowIndex,
          // 可以根据需要添加其他参数
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Chat feedback result:', result);
      
      // 处理返回的md表格字符串，更新polishResult
      if (result.updated_suggestions) {
        setPolishResult({
          ...polishResult,
          polish_suggestions: result.updated_suggestions
        });
        
        // 重新解析表格数据后，可能需要调整当前行索引
        const newTableData = parseMarkdownTable(result.updated_suggestions);
        if (newTableData.length > 0 && currentRowIndex >= newTableData.length) {
          setCurrentRowIndex(0); // 如果当前索引超出范围，重置为0
        }
      }
      
    } catch (error) {
      console.error('Error sending chat message:', error);
      alert(`发送消息时发生错误：${error.message}`);
    } finally {
      // 隐藏AI思考中状态
      setIsFirstCardThinking(false);
    }
  };

  // 新增：处理输入框回车键
  const handleChatInputKeyPress = (e) => {
    if (e.key === 'Enter' && !isFirstCardThinking) {
      handleChatSend();
    }
  };



  const handleConfirmAllSuggestions = async () => {
    try {
      // 立即切换到第四张卡片（加载卡片）
      setCards(prev => [...prev, prev.length]);
      setCurrentIndex(prev => prev + 1);
      
      // 调用后端API并等待响应
      const response = await fetch(`${API_BASE_URL}/start_optimization/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: true
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('开始优化结果:', result);
      
      if (result.success === true) {
        // 保存后端返回的优化结果数据
        setOptimizationResult(result);
        
        // 更新current_index和header
        if (result.current_index !== undefined) {
          setCurrentPage(result.current_index);
        }
        if (result.header) {
          setCurrentHeader(result.header);
        }
        
        // 准备新内容
        let newLeftContent = '';
        let newRightContent = '';
        let newCenterContent = '';
        
        // 使用current_index而不是硬编码的'1'
        const currentIndex = result.current_index || '1';
        
        // 提取 memory_dict[currentIndex]['polished_project'] 并填充到中间容器
        if (result.memory_dict && result.memory_dict[currentIndex] && result.memory_dict[currentIndex]['polished_project']) {
          newCenterContent = result.memory_dict[currentIndex]['polished_project'];
        }
        
        // 提取 desc_polished_all_project[currentIndex] 并填充到左侧和右侧容器
        if (result.desc_polished_all_project && result.desc_polished_all_project[currentIndex]) {
          const content = result.desc_polished_all_project[currentIndex];
          const firstDashIndex = content.indexOf('---');
          const lastDashIndex = content.lastIndexOf('---');
          
          // 填充左侧容器
          if (firstDashIndex !== -1) {
            newLeftContent = content.substring(0, firstDashIndex);
          } else {
            newLeftContent = content;
          }
          
          // 填充右侧容器
          if (lastDashIndex !== -1 && firstDashIndex !== lastDashIndex) {
            newRightContent = content.substring(lastDashIndex + 3);
          } else {
            newRightContent = '';
          }
        }
        
        // 切换到第五张卡片
        setCards(prev => [...prev, prev.length]);
        setCurrentIndex(prev => prev + 1);
        
        // 使用动画更新内容（延迟一点，让卡片切换动画先完成）
        setTimeout(() => {
          updateContentWithAnimation(newLeftContent, newRightContent, newCenterContent);
        }, 300);
        
      } else {
        throw new Error(result.message || '后端处理失败');
      }
      
    } catch (error) {
      console.error('开始优化时发生错误:', error);
      alert(`开始优化时发生错误：${error.message}`);
      // 发生错误时回退到第三张卡片
      setCurrentIndex(2);
      setCards(cards.slice(0, 3));
    }
  };


  const handleNext = async () => {
    if (currentIndex === 0) {
      // 第一张卡片，立即切换到加载卡片，然后调用后端API
      setIsProcessing(true);
      
      // 立即切换到第二张卡片（加载卡片）
      setCards(prev => [...prev, prev.length]);
      setCurrentIndex(prev => prev + 1);
      
      try {
        // 构建personalization字典
        const personalization = {
          "包装程度": optionMappings.setting1[settings.setting1],
          "经历详略": optionMappings.setting2[settings.setting2],
          "情景适配": optionMappings.setting3[settings.setting3]
        };
        
        console.log('发送个性化设置:', personalization);
        
        // 简化的API调用 - 只传递personalization，后端使用全局变量
        const response = await fetch(`${API_BASE_URL}/polish_resume/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalization: personalization,
            // 以下字段设为空值，让后端使用全局变量
            job_title: "",
            resume_text: "",
            initial_results: {},
            all_rate_results: {}
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API错误响应:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Polish result:', result);
        
        // 保存结果并切换到第三张卡片
        setPolishResult(result);
        setIsProcessing(false);
        setCards(prev => [...prev, prev.length]);
        setCurrentIndex(prev => prev + 1);
        
      } catch (error) {
        console.error('Error calling polish API:', error);
        alert(`处理请求时发生错误：${error.message}，请重试`);
        setIsProcessing(false);
        // 发生错误时，回退到第一张卡片
        setCurrentIndex(0);
        setCards([0]);
      }
    } else {
      // 其他卡片的处理逻辑
      setCards(prev => [...prev, prev.length]);
      setCurrentIndex(prev => prev + 1);
    }
  };


  const renderSecondLoadingCard = () => (
    <div className="loading-card-content">
      <h2>AI正在优化您的简历</h2>
      <div className="loading-animation">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <p className="loading-description">请稍候，AI正在根据您的偏好设置生成个性化的简历优化建议</p>
    </div>
  );


  



  const handleSettingChange = (settingKey, optionIndex) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: optionIndex
    }));
  };

  // 切换到上一行
  const handlePrevRow = () => {
    const tableData = getTableData();
    if (tableData.length > 0) {
      setCurrentRowIndex(prev => prev > 0 ? prev - 1 : tableData.length - 1);
    }
  };

  // 切换到下一行
  const handleNextRow = () => {
    const tableData = getTableData();
    if (tableData.length > 0) {
      setCurrentRowIndex(prev => prev < tableData.length - 1 ? prev + 1 : 0);
    }
  };

  // 第一张卡片的内容
  const renderFirstCard = () => (
    <div className="first-card-content">
      <h2>AI修改简历-个人偏好设置</h2>
      
      {/* 显示当前分析的职位信息 */}
      {jobTitle && (
        <div className="job-info" style={{marginBottom: '20px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '5px'}}>
          <p><strong>目标职位：</strong>{jobTitle}</p>
          <p style={{fontSize: '12px', color: '#666'}}>后端已保存分析数据，可直接进行简历优化</p>
        </div>
      )}
      
      <div className="setting-group">
        <h3>包装程度</h3>
        <div className="option-buttons">
          {optionMappings.setting1.map((option, index) => (
            <div key={index} className="option-wrapper">
              <button
                className={`option-btn ${settings.setting1 === index ? 'active' : ''}`}
                onClick={() => handleSettingChange('setting1', index)}
                onMouseEnter={() => setHoveredOption(`setting1-${index}`)}
                onMouseLeave={() => setHoveredOption(null)}
              >
                {option}
              </button>
              {hoveredOption === `setting1-${index}` && (
                <div className="tooltip">
                  {optionDescriptions.setting1[index]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <h3>经历详略</h3>
        <div className="option-buttons">
          {optionMappings.setting2.map((option, index) => (
            <div key={index} className="option-wrapper">
              <button
                className={`option-btn ${settings.setting2 === index ? 'active' : ''}`}
                onClick={() => handleSettingChange('setting2', index)}
                onMouseEnter={() => setHoveredOption(`setting2-${index}`)}
                onMouseLeave={() => setHoveredOption(null)}
              >
                {option}
              </button>
              {hoveredOption === `setting2-${index}` && (
                <div className="tooltip">
                  {optionDescriptions.setting2[index]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <h3>情景适配</h3>
        <div className="option-buttons">
          {optionMappings.setting3.map((option, index) => (
            <div key={index} className="option-wrapper">
              <button
                className={`option-btn ${settings.setting3 === index ? 'active' : ''}`}
                onClick={() => handleSettingChange('setting3', index)}
                onMouseEnter={() => setHoveredOption(`setting3-${index}`)}
                onMouseLeave={() => setHoveredOption(null)}
              >
                {option}
              </button>
              {hoveredOption === `setting3-${index}` && (
                <div className="tooltip">
                  {optionDescriptions.setting3[index]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card-actions">
        <button 
          className="next-btn" 
          onClick={handleNext}
          disabled={isProcessing}
        >
          {isProcessing ? '处理中...' : '开始优化简历'}
        </button>
      </div>
    </div>
  );

  // 第二张卡片的内容（加载卡片）
  const renderLoadingCard = () => (
    <div className="loading-card-content">
      <h2>AI正在优化您的简历</h2>
      <div className="loading-animation">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <p className="loading-description">请稍候，AI正在根据您的偏好设置生成个性化的简历优化建议</p>
    </div>
  );

  // 第三张卡片的内容（结果展示卡片）
  const renderResultCard = () => {
    const tableData = getTableData();
    const currentRow = tableData[currentRowIndex];
    
    return (
      <div className="result-card-container">
        {/* AI思考中的遮罩层 */}
        {isFirstCardThinking && (
          <div className="ai-thinking-overlay">
            <div className="ai-thinking-modal">
              <div className="thinking-animation">
                <div className="thinking-spinner"></div>
                <p>AI正在思考中...</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 主要布局容器：左右分块 */}
        <div className={`main-layout ${isFirstCardThinking ? 'blurred' : ''}`}>
          {/* 左侧内容容器 */}
          <div className="left-content-container">
            {/* 顶部标题区域 */}
            <div className="title-section">
              <h2>修改方案预览与调整</h2>
            </div>
            
            {/* 中间预览界面 */}
            <div className="preview-section">
              {/* 导航按钮 - 左侧 */}
              <button 
                className="nav-btn nav-btn-left" 
                onClick={handlePrevRow}
                disabled={tableData.length <= 1 || isFirstCardThinking}
              >
                ←
              </button>
              
              {/* 内容区域 */}
              <div className="preview-content">
                <div className="content-section original-section">
                  <span className="index-marker">{currentRow?.index}</span>
                  原相关项目：
                  <ReactMarkdown>{currentRow?.original}</ReactMarkdown>
                </div>
                
                <div className="content-section suggestion-section">
                  <ReactMarkdown>{currentRow?.suggestion}</ReactMarkdown>
                </div>
              </div>
              
              {/* 导航按钮 - 右侧 */}
              <button 
                className="nav-btn nav-btn-right" 
                onClick={handleNextRow}
                disabled={tableData.length <= 1 || isFirstCardThinking}
              >
                →
              </button>
            </div>
            
            {/* 底部对话区域 */}
            <div className="chat-section">
              <div className="chat-input-area">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatInputKeyPress}
                  placeholder={placeholderTexts[currentPlaceholderIndex]} 
                  className="chat-input"
                  disabled={isFirstCardThinking}
                />
                <button 
                  className="send-btn" 
                  onClick={handleChatSend}
                  disabled={isFirstCardThinking || !chatInput.trim()}
                >
                  {isFirstCardThinking ? '思考中...' : 'AI修改方案'}
                </button>
              </div>
            </div>
          </div>
          
          {/* 右侧按钮容器 */}
          <div className="right-button-container">
            <button 
              className="confirm-btn" 
              onClick={handleConfirmAllSuggestions}
              disabled={isFirstCardThinking}
            >
              认可所有方案 开始具体优化 ➜
            </button>
          </div>
        </div>
      </div>
    );
  };




  // 其他卡片的内容（完全通用逻辑）
  const renderOtherCard = (index) => {
    if (index === 1) {
      return renderLoadingCard();
    } else if (index === 2) {
      return renderResultCard();
    } else if (index === 3) {
      return renderSecondLoadingCard(); // 第四张卡片：3秒加载卡片
    } else if (index === cards.length - 1 && isConfirmingFinish === 2) {
      // 最后一张卡片：确认完成后的AI思考页面
      return renderSecondLoadingCard();
    } else {
      // 第五张卡片及以后：完全统一的通用卡片逻辑
      return renderGenericCard();
    }
  };
  

  // 项目对话框发送处理函数
  const handleProjectChatSend = async () => {
    if (!projectChatInput.trim()) return;
    
    const userInput = projectChatInput.trim();
    
    // 设置发送状态
    setIsProjectChatSending(true);
    
    try {
      // 清空输入框
      setProjectChatInput('');
      
      // 调用新的后端接口
      const response = await fetch(`${API_BASE_URL}/polish_project/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_input: userInput,
          current_index: currentPage,
          center_content: markdownContent
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // 更新状态
        setCurrentPage(result.current_index);
        setCurrentHeader(result.header);
        
        // 使用统一的填充逻辑
        const currentIndex = result.current_index;
        
        let newLeftContent = '';
        let newRightContent = '';
        let newCenterContent = '';
        
        // 填充中间容器
        if (result.memory_dict && result.memory_dict[currentIndex] && result.memory_dict[currentIndex]['polished_project']) {
          newCenterContent = result.memory_dict[currentIndex]['polished_project'];
        }
        
        // 填充左侧和右侧容器
        if (result.desc_polished_all_project && result.desc_polished_all_project[currentIndex]) {
          const content = result.desc_polished_all_project[currentIndex];
          const firstDashIndex = content.indexOf('---');
          const lastDashIndex = content.lastIndexOf('---');
          
          // 填充左侧容器
          if (firstDashIndex !== -1) {
            newLeftContent = content.substring(0, firstDashIndex);
          } else {
            newLeftContent = content;
          }
          
          // 填充右侧容器
          if (lastDashIndex !== -1 && firstDashIndex !== lastDashIndex) {
            newRightContent = content.substring(lastDashIndex + 3);
          } else {
            newRightContent = '';
          }
        }
        
        // 使用统一的更新方式
        setLeftTextContent(newLeftContent);
        setRightTextContent(newRightContent);
        setMarkdownContent(newCenterContent);
        
        // 添加动画效果
        setLeftTextAnimationClass('fadeInText');
        setRightTextAnimationClass('fadeInText');
        setCenterTextAnimationClass('fadeInText');
        
        setTimeout(() => {
          setLeftTextAnimationClass('');
          setRightTextAnimationClass('');
          setCenterTextAnimationClass('');
        }, 1000);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送消息失败，请重试');
    } finally {
      // 重置发送状态
      setIsProjectChatSending(false);
    }
  };

  // 添加独立的回车键处理函数
  const handleProjectChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isProjectChatSending) {
      e.preventDefault();
      handleProjectChatSend();
    }
  };


  const renderGenericCard = () => {

    const isLastItem = optimizationResult && currentPage >= Object.keys(optimizationResult.memory_dict).length;
    
    return (
      <div className="generic-card-content">
        {/* 主要布局容器：左中右三列 */}
        <div className="three-column-layout">
          {/* 左侧容器 */}
          <div className="left-container">
            <div className={`text-display-container left-text-container ${leftTextAnimationClass}`}>
              <ReactMarkdown>{preprocessText(leftTextContent || "")}</ReactMarkdown>
            </div>
            
            {/* 左侧上一页按钮 - currentPage > 1 时显示 */}
            {currentPage > 1 && (
              <div className="card-actions">
                <button 
                  className="next-btn" 
                  onClick={handlePreviousPage}
                  disabled={isPageChanging || isProjectChatSending} // 添加isProjectChatSending禁用条件
                >
                  ← 上一项
                </button>
              </div>
            )}
          </div>
          
          {/* 中间容器 */}
          <div className="center-container">
            
            {/* 新增：透明标题和marker容器 */}
            <div className="center-header-transparent">
              <span className="index-marker">{currentPage}</span>
              <div className="header-text">
                <ReactMarkdown>{currentHeader}</ReactMarkdown>
              </div>
            </div>

            {isEditing ? (
              <textarea
                ref={textareaRef}
                className={`editable-text-area ${centerTextAnimationClass}`}
                value={markdownContent}
                onChange={handleTextChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="已删除"
                autoFocus
              />
            ) : (
              <div
                className={`markdown-preview-area ${centerTextAnimationClass}`}
                onClick={() => {
                  setIsEditing(true);
                  // 延迟聚焦，确保 DOM 更新完成
                  setTimeout(() => {
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }, 0);
                }}
              >
                {markdownContent ? (
                  <ReactMarkdown>{preprocessText(markdownContent)}</ReactMarkdown>
                ) : (
                  <span className="placeholder-text">已删除</span>
                )}
              </div>
            )}
            
            <div className="edit-hint">
              该部分内容可编辑，小瑕疵建议直接手动修改，你的修改AI可见
            </div>
            
            {/* 底部漂浮对话框 - 使用独立的样式和逻辑 */}
            <div className="center-chat-section">
              <div className="center-chat-input-area">
                <input 
                  type="text" 
                  value={projectChatInput}
                  onChange={(e) => setProjectChatInput(e.target.value)}
                  onKeyPress={handleProjectChatKeyPress}
                  placeholder="提供更多信息，让AI更了解你的需求！" 
                  className="center-chat-input"
                  disabled={isProjectChatSending}
                />
                <button 
                  className="center-send-btn" 
                  onClick={handleProjectChatSend}
                  disabled={!projectChatInput.trim() || isProjectChatSending}
                >
                  {isProjectChatSending ? 'AI思考中...' : '发送'}
                </button>
              </div>
            </div>
          </div>
          
          {/* 右侧容器 */}
          <div className="right-container">
            <div className={`text-display-container right-text-container ${rightTextAnimationClass}`}>
              <ReactMarkdown>{preprocessText(rightTextContent || "")}</ReactMarkdown>
            </div>

            {/* 右侧下一页按钮 - 根据是否为最后一项，显示不同按钮 */}
            <div className="card-actions">
              <button 
                ref={isLastItem ? finishButtonRef : null}
                onClick={isLastItem ? handleFinish : handleNextPage}
                className={`next-btn ${isLastItem ? (isConfirmingFinish === 1 ? 'confirm-finish-btn' : 'finish-btn') : ''} ${isConfirmingFinish === 1 ? 'shine-effect' : ''}`}
                disabled={isPageChanging || isProjectChatSending} // 添加isProjectChatSending禁用条件
              >
                {isLastItem ? (isConfirmingFinish === 1 ? '确认完成' : '完成') : '下一项 →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 完成按钮处理函数
  const handleFinish = async () => {
    if (isConfirmingFinish === 1) {
      // 第二次点击：确认完成逻辑
      console.log('确认完成按钮被点击');
      
      try {
        // 获取当前中间容器的内容
        const currentCenterContent = markdownContent || '';
        
        // 设置为思考状态
        setIsConfirmingFinish(2);
        
        // 立即触发卡片切换动画
        setCards(prev => [...prev, prev.length]);
        setCurrentIndex(prev => prev + 1);
        
        // 向后端发送确认完成信号
        const response = await fetch(`${API_BASE_URL}/confirm_finish/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'confirm_finish',
            center_content: currentCenterContent
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API错误响应:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('确认完成结果:', result);
        
        if (result.success === true) {
          // 跳转到新的结果页面，传递headers
          navigate('/results', { 
            state: { 
              integrated_results: result.integrated_results,
              AI_comments: result.AI_comments,
              headers: result.headers  // 新增：传递headers
            }
          });
        } else {
          throw new Error(result.message || '后端处理失败');
        }
        
      } catch (error) {
        console.error('确认完成时发生错误:', error);
        alert(`确认完成时发生错误：${error.message}`);
        // 发生错误时重置状态
        setIsConfirmingFinish(0);
      }
      
    } else if (isConfirmingFinish === 0) {
      // 第一次点击：只保存数据，不触发卡片切换
      try {
        const currentCenterContent = markdownContent || '';
        
        // 向后端发送数据
        const response = await fetch(`${API_BASE_URL}/save_current_item/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'save',
            center_content: currentCenterContent
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('保存当前项结果:', result);
        
        // 成功保存后，切换到确认状态
        setIsConfirmingFinish(1);
        
      } catch (error) {
        console.error('保存当前项时发生错误:', error);
        alert('保存数据时发生错误，请重试');
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="card-stack">
        {/* 固定的背景卡片，营造"一摞"的视觉效果 */}
        <div className="background-card background-card-3"></div>
        <div className="background-card background-card-2"></div>
        <div className="background-card background-card-1"></div>
        
        {/* 实际的交互卡片 */}
        {cards.map((card, index) => (
          <div
            key={index}
            className={`card ${index === currentIndex ? 'active' : index < currentIndex ? 'removed' : 'stacked'}`}
            style={{
              zIndex: cards.length - index + 10,
              transform: `translateY(${ (cards.length - index - 1) * 10 }px) scale(${1 - (cards.length - index - 1) * 0.05})`,
              filter: `blur(${ (cards.length - index - 1) * 2 }px)`,
            }}
          >
            {index === 0 ? renderFirstCard() : renderOtherCard(index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResumeEditor;
