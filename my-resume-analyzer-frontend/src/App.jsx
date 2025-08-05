import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // 导入 useNavigate
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import './App.css'
import { API_BASE_URL } from './config.js';

// 设置PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

function App() {
  const navigate = useNavigate(); // 初始化 useNavigate
  const [uploadedFile, setUploadedFile] = useState(null)
  const [company, setCompany] = useState('')
  const [level, setLevel] = useState('')
  const [position, setPosition] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAnalysisCompleted, setIsAnalysisCompleted] = useState(false)
  
  // 添加全局状态变量
  const [resumeText, setResumeText] = useState('') // 新增
  const [initialResults, setInitialResults] = useState(null) // 新增
  const [allRateResults, setAllRateResults] = useState(null) // 新增
  const [jobTitle, setJobTitle] = useState('') // 新增
  const [moduleOrder, setModuleOrder] = useState(['workCompetency', 'interviewPass', 'competitiveness', 'contentMatch']);
  const initialAnalysisResults = () => {
    const results = {};
    moduleOrder.forEach(key => {
      results[key] = { status: 'pending', progress: 0 };
    });
    return results;
  };
  const [analysisResults, setAnalysisResults] = useState(initialAnalysisResults());
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfUrl, setPdfUrl] = useState(null)

  const handleFileUpload = (file) => {
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file)
      // 创建PDF文件的URL用于预览
      const url = URL.createObjectURL(file)
      setPdfUrl(url)
      setPageNumber(1)
    } else {
      alert('请上传PDF格式的简历文件')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const canStartAnalysis = uploadedFile && level && position

  const startAnalysis = async () => {
    if (!canStartAnalysis || !uploadedFile) return

    setIsAnalyzing(true)
    setIsAnalysisCompleted(false)
    setCurrentModuleIndex(0)
    setAnalysisResults(initialAnalysisResults())

    const formData = new FormData()
    formData.append('resume_file', uploadedFile)
    
    // 拼接职位信息并保存到全局状态
    let currentJobTitle = ''
    if (company) {
      currentJobTitle += company + ' '
    }
    if (level) {
      currentJobTitle += level + ' '
    }
    if (position) {
      currentJobTitle += position
    }
    currentJobTitle = currentJobTitle.trim()
    setJobTitle(currentJobTitle) // 保存到全局状态

    try {
      const response = await fetch(`${API_BASE_URL}/analyze_resume/?job_title=${encodeURIComponent(currentJobTitle)}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const results = await response.json()
      
      // 保存全局状态变量
      setResumeText(results.resume_text)
      setInitialResults(results.initial_analysis)
      setAllRateResults(results.all_ratings)
      
      // 先更新analysisResults，将所有模块设置为completed且progress为100
      if (results && results.all_ratings && results.initial_analysis) {
        setAnalysisResults(prevResults => ({
          ...prevResults,
          workCompetency: {
            ...prevResults.workCompetency,
            status: 'completed',
            progress: 100, // 确保进度为100
            score: results.all_ratings.work_competency?.score,
            details: results.all_ratings.work_competency?.reason || '暂无详细分析内容。',
            initial_daily_work: results.initial_analysis.daily_work,
            rate_daily_work: results.all_ratings.daily_work_rate
          },
          interviewPass: {
            ...prevResults.interviewPass,
            status: 'completed',
            progress: 100, // 确保进度为100
            score: results.all_ratings.interview_pass_possibility?.score,
            details: results.all_ratings.interview_pass_possibility?.reason || '暂无详细分析内容。',
            initial_interview: results.initial_analysis.interview,
            rate_interview_pass: results.all_ratings.interview_pass_rate
          },
          competitiveness: {
            ...prevResults.competitiveness,
            status: 'completed',
            progress: 100, // 确保进度为100
            score: results.all_ratings.job_competitiveness_analysis?.score,
            details: results.all_ratings.job_competitiveness_analysis?.reason || '暂无详细分析内容。',
            initial_peer_resume: results.initial_analysis.peer_resume,
            rate_peer_pressure: results.all_ratings.peer_pressure_rate
          },
          contentMatch: {
            ...prevResults.contentMatch,
            status: 'completed',
            progress: 100, // 确保进度为100
            score: results.all_ratings.resume_job_match_analysis?.score,
            details: results.all_ratings.resume_job_match_analysis?.reason || '暂无详细分析内容。',
            initial_resume_match: results.initial_analysis.resume_match,
            rate_resume_match: results.all_ratings.resume_match_rate
          }
        }));
      }
      
      // 然后设置分析完成状态
      setIsAnalyzing(false)
      setIsAnalysisCompleted(true)

    } catch (error) {
      console.error('Error starting analysis:', error)
      alert(`分析请求失败: ${error.message}`)
      // 出错时重置状态
      setIsAnalyzing(false)
      setIsAnalysisCompleted(false)
      setAnalysisResults(initialAnalysisResults());
      setCurrentModuleIndex(0);
    }
  }

  // useEffect 用于处理分析进度的动态更新
  useEffect(() => {
    let intervalId;

    if (isAnalyzing && !isAnalysisCompleted && currentModuleIndex < moduleOrder.length) {
      // 阶段1: 初始串行分析 (每个模块约60秒)
      const currentModuleKey = moduleOrder[currentModuleIndex];

      // 确保当前模块状态是 'analyzing' 如果它是 'pending'
      setAnalysisResults(prev => {
        if (prev[currentModuleKey]?.status === 'pending') {
          return {
            ...prev,
            [currentModuleKey]: { ...prev[currentModuleKey], status: 'analyzing' }
          };
        }
        return prev;
      });

      intervalId = setInterval(() => {
        setAnalysisResults(prevResults => {
          const newResults = { ...prevResults };
          const moduleKey = moduleOrder[currentModuleIndex]; 
          
          if (!moduleKey || !newResults[moduleKey] || newResults[moduleKey].status !== 'analyzing') {
            return prevResults; 
          }

          newResults[moduleKey].progress = Math.min(newResults[moduleKey].progress + 1, 100);

          if (newResults[moduleKey].progress === 100) {
            newResults[moduleKey].status = 'completed';
            if (currentModuleIndex < moduleOrder.length - 1) {
              setCurrentModuleIndex(prevIndex => prevIndex + 1);
            }
          }
          return newResults;
        });
      }, 1200);

    } else if (isAnalysisCompleted) {
      // 阶段2: 分析已完成，快速将所有未完成的模块进度补满
      setAnalysisResults(prevResults => {
        const newResults = { ...prevResults };
        moduleOrder.forEach(key => {
          if (newResults[key] && newResults[key].progress < 100) {
            newResults[key].progress = 100;
            newResults[key].status = 'completed';
          }
        });
        return newResults;
      });
    }

    return () => clearInterval(intervalId);
  }, [isAnalyzing, isAnalysisCompleted, currentModuleIndex]); // 移除analysisResults依赖


  const resetUpload = () => {
    setUploadedFile(null)
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    setNumPages(null)
    setPageNumber(1)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const resetToInitialState = () => {
    setUploadedFile(null)
    setCompany('')
    setLevel('')
    setPosition('')
    setIsAnalyzing(false)
    setIsAnalysisCompleted(false)
    setAnalysisResults(initialAnalysisResults());
    setCurrentModuleIndex(0); // 重置当前分析模块索引
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    setNumPages(null)
    setPageNumber(1)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages))
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">AI简历助手</h1>
          <p className="subtitle">通过智能分析简历，进一步帮您包装经历</p>
        </header>

        <div className={`main-content ${(isAnalyzing || isAnalysisCompleted) ? 'analyzing' : ''}`}>
          {/* 上半部分：简历预览和分析结果的容器 */}
          <div className="top-section">
            <div className="pdf-section">
            {/* PDF上传模块 */}
            <div className="upload-section">
              <div 
                className={`upload-area ${isDragOver ? 'drag-over' : ''} ${uploadedFile ? 'has-file' : ''} ${(isAnalyzing || isAnalysisCompleted) ? 'disabled' : ''}`}
                onDrop={(isAnalyzing || isAnalysisCompleted) ? undefined : handleDrop}
                onDragOver={(isAnalyzing || isAnalysisCompleted) ? undefined : handleDragOver}
                onDragLeave={(isAnalyzing || isAnalysisCompleted) ? undefined : handleDragLeave}
                onClick={(isAnalyzing || isAnalysisCompleted) ? undefined : () => fileInputRef.current?.click()}
              >
                {!uploadedFile ? (
                  <>
                    <div className="upload-icon">+</div>
                    <div className="upload-text">
                      <p className="upload-main-text">点击上传或拖拽简历文件</p>
                      <p className="upload-sub-text">支持PDF格式，文件大小不超过10MB</p>
                    </div>
                  </>
                ) : (
                  <div className="file-preview">
                    <div className="pdf-preview-container">
                      <div className="pdf-viewer">
                        {pdfUrl && (
                          <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={<div className="pdf-loading">加载PDF中...</div>}
                            error={<div className="pdf-error">PDF加载失败</div>}
                          >
                            <Page
                               pageNumber={pageNumber}
                               loading={<div className="page-loading">加载页面中...</div>}
                               renderTextLayer={false}
                               renderAnnotationLayer={false}
                               scale={1}
                             />
                          </Document>
                        )}
                      </div>
                      {numPages && numPages > 1 && (
                        <div className="pdf-controls">
                          <button 
                            className="pdf-nav-btn" 
                            onClick={goToPrevPage}
                            disabled={pageNumber <= 1}
                          >
                            ←
                          </button>
                          <span className="page-info">
                            {pageNumber} / {numPages}
                          </span>
                          <button 
                            className="pdf-nav-btn" 
                            onClick={goToNextPage}
                            disabled={pageNumber >= numPages}
                          >
                            →
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="file-info">
                      <p className="file-name">{uploadedFile.name}</p>
                      <p className="file-size">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      {(!isAnalyzing && !isAnalysisCompleted) && (
                        <button 
                          className="change-file-btn" 
                          onClick={(e) => {
                            e.stopPropagation()
                            resetUpload()
                          }}
                        >更换文件</button>
                      )}
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                  disabled={isAnalyzing || isAnalysisCompleted}
                />
              </div>
            </div>
          </div>
          
          {/* 分析结果模块 */}
          {(isAnalyzing || isAnalysisCompleted) && (
            <div className="results-section">
              <div className="results-container">
                <h3 className="results-title">分析结果</h3>
                <div className="analysis-items">
                  <AnalysisItem
                    title="日常工作胜任力"
                    status={analysisResults.workCompetency.status}
                    progress={analysisResults.workCompetency.progress}
                  />
                  <AnalysisItem
                    title="笔面门槛通过率"
                    status={analysisResults.interviewPass.status}
                    progress={analysisResults.interviewPass.progress}
                  />
                  <AnalysisItem
                    title="同侪竞争出众度"
                    status={analysisResults.competitiveness.status}
                    progress={analysisResults.competitiveness.progress}
                  />
                  <AnalysisItem
                    title="简历内容匹配度"
                    status={analysisResults.contentMatch.status}
                    progress={analysisResults.contentMatch.progress}
                  />
                </div>
              </div>
            </div>
          )}
          </div>
          
          {/* 下半部分：目标岗位 */}
          <div className="bottom-section">
            <div className="input-section">
              {/* 职位信息输入模块 */}
            <div className="job-info-section">
              <div className="job-info-container">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="目标公司（知名度高可填）"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="job-input"
                    disabled={isAnalyzing || isAnalysisCompleted}
                  />
                  <span className="separator">-</span>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="job-select"
                    disabled={isAnalyzing || isAnalysisCompleted}
                  >
                    <option value="">选择级别</option>
                    <option value="初级">初级</option>
                    <option value="中级">中级</option>
                    <option value="高级">高级</option>
                  </select>
                  <span className="separator">-</span>
                  <input
                    type="text"
                    placeholder="目标职位"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="job-input"
                    disabled={isAnalyzing || isAnalysisCompleted}
                  />
                </div>
              </div>
            </div>

            {/* 按钮区域 */}
            <div className="analyze-section">
              {isAnalysisCompleted ? (
                <div className="completed-buttons">
                  <button 
                    className="detail-btn" 
                    onClick={() => navigate('/details', { 
                      state: { 
                        analysisResults: analysisResults,
                        jobTitle: jobTitle,
                        resumeText: resumeText,
                        initialResults: initialResults,
                        allRateResults: allRateResults
                      } 
                    })}
                  >
                    查看评估详情
                  </button>

                  <button className="return-btn" onClick={resetToInitialState}>
                    返回
                  </button>
                </div>
              ) : (
                <button
                  className={`analyze-btn ${canStartAnalysis ? 'enabled' : 'disabled'} ${isAnalyzing ? 'analyzing' : ''}`}
                  onClick={startAnalysis}
                  disabled={!canStartAnalysis || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="loading-waves">
                        <div className="wave"></div>
                        <div className="wave"></div>
                        <div className="wave"></div>
                        <div className="wave"></div>
                        <div className="wave"></div>
                      </div>
                      <span>分析中...</span>
                    </>
                  ) : '开始分析'}
                </button>
              )}
            </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}

// 分析项组件
function AnalysisItem({ title, status, progress }) {
  return (
    <div className={`analysis-item ${status}`}>
      <div className="analysis-header">
        <h4 className="analysis-title">{title}</h4>
        <div className="analysis-status">
          {status === 'analyzing' && (
            <>
              <div className="loading-spinner"></div>
              <span>评估中</span>
            </>
          )}
          {status === 'completed' && (
            <>
              <div className="success-icon">✓</div>
              <span>评估完成</span>
            </>
          )}
        </div>
      </div>

    </div>
  )
}

export default App
