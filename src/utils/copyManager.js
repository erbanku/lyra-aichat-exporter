// utils/copyManager.js
// 统一的复制功能管理模块

import { StorageUtils } from '../App';
import {
  formatAttachments as formatAttachmentsHelper,
  formatThinking as formatThinkingHelper
} from './formatHelpers.js';

/**
 * 复制配置管理
 */
export class CopyConfigManager {
  static getConfig() {
    // 获取导出配置中的思考格式设置
    const exportConfig = StorageUtils.getLocalStorage('export-config', {});
    
    return StorageUtils.getLocalStorage('copy_options', {
      includeThinking: false,
      includeArtifacts: false,
      includeCanvas: false,
      includeMetadata: true,
      thinkingFormat: exportConfig.thinkingFormat || 'codeblock'
    });
  }

  static saveConfig(config) {
    return StorageUtils.setLocalStorage('copy_options', config);
  }
}

/**
 * 消息格式化器
 */
export class MessageFormatter {
  static format(message, options = {}) {
    const config = {
      ...CopyConfigManager.getConfig(),
      ...options
    };
    
    // 从 options 中获取翻译文本
    const i18n = options.i18n || {
      timeLabel: 'Time',
      thinkingLabel: '💭 Thinking Process:',
      artifactsLabel: '🔧 Artifacts:',
      canvasLabel: '🎨 Canvas:',
      attachmentsLabel: '📎 Attachments:',
      noTitle: 'No title',
      unknownType: 'Unknown type',
      content: 'Content'
    };
    
    const parts = [];
    
    // 添加元数据
    if (config.includeMetadata) {
      parts.push(
        `【${message.sender_label}】`,
        message.timestamp ? `${i18n.timeLabel}: ${message.timestamp}` : null,
        '---'
      );
    }
    
    // 思考过程（前置）- 格式为 codeblock 或 xml
    const thinkingFormat = config.thinkingFormat || 'codeblock';
    if (config.includeThinking && message.thinking &&
        (thinkingFormat === 'codeblock' || thinkingFormat === 'xml')) {
      const thinkingText = formatThinkingHelper(message.thinking, thinkingFormat, i18n.thinkingLabel);
      parts.push('', thinkingText);
    }
    
    // 添加主要内容
    if (message.display_text) {
      parts.push(message.display_text);
    }
    
    // 添加附件（在主内容之后）
    if (config.includeAttachments && message.attachments?.length > 0) {
      const attachmentsText = this.formatAttachments(message.attachments);
      if (attachmentsText) {
        parts.push('', attachmentsText);
      }
    }
    
    // 思考过程（后置）- 格式为 emoji
    if (config.includeThinking && message.thinking && thinkingFormat === 'emoji') {
      const thinkingText = formatThinkingHelper(message.thinking, thinkingFormat, i18n.thinkingLabel);
      parts.push('', thinkingText);
    }
    
    // 添加Artifacts
    if (config.includeArtifacts && message.artifacts?.length > 0) {
      parts.push('', i18n.artifactsLabel);
      
      message.artifacts.forEach(artifact => {
        parts.push(
          '',
          `### ${artifact.title || i18n.noTitle} (${artifact.type || i18n.unknownType})`
        );
        
        if (artifact.content) {
          const language = artifact.language || '';
          parts.push(
            `\`\`\`${language}`,
            artifact.content,
            '```'
          );
        }
      });
    }
    
    // 添加Canvas（Gemini格式）
    if (config.includeCanvas && message.canvas?.length > 0) {
      parts.push('', i18n.canvasLabel);
      
      message.canvas.forEach(canvas => {
        parts.push(
          '',
          `### ${canvas.title || i18n.noTitle} (${canvas.type || i18n.unknownType})`
        );
        
        if (canvas.content) {
          const language = canvas.language || '';
          parts.push(
            `\`\`\`${language}`,
            canvas.content,
            '```'
          );
        }
      });
    }
    
    return parts.filter(Boolean).join('\n');
  }

  /**
   * 格式化附件 - 使用共享辅助函数
   */
  static formatAttachments(attachments) {
    return formatAttachmentsHelper(attachments, { includeAttachments: true });
  }
}

/**
 * 剪贴板操作管理
 */
export class ClipboardManager {
  static async copy(text) {
    try {
      // 优先使用现代API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // 降级方案
      return this.copyFallback(text);
    } catch (error) {
      console.error('Copy failed:', error);
      return false;
    }
  }

  static copyFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position: fixed; left: -999999px; top: -999999px;';
    document.body.appendChild(textarea);
    
    try {
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      return success;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * 通知管理器
 */
export class NotificationManager {
  static show(message, type = 'success', duration = 3000) {
    // 移除已存在的通知
    const existing = document.querySelector('.copy-notification');
    if (existing) existing.remove();
    
    // 创建新通知
    const notification = this.createElement(message, type);
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  static createElement(message, type) {
    const notification = document.createElement('div');
    notification.className = `copy-notification ${type}`;
    notification.textContent = message;
    
    const styles = {
      success: '#4CAF50',
      error: '#f44336',
      info: '#2196F3'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 20px;
      background: ${styles[type] || styles.info};
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideDown 0.3s ease;
      font-size: 14px;
    `;
    
    return notification;
  }

  static initStyles() {
    if (document.querySelector('#notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideDown {
        from { 
          opacity: 0;
          transform: translate(-50%, -20px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
      @keyframes slideUp {
        from {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -20px);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// 初始化样式
NotificationManager.initStyles();

/**
 * 主复制功能函数
 */
export async function copyMessage(message, options = {}) {
  try {
    // 从 options 中获取翻译消息
    const messages = options.messages || {
      success: 'Copied to clipboard',
      error: 'Copy failed, please try again',
      generalError: 'Copy failed'
    };
    
    const formattedText = MessageFormatter.format(message, options);
    const success = await ClipboardManager.copy(formattedText);
    
    if (success) {
      NotificationManager.show(messages.success);
    } else {
      NotificationManager.show(messages.error, 'error');
    }
    
    return success;
  } catch (error) {
    console.error('Copy message error:', error);
    const messages = options.messages || { generalError: 'Copy failed' };
    NotificationManager.show(messages.generalError, 'error');
    return false;
  }
}

/**
 * 批量复制功能
 */
export async function copyMessages(messages, options = {}) {
  try {
    // 从 options 中获取翻译消息和格式化函数
    const i18nMessages = options.messages || {
      success: (count) => `Copied ${count} messages`,
      error: 'Copy failed, please try again',
      generalError: 'Copy failed'
    };
    
    const texts = messages.map(msg => MessageFormatter.format(msg, options));
    const combinedText = texts.join('\n\n---\n\n');
    const success = await ClipboardManager.copy(combinedText);
    
    if (success) {
      const successMessage = typeof i18nMessages.success === 'function' 
        ? i18nMessages.success(messages.length)
        : i18nMessages.success;
      NotificationManager.show(successMessage);
    } else {
      NotificationManager.show(i18nMessages.error, 'error');
    }
    
    return success;
  } catch (error) {
    console.error('Copy messages error:', error);
    const i18nMessages = options.messages || { generalError: 'Copy failed' };
    NotificationManager.show(i18nMessages.generalError, 'error');
    return false;
  }
}
