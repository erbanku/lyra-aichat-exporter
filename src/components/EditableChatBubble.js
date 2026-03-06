// components/EditableChatBubble.js
// 可编辑的消息气泡组件 - 用于预览面板
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PlatformIcon from './PlatformIcon';
import { DateTimeUtils } from '../utils/fileParser';
import { useI18n } from '../index.js';

const EditableChatBubble = ({
  message,
  index,
  platform = 'claude',
  format = 'claude',
  onEdit,
  onDelete,
  showSplitLine = false,
  currentImageIndex = 1,
  showTags = true
}) => {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.display_text || message.text || '');

  const getPlatformAvatarClass = (sender) => {
    if (sender === 'human') return 'human';

    if (format === 'jsonl_chat') return 'assistant platform-jsonl_chat';
    if (format === 'chatgpt') return 'assistant platform-chatgpt';
    if (format === 'grok') return 'assistant platform-grok';
    if (format === 'gemini_notebooklm') {
      const platformLower = platform?.toLowerCase() || '';
      if (platformLower.includes('notebooklm')) return 'assistant platform-notebooklm';
      return 'assistant platform-gemini';
    }

    const platformLower = platform?.toLowerCase() || 'claude';
    if (platformLower.includes('jsonl')) return 'assistant platform-jsonl_chat';
    if (platformLower.includes('chatgpt')) return 'assistant platform-chatgpt';
    if (platformLower.includes('grok')) return 'assistant platform-grok';
    if (platformLower.includes('gemini')) return 'assistant platform-gemini';
    if (platformLower.includes('ai studio') || platformLower.includes('aistudio')) return 'assistant platform-aistudio';
    if (platformLower.includes('notebooklm')) return 'assistant platform-notebooklm';
    return 'assistant platform-claude';
  };

  const handleSaveEdit = () => {
    if (onEdit && editText !== (message.display_text || message.text)) {
      onEdit(message.uuid, editText);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(message.display_text || message.text || '');
    setIsEditing(false);
  };

  return (
    <div className="editable-bubble-wrapper">
      {/* 切分线 */}
      {showSplitLine && (
        <div className="split-line">
          <div className="split-line-content">
            <span className="split-line-icon">✂️</span>
            <span className="split-line-text">
              {t('screenshot.splitLine')} - {t('screenshot.image')} {currentImageIndex}
            </span>
          </div>
        </div>
      )}

      <div className="editable-bubble">
        <div className="timeline-message">
          <div className={`timeline-dot ${message.sender === 'human' ? 'human' : 'assistant'}`}></div>

          <div className="timeline-content">
            {/* 头部 */}
            <div className="timeline-header">
              <div className="timeline-sender">
                <div className={`timeline-avatar ${getPlatformAvatarClass(message.sender)}`}>
                  {message.sender === 'human' ? '👤' : (
                    <PlatformIcon
                      platform={platform?.toLowerCase() || 'claude'}
                      format={format}
                      size={20}
                      style={{ backgroundColor: 'transparent' }}
                    />
                  )}
                </div>
                <div className="sender-info">
                  <div className="sender-name">{message.sender_label}</div>
                  <div className="sender-time">
                    {DateTimeUtils.formatTime(message.timestamp)}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="bubble-actions">
                {!isEditing ? (
                  <>
                    <button
                      className="btn-icon"
                      onClick={() => setIsEditing(true)}
                      title={t('screenshot.edit')}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => onDelete && onDelete(message.uuid)}
                      title={t('screenshot.delete')}
                    >
                      🗑️
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn-icon btn-save"
                      onClick={handleSaveEdit}
                      title={t('common.save')}
                    >
                      ✓
                    </button>
                    <button
                      className="btn-icon btn-cancel"
                      onClick={handleCancelEdit}
                      title={t('common.cancel')}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 正文 */}
            <div className="timeline-body">
              {isEditing ? (
                <textarea
                  className="edit-textarea"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                  rows={Math.max(3, editText.split('\n').length)}
                />
              ) : (
                <div
                  className="message-text"
                  onDoubleClick={() => setIsEditing(true)}
                  title={t('screenshot.doubleClickToEdit')}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {editText}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* 标签 */}
            {showTags && !isEditing && (
              <div className="timeline-footer">
                {/* 思考过程 */}
                {message.sender !== 'human' && message.thinking && (
                  <div className="timeline-tag">
                    <span>💭</span>
                    <span>{t('timeline.tags.hasThinking')}</span>
                  </div>
                )}
                {/* 图片 - 合并 images 数组和 attachments 中的嵌入图片 */}
                {(() => {
                  // 兼容性处理：自动检测图片类型的附件
                  const embeddedImages = message.attachments?.filter(att => {
                    if (att.is_embedded_image) return true;
                    // 兼容旧数据：检查 MIME 类型
                    if (att.file_type && att.file_type.startsWith('image/')) return true;
                    return false;
                  }) || [];
                  const totalImages = (message.images?.length || 0) + embeddedImages.length;
                  return totalImages > 0 && (
                    <div className="timeline-tag">
                      <span>🖼️</span>
                      <span>{totalImages}{t('timeline.tags.images')}</span>
                    </div>
                  );
                })()}
                {/* 附件 - 排除嵌入的图片，只显示真实附件 */}
                {(() => {
                  // 兼容性处理：自动排除图片类型的附件
                  const regularAttachments = message.attachments?.filter(att => {
                    if (att.is_embedded_image) return false;
                    // 兼容旧数据：排除图片类型
                    if (att.file_type && att.file_type.startsWith('image/')) return false;
                    return true;
                  }) || [];
                  return regularAttachments.length > 0 && (
                    <div className="timeline-tag">
                      <span>📎</span>
                      <span>{regularAttachments.length}{t('timeline.tags.attachments')}</span>
                    </div>
                  );
                })()}
                {/* Artifacts */}
                {message.sender !== 'human' && message.artifacts && message.artifacts.length > 0 && (
                  <div className="timeline-tag">
                    <span>🔧</span>
                    <span>{message.artifacts.length}{t('timeline.tags.artifacts')}</span>
                  </div>
                )}
                {/* Canvas */}
                {message.sender !== 'human' && message.canvas && message.canvas.length > 0 && (
                  <div className="timeline-tag">
                    <span>🔧</span>
                    <span>Canvas</span>
                  </div>
                )}
                {/* 工具使用 */}
                {message.tools && message.tools.length > 0 && (
                  <div className="timeline-tag">
                    <span>🔍</span>
                    <span>{t('timeline.tags.usedTools')}</span>
                  </div>
                )}
                {/* 引用 */}
                {message.citations && message.citations.length > 0 && (
                  <div className="timeline-tag">
                    <span>🔗</span>
                    <span>{message.citations.length}{t('timeline.tags.citations')}</span>
                  </div>
                )}

                {/* 用户标记 */}
                {message.marks?.completed && (
                  <div className="timeline-tag completed">
                    <span>✓</span>
                    <span>{t('timeline.tags.completed')}</span>
                  </div>
                )}
                {message.marks?.important && (
                  <div className="timeline-tag important">
                    <span>⭐</span>
                    <span>{t('timeline.tags.important')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditableChatBubble;
