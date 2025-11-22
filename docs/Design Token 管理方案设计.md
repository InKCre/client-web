

# **构建下一代设计令牌（Design Token）管理体系：基于 Material Design 3、Apple HIG 与 GitHub Primer 的跨平台架构与 SCSS 深度集成方案**

## **1\. 执行摘要**

随着数字产品生态系统的日益复杂，传统的手工维护样式表（Style Guides）已无法满足多平台、多主题及高可访问性的开发需求。设计令牌（Design Tokens）作为一种原子化的视觉信息单元，通过将十六进制色值、像素值等原始数据抽象为语义化的实体，成为现代设计系统的核心基础设施。本研究报告旨在通过综合分析 Google Material Design 3 (M3)、Apple Human Interface Guidelines (HIG)、Microsoft Windows/Fluent Design 以及 GitHub Primer 的最佳实践，提出一套详尽的、可持续的设计令牌管理方案。

本报告的核心在于解决设计决策的“可扩展性”与“技术落地”之间的矛盾，特别针对 SCSS 预处理器与现代 CSS 自定义属性（CSS Variables）的混合使用场景提出了具体的架构建议。分析表明，采用“参考（Reference）- 系统（System）- 组件（Component）”的三层架构，结合严格的语义化命名规范（CTI+S），是实现系统长期可维护性的关键。此外，通过引入算法生成的色调调色板（Tonal Palettes）和自动化的构建流水线（Style Dictionary），可以有效解决暗色模式适配和品牌动态化带来的工程挑战。

---

## **2\. 设计系统架构的比较分析与理论基础**

在构建新的令牌管理方案之前，必须深入解构行业领先的设计语言如何处理规模化与语义化的问题。通过对 M3、HIG、Primer 和 Windows 设计规范的剖析，我们可以提取出通用的架构模式与特定的反模式。

### **2.1 Material Design 3：算法色彩与层级架构**

Material Design 3（M3）代表了当前设计系统在色彩算法化与令牌层级化方面的最高水平。其核心贡献在于彻底摒弃了静态的色彩定义，转而采用动态生成的色调调色板体系。

#### **2.1.1 三层令牌分类法**

M3 明确定义了三种类别的令牌，这种分类法为大型系统的解耦提供了理论依据 1：

1. **参考令牌（Reference Tokens / Primitives）：** 这是设计系统的原材料。M3 不再简单地定义一个“蓝色”，而是定义了一个包含 13 个色调（从 0 到 100）的“色调调色板”（Tonal Palette）。例如 md.ref.palette.primary40 代表原色色相在 40% 亮度下的表现 1。  
2. **系统令牌（System Tokens / Semantics）：** 这是设计决策的核心层。系统令牌描述的是“意图”而非“数值”。例如，md.sys.color.primary 是一个语义角色，它在浅色模式下可能指向 primary40，而在深色模式下指向 primary80 1。  
3. **组件令牌（Component Tokens）：** 这是具体的应用层。它将系统令牌映射到具体的 UI 元素上，如 md.fab.container.color。

#### **2.1.2 动态色彩与色调关系**

M3 的一大创新是其动态色彩（Dynamic Color）机制，该机制能够从用户的壁纸或内容中提取关键色（Key Color），并通过算法生成完整的色调调色板 2。这一机制启示我们，可持续的令牌系统不能依赖硬编码的 Hex 值，而必须建立在色相（Hue）与色调（Tone/Luminance）分离的逻辑之上。通过锁定色调数值（如 Tone 40 与 Tone 90 的对比度永远满足 4.5:1），系统可以自动保证可访问性 3。

### **2.2 Apple Human Interface Guidelines：语义流动性与材质系统**

与 M3 的严格算法不同，Apple 的设计哲学更强调环境适应性（Adaptability）和材质（Materials）的运用。

#### **2.2.1 语义色彩的运行时解析**

Apple HIG 强烈建议开发者使用语义化色彩名称，如 labelColor（文本色）、systemGroupedBackground（分组背景色）或 link（链接色），而非固定的 RGB 值 5。这些语义色彩具有独特的“流动性”——它们不仅随深色模式（Dark Mode）自动翻转，还会根据高对比度设置（Increase Contrast）和辅助功能设置进行实时调整 5。

#### **2.2.2 材质作为令牌**

Apple 的系统引入了“材质”（Materials）的概念，即通过模糊（Blur）和半透明（Translucency）效果来传达层级关系，统称为“视觉类材质”（Visual Effect Materials） 6。这对令牌架构提出了挑战：一个设计令牌不仅仅是单一的色彩值，它可能是一个包含背景色、模糊半径和混合模式的复合对象。在 SCSS 实现中，这意味着我们需要混合宏（Mixins）来处理这种复杂的数据结构，而不仅仅是简单的变量映射。

### **2.3 GitHub Primer：功能性分层与开发体验**

GitHub 的 Primer 设计系统在 Web 领域的工程化实践极具参考价值，特别是其在 SCSS 和 CSS 变量过渡时期的处理方式。

#### **2.3.1 功能性令牌（Functional Tokens）**

Primer 在基础层（Primitives）和组件层之间，构建了一个强大的“功能层”（Functional Layer）。例如，fgColor-default（默认前景色）和 borderColor-muted（柔和边框色） 7。这种命名方式极大地降低了认知负荷——开发者不需要知道按钮的具体颜色，只需知道它是一个“功能性的边框”即可。这种抽象有效地防止了令牌数量的指数级膨胀。

#### **2.3.2 严格的 JSON 规范与命名空间**

Primer 使用 JSON/JSON5 作为单一事实来源（Single Source of Truth, SSoT），并明确区分了 base（基础值）和 functional（功能模式）8。其命名规范采用了严格的 System \- Category \- Functional \- Variant 结构（如 marketing-color-link-emphasis），这种结构天然适合生成 SCSS Map 的嵌套键值，便于深度合并和检索 8。

### **2.4 Microsoft Windows/Fluent：排版层级与资源字典**

虽然 Windows Metro（现 Fluent Design）的设计语言经历了多次迭代，但其对排版层级（Typography Hierarchy）和资源字典（Resource Dictionary）的处理仍具有借鉴意义。

#### **2.4.1 以排版为核心的层级**

Metro 设计语言强调“内容胜于形式”，主张通过字体的大小和粗细来构建信息层级，而非依赖分割线或容器 10。这提示我们在设计令牌时，排版令牌（Typography Tokens）必须是复合的——包含 font-family、font-weight、line-height 和 letter-spacing 的组合，而非孤立的变量 12。

#### **2.4.2 系统颜色的映射机制**

在 UWP/XAML 开发中，ThemeResource 允许应用绑定到系统级颜色（如 SystemColorWindowTextColor），这在处理高对比度模式（High Contrast Mode）时至关重要 13。在 Web 环境中，这对应于 CSS 的系统颜色关键字（如 CanvasText），令牌系统应预留接口以支持这些原生的系统级映射。

---

## **3\. 推荐的令牌架构体系设计**

基于上述分析，本报告提出一套融合了 M3 的色彩算法、Primer 的功能分层以及 Apple 语义适应性的“三层混合架构”。该架构特别针对 SCSS 与 CSS Variable 的混合编译进行了优化。

### **3.1 架构分层模型**

本方案采用严格的三层模型，数据流向为单向依赖：**Reference $\\rightarrow$ System $\\rightarrow$ Component**。

| 层级 (Tier) | 命名空间 | 定义与职责 | 对应 SCSS 类型 | 更新频率 |
| :---- | :---- | :---- | :---- | :---- |
| **第一层：参考令牌 (Reference/Primitive)** | ref | 系统的“原子”。包含色调调色板（Tonal Palettes）、原始字号、圆角数值。不包含任何上下文语义。 | SCSS Maps / Variables | 极低 (仅在品牌重塑时) |
| **第二层：系统令牌 (System/Semantic)** | sys | 系统的“分子”。将参考令牌映射到设计意图。包含色彩角色（Color Roles）、排版样式、间距规则。支持多主题（Light/Dark）。 | CSS Custom Properties | 中等 (主题调整时) |
| **第三层：组件令牌 (Component/Scoped)** | comp | 系统的“组织”。针对特定组件的覆盖。仅在通用系统令牌无法满足特定组件需求时使用。 | SCSS Mixins / Locals | 高 (UI 迭代时) |

### **3.2 语义化命名规范（Taxonomy）**

为了保证令牌的可读性和可搜索性，我们采用扩展的 **CTI+S (Category-Type-Item \+ State)** 命名法。这种结构在 SCSS Map 中可以自然转化为嵌套结构。

命名格式：  
\[Namespace\] \- \[Category\] \- \[Concept\] \- \[Property\] \- \[Variant\] \-  
**字段解析：**

* **Namespace (命名空间):** sys (系统级), ref (参考级), comp (组件级)。  
* **Category (类别):** color (颜色), type (排版), space (间距), elevation (层级/阴影)。  
* **Concept (概念):** 描述应用的对象，如 surface (表面), action (操作), feedback (反馈), nav (导航)。  
* **Property (属性):** CSS 属性的抽象，如 bg (背景), text (文本), border (边框)。  
* **Variant (变体):** 层级修饰词，如 primary, secondary, subtle, critical。  
* **State (状态):** 交互状态，如 hover, focus, disabled, active。

**实例对比表：**

| 令牌用途 | 推荐令牌名称 (CSS Var) | 原始值参考 (JSON Path) | 设计逻辑来源 |
| :---- | :---- | :---- | :---- |
| 主按钮背景色 | \--sys-color-action-bg-primary | {ref.palette.brand.40} | Primer 功能层 8 |
| 错误提示文本 | \--sys-color-feedback-text-error | {ref.palette.red.60} | M3 语义角色 3 |
| 卡片容器背景 | \--sys-color-surface-container | {ref.palette.neutral.90} | M3 表面系统 15 |
| 正文大号字体 | \--sys-type-body-lg | {ref.font.size.100} \+ {ref.font.weight.regular} | Windows 排版层级 12 |

### **3.3 目录结构策略**

为了支持 SCSS 的模块化导入和 Style Dictionary 的构建，建议采用以下文件结构 16：

design-system/  
├── tokens/ (JSON SSoT)  
│ ├── primitives/  
│ │ ├── color.json (Tonal Palettes)  
│ │ ├── typography.json  
│ │ └── spacing.json  
│ ├── semantic/  
│ │ ├── color/  
│ │ │ ├── light.json (Default mappings)  
│ │ │ ├── dark.json (Dark mode overrides)  
│ │ │ └── high-contrast.json  
│ │ └── typography.json  
│ └── component/  
│ └── button.json  
├── src/  
│ ├── scss/  
│ │ ├── abstract/  
│ │ │ ├── \_variables.scss (Generated CSS Vars)
│ │ │ ├── \_ref.scss (Generated Reference Maps)
│ │ │ ├── \_semantic.scss (Generated Semantic Maps)
│ │ │ ├── \_functions.scss (Accessors)
│ │ │ └── \_mixins.scss
│ │ └── components/  
│ └──...

---

## **4\. 深度色彩架构与动态化实施**

色彩管理是令牌系统中最复杂的部分。为了实现 M3 级别的动态性和 Apple 级别的适应性，我们必须摒弃单一的色彩定义方式。

### **4.1 色调调色板（Tonal Palettes）的构建**

借鉴 M3 的 HCT 色彩空间理论，所有的参考颜色（Reference Colors）都不应以孤立的 Hex 值存在，而应定义为色调调色板。

**JSON 定义示例 (primitives/color.json):**

JSON

{  
  "ref": {  
    "palette": {  
      "brand": {  
        "40": { "$value": "\#6750A4", "$type": "color" },  
        "50": { "$value": "\#7F67BE", "$type": "color" },  
        "80": { "$value": "\#D0BCFF", "$type": "color" },  
        "90": { "$value": "\#EADDFF", "$type": "color" }  
      },  
      "error": {  
        "40": { "$value": "\#B3261E", "$type": "color" }  
      }  
    }  
  }  
}

这种结构的优势在于，当我们进行品牌重塑（Rebranding）时，只需替换 ref.palette.brand 的基础色相，并重新生成各个亮度等级（Tones），整个系统的明暗关系和可访问性对比度（Contrast Ratios）将自动保持不变 2。

### **4.2 双模主题映射（Theming Strategy）**

在系统层（Semantic Layer），我们通过分离的 JSON 文件来定义不同模式下的映射关系，这实现了 Apple HIG 提倡的语义色彩自适应 18。

* Light Mode (semantic/color/light.json):  
  sys.color.action.bg.primary $\\rightarrow$ {ref.palette.brand.40}  
* Dark Mode (semantic/color/dark.json):  
  sys.color.action.bg.primary $\\rightarrow$ {ref.palette.brand.80}

通过构建工具，这两个文件将被合并生成如下 CSS 代码：

CSS

:root {  
  \--sys-color\-action-bg-primary: \#6750A4; /\* 映射自 brand.40 \*/  
}

@media (prefers-color-scheme: dark) {  
  :root {  
    \--sys-color\-action-bg-primary: \#D0BCFF; /\* 映射自 brand.80 \*/  
  }  
}

这种处理方式使得暗色模式的切换在浏览器合成层完成，无需 JavaScript 介入，性能最优且无闪烁。

### **4.3 高对比度与系统色支持**

为了满足 Windows 高对比度模式和 Web 可访问性标准（WCAG AA/AAA），我们需要引入第三个维度的映射 14。

在 semantic/color/high-contrast.json 中，我们将语义令牌映射到对比度更高的色调上（例如，将文本色从 neutral.10 加深到 neutral.0 即纯黑）。此外，对于部分关键 UI 元素，应使用 CSS 系统颜色关键字作为回退值（Fallback），例如：  
\--sys-color-text-primary: CanvasText;  
这确保了在操作系统的强制色彩模式（Forced Colors Mode）下，内容依然可见。

---

## **5\. 排版与复杂属性的复合令牌策略**

排版、阴影和动画通常涉及多个 CSS 属性的组合，这在单一的 CSS 变量中难以表达。SCSS 的混合宏（Mixin）特性在此处发挥了关键作用。

### **5.1 复合令牌的 JSON 结构**

不同于颜色，排版令牌是一个对象集合 20。

JSON

"sys": {  
  "typography": {  
    "body": {  
      "large": {  
        "$type": "typography",  
        "fontFamily": "{ref.font.sans}",  
        "fontWeight": "{ref.font.weight.regular}",  
        "fontSize": "{ref.font.size.100}",  
        "lineHeight": "{ref.font.lineHeight.150}"  
      }  
    }  
  }  
}

### **5.2 SCSS Map 的深度利用**

为了在 SCSS 中优雅地使用这些复合令牌，我们需要构建系统输出“深度 Map”（Deep Map），将参考层写入 \_ref.scss，将语义层写入 \_semantic.scss。Style Dictionary 的 scss/map-deep 格式可以完美保留 JSON 的层级结构 21。

**生成的 SCSS Map:**

SCSS

$design-system-tokens: (  
  'sys': (  
    'typography': (  
      'body': (  
        'large': (  
          'font-family': 'Roboto, sans-serif',  
          'font-weight': 400,  
          'font-size': 1rem,  
          'line-height': 1.5  
        )  
      )  
    )  
  )  
);

### **5.3 处理 Sass 的混合声明（Mixed Declarations）变更**

近期 Dart Sass (v1.77.7+) 引入了关于“混合声明”（Mixed Declarations）的破坏性变更，即禁止在嵌套规则之后再编写属性声明 23。传统的 Mixin 写法可能会触发警告。

**推荐的 Mixin 实现模式：**

SCSS

// \_mixins.scss  
@use "sass:map";  
@use "tokens" as t;

// 排版 Mixin  
@mixin type-style($path...) {  
  $typography-map: t.get-token($path...);  
    
  // 显式输出所有属性，避免嵌套逻辑混乱  
  font-family: map.get($typography-map, 'font-family');  
  font-weight: map.get($typography-map, 'font-weight');  
  font-size: map.get($typography-map, 'font-size');  
  line-height: map.get($typography-map, 'line-height');  
}

// 用法  
.article-body {  
  @include type-style(sys, typography, body, large);  
  // 任何嵌套规则必须放在 Mixin 之后，或者 Mixin 内部不包含嵌套  
  color: var(--sys-color-text-primary);  
}

这种将复合令牌解构为扁平 CSS 属性的方法，既规避了 Sass 的语法限制，又保持了代码的整洁。

---

## **6\. 技术实现路径：JSON 到 SCSS 的全链路流水线**

本节详细阐述如何通过工具链将上述理论转化为可执行的代码。核心工具选用 Style Dictionary，因其对 JSON 转换的强大支持及插件生态 26。

### **6.1 单一事实来源（SSoT）的构建**

所有设计决策必须存储在 JSON 文件中。为了增强协作，建议使用 W3C Design Tokens Format Module 草案标准，该标准定义了 $value 和 $type 等保留字，确保了跨工具（如 Figma Tokens 插件）的兼容性 20。

### **6.2 Style Dictionary 的深度配置**

我们需要配置 Style Dictionary 以同时输出 CSS 变量（用于运行时主题切换）和 SCSS Map（用于编译时逻辑）。

**配置文件 (config.js):**

JavaScript

const StyleDictionary \= require('style-dictionary');

module.exports \= {  
  source: \['tokens/\*\*/\*.json'\], // 包含 primitives 和 semantic  
  platforms: {  
    scss: {  
      transformGroup: 'scss',  
      buildPath: 'src/scss/abstract/',  
      files:  
    }  
  }  
};

### **6.3 混合访问器模式（Hybrid Accessor Pattern）**

这是本方案中最具创新性的部分。为了结合 SCSS 的函数优势和 CSS 变量的动态优势，我们创建一个 SCSS 函数来包装变量调用。

**SCSS 函数实现 (\_functions.scss):**

SCSS

@use "sass:map";  
@use "sass:list";  
@use "tokens" as t;

// 辅助函数：将列表转换为连字符分隔的字符串  
@function list-to-string($list, $glue: "-") {  
  $result: null;  
  @each $item in $list {  
    $result: if($result \== null, $item, $result \+ $glue \+ $item);  
  }  
  @return $result;  
}

// 核心函数：获取令牌  
// 如果是系统级令牌，返回 CSS 变量形式 var(--sys-...)  
// 如果是参考级令牌，直接返回其值（用于计算或媒体查询）  
@function get($keys...) {  
  // 1\. 从 Map 中获取原始值作为回退值 (Fallback)  
  $raw-value: map.get(t.$tokens, $keys...);  
    
  // 2\. 检查是否为系统级 (假设第一级 key 为 sys)  
  $namespace: list.nth($keys, 1);  
    
  @if $namespace \== 'sys' and type-of($raw-value)\!= 'map' {  
    // 生成变量名：sys-color-action-bg  
    $var-name: \--\#{list-to-string($keys)};  
    @return var($var-name, $raw-value);  
  }  
    
  @return $raw-value;  
}

**开发者的使用体验：**

SCSS

.btn {  
  // 编译结果: background-color: var(--sys-color-action-bg-primary, \#6750A4);  
  background-color: get(sys, color, action, bg, primary);  
    
  // 媒体查询直接使用参考令牌（因为 CSS 变量在媒体查询中无效）  
  @media (min-width: get(ref, breakpoint, md)) {  
    padding: get(sys, space, lg);  
  }  
}

这种模式完美解决了 SCSS 预编译特性与 CSS 运行时特性之间的矛盾。

---

## **7\. 治理、废弃策略与长期维护**

一个可持续的系统不仅需要初始架构，更需要完善的演进机制。

### **7.1 废弃（Deprecation）流程**

随着设计系统的迭代，某些令牌必然会被废弃。直接删除会导致下游应用构建失败。参考 GraphQL 和标准 API 的废弃模式，我们应在 JSON 中标记元数据 28。

**JSON 标记：**

JSON

{  
  "old-token": {  
    "$value": "\#ff0000",  
    "deprecated": true,  
    "deprecation\_reason": "Use 'sys.color.error' instead."  
  }  
}

SCSS 层的警告机制：  
我们需要自定义 Style Dictionary 的 Format 或在 SCSS 函数中增加检查逻辑。当开发者引用了带有 deprecated 标记的令牌时，SCSS 编译器应在控制台输出 @warn 信息 30。

SCSS

// 伪代码逻辑  
@if map.get($token-meta, 'deprecated') {  
  @warn "Token '\#{$name}' is deprecated. Reason: \#{map.get($token-meta, 'reason')}";  
}

### **7.2 自动化 Linting 与类型安全**

为了防止开发者硬编码颜色值（Magic Values），应引入 stylelint 并配置 stylelint-declaration-strict-value 插件，强制要求 color、background-color 等属性必须使用变量或 SCSS 函数。

此外，Primer 团队的实践表明，将令牌发布为 NPM 包，并提供 TypeScript 类型定义（即使对于样式项目），可以极大地提升开发工具的自动补全体验，减少拼写错误 32。

---

## **8\. 结论**

本研究报告提出了一套融合了行业顶尖实践的设计令牌管理方案。通过借鉴 Material Design 3 的**动态色彩算法**，我们确立了色调调色板作为单一事实来源的地位；通过采纳 Apple HIG 的**语义化适应性**，我们实现了优雅的暗色模式支持；通过应用 GitHub Primer 的**功能性分层**与**严格命名规范**，我们解决了大规模协作中的认知负荷问题。

在技术落地层面，本方案不仅仅是一个变量列表，而是一个完整的**数据到样式的流水线**。利用 JSON 作为数据核心，Style Dictionary 作为转换引擎，SCSS Deep Map 与 Mixin 作为逻辑载体，CSS Variables 作为运行时表现，我们成功构建了一个既具备 SCSS 编译时安全检查能力，又拥有现代 CSS 动态特性的混合架构。

这一架构不仅能够满足当前的跨平台与多主题需求，其高度解耦的特性也为未来适应新的设计趋势（如支持更多维度的无障碍设置或全新的视觉语言）预留了充足的空间，真正实现了设计系统的可持续发展。

