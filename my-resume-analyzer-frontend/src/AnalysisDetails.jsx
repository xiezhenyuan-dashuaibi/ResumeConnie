import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'; // 引入 react-markdown
import remarkGfm from 'remark-gfm'; // 引入 remark-gfm 用于支持 GFM (表格、删除线等)
import './AnalysisDetails.css';

const moduleNames = {
  workCompetency: '日常工作胜任力',
  interviewPass: '笔面门槛通过率',
  competitiveness: '同侪竞争出众度',
  contentMatch: '简历内容匹配度',
};

function AnalysisDetails() {
  const location = useLocation();
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedModule, setSelectedModule] = useState('workCompetency'); // 默认选中第一个模块

  useEffect(() => {
    // 尝试从 location state 获取分析结果数据
    if (location.state && location.state.analysisResults) {
      setAnalysisData(location.state.analysisResults);
    } else {
      // 如果没有数据，可以考虑重定向回主页或显示错误信息
      console.warn('No analysis data found in location state.');
      // 示例：填充一些模拟数据，以便在直接访问此页面时也能看到布局
      setAnalysisData({
        workCompetency: { status: 'completed', progress: 100, score: 85, details: '您在日常工作中的表现预计将非常出色，各项技能均能满足岗位要求。' },
        interviewPass: { status: 'completed', progress: 100, score: 78, details: '通过笔试和面试的几率较高，建议针对岗位JD进行更细致的准备。' },
        competitiveness: { status: 'completed', progress: 100, score: 92, details: '在众多候选人中，您的竞争力非常突出，具有明显优势。' },
        contentMatch: { status: 'completed', progress: 100, score: 88, details: '简历内容与岗位JD匹配度高，关键技能和经验都得到了体现。' },
      });
    }
  }, [location.state]);

  const handleModuleSelect = (moduleKey) => {
    setSelectedModule(moduleKey);
  };

  const renderModuleContent = () => {
    if (!analysisData || !analysisData[selectedModule]) {
      return <p>暂无详细信息。</p>;
    }
    const moduleInfo = analysisData[selectedModule];
    // 根据 selectedModule 动态获取要显示的 initial 和 rate 数据键名
    let initialDataKey, rateDataKey, initialDataLabel, rateDataLabel;
    switch (selectedModule) {
      case 'workCompetency':
        initialDataKey = 'initial_daily_work';
        rateDataKey = 'rate_daily_work';
        initialDataLabel = '初步分析 (日常工作):';
        rateDataLabel = '评分依据 (日常工作):';
        break;
      case 'interviewPass':
        initialDataKey = 'initial_interview';
        rateDataKey = 'rate_interview_pass';
        initialDataLabel = '初步分析 (面试):';
        rateDataLabel = '评分依据 (面试通过率):';
        break;
      case 'competitiveness':
        initialDataKey = 'initial_peer_resume';
        rateDataKey = 'rate_peer_pressure';
        initialDataLabel = '初步分析 (同侪):';
        rateDataLabel = '评分依据 (同侪压力):';
        break;
      case 'contentMatch':
        initialDataKey = 'initial_resume_match';
        rateDataKey = 'rate_resume_match';
        initialDataLabel = '初步分析 (简历匹配):';
        rateDataLabel = '评分依据 (简历匹配率):';
        break;
      default:
        break;
    }

    return (
      <div className="details-content-area">
        <h1 className="module-main-title">{moduleNames[selectedModule]}</h1>
        
        <h2 className="section-title">目标岗位详情</h2>
        {initialDataKey && moduleInfo[initialDataKey] ? (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {(() => {
                const rawContent = typeof moduleInfo[initialDataKey] === 'object' 
                  ? JSON.stringify(moduleInfo[initialDataKey], null, 2) 
                  : String(moduleInfo[initialDataKey]);
                return rawContent.replace(/```/g, '');
              })()}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="details-text-block">暂无目标岗位详情。</p>
        )}

        <h2 className="section-title">您的简历评分详情</h2>
        {rateDataKey && moduleInfo[rateDataKey] ? (
          <div className="markdown-content">
            {(() => {
              // 获取原始内容并去除所有```符号
              const rawContent = typeof moduleInfo[rateDataKey] === 'object' 
                ? JSON.stringify(moduleInfo[rateDataKey], null, 2) 
                : String(moduleInfo[rateDataKey]);
              const cleanContent = rawContent.replace(/```/g, '');
              
              // 查找第一个#的位置
              const firstHashIndex = cleanContent.indexOf('#');
              
              if (firstHashIndex > 0) {
                // 分离第一个#之前的内容和之后的内容
                const summaryContent = cleanContent.substring(0, firstHashIndex).trim();
                const markdownContent = cleanContent.substring(firstHashIndex).trim();
                
                return (
                  <>
                    {summaryContent && (
                      <div className="score-summary">
                        {summaryContent.split('\n').map((line, index) => (
                          <p key={index} className="summary-line">
                            {line.split(/([0-9]+(?:\.[0-9]+)?)/g).map((part, partIndex) => 
                              /^[0-9]+(?:\.[0-9]+)?$/.test(part) ? (
                                <span key={partIndex} className="score-number">{part}</span>
                              ) : (
                                part
                              )
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                    {markdownContent && (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
                    )}
                  </>
                );
              } else {
                // 如果没有找到#，将前三段内容进行特殊渲染
                const paragraphs = cleanContent.split('\n').filter(p => p.trim());
                const firstThreeParagraphs = paragraphs.slice(0, 3).join('\n');
                const remainingContent = paragraphs.slice(3).join('\n');
                
                return (
                  <>
                    {firstThreeParagraphs && (
                      <div className="score-summary">
                        {firstThreeParagraphs.split('\n').map((line, index) => (
                          <p key={index} className="summary-line">
                            {line.split(/([0-9]+(?:\.[0-9]+)?)/g).map((part, partIndex) => 
                              /^[0-9]+(?:\.[0-9]+)?$/.test(part) ? (
                                <span key={partIndex} className="score-number">{part}</span>
                              ) : (
                                part
                              )
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                    {remainingContent && (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{remainingContent}</ReactMarkdown>
                    )}
                  </>
                );
              }
            })()
            }
          </div>
        ) : (
          <p className="details-text-block">暂无评分依据。</p>
        )}
      </div>
    );
  };

  if (!analysisData) {
    return (
      <div className="page-wrapper">
        <div className="main-container">
          <div className="details-top-bar">
            <Link to="/" className="back-link">返回主页</Link>
          </div>
          <p>正在加载分析数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="main-container">
        <div className="details-top-bar">
          <Link to="/" className="back-link">返回主页</Link>
          <Link to="/edit-resume" className="edit-button">与AI协作高效包装经历→</Link> {/* 新按钮 */}
        </div>
        <div className="details-main-layout">
          <div className="details-sidebar">
            <h4>分析模块</h4>
            <ul>
              {Object.keys(moduleNames).map((key) => (
                <li
                  key={key}
                  className={selectedModule === key ? 'active' : ''}
                  onClick={() => handleModuleSelect(key)}
                >
                  {moduleNames[key]}
                </li>
              ))}
            </ul>
          </div>
          <div className="details-content">
            {renderModuleContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysisDetails;