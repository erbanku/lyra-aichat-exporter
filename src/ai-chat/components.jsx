/**
 * Lyra AI Chat - Components
 * 所有UI组件：浮窗 + 对话面板 + 通用组件
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useChatService, useContextStore, usePanelStore, useDraggable, useResizable, useAutoResize } from './hooks.js'
import { contextActions } from './store.js'
import { useI18n } from '../index.js'
import StorageManager from '../utils/storageManager'
import 'katex/dist/katex.min.css'

// ============================================
// 图标组件 (SVG inline)
// ============================================

export function IconClose({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconMinimize({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconMaximize({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  )
}

export function IconPin({ size = 16, className = '', filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  )
}

export function IconSend({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export function IconTrash({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

export function IconRefresh({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

export function IconLoading({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lyra-icon-spin ${className}`}>
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  )
}

export function IconEdit({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function IconCheck({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function IconX({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconInfo({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

// ============================================
// 基础UI组件
// ============================================

export function IconButton({ icon, size = 'md', variant = 'ghost', onClick, disabled = false, title, className = '', ...props }) {
  return (
    <button
      className={`lyra-icon-button lyra-icon-button--${size} lyra-icon-button--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      {icon}
    </button>
  )
}

export function Textarea({ value, onChange, placeholder, disabled = false, rows = 3, className = '', textareaRef, onKeyDown, ...props }) {
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={`lyra-textarea ${className}`}
      {...props}
    />
  )
}

export function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`lyra-badge lyra-badge--${variant} ${className}`}>
      {children}
    </span>
  )
}

export function Divider({ className = '' }) {
  return <div className={`lyra-divider ${className}`} />
}

// ============================================
// Context Status - 上下文状态组件
// ============================================

/**
 * 估算token数量（简化算法）
 */
function estimateTokens(messages) {
  if (!messages || messages.length === 0) return 0
  const totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0)
  return Math.ceil(totalChars / 4)
}

/**
 * 上下文状态组件
 */
export function ContextStatus({ onClear, onRefresh, onManage }) {
  const { t } = useI18n()
  const { activeContext, browsingPath, clearAll } = useContextStore()
  const [showDetail, setShowDetail] = useState(false)

  const messageCount = activeContext.length
  const tokenCount = estimateTokens(activeContext)
  const pathCount = browsingPath.length

  const handleClear = () => {
    clearAll()
    onClear?.()
  }

  const handleManage = () => {
    setShowDetail(true)
    onManage?.()
  }

  if (messageCount === 0) {
    return (
      <div className="lyra-context-status lyra-context-status--empty">
        <span className="lyra-context-status__text">
          {t('aiChat.context.empty')}
        </span>
      </div>
    )
  }

  return (
    <>
      <div className="lyra-context-status">
        <div
          className="lyra-context-status__info"
          onClick={handleManage}
          style={{ cursor: 'pointer' }}
          title={t('aiChat.context.detailsTitle')}
        >
          <Badge variant="info">
            {t('aiChat.context.messages', { count: messageCount })}
          </Badge>
          <Badge variant="secondary">
            {t('aiChat.context.tokens', { count: tokenCount })}
          </Badge>
          {pathCount > 0 && (
            <Badge variant="default">
              {t('aiChat.context.steps', { count: pathCount })}
            </Badge>
          )}
        </div>
        <div className="lyra-context-status__actions">
          {onRefresh && (
            <IconButton
              icon={<IconRefresh size={14} />}
              onClick={onRefresh}
              title={t('aiChat.context.refresh')}
              size="sm"
            />
          )}
          <IconButton
            icon={<IconTrash size={14} />}
            onClick={handleClear}
            title={t('aiChat.context.clear')}
            size="sm"
          />
        </div>
      </div>

      {showDetail && (
        <ContextDetail
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}

/**
 * 上下文详情展开组件
 */
export function ContextDetail({ isOpen, onClose }) {
  const { t } = useI18n()
  const { activeContext, browsingPath, summaries } = useContextStore()
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customContent, setCustomContent] = useState('')
  const [customLabel, setCustomLabel] = useState('')

  // 上下文配置
  const [maxContentLength, setMaxContentLength] = useState(() => {
    const config = StorageManager.get('ai-context-config', { maxContentLength: 3000, systemPrompt: '' })
    return config.maxContentLength ?? 3000
  })

  const [systemPrompt, setSystemPrompt] = useState(() => {
    const config = StorageManager.get('ai-context-config', { maxContentLength: 3000, systemPrompt: '' })
    return config.systemPrompt || ''
  })

  if (!isOpen) return null

  const handleRemoveMessage = (uuid) => {
    contextActions.removeFromContext(uuid)
  }

  const handleMaxContentLengthChange = (value) => {
    const numValue = parseInt(value, 10) || 0
    setMaxContentLength(numValue)
    saveConfig({ maxContentLength: numValue })
  }

  const handleSystemPromptChange = (value) => {
    setSystemPrompt(value)
    saveConfig({ systemPrompt: value })
  }

  const saveConfig = (updates) => {
    // 读取现有配置
    const config = StorageManager.get('ai-context-config', { maxContentLength: 3000, systemPrompt: '' })

    // 合并更新并保存
    StorageManager.set('ai-context-config', { ...config, ...updates })
  }

  const handleAddCustom = () => {
    if (customContent.trim()) {
      contextActions.addCustomContent({
        content: customContent.trim(),
        label: customLabel.trim() || t('aiChat.context.customLabel') || '用户补充'
      })
      setCustomContent('')
      setCustomLabel('')
      setShowAddCustom(false)
    }
  }

  // 按分支分组消息，并在每个分支内按 index 排序
  const groupedByBranch = activeContext.reduce((acc, msg) => {
    const branch = msg.branch || 'main'
    if (!acc[branch]) {
      acc[branch] = []
    }
    acc[branch].push(msg)
    return acc
  }, {})

  // 对每个分支内的消息按 index 排序
  Object.keys(groupedByBranch).forEach(branch => {
    groupedByBranch[branch].sort((a, b) => {
      // 自定义内容（index = -1）排在最前
      if (a.isCustom && !b.isCustom) return -1
      if (!a.isCustom && b.isCustom) return 1
      // 其他按 index 升序
      return a.index - b.index
    })
  })

  const branches = Object.keys(groupedByBranch)

  const handleClearBranch = (branchId) => {
    const branchMessages = groupedByBranch[branchId]
    if (branchMessages && branchMessages.length > 0) {
      const minIndex = Math.min(...branchMessages.map(m => m.index))
      contextActions.clearBranch(branchId, minIndex)
    }
  }

  return (
    <div className="lyra-context-detail-overlay" onClick={onClose}>
      <div className="lyra-context-detail" onClick={e => e.stopPropagation()}>
        <div className="lyra-context-detail__header">
          <h4>{t('aiChat.context.detailsTitle')}</h4>
          <IconButton
            icon={<IconClose size={14} />}
            onClick={onClose}
            size="sm"
          />
        </div>

        <div className="lyra-context-detail__body">
          {/* 上下文配置 */}
          <div className="lyra-context-detail__section">
            <div className="lyra-context-detail__section-header">
              <h5>⚙️ {t('aiChat.context.config') || '上下文配置'}</h5>
            </div>
            <div className="lyra-context-detail__config">
              <label className="lyra-context-detail__config-label">
                <span>{t('aiChat.context.maxContentLength') || '消息截取长度'}</span>
                <span className="lyra-context-detail__config-desc">
                  {t('aiChat.context.maxContentLengthDesc') || '每条消息最多保留的字符数（0 = 不限制）'}
                </span>
              </label>
              <input
                type="number"
                className="lyra-input lyra-input--sm"
                value={maxContentLength}
                onChange={(e) => handleMaxContentLengthChange(e.target.value)}
                min={0}
                max={50000}
                step={500}
                style={{ width: '120px' }}
              />
            </div>

            <div className="lyra-context-detail__config lyra-context-detail__config--column">
              <label className="lyra-context-detail__config-label">
                <span>{t('aiChat.context.systemPrompt') || '自定义系统提示词'}</span>
                <span className="lyra-context-detail__config-desc">
                  {t('aiChat.context.systemPromptDesc') || '留空使用默认提示词。可用占位符：{contextSummary}、{pathSummary}'}
                </span>
              </label>
              <textarea
                className="lyra-textarea lyra-textarea--sm"
                value={systemPrompt}
                onChange={(e) => handleSystemPromptChange(e.target.value)}
                placeholder={t('aiChat.context.systemPromptPlaceholder') || '留空使用默认系统提示词...'}
                rows={6}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>

          <Divider />

          {/* 消息列表 - 按分支分组 */}
          <div className="lyra-context-detail__section">
            <div className="lyra-context-detail__section-header">
              <h5>{t('aiChat.context.browsingMessages')} ({activeContext.length})</h5>
              <button
                className="lyra-btn lyra-btn--sm lyra-btn--secondary"
                onClick={() => setShowAddCustom(!showAddCustom)}
              >
                {showAddCustom ? '取消' : '+ 添加内容'}
              </button>
            </div>

            {/* 添加自定义内容表单 */}
            {showAddCustom && (
              <div className="lyra-context-detail__add-form">
                <input
                  type="text"
                  className="lyra-input lyra-input--sm"
                  placeholder="标签（如：背景信息、用户总结）"
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                />
                <textarea
                  className="lyra-textarea lyra-textarea--sm"
                  placeholder="输入要添加的内容..."
                  value={customContent}
                  onChange={e => setCustomContent(e.target.value)}
                  rows={3}
                />
                <button
                  className="lyra-btn lyra-btn--sm lyra-btn--primary"
                  onClick={handleAddCustom}
                  disabled={!customContent.trim()}
                >
                  添加
                </button>
              </div>
            )}

            {/* 按分支显示 */}
            <div className="lyra-context-detail__branches">
              {branches.map(branchId => (
                <div key={branchId} className="lyra-context-detail__branch">
                  <div className="lyra-context-detail__branch-header">
                    <span className="lyra-context-detail__branch-name">
                      {branchId === 'main' ? '主分支' : branchId === 'custom' ? '自定义' : `分支 ${branchId}`}
                    </span>
                    <span className="lyra-context-detail__branch-count">
                      ({groupedByBranch[branchId].length})
                    </span>
                    {branchId !== 'custom' && branches.length > 1 && (
                      <button
                        className="lyra-btn lyra-btn--xs lyra-btn--danger"
                        onClick={() => handleClearBranch(branchId)}
                        title={`清理 ${branchId} 分支`}
                      >
                        清理分支
                      </button>
                    )}
                  </div>
                  <div className="lyra-context-detail__list">
                    {groupedByBranch[branchId].map((msg, idx) => (
                      <div key={msg.uuid || idx} className="lyra-context-detail__item">
                        <span className="lyra-context-detail__index">
                          {msg.isCustom ? '📝' : `#${msg.index}`}
                        </span>
                        <span className="lyra-context-detail__sender">
                          {msg.sender === 'human' ? '👤' : msg.sender === 'user_custom' ? '✏️' : '🤖'}
                        </span>
                        <span className="lyra-context-detail__preview">
                          {msg.label && <strong>[{msg.label}] </strong>}
                          {msg.content?.substring(0, 50)}...
                        </span>
                        <IconButton
                          icon={<IconClose size={12} />}
                          onClick={() => handleRemoveMessage(msg.uuid)}
                          title={t('aiChat.context.remove')}
                          size="xs"
                          className="lyra-context-detail__remove"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {activeContext.length === 0 && (
                <div className="lyra-context-detail__empty">
                  {t('aiChat.context.empty')}
                </div>
              )}
            </div>
          </div>

          {/* 浏览轨迹 */}
          <div className="lyra-context-detail__section">
            <h5>{t('aiChat.context.browsingPath')} ({browsingPath.length})</h5>
            <div className="lyra-context-detail__list lyra-context-detail__list--compact">
              {browsingPath.slice(-10).map((entry, idx) => (
                <div key={idx} className="lyra-context-detail__item lyra-context-detail__item--path">
                  <span className="lyra-context-detail__action">
                    {entry.action === 'view' && '👁️'}
                    {entry.action === 'switch_branch' && '🔀'}
                    {entry.action === 'clear' && '🗑️'}
                    {entry.action === 'clear_branch' && '🧹'}
                    {entry.action === 'remove' && '❌'}
                    {entry.action === 'add_custom' && '📝'}
                  </span>
                  <span className="lyra-context-detail__detail">
                    {entry.action === 'view' && `消息 #${entry.index}`}
                    {entry.action === 'switch_branch' && `${entry.from} → ${entry.to}`}
                    {entry.action === 'clear' && `清理 ${entry.clearedRange?.length || 0} 条`}
                    {entry.action === 'clear_branch' && `清理分支 ${entry.branchId} (${entry.clearedCount} 条)`}
                    {entry.action === 'remove' && `移除消息`}
                    {entry.action === 'add_custom' && `添加 ${entry.label}`}
                  </span>
                  <span className="lyra-context-detail__time">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {browsingPath.length === 0 && (
                <div className="lyra-context-detail__empty">
                  暂无浏览轨迹
                </div>
              )}
            </div>
          </div>

          {/* 摘要 */}
          {summaries.length > 0 && (
            <div className="lyra-context-detail__section">
              <h5>{t('aiChat.context.summaries')} ({summaries.length})</h5>
              <div className="lyra-context-detail__list">
                {summaries.map((s, idx) => (
                  <div key={idx} className="lyra-context-detail__item">
                    <span className="lyra-context-detail__summary">
                      {s.summary.substring(0, 100)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Message List - 消息列表组件
// ============================================

/**
 * Markdown 渲染组件配置
 */
const MarkdownComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '')
    return !inline && match ? (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    )
  }
}

/**
 * 单条消息组件
 */
function Message({ message, onEdit, onDelete, onRetry, isLastUserMessage = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.content || '')
  const textareaRef = useRef(null)

  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const isStreaming = message.status === 'streaming'
  const isError = message.status === 'error'

  // 自动调整 textarea 高度
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing, editText])

  const handleSaveEdit = useCallback(() => {
    if (editText.trim() && editText !== message.content) {
      onEdit?.(message.id, editText.trim())
    }
    setIsEditing(false)
  }, [editText, message.id, message.content, onEdit])

  const handleCancelEdit = useCallback(() => {
    setEditText(message.content || '')
    setIsEditing(false)
  }, [message.content])

  const handleStartEdit = useCallback(() => {
    setEditText(message.content || '')
    setIsEditing(true)
  }, [message.content])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSaveEdit()
    }
    if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }, [handleSaveEdit, handleCancelEdit])

  return (
    <div className={`lyra-message lyra-message--${message.role} ${isError ? 'lyra-message--error' : ''} ${isEditing ? 'lyra-message--editing' : ''}`}>
      <div className="lyra-message__avatar">
        {isUser ? '👤' : isSystem ? '⚙️' : '🤖'}
      </div>
      <div className="lyra-message__content">
        {/* 消息操作按钮 */}
        {!isStreaming && (
          <div className="lyra-message__actions">
            {!isEditing ? (
              <>
                <IconButton
                  icon={<IconEdit size={14} />}
                  onClick={handleStartEdit}
                  title="编辑"
                  size="xs"
                  variant="ghost"
                />
                {isUser && isLastUserMessage && onRetry && (
                  <IconButton
                    icon={<IconRefresh size={14} />}
                    onClick={() => onRetry(message.id)}
                    title="重试"
                    size="xs"
                    variant="ghost"
                  />
                )}
                {onDelete && (
                  <IconButton
                    icon={<IconTrash size={14} />}
                    onClick={() => onDelete(message.id)}
                    title="删除"
                    size="xs"
                    variant="ghost"
                  />
                )}
              </>
            ) : (
              <>
                <IconButton
                  icon={<IconCheck size={14} />}
                  onClick={handleSaveEdit}
                  title="保存 (Ctrl+Enter)"
                  size="xs"
                  variant="primary"
                />
                <IconButton
                  icon={<IconX size={14} />}
                  onClick={handleCancelEdit}
                  title="取消 (Esc)"
                  size="xs"
                  variant="ghost"
                />
              </>
            )}
          </div>
        )}

        {/* 消息内容 */}
        {isEditing ? (
          <div className="lyra-message__edit-mode">
            <textarea
              ref={textareaRef}
              className="lyra-message__edit-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder="输入消息内容..."
            />
          </div>
        ) : (
          <div className="lyra-message__text">
            {message.content ? (
              isUser ? (
                // 用户消息：纯文本显示
                <div className="lyra-message__user-text">
                  {message.content}
                </div>
              ) : (
                // AI 消息：Markdown 渲染
                <div className="lyra-message__markdown">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={MarkdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )
            ) : isStreaming ? (
              <span className="lyra-message__placeholder">...</span>
            ) : null}
            {isStreaming && (
              <span className="lyra-message__cursor">▋</span>
            )}
          </div>
        )}

        {/* 工具调用 */}
        {message.toolCalls?.length > 0 && (
          <div className="lyra-message__tools">
            {message.toolCalls.map(tool => (
              <div key={tool.id} className={`lyra-tool-call lyra-tool-call--${tool.status}`}>
                <span className="lyra-tool-call__name">🔧 {tool.toolName}</span>
                {tool.status === 'running' && <IconLoading size={12} />}
                {tool.status === 'success' && <span className="lyra-tool-call__status">✓</span>}
                {tool.status === 'error' && <span className="lyra-tool-call__status">✗</span>}
              </div>
            ))}
          </div>
        )}

        {/* 时间戳和编辑标记 */}
        <div className="lyra-message__meta">
          <span className="lyra-message__time">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.isEdited && !isEditing && (
            <span className="lyra-message__edited" title="已编辑">
              (已编辑)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * AI 上下文完整信息面板
 */
function AIContextPanel({ isOpen, onClose }) {
  const { activeContext } = useContextStore()

  if (!isOpen) return null

  // 读取消息截取长度配置
  const exportOptions = StorageManager.get('export_options', {})
  const messageTruncateLength = exportOptions.messageTruncateLength || 0

  // 截取消息内容的函数
  const truncateMessage = (content) => {
    if (!messageTruncateLength || messageTruncateLength <= 0) {
      return content
    }
    if (content.length > messageTruncateLength) {
      return content.substring(0, messageTruncateLength) + '...'
    }
    return content
  }

  // 读取系统提示词 - 包括默认提示词
  const config = StorageManager.get('ai-context-config', { systemPrompt: '' })
  let systemPrompt = config.systemPrompt || ''

  // 如果没有自定义提示词，使用默认提示词
  if (!systemPrompt) {
    systemPrompt = `[对话已重置，接受任务]`
  }

  // 估算 token
  const tokenCount = Math.ceil(
    activeContext.reduce((sum, m) => sum + (m.content?.length || 0), 0) / 4
  )

  // 按分支分组消息
  const groupedByBranch = activeContext.reduce((acc, msg) => {
    const branch = msg.branch || 'main'
    if (!acc[branch]) {
      acc[branch] = []
    }
    acc[branch].push(msg)
    return acc
  }, {})

  Object.keys(groupedByBranch).forEach(branch => {
    groupedByBranch[branch].sort((a, b) => {
      if (a.isCustom && !b.isCustom) return -1
      if (!a.isCustom && b.isCustom) return 1
      return a.index - b.index
    })
  })

  const branches = Object.keys(groupedByBranch)

  return (
    <div className="lyra-ai-context-panel">
      <div className="lyra-ai-context-panel__content">
        {/* 头部 */}
        <div className="lyra-ai-context-panel__header">
          <h3 className="lyra-ai-context-panel__title">🤖 AI 看到的完整上下文信息</h3>
          <button
            className="lyra-ai-context-panel__close-btn"
            onClick={onClose}
            title="关闭"
          >
            ✕
          </button>
        </div>

        {/* 内容体 */}
        <div className="lyra-ai-context-panel__body">
          {/* 统计信息 */}
          <div className="lyra-ai-context-panel__stats">
            <div className="lyra-ai-context-panel__stat-item">
              <span className="lyra-ai-context-panel__stat-label">消息数</span>
              <span className="lyra-ai-context-panel__stat-value">{activeContext.length}</span>
            </div>
            <div className="lyra-ai-context-panel__stat-item">
              <span className="lyra-ai-context-panel__stat-label">Token估算</span>
              <span className="lyra-ai-context-panel__stat-value">{tokenCount}</span>
            </div>
          </div>
        {/* 系统提示词 */}
        <div className="lyra-ai-context-panel__section">
          <h4 className="lyra-ai-context-panel__section-title">
            ⚙️ 系统提示词
          </h4>
          <div className="lyra-ai-context-panel__prompt-box">
            <pre className="lyra-ai-context-panel__prompt-text">{systemPrompt}</pre>
          </div>
        </div>

          {/* 上下文消息 */}
          <div className="lyra-ai-context-panel__section">
            <h4 className="lyra-ai-context-panel__section-title">
              💬 上下文消息
            </h4>
            {activeContext.length === 0 ? (
              <div className="lyra-ai-context-panel__empty-hint">
                暂无上下文消息
              </div>
            ) : (
              <div className="lyra-ai-context-panel__branches">
                {branches.map(branchId => (
                  <div key={branchId} className="lyra-ai-context-panel__branch">
                    <div className="lyra-ai-context-panel__branch-header">
                      <span className="lyra-ai-context-panel__branch-name">
                        {branchId === 'main' ? '📌 主分支' : branchId === 'custom' ? '📝 自定义' : `🔀 分支 ${branchId}`}
                      </span>
                      <span className="lyra-ai-context-panel__branch-count">
                        {groupedByBranch[branchId].length} 条
                      </span>
                    </div>
                    <div className="lyra-ai-context-panel__messages">
                      {groupedByBranch[branchId].map((msg, idx) => (
                        <div key={msg.uuid || idx} className="lyra-ai-context-panel__message">
                          <div className="lyra-ai-context-panel__message-header">
                            <span className="lyra-ai-context-panel__message-sender">
                              {msg.sender === 'human' ? '用户' : msg.sender === 'user_custom' ? '补充' : 'AI'}
                            </span>
                            <span className="lyra-ai-context-panel__message-index">
                              {msg.isCustom ? '' : `#${msg.index}`}
                            </span>
                            {msg.label && (
                              <span className="lyra-ai-context-panel__message-label">
                                [{msg.label}]
                              </span>
                            )}
                          </div>
                          <div className="lyra-ai-context-panel__message-text">
                            {truncateMessage(msg.content)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

/**
 * 消息列表组件
 */
export function MessageList({ messages = [], isLoading = false, onEditMessage, onDeleteMessage, onRetryMessage }) {
  const listRef = useRef(null)
  const bottomRef = useRef(null)

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 找到最后一条用户消息
  const lastUserMessageId = [...messages].reverse().find(m => m.role === 'user')?.id

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="lyra-message-list lyra-message-list--empty">
        <div className="lyra-message-list__placeholder">
          <span className="lyra-message-list__placeholder-icon">💬</span>
          <p>开始与AI助手对话</p>
          <p className="lyra-message-list__placeholder-hint">
            询问关于浏览中对话的问题，或请求帮助整理内容
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="lyra-message-list" ref={listRef}>
      {/* 消息列表 */}
      {messages.map(message => (
        <Message
          key={message.id}
          message={message}
          onEdit={onEditMessage}
          onDelete={onDeleteMessage}
          onRetry={onRetryMessage}
          isLastUserMessage={message.id === lastUserMessageId}
        />
      ))}
      {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
        <div className="lyra-message lyra-message--assistant lyra-message--loading">
          <div className="lyra-message__avatar">🤖</div>
          <div className="lyra-message__content">
            <div className="lyra-message__typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

// ============================================
// Chat Input - 聊天输入组件
// ============================================

/**
 * 聊天输入组件
 */
export function ChatInput({ onSend, onCancel, disabled = false, isLoading = false, placeholder = '输入消息...' }) {
  const [text, setText] = useState('')
  const { textareaRef, resize } = useAutoResize(150)

  const handleChange = useCallback((value) => {
    setText(value)
    resize()
  }, [resize])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled || isLoading) return

    onSend(trimmed)
    setText('')

    // 重置高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, disabled, isLoading, onSend, textareaRef])

  const handleKeyDown = useCallback((e) => {
    // Enter发送，Shift+Enter换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    // Escape取消
    if (e.key === 'Escape' && isLoading) {
      onCancel?.()
    }
  }, [handleSend, isLoading, onCancel])

  return (
    <div className="lyra-chat-input">
      <div className="lyra-chat-input__wrapper">
        <Textarea
          textareaRef={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="lyra-chat-input__textarea"
        />
        <div className="lyra-chat-input__actions">
          {isLoading ? (
            <IconButton
              icon={<IconLoading size={18} />}
              onClick={onCancel}
              title="取消"
              variant="ghost"
            />
          ) : (
            <IconButton
              icon={<IconSend size={18} />}
              onClick={handleSend}
              disabled={!text.trim() || disabled}
              title="发送 (Enter)"
              variant="primary"
            />
          )}
        </div>
      </div>
      <div className="lyra-chat-input__hint">
        <span>Enter 发送 · Shift+Enter 换行</span>
      </div>
    </div>
  )
}

// ============================================
// Chat Panel - 对话面板主组件
// ============================================

/**
 * 对话面板组件
 */
export function ChatPanel() {
  const [showContextDetail, setShowContextDetail] = useState(false)
  const [showAIContextPanel, setShowAIContextPanel] = useState(false)

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    cancel,
    clear,
    retry,
    editMessage,
    deleteMessage,
    isConfigured
  } = useChatService()

  const contextStore = useContextStore()

  const handleSend = useCallback((text) => {
    sendMessage(text)
  }, [sendMessage])

  const handleClear = useCallback(() => {
    clear()
  }, [clear])

  const handleRefreshContext = useCallback(() => {
    // TODO: 从浏览面板刷新上下文
    console.log('Refresh context from browsing panel')
  }, [])

  const handleEditMessage = useCallback((messageId, newContent) => {
    editMessage(messageId, newContent)
  }, [editMessage])

  const handleDeleteMessage = useCallback((messageId) => {
    // eslint-disable-next-line no-restricted-globals
    if (window.confirm('确定要删除这条消息吗？')) {
      deleteMessage(messageId)
    }
  }, [deleteMessage])

  const handleRetryMessage = useCallback((messageId) => {
    retry(messageId)
  }, [retry])

  // 未配置API Key时的提示
  if (!isConfigured) {
    return (
      <div className="lyra-chat-panel lyra-chat-panel--unconfigured">
        <div className="lyra-chat-panel__notice">
          <span className="lyra-chat-panel__notice-icon">⚙️</span>
          <h4>需要配置API</h4>
          <p>请打开主设置面板（点击右上角⚙️图标）配置AI Chat API密钥</p>
          <p style={{ fontSize: '0.85em', marginTop: '0.5em', opacity: 0.7 }}>
            设置 → AI设置 → AI Chat API配置
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="lyra-chat-panel">
      {/* 上下文状态栏 */}
      <div className="lyra-chat-panel__context">
        <ContextStatus
          onClear={() => contextStore.clearAll()}
          onRefresh={handleRefreshContext}
        />
        <IconButton
          icon={showContextDetail ? '▲' : '▼'}
          onClick={() => setShowContextDetail(!showContextDetail)}
          title={showContextDetail ? '收起详情' : '展开详情'}
          size="sm"
        />
      </div>

      {/* 上下文详情 */}
      <ContextDetail
        isOpen={showContextDetail}
        onClose={() => setShowContextDetail(false)}
      />

      <Divider />

      {/* 工具栏 */}
      <div className="lyra-chat-panel__toolbar">
        <IconButton
          icon={<IconInfo size={16} />}
          onClick={() => setShowAIContextPanel(true)}
          title="查看AI完整上下文"
          size="sm"
        />
        <IconButton
          icon={<IconTrash size={16} />}
          onClick={handleClear}
          title="清空对话"
          disabled={messages.length === 0}
          size="sm"
        />
        {error && (
          <span className="lyra-chat-panel__error" title={error}>
            ⚠️ {error.length > 20 ? error.substring(0, 20) + '...' : error}
          </span>
        )}
      </div>

      {/* 消息列表 */}
      <div className="lyra-chat-panel__messages">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onRetryMessage={handleRetryMessage}
        />
      </div>

      {/* 输入区域 */}
      <div className="lyra-chat-panel__input">
        <ChatInput
          onSend={handleSend}
          onCancel={cancel}
          isLoading={isLoading}
          placeholder={
            contextStore.activeContext.length > 0
              ? '询问关于浏览中对话的问题...'
              : '开始对话...'
          }
        />
      </div>

      {/* AI 上下文面板 */}
      <AIContextPanel
        isOpen={showAIContextPanel}
        onClose={() => setShowAIContextPanel(false)}
      />
    </div>
  )
}

// ============================================
// Float Panel - 浮窗面板组件
// ============================================

/**
 * 浮窗头部组件
 */
function PanelHeader({ isPinned, isMinimized, onClose, onMinimize, onRestore, onTogglePin, dragRef, onMouseDown, t }) {
  return (
    <div
      ref={dragRef}
      className="lyra-float-panel__header"
      onMouseDown={onMouseDown}
    >
      <div className="lyra-float-panel__title">
        <span className="lyra-float-panel__icon">💬</span>
        <span className="lyra-float-panel__name">
          {t('aiChat.panel.title')}
        </span>
      </div>

      <div className="lyra-float-panel__controls">
        <IconButton
          icon={<IconPin size={14} filled={isPinned} />}
          onClick={onTogglePin}
          title={isPinned ? t('aiChat.panel.unpin') : t('aiChat.panel.pin')}
          size="sm"
        />
        <IconButton
          icon={isMinimized ? <IconMaximize size={14} /> : <IconMinimize size={14} />}
          onClick={isMinimized ? onRestore : onMinimize}
          title={isMinimized ? t('aiChat.panel.restore') : t('aiChat.panel.minimize')}
          size="sm"
        />
        <IconButton
          icon={<IconClose size={14} />}
          onClick={onClose}
          title={t('aiChat.panel.close')}
          size="sm"
        />
      </div>
    </div>
  )
}

/**
 * 调整大小手柄
 */
function ResizeHandle({ onMouseDown }) {
  return (
    <div
      className="lyra-float-panel__resize-handle"
      onMouseDown={onMouseDown}
    >
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

/**
 * 最小化状态的浮窗
 */
function MinimizedPanel({ onClick, t }) {
  return (
    <div className="lyra-float-panel lyra-float-panel--minimized" onClick={onClick}>
      <span className="lyra-float-panel__minimized-icon">💬</span>
      <span className="lyra-float-panel__minimized-label">{t('aiChat.panel.assistant')}</span>
    </div>
  )
}

/**
 * 浮窗面板主组件
 */
export function FloatPanel() {
  const { t } = useI18n()
  const panelState = usePanelStore()
  const {
    isOpen,
    isMinimized,
    isPinned,
    position,
    size,
    open,
    close,
    minimize,
    restore,
    togglePin,
    setPosition,
    setSize
  } = panelState

  // 拖拽hook
  const {
    dragRef,
    isDragging,
    position: dragPosition,
    handleMouseDown: handleDragStart
  } = useDraggable({
    initialPosition: position,
    onDragEnd: setPosition
  })

  // 调整大小hook
  const {
    isResizing,
    size: resizeSize,
    startResize
  } = useResizable({
    initialSize: size,
    minSize: { width: 320, height: 400 },
    onResizeEnd: setSize
  })

  // 使用拖拽/调整大小的实时位置和尺寸
  const currentPosition = isDragging ? dragPosition : position
  const currentSize = isResizing ? resizeSize : size

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isPinned) {
        close()
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'l') {
        e.preventDefault()
        if (isOpen) {
          close()
        } else {
          open()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isPinned, open, close])

  // 不显示
  if (!isOpen) {
    return null
  }

  // 最小化状态
  if (isMinimized) {
    return <MinimizedPanel onClick={restore} t={t} />
  }

  // 面板样式
  const panelStyle = {
    left: `${currentPosition.x}px`,
    top: `${currentPosition.y}px`,
    width: `${currentSize.width}px`,
    height: `${currentSize.height}px`
  }

  return (
    <div
      className={`lyra-float-panel ${isDragging ? 'lyra-float-panel--dragging' : ''} ${isResizing ? 'lyra-float-panel--resizing' : ''} ${isPinned ? 'lyra-float-panel--pinned' : ''}`}
      style={panelStyle}
    >
      <PanelHeader
        isPinned={isPinned}
        isMinimized={isMinimized}
        onClose={close}
        onMinimize={minimize}
        onRestore={restore}
        onTogglePin={togglePin}
        dragRef={dragRef}
        onMouseDown={handleDragStart}
        t={t}
      />

      <div className="lyra-float-panel__body">
        <ChatPanel />
      </div>

      <ResizeHandle onMouseDown={startResize} />
    </div>
  )
}

/**
 * 浮窗触发按钮 - 用于打开浮窗
 */
export function FloatPanelTrigger({ position = 'bottom-right' }) {
  const { t } = useI18n()
  const { isOpen, toggle } = usePanelStore()

  return (
    <button
      className={`lyra-float-trigger lyra-float-trigger--${position} ${isOpen ? 'lyra-float-trigger--active' : ''}`}
      onClick={toggle}
      title={isOpen ? t('aiChat.panel.close') : t('aiChat.panel.assistant')}
    >
      <span className="lyra-float-trigger__icon">
        {isOpen ? '✕' : '💬'}
      </span>
    </button>
  )
}

const AIChatComponents = {
  FloatPanel,
  FloatPanelTrigger,
  ChatPanel,
  ChatInput,
  MessageList,
  ContextStatus,
  ContextDetail
}
export default AIChatComponents;
