// utils/export/pdfLatexRenderer.js
// LaTeX数学公式渲染器 - 使用Unicode映射和自定义绘图实现非SVG渲染
// 优化版：支持更多LaTeX命令，宽度计算缓存机制

// ============ 渲染常量 ============
const LATEX_RENDER_CONSTANTS = {
  // 字体缩放比例
  FRACTION_FONT_SCALE: 0.75,      // 分数内字体缩放
  SUPERSCRIPT_FONT_SCALE: 0.7,    // 上标字体缩放
  SUBSCRIPT_FONT_SCALE: 0.7,      // 下标字体缩放
  DISPLAY_FONT_SCALE: 1.2,        // 块级公式放大
  
  // 位置偏移比例（相对于fontSize）
  FRACTION_NUM_OFFSET: 0.17,      // 分子上移
  FRACTION_DEN_OFFSET: 0.5,       // 分母下移
  SUPERSCRIPT_OFFSET: 0.3,        // 上标上移
  SUBSCRIPT_OFFSET: 0.3,          // 下标下移
  
  // 其他
  FRACTION_PADDING: 4,            // 分数左右padding
  SQRT_PADDING: 8,                // 根号padding
  CACHE_MAX_SIZE: 500,            // 宽度缓存最大条目数
};

/**
 * LaTeX到Unicode的映射表
 */
const LATEX_UNICODE_MAP = {
  // 希腊字母小写
  'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
  'epsilon': 'ε', 'varepsilon': 'ε', 'zeta': 'ζ', 'eta': 'η',
  'theta': 'θ', 'vartheta': 'ϑ', 'iota': 'ι', 'kappa': 'κ',
  'lambda': 'λ', 'mu': 'μ', 'nu': 'ν', 'xi': 'ξ',
  'pi': 'π', 'varpi': 'ϖ', 'rho': 'ρ', 'varrho': 'ϱ',
  'sigma': 'σ', 'varsigma': 'ς', 'tau': 'τ', 'upsilon': 'υ',
  'phi': 'φ', 'varphi': 'φ', 'chi': 'χ', 'psi': 'ψ', 'omega': 'ω',
  
  // 希腊字母大写
  'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ',
  'Epsilon': 'Ε', 'Zeta': 'Ζ', 'Eta': 'Η', 'Theta': 'Θ',
  'Iota': 'Ι', 'Kappa': 'Κ', 'Lambda': 'Λ', 'Mu': 'Μ',
  'Nu': 'Ν', 'Xi': 'Ξ', 'Pi': 'Π', 'Rho': 'Ρ',
  'Sigma': 'Σ', 'Tau': 'Τ', 'Upsilon': 'Υ', 'Phi': 'Φ',
  'Chi': 'Χ', 'Psi': 'Ψ', 'Omega': 'Ω',
  
  // 数学运算符
  'pm': '±', 'mp': '∓', 'times': '×', 'div': '÷',
  'cdot': '·', 'ast': '∗', 'star': '⋆', 'circ': '∘',
  'bullet': '•', 'oplus': '⊕', 'ominus': '⊖', 'otimes': '⊗',
  'oslash': '⊘', 'odot': '⊙', 'dagger': '†', 'ddagger': '‡',
  
  // 关系符号
  'leq': '≤', 'le': '≤', 'geq': '≥', 'ge': '≥',
  'neq': '≠', 'ne': '≠', 'approx': '≈', 'equiv': '≡',
  'sim': '∼', 'simeq': '≃', 'propto': '∝', 'perp': '⊥',
  'parallel': '∥', 'subset': '⊂', 'supset': '⊃',
  'subseteq': '⊆', 'supseteq': '⊇', 'in': '∈', 'notin': '∉',
  
  // 箭头
  'leftarrow': '←', 'rightarrow': '→', 'uparrow': '↑', 'downarrow': '↓',
  'leftrightarrow': '↔', 'updownarrow': '↕', 'Leftarrow': '⇐', 'Rightarrow': '⇒',
  'Uparrow': '⇑', 'Downarrow': '⇓', 'Leftrightarrow': '⇔', 'Updownarrow': '⇕',
  'mapsto': '↦', 'to': '→', 'gets': '←',
  
  // 其他符号
  'infty': '∞', 'partial': '∂', 'nabla': '∇', 'forall': '∀',
  'exists': '∃', 'nexists': '∄', 'emptyset': '∅', 'varnothing': '∅',
  'complement': '∁', 'neg': '¬', 'wedge': '∧', 'vee': '∨',
  'cap': '∩', 'cup': '∪', 'int': '∫', 'iint': '∬', 'iiint': '∭',
  'oint': '∮', 'sum': '∑', 'prod': '∏', 'coprod': '∐',
  'bigcap': '⋂', 'bigcup': '⋃', 'bigvee': '⋁', 'bigwedge': '⋀',
  'bigoplus': '⨁', 'bigotimes': '⨂', 'bigodot': '⨀', 'biguplus': '⨄',
  
  // 括号和定界符
  'langle': '⟨', 'rangle': '⟩', 'lfloor': '⌊', 'rfloor': '⌋',
  'lceil': '⌈', 'rceil': '⌉', 'vert': '|', 'Vert': '‖',
  
  // 特殊字符
  'dots': '…', 'cdots': '⋯', 'vdots': '⋮', 'ddots': '⋱',
  'ldots': '…', 'therefore': '∴', 'because': '∵',
  'angle': '∠', 'measuredangle': '∡', 'sphericalangle': '∢',
  
  // 其他
  'prime': '′', 'backprime': '‵', 'degree': '°',

  // 三角函数和数学函数（保留名称，不转换为符号）
  'sin': 'sin', 'cos': 'cos', 'tan': 'tan',
  'cot': 'cot', 'sec': 'sec', 'csc': 'csc',
  'arcsin': 'arcsin', 'arccos': 'arccos', 'arctan': 'arctan',
  'sinh': 'sinh', 'cosh': 'cosh', 'tanh': 'tanh',
  'log': 'log', 'ln': 'ln', 'exp': 'exp',
  'lim': 'lim', 'max': 'max', 'min': 'min',
  'sup': 'sup', 'inf': 'inf', 'det': 'det', 'dim': 'dim'
};

// 数学花体字母映射表（\mathcal{X}）
const MATHCAL_MAP = {
  'A': '𝒜', 'B': 'ℬ', 'C': '𝒞', 'D': '𝒟', 'E': 'ℰ', 'F': 'ℱ',
  'G': '𝒢', 'H': 'ℋ', 'I': 'ℐ', 'J': '𝒥', 'K': '𝒦', 'L': 'ℒ',
  'M': 'ℳ', 'N': '𝒩', 'O': '𝒪', 'P': '𝒫', 'Q': '𝒬', 'R': 'ℛ',
  'S': '𝒮', 'T': '𝒯', 'U': '𝒰', 'V': '𝒱', 'W': '𝒲', 'X': '𝒳',
  'Y': '𝒴', 'Z': '𝒵'
};

// 黑板粗体映射（\mathbb{X}）
const MATHBB_MAP = {
  'A': '𝔸', 'B': '𝔹', 'C': 'ℂ', 'D': '𝔻', 'E': '𝔼', 'F': '𝔽',
  'G': '𝔾', 'H': 'ℍ', 'I': '𝕀', 'J': '𝕁', 'K': '𝕂', 'L': '𝕃',
  'M': '𝕄', 'N': 'ℕ', 'O': '𝕆', 'P': 'ℙ', 'Q': 'ℚ', 'R': 'ℝ',
  'S': '𝕊', 'T': '𝕋', 'U': '𝕌', 'V': '𝕍', 'W': '𝕎', 'X': '𝕏',
  'Y': '𝕐', 'Z': 'ℤ'
};

// 上标数字和字母映射
// 注意：¹²³ (U+00B9, U+00B2, U+00B3) 被大多数字体支持
// ⁰⁴-⁹ (U+2070, U+2074-U+2079) 可能不被某些字体支持
const SUPERSCRIPT_MAP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ',
  // 常用上标字母（转置、共轭、Hermitian等）
  'T': 'ᵀ', 'H': 'ᴴ', '*': '﹡', 't': 'ᵗ',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
  'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'j': 'ʲ', 'k': 'ᵏ',
  'l': 'ˡ', 'm': 'ᵐ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ',
  's': 'ˢ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
};

// 上标字符的ASCII回退（当Unicode不被支持时）
const SUPERSCRIPT_SAFE = {
  '0': '^0', '1': '¹', '2': '²', '3': '³', '4': '^4',
  '5': '^5', '6': '^6', '7': '^7', '8': '^8', '9': '^9',
  '+': '^+', '-': '^-', '=': '^=', '(': '^(', ')': '^)',
  'n': '^n', 'i': '^i', 'T': '^T', 'H': '^H', '*': '^*',
  't': '^t', 'a': '^a', 'b': '^b', 'c': '^c', 'd': '^d',
  'e': '^e', 'f': '^f', 'g': '^g', 'h': '^h', 'j': '^j',
  'k': '^k', 'l': '^l', 'm': '^m', 'o': '^o', 'p': '^p',
  'r': '^r', 's': '^s', 'u': '^u', 'v': '^v', 'w': '^w',
  'x': '^x', 'y': '^y', 'z': '^z'
};

// 下标数字和字母映射（Unicode下标字符）
const SUBSCRIPT_MAP = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
  'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
  'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
  'v': 'ᵥ', 'x': 'ₓ'
};

/**
 * 提取花括号内的内容（支持嵌套和转义）
 * @param {string} str - 字符串，从 { 开始
 * @returns {string|null} - 提取的内容（不包括外层花括号），如果失败返回 null
 */
function extractBracedContent(str) {
  if (!str || !str.startsWith('{')) return null;

  let depth = 0;
  let i = 0;

  for (; i < str.length; i++) {
    // 检查转义字符
    if (str[i] === '\\' && i + 1 < str.length) {
      i++;
      continue;
    }
    
    if (str[i] === '{') {
      depth++;
    } else if (str[i] === '}') {
      depth--;
      if (depth === 0) {
        return str.substring(1, i);
      }
    }
  }

  return null;
}

/**
 * LaTeX渲染器类
 */
export class LaTeXRenderer {
  constructor(pdf, config = {}) {
    this.pdf = pdf;
    this.config = {
      fontSize: config.fontSize || 10,
      color: config.color || [0, 0, 0],
      fontName: config.fontName || 'helvetica',
      useUnicode: config.useUnicode !== false,
      ...config
    };

    // 宽度计算缓存 - 避免重复计算
    this.widthCache = new Map();
    this.cacheAccessOrder = [];  // LRU跟踪
  }

  /**
   * 设置渲染字体
   */
  setRenderFont(fontSize = null) {
    if (this.config.fontName) {
      try {
        this.pdf.setFont(this.config.fontName, 'normal');
      } catch (e) {
        // 字体不可用时回退
      }
    }
    if (fontSize !== null) {
      this.pdf.setFontSize(fontSize);
    }
  }

  /**
   * 获取文本宽度（带缓存，LRU策略）
   */
  getCachedTextWidth(text, fontSize) {
    const cacheKey = `${text}|${fontSize}|${this.config.fontName}`;

    if (this.widthCache.has(cacheKey)) {
      // 更新LRU顺序
      const idx = this.cacheAccessOrder.indexOf(cacheKey);
      if (idx > -1) {
        this.cacheAccessOrder.splice(idx, 1);
      }
      this.cacheAccessOrder.push(cacheKey);
      return this.widthCache.get(cacheKey);
    }

    this.setRenderFont(fontSize);
    const width = this.pdf.getTextWidth(text);
    
    // 缓存大小限制：超过最大值时淘汰最旧条目
    if (this.widthCache.size >= LATEX_RENDER_CONSTANTS.CACHE_MAX_SIZE) {
      const oldestKey = this.cacheAccessOrder.shift();
      if (oldestKey) {
        this.widthCache.delete(oldestKey);
      }
    }
    
    this.widthCache.set(cacheKey, width);
    this.cacheAccessOrder.push(cacheKey);

    return width;
  }

  /**
   * 清除宽度缓存
   */
  clearWidthCache() {
    this.widthCache.clear();
    this.cacheAccessOrder = [];
  }

  /**
   * 渲染行内LaTeX数学公式
   * @param {string} latex - LaTeX源码（不包含$符号）
   * @param {number} x - 起始X坐标
   * @param {number} y - 基线Y坐标
   * @param {number} maxWidth - 最大宽度
   * @returns {number} - 渲染后的宽度
   */
  renderInlineLaTeX(latex, x, y, maxWidth) {
    // 首先尝试简单的Unicode转换
    const simplified = this.simplifyLaTeX(latex);
    
    // 检查是否包含复杂结构（分数、矩阵等）
    if (this.hasComplexStructure(latex)) {
      return this.renderComplexLaTeX(latex, x, y, maxWidth, true);
    }
    
    // 简单公式直接渲染为Unicode文本
    this.pdf.setFontSize(this.config.fontSize);
    this.pdf.setTextColor(...this.config.color);
    
    // 设置斜体以区分数学文本
    try {
      this.pdf.setFont(this.pdf.getFont().fontName, 'italic');
    } catch (e) {
      // 如果没有斜体，保持原样
    }
    
    this.pdf.text(simplified, x, y);
    const width = this.pdf.getTextWidth(simplified);
    
    // 恢复正常字体
    try {
      this.pdf.setFont(this.pdf.getFont().fontName, 'normal');
    } catch (e) {
      // 忽略字体恢复错误
    }
    
    return width;
  }

  /**
   * 渲染块级LaTeX数学公式
   * @param {string} latex - LaTeX源码
   * @param {number} x - 起始X坐标
   * @param {number} y - 起始Y坐标
   * @param {number} maxWidth - 最大宽度
   * @returns {Object} - {width, height} 渲染后的尺寸
   */
  renderDisplayLaTeX(latex, x, y, maxWidth) {
    // 块级公式居中显示
    const centerX = x + maxWidth / 2;
    const { DISPLAY_FONT_SCALE } = LATEX_RENDER_CONSTANTS;
    
    // 检查是否包含复杂结构
    if (this.hasComplexStructure(latex)) {
      return this.renderComplexLaTeX(latex, centerX, y, maxWidth, false);
    }
    
    // 简单公式
    const simplified = this.simplifyLaTeX(latex);
    const fontSize = this.config.fontSize * DISPLAY_FONT_SCALE;
    
    this.pdf.setFontSize(fontSize);
    this.pdf.setTextColor(...this.config.color);
    
    // 计算文本宽度以居中
    const textWidth = this.pdf.getTextWidth(simplified);
    const startX = centerX - textWidth / 2;
    
    // 添加背景
    const padding = 5;
    this.pdf.setFillColor(250, 250, 250);
    this.pdf.rect(startX - padding, y - fontSize * 0.8, textWidth + padding * 2, fontSize * 1.5, 'F');
    
    // 渲染文本
    this.pdf.text(simplified, startX, y);
    
    return {
      width: textWidth + padding * 2,
      height: fontSize * 1.5
    };
  }

  /**
   * 简化LaTeX为Unicode字符（增强版，支持嵌套）
   * @param {string} latex - LaTeX源码
   * @returns {string} - 转换后的Unicode文本
   */
  simplifyLaTeX(latex) {
    if (!latex) return '';
    
    let result = latex;

    // 移除多余的空格
    result = result.replace(/\s+/g, ' ').trim();
    
    // 处理LaTeX环境（matrix, cases, align等）
    result = this.simplifyEnvironments(result);
    
    // 处理 \left 和 \right 命令（简化为普通括号）
    result = result.replace(/\\left\(/g, '(');
    result = result.replace(/\\right\)/g, ')');
    result = result.replace(/\\left\[/g, '[');
    result = result.replace(/\\right\]/g, ']');
    result = result.replace(/\\left\\\{/g, '{');
    result = result.replace(/\\right\\\}/g, '}');
    result = result.replace(/\\left\{/g, '{');
    result = result.replace(/\\right\}/g, '}');
    result = result.replace(/\\left\|/g, '|');
    result = result.replace(/\\right\|/g, '|');
    result = result.replace(/\\left\./g, '');
    result = result.replace(/\\right\./g, '');

    // 处理 \mathbb{X} 命令 - 黑板粗体
    result = result.replace(/\\mathbb\{([A-Z])\}/g, (_, letter) => {
      return MATHBB_MAP[letter] || letter;
    });

    // 处理 \mathcal{X} 命令 - 花体字母
    result = result.replace(/\\mathcal\{([A-Z])\}/g, (_, letter) => {
      return MATHCAL_MAP[letter] || letter;
    });

    // 处理 \text{} 命令 - 提取文本内容
    result = result.replace(/\\text\{([^}]*)\}/g, '$1');

    // 处理可扩展箭头命令 \xleftrightarrow{}, \xrightarrow{}, \xleftarrow{}
    // 内部内容需要递归处理
    result = result.replace(/\\xleftrightarrow\{([^}]*)\}/g, (match, inner) => {
      const simplifiedInner = inner ? this.simplifyLaTeX(inner) : '';
      return `←[${simplifiedInner}]→`;
    });
    result = result.replace(/\\xrightarrow\{([^}]*)\}/g, (match, inner) => {
      const simplifiedInner = inner ? this.simplifyLaTeX(inner) : '';
      return `→[${simplifiedInner}]`;
    });
    result = result.replace(/\\xleftarrow\{([^}]*)\}/g, (match, inner) => {
      const simplifiedInner = inner ? this.simplifyLaTeX(inner) : '';
      return `[${simplifiedInner}]←`;
    });

    // 处理 \boxed{...} - 用方括号包裹内容
    result = this.simplifyBoxed(result);

    // 处理 \underbrace{...}_{...} 和 \overbrace{...}^{...}
    result = this.simplifyBraces(result);

    // 处理 \frac{a}{b} - 简化为 a/b 形式
    result = this.simplifyFractions(result);

    // 处理 \sqrt{x} 和 \sqrt[n]{x}
    result = result.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '($2)^(1/$1)');
    result = result.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

    // 处理上标和下标（支持嵌套花括号）
    result = this.processSupSubScripts(result);
    
    // 替换LaTeX命令为Unicode（按长度降序排列，避免短命令先匹配）
    const sortedCommands = Object.keys(LATEX_UNICODE_MAP).sort((a, b) => b.length - a.length);
    sortedCommands.forEach(command => {
      const pattern = new RegExp(`\\\\${command}(?![a-zA-Z])`, 'g');
      result = result.replace(pattern, LATEX_UNICODE_MAP[command]);
    });
    
    // 清理剩余的反斜杠命令（保留内容）
    result = result.replace(/\\([a-zA-Z]+)/g, '$1');
    result = result.replace(/\\(.)/g, '$1');
    
    // 清理花括号（保留内容）
    result = result.replace(/[{}]/g, '');
    
    return result;
  }

  /**
   * 简化 \boxed{...} 命令 - 用方括号包裹内容
   */
  simplifyBoxed(text) {
    let result = text;
    let lastResult = '';

    while (result !== lastResult) {
      lastResult = result;

      const boxedMatch = result.match(/\\boxed/);
      if (!boxedMatch) break;

      const startIdx = boxedMatch.index;
      const afterBoxed = result.substring(startIdx + 6); // 跳过 \boxed

      // 提取花括号内容
      const content = extractBracedContent(afterBoxed);
      if (content === null) break;

      // 构建替换文本：用方括号包裹，递归简化内部内容
      const fullMatch = result.substring(startIdx, startIdx + 6 + content.length + 2);
      const simplifiedContent = this.simplifyLaTeX(content);
      const simplified = `[ ${simplifiedContent} ]`;

      result = result.replace(fullMatch, simplified);
    }

    return result;
  }

  /**
   * 简化 \underbrace{...}_{...} 和 \overbrace{...}^{...} 命令
   * 格式：内容(标注)
   */
  simplifyBraces(text) {
    let result = text;
    let lastResult = '';

    // 处理 \underbrace{content}_{label}
    while (result !== lastResult) {
      lastResult = result;

      const underbraceMatch = result.match(/\\underbrace/);
      if (!underbraceMatch) break;

      const startIdx = underbraceMatch.index;
      const afterCmd = result.substring(startIdx + 11); // 跳过 \underbrace

      // 提取主内容
      const content = extractBracedContent(afterCmd);
      if (content === null) break;

      // 检查是否有下标标注
      const afterContent = afterCmd.substring(content.length + 2);
      let label = '';
      let totalLength = 11 + content.length + 2; // \underbrace + {content}

      if (afterContent.startsWith('_')) {
        const labelContent = extractBracedContent(afterContent.substring(1));
        if (labelContent !== null) {
          label = labelContent;
          totalLength += 1 + labelContent.length + 2; // _ + {label}
        }
      }

      // 构建替换文本
      const fullMatch = result.substring(startIdx, startIdx + totalLength);
      const simplifiedContent = this.simplifyLaTeX(content);
      const simplifiedLabel = label ? this.simplifyLaTeX(label) : '';
      const simplified = simplifiedLabel
        ? `${simplifiedContent}[${simplifiedLabel}]`
        : simplifiedContent;

      result = result.replace(fullMatch, simplified);
    }

    // 处理 \overbrace{content}^{label}
    lastResult = '';
    while (result !== lastResult) {
      lastResult = result;

      const overbraceMatch = result.match(/\\overbrace/);
      if (!overbraceMatch) break;

      const startIdx = overbraceMatch.index;
      const afterCmd = result.substring(startIdx + 10); // 跳过 \overbrace

      // 提取主内容
      const content = extractBracedContent(afterCmd);
      if (content === null) break;

      // 检查是否有上标标注
      const afterContent = afterCmd.substring(content.length + 2);
      let label = '';
      let totalLength = 10 + content.length + 2; // \overbrace + {content}

      if (afterContent.startsWith('^')) {
        const labelContent = extractBracedContent(afterContent.substring(1));
        if (labelContent !== null) {
          label = labelContent;
          totalLength += 1 + labelContent.length + 2; // ^ + {label}
        }
      }

      // 构建替换文本
      const fullMatch = result.substring(startIdx, startIdx + totalLength);
      const simplifiedContent = this.simplifyLaTeX(content);
      const simplifiedLabel = label ? this.simplifyLaTeX(label) : '';
      const simplified = simplifiedLabel
        ? `${simplifiedContent}[${simplifiedLabel}]`
        : simplifiedContent;

      result = result.replace(fullMatch, simplified);
    }

    return result;
  }

  /**
   * 简化分数表达式（支持嵌套）
   */
  simplifyFractions(text) {
    let result = text;
    let lastResult = '';

    // 循环处理嵌套分数
    while (result !== lastResult) {
      lastResult = result;

      const fracMatch = result.match(/\\frac/);
      if (!fracMatch) break;

      const startIdx = fracMatch.index;
      const afterFrac = result.substring(startIdx + 5); // 跳过 \frac

      // 提取分子
      const numerator = extractBracedContent(afterFrac);
      if (numerator === null) break;

      // 提取分母
      const afterNum = afterFrac.substring(numerator.length + 2);
      const denominator = extractBracedContent(afterNum);
      if (denominator === null) break;

      // 构建替换文本
      const fullMatch = result.substring(startIdx, startIdx + 5 + numerator.length + 2 + denominator.length + 2);
      const simplified = `(${numerator})/(${denominator})`;

      result = result.replace(fullMatch, simplified);
    }

    return result;
  }

  /**
   * 处理上下标（支持嵌套）
   */
  processSupSubScripts(text) {
    let result = text;
    
    // 处理上标 ^{...}
    let lastResult = '';
    while (result !== lastResult) {
      lastResult = result;
      const supMatch = result.match(/\^(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\w)/);
      if (supMatch) {
        let content = supMatch[1];
        if (content.startsWith('{') && content.endsWith('}')) {
          content = content.slice(1, -1);
        }
        const converted = this.convertToSuperscript(content);
        result = result.replace(supMatch[0], converted);
      }
    }
    
    // 处理下标 _{...}
    lastResult = '';
    while (result !== lastResult) {
      lastResult = result;
      const subMatch = result.match(/_(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\w)/);
      if (subMatch) {
        let content = subMatch[1];
        if (content.startsWith('{') && content.endsWith('}')) {
          content = content.slice(1, -1);
        }
        const converted = this.convertToSubscript(content);
        result = result.replace(subMatch[0], converted);
      }
    }
    
    return result;
  }

  /**
   * 转换为上标Unicode（使用安全回退）
   */
  convertToSuperscript(text) {
    // 先简化内部LaTeX
    const simplified = this.simplifyLaTeX(text);
    // 使用安全的上标映射（只用¹²³，其他用^x形式）
    return simplified.split('').map(char => {
      if (SUPERSCRIPT_SAFE[char]) return SUPERSCRIPT_SAFE[char];
      if (SUPERSCRIPT_MAP[char]) return SUPERSCRIPT_MAP[char];
      return '^' + char;  // 未知字符用^x形式
    }).join('');
  }

  /**
   * 转换为下标Unicode（使用安全回退策略）
   * 数字下标使用Unicode（₀₁₂等，字体支持较好）
   * 字母下标使用括号形式（如 x(n)），避免乱码
   */
  convertToSubscript(text) {
    // 先简化内部LaTeX
    const simplified = this.simplifyLaTeX(text);

    // 检查是否全是数字（数字下标Unicode支持较好）
    const isAllDigits = /^[0-9]+$/.test(simplified);

    if (isAllDigits) {
      // 纯数字下标：使用Unicode下标数字
      return simplified.split('').map(char => {
        return SUBSCRIPT_MAP[char] || char;
      }).join('');
    } else {
      // 包含字母的下标：使用安全的括号形式
      // 例如：u_0 -> u₀, u_n -> u(n), u_{max} -> u(max)
      const result = simplified.split('').map(char => {
        // 数字仍使用Unicode下标
        if (/[0-9]/.test(char)) {
          return SUBSCRIPT_MAP[char] || char;
        }
        // 字母和其他字符保持原样（后面会用括号包裹）
        return char;
      }).join('');

      // 如果结果中包含非下标数字的字符，用括号包裹整个下标
      const hasNonDigit = /[^₀₁₂₃₄₅₆₇₈₉]/.test(result);
      if (hasNonDigit) {
        return '(' + result + ')';
      }
      return result;
    }
  }

  /**
   * 检查是否包含复杂LaTeX结构（需要特殊渲染）
   */
  hasComplexStructure(latex) {
    const complexPatterns = [
      /\\frac\{/,           // 分数
      /\\sqrt(?:\[|\{)/,  // 根号
      /\\begin\{/,          // 环境（如矩阵、cases）
      /\\xleftrightarrow/,  // 带上标的箭头
      /\\xrightarrow/,      // 带上标的右箭头
      /\\xleftarrow/,       // 带上标的左箭头
      /\\boxed\{/,          // 框住公式
      /\\underbrace\{/,     // 下括号
      /\\overbrace\{/       // 上括号
    ];

    return complexPatterns.some(pattern => pattern.test(latex));
  }

  /**
   * 渲染复杂LaTeX结构
   */
  renderComplexLaTeX(latex, x, y, maxWidth, isInline) {
    const fontSize = isInline ? this.config.fontSize : this.config.fontSize * 1.2;
    const elements = this.parseComplexLaTeX(latex);

    // 第一步：计算总宽度
    let totalWidth = 0;
    this.pdf.setFontSize(fontSize);

    elements.forEach(element => {
      switch (element.type) {
        case 'text':
          totalWidth += this.pdf.getTextWidth(element.content);
          break;

        case 'fraction':
          // 估算分数宽度
          const fracFontSize = fontSize * 0.75;
          this.pdf.setFontSize(fracFontSize);
          const numWidth = this.pdf.getTextWidth(element.numerator);
          const denWidth = this.pdf.getTextWidth(element.denominator);
          totalWidth += Math.max(numWidth, denWidth) + 4;
          this.pdf.setFontSize(fontSize);
          break;

        case 'sqrt':
          totalWidth += this.pdf.getTextWidth(element.content) + 8;
          break;

        case 'superscript':
        case 'subscript':
          totalWidth += this.pdf.getTextWidth(element.base || '');
          const subSupFontSize = fontSize * 0.7;
          this.pdf.setFontSize(subSupFontSize);
          totalWidth += this.pdf.getTextWidth(element.exponent || element.subscript || '');
          this.pdf.setFontSize(fontSize);
          break;

        default:
          totalWidth += this.pdf.getTextWidth(element.raw || '');
      }
    });

    // 第二步：对于display math，从居中位置开始渲染
    let currentX = isInline ? x : (x - totalWidth / 2);
    let maxHeight = fontSize;
    let hasFraction = false;  // 标记是否包含分数

    // 第三步：渲染所有元素
    elements.forEach(element => {
      switch (element.type) {
        case 'text':
          this.pdf.setFontSize(fontSize);
          this.pdf.text(element.content, currentX, y);
          const textWidth = this.pdf.getTextWidth(element.content);
          currentX += textWidth;
          break;

        case 'fraction':
          const fracWidth = this.renderFraction(
            element.numerator,
            element.denominator,
            currentX,
            y,
            fontSize
          );
          currentX += fracWidth;
          hasFraction = true;
          break;

        case 'sqrt':
          const sqrtWidth = this.renderSquareRoot(
            element.content,
            currentX,
            y,
            fontSize
          );
          currentX += sqrtWidth;
          break;

        case 'superscript':
          const supWidth = this.renderSuperscript(
            element.base,
            element.exponent,
            currentX,
            y,
            fontSize
          );
          currentX += supWidth;
          break;

        case 'subscript':
          const subWidth = this.renderSubscript(
            element.base,
            element.subscript,
            currentX,
            y,
            fontSize
          );
          currentX += subWidth;
          break;

        default:
          // 未识别的类型，渲染为普通文本
          const fallbackText = element.raw || '';
          this.pdf.setFontSize(fontSize);
          this.pdf.text(fallbackText, currentX, y);
          const fallbackWidth = this.pdf.getTextWidth(fallbackText);
          currentX += fallbackWidth;
      }
    });

    // 根据是否包含分数计算实际高度
    if (hasFraction) {
      maxHeight = fontSize * 1.2;  // 分数需要更多垂直空间
    } else {
      maxHeight = fontSize;  // 普通公式紧凑间距
    }

    return isInline ? totalWidth : { width: totalWidth, height: maxHeight };
  }

  /**
   * 解析复杂LaTeX为可渲染的元素
   * 对于包含 \boxed、\underbrace 等复杂结构的公式，
   * 先用 simplifyLaTeX 简化整个公式，然后再解析分数
   */
  parseComplexLaTeX(latex) {
    const elements = [];

    // 先用 simplifyLaTeX 处理 \boxed、\underbrace 等复杂结构
    // 这样可以正确处理嵌套的花括号
    const preprocessed = this.simplifyLaTeX(latex);

    // 然后检查简化后的文本中是否还有需要特殊渲染的分数
    // 注意：simplifyLaTeX 会把 \frac{a}{b} 转换为 (a)/(b)
    // 所以这里不需要再处理分数了，直接返回简化后的文本
    if (preprocessed) {
      elements.push({ type: 'text', content: preprocessed });
    }

    return elements;
  }

  /**
   * 解析复杂LaTeX为可渲染的元素（旧版本，保留用于分数渲染）
   * 如果需要真正的分数渲染（分子在上，分母在下），使用此方法
   */
  parseComplexLaTeXWithFractions(latex) {
    const elements = [];
    let remaining = latex;

    // 使用支持嵌套的分数匹配
    while (remaining.length > 0) {
      const fracMatch = remaining.match(/\\frac/);

      if (fracMatch) {
        // 添加分数前的文本
        if (fracMatch.index > 0) {
          const beforeText = remaining.substring(0, fracMatch.index);
          const simplified = this.simplifyLaTeX(beforeText);
          if (simplified) {
            elements.push({ type: 'text', content: simplified });
          }
        }

        // 使用 extractBracedContent 提取分子和分母（支持嵌套）
        const afterFrac = remaining.substring(fracMatch.index + 5);
        const numerator = extractBracedContent(afterFrac);

        if (numerator !== null) {
          const afterNum = afterFrac.substring(numerator.length + 2);
          const denominator = extractBracedContent(afterNum);

          if (denominator !== null) {
            // 添加分数
            elements.push({
              type: 'fraction',
              numerator: this.simplifyLaTeX(numerator),
              denominator: this.simplifyLaTeX(denominator),
              raw: remaining.substring(fracMatch.index, fracMatch.index + 5 + numerator.length + 2 + denominator.length + 2)
            });

            remaining = remaining.substring(fracMatch.index + 5 + numerator.length + 2 + denominator.length + 2);
            continue;
          }
        }

        // 如果提取失败，处理剩余文本
        const simplified = this.simplifyLaTeX(remaining);
        if (simplified) {
          elements.push({ type: 'text', content: simplified });
        }
        break;
      } else {
        // 没有更多分数，处理剩余文本
        const simplified = this.simplifyLaTeX(remaining);
        if (simplified) {
          elements.push({ type: 'text', content: simplified });
        }
        break;
      }
    }
    
    return elements;
  }

  /**
   * 渲染分数
   */
  renderFraction(numerator, denominator, x, y, fontSize) {
    const { FRACTION_FONT_SCALE, FRACTION_NUM_OFFSET, FRACTION_DEN_OFFSET, FRACTION_PADDING } = LATEX_RENDER_CONSTANTS;
    
    // 设置较小的字体用于分数
    const fracFontSize = fontSize * FRACTION_FONT_SCALE;
    this.pdf.setFontSize(fracFontSize);

    const numWidth = this.pdf.getTextWidth(numerator);
    const denWidth = this.pdf.getTextWidth(denominator);
    const fracWidth = Math.max(numWidth, denWidth) + FRACTION_PADDING;

    // 分子和分母紧贴分数线
    const numOffset = fracFontSize * FRACTION_NUM_OFFSET;
    const denOffset = fracFontSize * FRACTION_DEN_OFFSET;

    // 渲染分子（在分数线上方，居中对齐）
    const numX = x + (fracWidth - numWidth) / 2;
    this.pdf.text(numerator, numX, y - numOffset);

    // 绘制分数线
    this.pdf.setLineWidth(0.3);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.line(x, y, x + fracWidth, y);

    // 渲染分母（在分数线下方，居中对齐）
    const denX = x + (fracWidth - denWidth) / 2;
    this.pdf.text(denominator, denX, y + denOffset);

    // 恢复字体大小
    this.pdf.setFontSize(fontSize);

    return fracWidth;
  }

  /**
   * 渲染平方根
   */
  renderSquareRoot(content, x, y, fontSize) {
    const { SQRT_PADDING, DISPLAY_FONT_SCALE } = LATEX_RENDER_CONSTANTS;
    
    const contentWidth = this.pdf.getTextWidth(content);
    const sqrtWidth = contentWidth + SQRT_PADDING;
    const sqrtHeight = fontSize * DISPLAY_FONT_SCALE;
    
    // 绘制根号符号
    this.pdf.setLineWidth(0.3);
    // 左侧勾
    this.pdf.line(x, y - sqrtHeight / 3, x + 2, y);
    // 斜线
    this.pdf.line(x + 2, y, x + 4, y - sqrtHeight);
    // 顶线
    this.pdf.line(x + 4, y - sqrtHeight, x + sqrtWidth, y - sqrtHeight);
    
    // 渲染根号内的内容
    this.pdf.setFontSize(fontSize);
    this.pdf.text(content, x + 6, y);
    
    return sqrtWidth;
  }

  /**
   * 渲染上标
   */
  renderSuperscript(base, exponent, x, y, fontSize) {
    const { SUPERSCRIPT_FONT_SCALE, SUPERSCRIPT_OFFSET } = LATEX_RENDER_CONSTANTS;
    
    // 渲染基数
    this.pdf.setFontSize(fontSize);
    this.pdf.text(base, x, y);
    const baseWidth = this.pdf.getTextWidth(base);
    
    // 渲染上标（使用更小的字体和向上偏移）
    const supFontSize = fontSize * SUPERSCRIPT_FONT_SCALE;
    this.pdf.setFontSize(supFontSize);
    const supText = this.simplifyLaTeX(exponent);
    this.pdf.text(supText, x + baseWidth, y - fontSize * SUPERSCRIPT_OFFSET);
    const supWidth = this.pdf.getTextWidth(supText);
    
    // 恢复字体大小
    this.pdf.setFontSize(fontSize);
    
    return baseWidth + supWidth;
  }

  /**
   * 渲染下标
   */
  renderSubscript(base, subscript, x, y, fontSize) {
    const { SUBSCRIPT_FONT_SCALE, SUBSCRIPT_OFFSET } = LATEX_RENDER_CONSTANTS;
    
    // 渲染基数
    this.pdf.setFontSize(fontSize);
    this.pdf.text(base, x, y);
    const baseWidth = this.pdf.getTextWidth(base);
    
    // 渲染下标（使用更小的字体和向下偏移）
    const subFontSize = fontSize * SUBSCRIPT_FONT_SCALE;
    this.pdf.setFontSize(subFontSize);
    const subText = this.simplifyLaTeX(subscript);
    this.pdf.text(subText, x + baseWidth, y + fontSize * SUBSCRIPT_OFFSET);
    const subWidth = this.pdf.getTextWidth(subText);
    
    // 恢复字体大小
    this.pdf.setFontSize(fontSize);
    
    return baseWidth + subWidth;
  }

  /**
   * 简化LaTeX环境（matrix, cases, align等）
   * @param {string} latex - 包含环境的LaTeX源码
   * @returns {string} - 转换后的文本
   */
  simplifyEnvironments(latex) {
    let result = latex;
    
    // 处理矩阵环境: \begin{matrix/pmatrix/bmatrix/vmatrix/Vmatrix/Bmatrix}...\end{...}
    const matrixTypes = ['matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'Vmatrix', 'Bmatrix'];
    const matrixBrackets = {
      'matrix': ['', ''],
      'pmatrix': ['(', ')'],
      'bmatrix': ['[', ']'],
      'vmatrix': ['|', '|'],
      'Vmatrix': ['‖', '‖'],
      'Bmatrix': ['{', '}']
    };
    
    for (const mtype of matrixTypes) {
      const regex = new RegExp(`\\\\begin\\{${mtype}\\}([\\s\\S]*?)\\\\end\\{${mtype}\\}`, 'g');
      result = result.replace(regex, (match, content) => {
        const [leftBracket, rightBracket] = matrixBrackets[mtype];
        return leftBracket + this.simplifyMatrixContent(content) + rightBracket;
      });
    }
    
    // 处理cases环境: \begin{cases}...\end{cases}
    result = result.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (match, content) => {
      return '{ ' + this.simplifyCasesContent(content) + ' }';
    });
    
    // 处理align/aligned环境: \begin{align}...\end{align}
    result = result.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (match, content) => {
      return this.simplifyAlignContent(content);
    });
    result = result.replace(/\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}/g, (match, content) => {
      return this.simplifyAlignContent(content);
    });
    
    // 处理equation环境
    result = result.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, '$1');
    
    // 处理array环境
    result = result.replace(/\\begin\{array\}\{[^}]*\}([\s\S]*?)\\end\{array\}/g, (match, content) => {
      return this.simplifyMatrixContent(content);
    });
    
    return result;
  }
  
  /**
   * 简化矩阵内容
   */
  simplifyMatrixContent(content) {
    // 分割行（以 \\\ 分隔）
    const rows = content.split(/\\\\/).map(row => row.trim()).filter(row => row);
    
    // 处理每行：分割列（以 & 分隔），简化每个单元格
    const simplifiedRows = rows.map(row => {
      const cells = row.split('&').map(cell => {
        // 递归简化单元格内容（但不要再调用simplifyEnvironments避免无限递归）
        return this.simplifyLaTeXBasic(cell.trim());
      });
      return cells.join(' , ');
    });
    
    // 用分号分隔行
    return simplifiedRows.join(' ; ');
  }
  
  /**
   * 简化cases内容
   */
  simplifyCasesContent(content) {
    // 分割行
    const rows = content.split(/\\\\/).map(row => row.trim()).filter(row => row);
    
    const simplifiedRows = rows.map(row => {
      // 每行可能有 & 分隔表达式和条件
      const parts = row.split('&').map(part => this.simplifyLaTeXBasic(part.trim()));
      if (parts.length >= 2) {
        return `${parts[0]}, if ${parts[1]}`;
      }
      return parts[0];
    });
    
    return simplifiedRows.join(' | ');
  }
  
  /**
   * 简化align内容
   */
  simplifyAlignContent(content) {
    // 分割行
    const rows = content.split(/\\\\/).map(row => row.trim()).filter(row => row);
    
    const simplifiedRows = rows.map(row => {
      // 移除对齐符 &
      return this.simplifyLaTeXBasic(row.replace(/&/g, ' '));
    });
    
    return simplifiedRows.join(' ; ');
  }
  
  /**
   * 基础LaTeX简化（不包含环境处理，避免递归）
   */
  simplifyLaTeXBasic(latex) {
    if (!latex) return '';
    
    let result = latex;
    
    // 处理常见命令
    result = result.replace(/\\mathbb\{([A-Z])\}/g, (_, letter) => MATHBB_MAP[letter] || letter);
    result = result.replace(/\\mathcal\{([A-Z])\}/g, (_, letter) => MATHCAL_MAP[letter] || letter);
    result = result.replace(/\\text\{([^}]*)\}/g, '$1');
    result = result.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)');
    result = result.replace(/\\sqrt\{([^}]*)\}/g, '√($1)');
    
    // 处理上下标
    result = this.processSupSubScripts(result);
    
    // 替换LaTeX命令为Unicode
    const sortedCommands = Object.keys(LATEX_UNICODE_MAP).sort((a, b) => b.length - a.length);
    sortedCommands.forEach(command => {
      const pattern = new RegExp(`\\\\${command}(?![a-zA-Z])`, 'g');
      result = result.replace(pattern, LATEX_UNICODE_MAP[command]);
    });
    
    // 清理
    result = result.replace(/\\([a-zA-Z]+)/g, '$1');
    result = result.replace(/\\(.)/g, '$1');
    result = result.replace(/[{}]/g, '');
    
    return result.trim();
  }
}

// 导出默认实例化函数
export function createLaTeXRenderer(pdf, config) {
  return new LaTeXRenderer(pdf, config);
}
