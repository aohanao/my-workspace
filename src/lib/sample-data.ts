import {
  JobApplication,
  ThesisInfo,
  ModelExperiment,
  ResearchProject,
  MilestoneItem,
  LeetCodeItem,
  KnowledgeFlashcard,
  DailyTop3Item,
  HabitItem,
  QuickCaptureNote,
  TimeBlockItem,
} from '@/types'

// 初始秋招投递数据：清空，等待用户导入真实飞书表格或手动添加
export const INITIAL_JOBS: JobApplication[] = []

// 硕士学位论文真实信息（来自西南交通大学开题报告：梅傲寒）
export const INITIAL_THESIS: ThesisInfo = {
  title: '钻爆法隧道全工序机械化施工智能配置方法及系统研究',
  blindReviewDate: '2027-02-04',
  defenseDate: '2027-05-20',
  chapters: [
    {
      id: 'ch-1',
      title: '第一章 绪论 (工程背景、国内外研究现状及论文主要内容与技术路线)',
      targetWords: 6000,
      currentWords: 0,
      status: 'not_started',
      notes: '明确“少人化、机械化、智能化”需求，综述隧道开挖支护机理与智能决策系统。',
    },
    {
      id: 'ch-2',
      title: '第二章 隧道全工序机械化施工标准工法与装备谱系化配置体系',
      targetWords: 8000,
      currentWords: 0,
      status: 'not_started',
      notes: '研究主洞/平导不同围岩与工法下的机械装备空间适配性与高效谱系化配置。',
    },
    {
      id: 'ch-3',
      title: '第三章 适应全工序机械化施工的隧道支护结构体系与接触力学机理',
      targetWords: 9000,
      currentWords: 0,
      status: 'not_started',
      notes: '揭示围岩应力状态、压力拱演化规律以及岩-支-机相互作用机理。',
    },
    {
      id: 'ch-4',
      title: '第四章 融合力学机理与数据驱动的隧道支护参数智能选择模型',
      targetWords: 8000,
      currentWords: 0,
      status: 'not_started',
      notes: '构建“围岩性态-支护参数-结构安全”数据集，开发物理约束神经网络模型。',
    },
    {
      id: 'ch-5',
      title: '第五章 公路隧道多工序关键参数智能设计与配置系统研发及工程验证',
      targetWords: 7000,
      currentWords: 0,
      status: 'not_started',
      notes: '集成工法选择、支护设计与装备配置算法，选取典型工程算例测试验证。',
    },
    {
      id: 'ch-6',
      title: '第六章 结论与展望',
      targetWords: 2000,
      currentWords: 0,
      status: 'not_started',
      notes: '总结全工序机械化智能配置核心成果与创新点。',
    },
  ],
}

// 模拟与算法台账（核心算法模型：训练深度神经网络模型建立地质参数、围岩等级、支护参数与结构安全性之间的映射关系）
export const INITIAL_MODELS: ModelExperiment[] = [
  {
    id: 'exp-geo-rock-support-safety-net',
    modelName: 'GeoSupportSafety-DNN: 地质参数-围岩等级-支护参数-结构安全性映射神经网络',
    taskType: '多维非线性高维力学映射与结构安全性智能预测',
    dataset: '隧道原位地质钻探监测库 + 三维围岩数值仿真高维矩阵 (地应力/弹性模量/Kv/围岩分级II~V/支护工况/安全系数与收敛变形)',
    hyperparameters: 'DNN (4隐含层: 256-128-64-32) + AdamW (lr: 1e-4), Loss: MSE + 压力拱极限平衡先验物理惩罚项',
    metrics: '待启动训练 (目标: 安全性预测 R² ≥ 0.94, MAE ≤ 3.2%)',
    status: 'not_started',
    date: '2026-09-03',
    notes: '核心算法目标：训练深度神经网络，精准拟合地质参数（地应力场、岩体弹性模量、完整性系数Kv、地下水状态）、围岩级别（II~V级）和支护参数（锚杆间距排距、喷混凝土厚度、格栅/型钢拱架型号）与结构安全性指标（开挖后围岩塑性区深度、接触应力、拱顶沉降、支护安全系数）之间的非线性全局映射关系，支撑智能选配与安全校验。',
  },
]

// 系统工程台账（包含一个大系统，涵盖装备配置、工法选配、支护参数配置等子系统，并深度介入 RAG 与施工智能体板块）
export const INITIAL_PROJECTS: ResearchProject[] = [
  {
    id: 'proj-tunnel-integrated-system',
    name: '钻爆法隧道全工序机械化施工智能决策与协同配置系统 (核心大系统)',
    description: '课题核心综合成果大系统，打通“工法选配 - 支护参数配置 - 机械装备谱系化选型 - Agentic RAG规程问答与自主调度智能体”的全链路数字孪生与协同配置平台。',
    techStack: ['Python', 'FastAPI', 'PyTorch', 'Agentic RAG', 'LangChain', 'React', 'Three.js'],
    progress: 0,
    tasks: [
      {
        id: 'task-sub-equipment',
        text: '【装备配置子系统】构建三臂凿岩台车、湿喷机械手、拱架安装机装备作业工装谱系库，研发开挖断面空间作业干涉校核与智能选型算法',
        done: false,
      },
      {
        id: 'task-sub-method',
        text: '【工法选配子系统】依据围岩性态动态分级，实现开挖工法（全断面法、台阶法、双侧壁导坑法、CD/CRD法）自适应匹配与工序时空协同调度',
        done: false,
      },
      {
        id: 'task-sub-support',
        text: '【支护参数配置子系统】调用地质-围岩-支护-安全性映射神经网络，实现初期支护（锚杆/喷混/钢拱架）参数快速推荐与受力安全校核',
        done: false,
      },
      {
        id: 'task-sub-rag-agent',
        text: '【RAG 与智能体板块】接入行业标准规范与工程案例知识库（Agentic RAG），构建施工协同决策智能体（Agent），实现方案自检、推理与工程预警',
        done: false,
      },
    ],
  },
]

// 毕业里程碑（开题已过，中期未进行且定于 12 月份）
export const INITIAL_MILESTONES: MilestoneItem[] = [
  {
    id: 'ms-1',
    title: '硕士学位论文开题报告答辩',
    targetDate: '2025-11-15',
    completed: true,
    category: '开题',
    notes: '顺利通过开题考核，确定“钻爆法隧道全工序机械化施工智能配置方法及系统研究”课题方向。',
  },
  {
    id: 'ms-2',
    title: '硕士学位论文中期考核检查',
    targetDate: '2026-12-20',
    completed: false,
    category: '中期',
    notes: '研究生院中期检查节点预计在12月份。需在此前完成神经网络映射模型建立与全工序大系统原型研发。',
  },
  {
    id: 'ms-3',
    title: '秋招冲刺截止与意向签约',
    targetDate: '2026-11-20',
    completed: false,
    category: '其他',
    notes: '积极投递目标企业研发与算法岗位，完成技术面试、HR面与三方意向签约。',
  },
  {
    id: 'ms-4',
    title: '硕士学位论文初稿撰写完成',
    targetDate: '2027-02-04',
    completed: false,
    category: '预答辩',
    notes: '完成全部 6 个章节初稿撰写，交付导师一审并修改。',
  },
  {
    id: 'ms-5',
    title: '学位论文查重与盲审送审',
    targetDate: '2027-03-15',
    completed: false,
    category: '盲审',
    notes: '根据导师修改意见定稿，提交盲审送审与格式核验。',
  },
  {
    id: 'ms-6',
    title: '硕士研究生毕业正式答辩',
    targetDate: '2027-05-20',
    completed: false,
    category: '答辩',
    notes: '顺利完成学位论文答辩、学位评定与离校手续。',
  },
]

// 力扣高频真题题库（含完整 Python 代码答案、解题思路、时间与空间复杂度）
export const INITIAL_LEETCODE: LeetCodeItem[] = [
  {
    id: 'lc-1',
    number: 1,
    title: '两数之和 (Two Sum)',
    difficulty: 'Easy',
    tags: ['哈希表', '高频'],
    lastReviewed: '2026-09-01',
    nextReview: '2026-09-04',
    reviewStage: 3,
    notes: '遍历数组时用哈希表记录 {值: 索引}。对于当前数 num，检查 target-num 是否在表中，若存在即找到答案。',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    solutionExplanation: '遍历数组时，用哈希表存储 {值: 索引}。对于当前数 num，检查 target - num 是否在表中，若存在则找到答案。空间换时间。',
    code: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        hashtable = dict()
        for i, num in enumerate(nums):
            if target - num in hashtable:
                return [hashtable[target - num], i]
            hashtable[nums[i]] = i 
        return []`,
  },
  {
    id: 'lc-49',
    number: 49,
    title: '字母异位词分组 (Group Anagrams)',
    difficulty: 'Medium',
    tags: ['哈希表', '排序', '字符串'],
    lastReviewed: '2026-08-31',
    nextReview: '2026-09-03',
    reviewStage: 2,
    notes: '异位词排序后结果相同（如 "eat" 和 "tea" 排序后都是 "aet"）。用排序后的字符串作为哈希表的 key。',
    timeComplexity: 'O(n * k log k)',
    spaceComplexity: 'O(n * k)',
    solutionExplanation: '将原字符串排序后的副本作为哈希表的键，将相同的异位词存入列表。',
    code: `class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        mp = collections.defaultdict(list)
        for st in strs:
            key = "".join(sorted(st))
            mp[key].append(st)
        return list(mp.values())`,
  },
  {
    id: 'lc-128',
    number: 128,
    title: '最长连续序列 (Longest Consecutive Sequence)',
    difficulty: 'Medium',
    tags: ['哈希表', '并查集', '高频'],
    lastReviewed: '2026-08-30',
    nextReview: '2026-09-03',
    reviewStage: 2,
    notes: 'set 去重，只从连续序列起点（即 num-1 不在集合中）开始向右遍历，计算序列长度，保证严格 O(n)。',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    solutionExplanation: '将所有数存入哈希集合，若 num-1 不在 set 中，说明 num 是某条连续序列的起点。以此起点不断向后查找 num+1，内层 while 总共遍历一次。',
    code: `class Solution:
    def longestConsecutive(self, nums: List[int]) -> int:
        ans = 0
        num_set = set(nums) # 去重
        for num in num_set:
            # 数字连续，只要 num-1 不在, 就以此为起点
            if num - 1 not in num_set:
                curr = num # 记录当前起点
                curr_ans = 1 # 记录当前长度
                while curr + 1 in num_set:
                    curr += 1
                    curr_ans += 1
                ans = max(ans, curr_ans)
        return ans`,
  },
  {
    id: 'lc-283',
    number: 283,
    title: '移动零 (Move Zeroes)',
    difficulty: 'Easy',
    tags: ['双指针', '数组'],
    lastReviewed: '2026-08-29',
    nextReview: '2026-09-02',
    reviewStage: 3,
    notes: '快慢双指针。left 指向待填充位置，right 遍历数组。遇非零即交换至 left，left 右移。',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    solutionExplanation: '保证 [0, left) 均为非零元素，单次线性扫描完成原地操作。',
    code: `class Solution:
    def moveZeroes(self, nums: List[int]) -> None:
        n = len(nums)
        left = right = 0
        while right < n:
            if nums[right] != 0:
                nums[left], nums[right] = nums[right], nums[left]
                left += 1
            right += 1`,
  },
  {
    id: 'lc-11',
    number: 11,
    title: '盛最多水的容器 (Container With Most Water)',
    difficulty: 'Medium',
    tags: ['双指针', '贪心'],
    lastReviewed: '2026-08-28',
    nextReview: '2026-09-03',
    reviewStage: 2,
    notes: '对撞双指针。面积 = 底 * 高。底边缩小时移动较短的木板才能有更大面积可能。',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    solutionExplanation: '左右两端向中间夹逼，每次收缩矮侧板子，记录全局最大蓄水量。',
    code: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        n = len(height)
        left = 0
        right = n - 1
        maxml = 0
        while left < right:
            ml = (right - left) * min(height[left], height[right])
            maxml = max(maxml, ml)
            if height[left] < height[right]:
                left += 1
            else:
                right -= 1
        return maxml`,
  },
  {
    id: 'lc-15',
    number: 15,
    title: '三数之和 (3Sum)',
    difficulty: 'Medium',
    tags: ['双指针', '排序', '高频'],
    lastReviewed: '2026-08-29',
    nextReview: '2026-09-02',
    reviewStage: 3,
    notes: '先排序，固定第一个数 nums[i]，余下两位用左右对撞指针搜索，注意去重。',
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(1)',
    solutionExplanation: '先升序排序，遍历首个数，并跳过重复元素；内部使用双指针左右夹逼求 target = -nums[first]，去重防重复三元组。',
    code: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        n = len(nums)
        nums.sort() # 先排序 避免重复
        ans = list()
        for first in range(n):
            if first > 0 and nums[first] == nums[first - 1]:
                continue
            third = n - 1
            target = -nums[first]
            for second in range(first + 1, n):
                if second > first + 1 and nums[second] == nums[second - 1]:
                    continue
                while second < third and nums[second] + nums[third] > target:
                    third -= 1
                if second == third:
                    break
                if nums[second] + nums[third] == target:
                    ans.append([nums[first], nums[second], nums[third]])
        return ans`,
  },
  {
    id: 'lc-42',
    number: 42,
    title: '接雨水 (Trapping Rain Water)',
    difficulty: 'Hard',
    tags: ['双指针', '单调栈', '高频'],
    lastReviewed: '2026-08-25',
    nextReview: '2026-09-02',
    reviewStage: 3,
    notes: '双指针法。矮边决定水位上限，维护 leftMax/rightMax，从低的一侧累加蓄水。',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    solutionExplanation: '维护两侧最大高度 leftMax 和 rightMax，哪个较小就优先向内收缩并累加 (maxHeight - currentHeight)。',
    code: `class Solution:
    def trap(self, height: List[int]) -> int:
        n = len(height)
        left, leftMax, rightMax = 0, 0, 0
        right = n - 1
        ans = 0
        while left < right:
            leftMax = max(leftMax, height[left])
            rightMax = max(rightMax, height[right])
            if height[left] < height[right]:
                ans += leftMax - height[left]
                left += 1
            else:
                ans += rightMax - height[right]
                right -= 1
        return ans`,
  },
  {
    id: 'lc-3',
    number: 3,
    title: '无重复字符的最长子串 (Longest Substring Without Repeating Characters)',
    difficulty: 'Medium',
    tags: ['滑动窗口', '哈希表', '高频'],
    lastReviewed: '2026-08-27',
    nextReview: '2026-09-03',
    reviewStage: 3,
    notes: '右指针扩张窗口，遇重复则左指针收缩；或用哈希表直接跳转 left = last[ch] + 1。',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(|Σ|)',
    solutionExplanation: '使用滑动窗口结合哈希表维护字符最新出现位置，直接跳移 left 边界至重复字符下一位。',
    code: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last = {}
        ans, left = 0, 0
        for right, ch in enumerate(s):
            if ch in last and left <= last[ch]:
                left = last[ch] + 1
            last[ch] = right
            ans = max(ans, right - left + 1)
        return ans`,
  },
  {
    id: 'lc-438',
    number: 438,
    title: '找到字符串中所有字母异位词',
    difficulty: 'Medium',
    tags: ['滑动窗口', '哈希表'],
    lastReviewed: '2026-08-26',
    nextReview: '2026-09-02',
    reviewStage: 2,
    notes: '固定窗口大小为 len(p)，维护频次字典与 p 的字典比较。',
    timeComplexity: 'O(m + (n-m)*26)',
    spaceComplexity: 'O(26)',
    solutionExplanation: '窗口长度固定为 p 的长度，滑移时移除左端字符计数、加入右端新字符计数。',
    code: `class Solution:
    def findAnagrams(self, s: str, p: str) -> List[int]:
        s_len, p_len = len(s), len(p)
        if s_len < p_len:
            return []
        p_count = collections.Counter(p)
        s_count = collections.Counter(s[:p_len])
        ans = []
        if s_count == p_count:
            ans.append(0)
        for i in range(s_len - p_len):
            left_char = s[i]
            s_count[left_char] -= 1
            if s_count[left_char] == 0:
                del s_count[left_char]
            right_char = s[i + p_len]
            s_count[right_char] = s_count.get(right_char, 0) + 1
            if s_count == p_count:
                ans.append(i + 1)
        return ans`,
  },
  {
    id: 'lc-560',
    number: 560,
    title: '和为 K 的子数组 (Subarray Sum Equals K)',
    difficulty: 'Medium',
    tags: ['前缀和', '哈希表', '高频'],
    lastReviewed: '2026-08-25',
    nextReview: '2026-09-02',
    reviewStage: 2,
    notes: '前缀和 + 哈希表。s[j] - s[i] = k 即寻找前缀和为 s - k 的个数，ans += mp[s-k]。',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    solutionExplanation: '将数组连续子数组和问题转换为前缀和之差，哈希表存储前缀和出现频次。',
    code: `class Solution:
    def subarraySum(self, nums: List[int], k: int) -> int:
        mp = collections.defaultdict(int)
        s = ans = 0
        for num in nums:
            mp[s] += 1
            s += num
            ans += mp[s - k]
        return ans`,
  },
  {
    id: 'lc-239',
    number: 239,
    title: '滑动窗口最大值 (Sliding Window Maximum)',
    difficulty: 'Hard',
    tags: ['双端队列', '单调队列', '高频'],
    lastReviewed: '2026-08-26',
    nextReview: '2026-09-03',
    reviewStage: 2,
    notes: '单调队列存下标，保持值从大到小。尾部小于当前值的全弹出，队首过期出队，队首即最大值。',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(k)',
    solutionExplanation: '双端队列维护窗口内的单调递减下标，左端始终为当前滑动窗口最大值的下标。',
    code: `class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        q = collections.deque()
        ans = []
        for i, v in enumerate(nums):
            while q and nums[q[-1]] <= v:
                q.pop()
            q.append(i)
            if q[0] <= i - k:
                q.popleft()
            if i >= k - 1:
                ans.append(nums[q[0]])
        return ans`,
  },
  {
    id: 'lc-76',
    number: 76,
    title: '最小覆盖子串 (Minimum Window Substring)',
    difficulty: 'Hard',
    tags: ['滑动窗口', '哈希表', '高频'],
    lastReviewed: '2026-08-24',
    nextReview: '2026-09-02',
    reviewStage: 3,
    notes: '滑动窗口 + 字符计数 need。右指针扩张满足条件后，左指针尽量收缩求最小窗口。',
    timeComplexity: 'O(m + n)',
    spaceComplexity: 'O(|Σ|)',
    solutionExplanation: '右指针扩张直到满足 t 的全部字符种类与数量，左指针开始逐步收缩并记录最短窗口。',
    code: `class Solution:
    def minWindow(self, s: str, t: str) -> str:
        left, right, valid, start, min_len = 0, 0, 0, 0, float('inf')
        need = collections.Counter(t)
        n = collections.defaultdict(int)
        while right < len(s):
            c = s[right]
            right += 1
            if c in need:
                n[c] += 1
                if n[c] == need[c]:
                    valid += 1
            while valid == len(need):
                if right - left < min_len:
                    start = left
                    min_len = right - left
                d = s[left]
                left += 1
                if d in need:
                    if n[d] == need[d]:
                        valid -= 1
                    n[d] -= 1
        return "" if min_len == float('inf') else s[start : start + min_len]`,
  },
  {
    id: 'lc-53',
    number: 53,
    title: '最大子数组和 (Maximum Subarray)',
    difficulty: 'Medium',
    tags: ['动态规划', '分治', '高频'],
    lastReviewed: '2026-08-30',
    nextReview: '2026-09-04',
    reviewStage: 3,
    notes: 'current = max(x, current + x)。若加上前面比自身还小，则舍弃前面重新开始。',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    solutionExplanation: '经典 Kadane 算法，current 维护以当前元素结尾的最大连续子数组和。',
    code: `class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        current = maxSum = nums[0]
        for x in nums[1:]:
            current = max(x, current + x)
            maxSum = max(current, maxSum)
        return maxSum`,
  },
  {
    id: 'lc-56',
    number: 56,
    title: '合并区间 (Merge Intervals)',
    difficulty: 'Medium',
    tags: ['数组', '排序', '高频'],
    lastReviewed: '2026-08-29',
    nextReview: '2026-09-03',
    reviewStage: 2,
    notes: '按左端点升序排序，若上一区间 end < 当前区间 start 则新增，否则合并右边界。',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    solutionExplanation: '先根据区间左端点排序，然后顺序合并重叠区间。',
    code: `class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        intervals.sort(key=lambda x: x[0])
        merged = []
        for interval in intervals:
            if not merged or merged[-1][1] < interval[0]:
                merged.append(interval)
            else:
                merged[-1][1] = max(merged[-1][1], interval[1])
        return merged`,
  },
  {
    id: 'lc-206',
    number: 206,
    title: '反转链表 (Reverse Linked List)',
    difficulty: 'Easy',
    tags: ['链表', '递归', '迭代', '高频'],
    lastReviewed: '2026-08-31',
    nextReview: '2026-09-04',
    reviewStage: 4,
    notes: '递归后序回溯：head.next.next = head; head.next = None；或双指针迭代法。',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)递归 / O(1)迭代',
    solutionExplanation: '后序递归到链表尾节点，回溯时将后一节点的 next 指向当前节点并将自己 next 置空。',
    code: `class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        if not head or not head.next:
            return head
        new_head = self.reverseList(head.next)
        head.next.next = head
        head.next = None
        return new_head`,
  },
  {
    id: 'lc-146',
    number: 146,
    title: 'LRU 缓存 (LRU Cache)',
    difficulty: 'Medium',
    tags: ['哈希表', '双向链表', '高频设计'],
    lastReviewed: '2026-08-28',
    nextReview: '2026-09-03',
    reviewStage: 3,
    notes: 'OrderedDict 或 双向链表 + 哈希表。访问 move_to_end，超容 popitem(last=False)。',
    timeComplexity: 'O(1)',
    spaceComplexity: 'O(capacity)',
    solutionExplanation: 'Python 的 OrderedDict 本质是哈希表与双向链表的结合体，支持 O(1) 访问与剔除最旧元素。',
    code: `from collections import OrderedDict

class LRUCache(OrderedDict):
    def __init__(self, capacity: int):
        self.capacity = capacity

    def get(self, key: int) -> int:
        if key not in self:
            return -1
        self.move_to_end(key)
        return self[key]

    def put(self, key: int, value: int) -> None:
        if key in self:
            self.move_to_end(key)
        self[key] = value
        if len(self) > self.capacity:
            self.popitem(last=False)`,
  },
  {
    id: 'lc-200',
    number: 200,
    title: '岛屿数量 (Number of Islands)',
    difficulty: 'Medium',
    tags: ['图论', 'DFS', 'BFS', '并查集'],
    lastReviewed: '2026-08-27',
    nextReview: '2026-09-02',
    reviewStage: 2,
    notes: '遍历网格，遇陆地 1 计数 +1，DFS 将上下左右连通陆地全沉没染成 0。',
    timeComplexity: 'O(m * n)',
    spaceComplexity: 'O(m * n)',
    solutionExplanation: '网格 DFS 搜索，访问过的陆地原地修改为 0 避免开辟 visited 数组。',
    code: `class Solution:
    def dfs(self, grid, r, c):
        grid[r][c] = "0"
        nr, nc = len(grid), len(grid[0])
        for x, y in [(r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)]:
            if 0 <= x < nr and 0 <= y < nc and grid[x][y] == "1":
                self.dfs(grid, x, y)

    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid:
            return 0
        nr, nc = len(grid), len(grid[0])
        num_islands = 0
        for r in range(nr):
            for c in range(nc):
                if grid[r][c] == "1":
                    num_islands += 1
                    self.dfs(grid, r, c)
        return num_islands`,
  },
  {
    id: 'lc-46',
    number: 46,
    title: '全排列 (Permutations)',
    difficulty: 'Medium',
    tags: ['回溯', 'DFS', '高频'],
    lastReviewed: '2026-08-28',
    nextReview: '2026-09-03',
    reviewStage: 2,
    notes: '回溯模板：做选择 -> used[i]=True -> 递归探索 -> 撤销选择 used[i]=False。',
    timeComplexity: 'O(n * n!)',
    spaceComplexity: 'O(n)',
    solutionExplanation: '维护 path 与 used 布尔标记数组，递归终止时将 path 深度拷贝存入结果。',
    code: `class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        result = []
        path = []
        used = [False] * len(nums)

        def backtrack():
            if len(path) == len(nums):
                result.append(path.copy())
                return
            for i in range(len(nums)):
                if used[i]:
                    continue
                path.append(nums[i])
                used[i] = True
                backtrack()
                path.pop()
                used[i] = False

        backtrack()
        return result`,
  },
  {
    id: 'lc-300',
    number: 300,
    title: '最长递增子序列 (Longest Increasing Subsequence)',
    difficulty: 'Medium',
    tags: ['动态规划', '二分查找', '高频'],
    lastReviewed: '2026-08-30',
    nextReview: '2026-09-02',
    reviewStage: 2,
    notes: 'dp[i] 表示以 nums[i] 结尾的 LIS 长度，dp[i] = max(dp[j] + 1)；或贪心+二分 O(nlogn)。',
    timeComplexity: 'O(n^2) / O(n log n)',
    spaceComplexity: 'O(n)',
    solutionExplanation: '状态转移：dp[i] 为前 i 个元素中以第 i 个元素结尾的最长严格递增子序列长度。',
    code: `class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        if not nums:
            return 0
        dp = [1] * len(nums)
        for i in range(len(nums)):
            for j in range(i):
                if nums[i] > nums[j]:
                    dp[i] = max(dp[i], dp[j] + 1)
        return max(dp)`,
  },
  {
    id: 'lc-72',
    number: 72,
    title: '编辑距离 (Edit Distance)',
    difficulty: 'Hard',
    tags: ['动态规划', '字符串', '经典高频'],
    lastReviewed: '2026-08-25',
    nextReview: '2026-09-02',
    reviewStage: 2,
    notes: 'dp[i][j] 表示 word1 前 i 个转为 word2 前 j 个的最少操作。增/删/改 min + 1。',
    timeComplexity: 'O(m * n)',
    spaceComplexity: 'O(m * n)',
    solutionExplanation: '字符相等则 dp[i][j]=dp[i-1][j-1]，不等则在插入、删除、替换三者取最小步数加 1。',
    code: `class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        m, n = len(word1), len(word2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            dp[i][0] = i
        for j in range(1, n + 1):
            dp[0][j] = j
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if word1[i - 1] == word2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
                else:
                    dp[i][j] = min(dp[i-1][j-1], dp[i][j-1], dp[i-1][j]) + 1
        return dp[m][n]`,
  },
]

// 严格来源于 用户公共八股笔记 的真实大模型与计算机公共高频八股
export const INITIAL_FLASHCARDS: KnowledgeFlashcard[] = [
  {
    id: 'fc-1',
    category: '大模型与 Agent 架构',
    question: '什么是 ReAct（Reason + Act）范式？与纯思维链（CoT）的核心区别是什么？',
    answer: 'ReAct 是智能体（Agent）核心运行范式：思考(Thought) ➔ 行动(Action: 调用外部API/工具) ➔ 观察(Observation: 解析返回数据) ➔ 再思考 ➔ 最终输出。核心区别：CoT 仅在模型内部自回归暴露多步推理，不与外部环境交互；而 ReAct 将推理过程与工具调用深度结合，形成“感知-决策-行动-反馈”闭环，能实时获取外部动态知识。',
    mastery: 'mastered',
    lastReviewDate: '2026-09-02',
  },
  {
    id: 'fc-2',
    category: '大模型与推理加速',
    question: '长文本大模型推理显存瓶颈在哪里？Prompt Caching 原理是什么？',
    answer: '长文本推理显存瓶颈在 KV Cache（Key-Value Cache）。自回归生成时每生成一个 Token 都需保留所有历史 Token 的 K 和 V 矩阵，显存占用随上下文长度线性暴增，且受限于 GPU 显存高带宽内存（HBM）。Prompt Caching（提示词缓存）的原理是将高频、长固定的 System Prompt / 规程前缀在首次推理计算后直接持久化保留其 KV 矩阵，后续请求直接复用跳过重复的前缀注意力计算，极大降低 API 成本并大幅缩短首字生成时间（TTFT）。',
    mastery: 'mastered',
    lastReviewDate: '2026-09-01',
  },
  {
    id: 'fc-3',
    category: '大模型框架与消息流',
    question: 'LangChain / FastMCP 中的四种标准 Message 类型及其作用分别是什么？',
    answer: '1. SystemMessage：系统最高指令与人设设定（定义角色边界、格式约束、禁止事项）；2. HumanMessage：代表真实用户的提问输入；3. AIMessage：记录大模型在多轮对话中的思考过程与历史输出；4. ToolMessage / FunctionMessage：在 Agent 调用工具后，将工具在外部环境执行完毕返回的结构化结果打包发回给模型，支撑下一轮推理。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-31',
  },
  {
    id: 'fc-4',
    category: '模型微调与参数高效',
    question: 'LoRA 与 QLoRA 参数高效微调的核心思想是什么？为什么能大幅节省显存？',
    answer: '传统全量微调需更新全部模型权重，显存开销巨大。LoRA 核心思想是冻结预训练基座模型全部权重，在注意力层并联外挂低秩分解矩阵 A 和 B（权重增量 ΔW = B × A，r 为低秩维度如 8 或 16）。参数量仅为原模型的 0.1%~1%。QLoRA 则进一步将原模型基座量化为 4-bit NormalFloat 存储，配合分页优化器（Paged Optimizers），使得单张消费级显卡（如 RTX 3090/4090）即可微调数十亿参数模型。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-30',
  },
  {
    id: 'fc-5',
    category: '计算机网络与协议',
    question: '简述 TCP 三次握手过程，为什么不能是两次？',
    answer: '过程：1. 客户端发送 SYN 报文（同步序列号 ISN_c），进入 SYN_SENT；2. 服务端回复 SYN+ACK 报文（确认收到客户端 SYN，同时发送服务端序列号 ISN_s），进入 SYN_RCVD；3. 客户端回复 ACK 报文（确认收到服务端 SYN），连接建立完成。原因：三次握手才能互相同步并确认双方的“发送”与“接收”能力都正常；若仅两次握手，若客户端之前滞留在网络中的历史失效 SYN 忽然到达服务端，服务端盲目建立连接会造成严重的连接悬挂与服务器资源浪费。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-29',
  },
  {
    id: 'fc-6',
    category: '计算机网络与架构',
    question: '正向代理与反向代理的核心区别是什么？为什么 80/443 端口通常由 Nginx 中转？',
    answer: '区别：正向代理配置在客户端侧，代表客户端向外访问，目标服务器不知道真实客户端（如科学上网）；反向代理配置在服务端侧，代表服务器接收外部请求并分发到内网集群，客户端不知道真实后端地址。80/443 用 Nginx 中转原因：1. Linux 中 1024 以下端口需 root 权限，业务应用（Node/FastAPI）以 root 运行存在巨大安全漏洞，Nginx root 监听后可降权转发；2. 单台服务器 80/443 端口只能由一个程序占用，Nginx 可统一路由给不同域名的不同服务（8080/3000等），实现端口复用、静态缓存与负载均衡。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-28',
  },
  {
    id: 'fc-7',
    category: 'Python 异步与操作系统',
    question: 'CPython GIL 锁的底层机制是什么？进程、线程、协程在 IO 密集与 CPU 密集下的表现有何不同？',
    answer: 'GIL（全局解释器锁）是一把互斥锁，确保单个 CPython 进程同一时刻只有 1 个线程在执行 Python 字节码。因此在 CPU 密集任务下，多线程无法实现多核真正并行，甚至因频繁线程上下文切换而变慢（突破方案是 multiprocessing 多进程）；但在 IO 密集任务（网络请求/数据库查询）下，线程/协程遇到阻塞会自动释放 GIL，利用 asyncio 单线程事件循环即可驱动上万高并发非阻塞 IO，极具性能优势。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-27',
  },
  {
    id: 'fc-8',
    category: '高并发系统与分布式',
    question: '高并发系统架构演进的六大核心维度分别是什么？如何应对缓存击穿与雪崩？',
    answer: '六大维度：1. 系统拆分（微服务解耦与故障物理隔离）；2. 缓存加速（Redis 内存级吞吐，Cache-Aside 模式）；3. MQ 消息队列（异步解耦与削峰填谷）；4. 读写分离（一主多从分担读流量）；5. 数据分离（分库分表突破单机容量与写瓶颈）；6. 全方位服务监控与可观测性（Metrics/Logs/Trace）。缓存击穿（热点 Key 失效）：互斥分布式锁加锁回填或逻辑不过期异步刷新；缓存雪崩（批量 Key 集中失效）：设置过期时间时增加随机抖动偏移量（Random TTL）。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-26',
  },
  {
    id: 'fc-9',
    category: '容器与云原生底层',
    question: 'Docker 容器底层本质是什么？为什么说 Docker 能够承载重型项目？重型项目调优边界是什么？',
    answer: 'Docker 底层并不是传统硬件虚拟化（无 Hypervisor 和独立 Guest OS 内核），而是 Linux 内核原生的进程级资源隔离（cgroups 限制 CPU/内存配额 + namespaces 隔离视图）。其 CPU 与内存损耗小于 1%~2%，性能近乎裸机。重型项目调优必须突破默认限制：1. --shm-size（将默认 64MB 共享内存调至数十 GB，防 PyTorch/数据库 Bus Error）；2. cpuset 绑定物理核心与 NUMA 内存节点（防跨 Socket 内存延迟）；3. Volume 直通挂载宿主机 NVMe SSD（避开 Overlay2 写入性能衰减）；4. --net=host 消除网络虚拟化 NAT 损耗；5. ulimit 扩容文件句柄与锁定物理内存。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-25',
  },
]

// 每日待办四象限初始项
export const INITIAL_TOP3: DailyTop3Item[] = [
  { id: 'top-1', text: '梳理地质参数-围岩等级-支护参数-安全性神经网络模型特征输入输出', done: false, category: 'research', priority: '重急' },
  { id: 'top-2', text: '跟进秋招求职管家投递流程并排查面试排期', done: false, category: 'career', priority: '轻急' },
  { id: 'top-3', text: '复习 2 道力扣高频题（滑动窗口/双指针）与计算机大模型八股', done: false, category: 'study', priority: '重缓' },
]

// 7 大日常习惯打卡矩阵
export const INITIAL_HABITS: HabitItem[] = [
  {
    id: 'h-1',
    name: '毕业论文 / 文献研读',
    color: '#6366f1',
    icon: 'BookOpen',
    category: '学业',
    logs: {
      '2026-09-01': true,
      '2026-09-02': true,
      '2026-09-03': true,
    },
  },
  {
    id: 'h-2',
    name: '力扣刷题 / 算法总结',
    color: '#10b981',
    icon: 'Code',
    category: '技能学习',
    logs: {
      '2026-08-31': true,
      '2026-09-01': true,
      '2026-09-02': true,
    },
  },
  {
    id: 'h-3',
    name: 'ML/DL / 隧道力学模拟',
    color: '#3b82f6',
    icon: 'Cpu',
    category: '技能学习',
    logs: {
      '2026-09-01': true,
      '2026-09-02': true,
    },
  },
  {
    id: 'h-4',
    name: '秋招投递 / 岗位复盘',
    color: '#f59e0b',
    icon: 'Briefcase',
    category: '个人',
    logs: {
      '2026-09-01': true,
      '2026-09-02': true,
      '2026-09-03': true,
    },
  },
  {
    id: 'h-5',
    name: '健身锻炼 (肩/胸/背/腿/核心)',
    color: '#ef4444',
    icon: 'Flame',
    category: '健身',
    logs: {
      '2026-08-31': true,
      '2026-09-02': true,
    },
  },
  {
    id: 'h-6',
    name: 'English Vocabulary & 听说',
    color: '#8b5cf6',
    icon: 'Smile',
    category: 'English',
    logs: {
      '2026-09-01': true,
      '2026-09-02': true,
    },
  },
  {
    id: 'h-7',
    name: '阅读《当下的力量》',
    color: '#ec4899',
    icon: 'BookOpen',
    category: '阅读',
    logs: {
      '2026-09-01': true,
    },
  },
]

// 可自定义的时间块结构化日程 (Time-Blocking)
export const INITIAL_TIMEBLOCKS: TimeBlockItem[] = [
  {
    id: 'tb-1',
    period: 'morning',
    periodLabel: '🌅 上午 (高效专注时段)',
    timeRange: '09:30 - 12:00',
    title: '学术研究与基础沉淀',
    tasks: [
      { time: '09:30 - 11:00', activity: '毕业论文撰写 / 神经网络映射模型训练' },
      { time: '11:00 - 12:00', activity: '力扣算法真题 / 计算机与大模型八股复盘' },
    ],
  },
  {
    id: 'tb-2',
    period: 'afternoon',
    periodLabel: '☀️ 下午 (求职与体能时段)',
    timeRange: '15:30 - 18:00',
    title: '秋招推进与身体力量',
    tasks: [
      { time: '15:30 - 17:00', activity: '秋招企业投递 / 面试复盘 / 笔试准备' },
      { time: '17:00 - 18:00', activity: '健身房力量锻炼 (肩/胸/背/腿/核心轮换)' },
    ],
  },
  {
    id: 'tb-3',
    period: 'evening',
    periodLabel: '🌙 晚上 (实验与复盘时段)',
    timeRange: '19:00 - 23:00',
    title: '大系统开发与睡前沉淀',
    tasks: [
      { time: '19:00 - 20:30', activity: '全工序机械化施工大系统研发 (装备/工法/支护/Agent)' },
      { time: '20:30 - 23:00', activity: '当日工作台复盘 / 灵感速记 / 阅读《当下的力量》' },
    ],
  },
]

export const INITIAL_NOTES: QuickCaptureNote[] = [
  {
    id: 'note-1',
    content: '导师指导要点：硕士论文核心是构建高维非线性映射神经网络，找到地质参数、围岩等级与支护参数及结构安全性之间的本质对应关系，并在机械化大系统中落地。',
    createdAt: '2026-09-02 10:00',
    tags: ['导师意见', '核心算法'],
  },
  {
    id: 'note-2',
    content: '大系统架构设计备忘：整个机械化施工大系统需要包含装备配置、工法选配、支护参数配置等子系统，并无缝接入 Agentic RAG 专业知识库和工程智能体。',
    createdAt: '2026-09-03 09:30',
    tags: ['系统工程', '智能体'],
  },
]
