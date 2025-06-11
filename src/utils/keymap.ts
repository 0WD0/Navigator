// 快捷键动作类型
export type KeyAction = {
  action: string
  payload?: any
  description: string
}

// Trie 节点
export class TrieNode {
  children: Map<string, TrieNode> = new Map()
  action: KeyAction | null = null
  isEndOfSequence: boolean = false

  constructor() {}
}

// Trie 字典树
export class KeymapTrie {
  private root: TrieNode = new TrieNode()

  // 添加快捷键映射
  addSequence(keys: string[], action: KeyAction) {
    let current = this.root
    
    for (const key of keys) {
      if (!current.children.has(key)) {
        current.children.set(key, new TrieNode())
      }
      current = current.children.get(key)!
    }
    
    current.action = action
    current.isEndOfSequence = true
  }

  // 查找节点
  findNode(keys: string[]): TrieNode | null {
    let current = this.root
    
    for (const key of keys) {
      if (!current.children.has(key)) {
        return null
      }
      current = current.children.get(key)!
    }
    
    return current
  }

  // 检查是否有可能的后续按键
  hasChildren(keys: string[]): boolean {
    const node = this.findNode(keys)
    return node ? node.children.size > 0 : false
  }

  // 获取动作
  getAction(keys: string[]): KeyAction | null {
    const node = this.findNode(keys)
    return node?.action || null
  }

  // 检查是否是有效的序列开始
  isValidPrefix(keys: string[]): boolean {
    return this.findNode(keys) !== null
  }

  // 获取根节点（用于遍历）
  getRootNode(): TrieNode {
    return this.root
  }
}

// 快捷键状态机
export class KeySequenceStateMachine {
  private trie: KeymapTrie = new KeymapTrie()
  private currentSequence: string[] = []
  private timeoutId: number | null = null
  private readonly CONFIRMATION_TIMEOUT = 1000 // 1秒确认超时
  
  constructor() {
    this.initializeKeymaps()
  }

  // 初始化快捷键映射
  private initializeKeymaps() {
    // 基础导航
    this.trie.addSequence(['j'], {
      action: 'navigation.nextPage',
      description: '下一页'
    })
    
    this.trie.addSequence(['k'], {
      action: 'navigation.previousPage', 
      description: '上一页'
    })

    this.trie.addSequence(['h'], {
      action: 'navigation.left',
      description: '向左'
    })

    this.trie.addSequence(['l'], {
      action: 'navigation.right',
      description: '向右'
    })

    // 多键序列 - gg (第一页)
    this.trie.addSequence(['g', 'g'], {
      action: 'navigation.firstPage',
      description: '跳转到第一页'
    })

    // 单键 G (最后一页)
    this.trie.addSequence(['G'], {
      action: 'navigation.lastPage',
      description: '跳转到最后一页'
    })

    // 批注相关 - nc (创建批注)
    this.trie.addSequence(['n', 'c'], {
      action: 'annotation.create',
      description: '创建批注'
    })

    // 批注相关 - ne (编辑批注)
    this.trie.addSequence(['n', 'e'], {
      action: 'annotation.edit',
      description: '编辑批注'
    })

    // 批注相关 - nd (删除批注)
    this.trie.addSequence(['n', 'd'], {
      action: 'annotation.delete',
      description: '删除批注'
    })

    // 批注相关 - nl (列出批注)
    this.trie.addSequence(['n', 'l'], {
      action: 'annotation.list',
      description: '列出所有批注'
    })

    // 视图切换
    this.trie.addSequence(['1'], {
      action: 'view.preview',
      description: '预览视图'
    })

    this.trie.addSequence(['2'], {
      action: 'view.outline', 
      description: '大纲视图'
    })

    this.trie.addSequence(['3'], {
      action: 'view.textOnly',
      description: '纯文本视图'
    })

    // 搜索相关 - sf (搜索向前)
    this.trie.addSequence(['s', 'f'], {
      action: 'search.forward',
      description: '向前搜索'
    })

    // 搜索相关 - sb (搜索向后)
    this.trie.addSequence(['s', 'b'], {
      action: 'search.backward',
      description: '向后搜索'
    })

    // 模式切换
    this.trie.addSequence([':'], {
      action: 'mode.command',
      description: '进入命令模式'
    })

    this.trie.addSequence(['i'], {
      action: 'mode.insert',
      description: '进入插入模式'
    })

    this.trie.addSequence(['?'], {
      action: 'help.toggle',
      description: '显示/隐藏帮助'
    })
  }

  // 处理按键输入
  processKey(key: string): { action: KeyAction | null; shouldContinue: boolean } {
    // 清除之前的超时
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    // 添加当前按键到序列
    const testSequence = [...this.currentSequence, key]

    // 检查是否是有效的前缀
    if (!this.trie.isValidPrefix(testSequence)) {
      // 无效前缀，重置序列
      this.reset()
      return { action: null, shouldContinue: false }
    }

    // 更新当前序列
    this.currentSequence = testSequence
    
    // 获取当前节点
    const currentAction = this.trie.getAction(this.currentSequence)
    const hasChildren = this.trie.hasChildren(this.currentSequence)

    if (currentAction && !hasChildren) {
      // 情况1: 终止状态且没有后续按键 → 立即响应
      const action = currentAction
      this.reset()
      return { action, shouldContinue: false }
    } else if (currentAction && hasChildren) {
      // 情况2: 终止状态但有后续按键 → 等待确认时间后响应
      const action = currentAction
      this.timeoutId = window.setTimeout(() => {
        this.reset()
        this.executeAction(action)
      }, this.CONFIRMATION_TIMEOUT)
      return { action: null, shouldContinue: true }
    } else {
      // 情况3: 非终止状态 → 等待更多输入，设置超时清空
      this.timeoutId = window.setTimeout(() => {
        this.reset()
      }, this.CONFIRMATION_TIMEOUT)
      return { action: null, shouldContinue: true }
    }
  }

  // 重置状态机
  reset() {
    this.currentSequence = []
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  // 获取当前序列（用于显示）
  getCurrentSequence(): string {
    return this.currentSequence.join('')
  }

  // 获取所有快捷键映射（用于帮助系统）
  getAllKeymaps(): Array<{ keys: string; description: string }> {
    const result: Array<{ keys: string; description: string }> = []
    this.collectKeymaps(this.trie.getRootNode(), [], result)
    return result
  }

  private collectKeymaps(node: TrieNode, currentPath: string[], result: Array<{ keys: string; description: string }>) {
    if (node.action) {
      result.push({
        keys: currentPath.join(''),
        description: node.action.description
      })
    }

    for (const [key, childNode] of node.children) {
      this.collectKeymaps(childNode, [...currentPath, key], result)
    }
  }

  // 获取根节点（用于遍历）
  getRootNode(): TrieNode {
    return this.root
  }

  // 执行动作的回调（由外部注入）
  private executeAction: (action: KeyAction) => void = () => {}

  // 设置动作执行器
  setActionExecutor(executor: (action: KeyAction) => void) {
    this.executeAction = executor
  }
}

// 单例实例
export const keySequenceStateMachine = new KeySequenceStateMachine() 