import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './Results.module.css';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [integratedResults, setIntegratedResults] = useState('');
  const [aiComments, setAiComments] = useState('');
  const [headers, setHeaders] = useState({});
  const [copySuccess, setCopySuccess] = useState({});

  useEffect(() => {
    if (location.state) {
      setIntegratedResults(location.state.integrated_results || '');
      setAiComments(location.state.AI_comments || '');
      setHeaders(location.state.headers || {});
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  // 复制单个项目内容
  const handleCopyBlock = async (blockContent, blockIndex) => {
    try {
      await navigator.clipboard.writeText(blockContent.trim());
      setCopySuccess(prev => ({ ...prev, [blockIndex]: true }));
      setTimeout(() => {
        setCopySuccess(prev => ({ ...prev, [blockIndex]: false }));
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 处理integrated_results的分块显示
  const renderIntegratedResults = () => {
    if (!integratedResults) return null;
    
    const blocks = integratedResults.split('\n\n---\n\n');
    const headerIndexes = Object.keys(headers).sort((a, b) => parseInt(a) - parseInt(b));
    
    return blocks.map((block, index) => {
      let displayTitle = `项目 ${index + 1}`;
      
      if (headerIndexes.length > index) {
        const headerIndex = headerIndexes[index];
        const headerTitle = headers[headerIndex];
        if (headerTitle) {
          displayTitle = `${headerIndex}. ${headerTitle}`;
        }
      }
      
      return (
        <div key={index} className={styles.block}>
          <div className={styles.blockHeader}>
            <span className={styles.blockNumber}>{displayTitle}</span>
            <button 
              className={styles.blockCopyBtn}
              onClick={() => handleCopyBlock(block, index)}
            >
              '📄'
            </button>
          </div>
          <div className={styles.blockContent}>
            {block.trim()}
          </div>
          {index < blocks.length - 1 && <div className={styles.blockSeparator}></div>}
        </div>
      );
    });
  };

  // 添加返回首页的处理函数
  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContainer}>
        <div className={styles.topContainer}>
          <div className={styles.leftSection}>
            <div className={styles.sectionHeader}>
              <h2>优化后的简历内容</h2>
            </div>
            <div className={styles.scrollableContent}>
              {renderIntegratedResults()}
            </div>
          </div>
          
          <div className={styles.rightSection}>
            <div className={styles.sectionHeader}>
              <h2>AI小建议</h2>
            </div>
            <div className={styles.aiCommentsContent}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiComments}</ReactMarkdown>
            </div>
          </div>
        </div>
        

        
        {/* 新增：返回首页按钮容器 */}
        <div className={styles.homeButtonContainer}>
          <button 
            className={styles.homeButton}
            onClick={handleBackToHome}
          >
            🏠 返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results;