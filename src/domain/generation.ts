export interface TripInput {
  destination: string;
  dateOrSeason: string;
  shootingWindow: string;
  origin: string;
  endLocation: string;
  targetVideoMinutes: number;
  equipment: string;
}

export function buildGenerationPrompt(input: TripInput): string {
  return `你是 TabiFrame AI 的旅行 Vlog 策划师。请为《一个人在日本散步》生成安静、舒缓、自然、第一人称观察视角的结构化拍摄计划。只输出一个 JSON 对象，不要 Markdown、HTML、脚本或解释。\n\n本次条件：\n${JSON.stringify(input, null, 2)}\n\n真实性与安全规则：\n1. 不得编造交通时刻、开放时间、现场状况、拍摄许可、图片 URL、作者或许可证。无法核实的事实写入 needsVerification；没有可靠图片时 referenceImages 必须为空数组。\n2. 路线按可执行顺序组织，考虑可用时间和移动；不要为了凑镜头编造场景。\n3. 每组镜头有稳定且唯一的 id、明确拍摄动作、正整数 clipCount 和 1–180 的 recordSeconds。\n4. 不拍陌生人特写；危险位置不要求行走运镜；室内或宗教仪式需先确认许可。\n5. 输出用于策划账本，不代表用户实际拍摄过任何视频。\n\nJSON 必须严格符合：\n{\n  "schemaVersion": 1,\n  "promptVersion": "prototype-v2.1",\n  "projectId": "小写字母数字与连字符组成的稳定ID",\n  "title": "一个人在日本散步 / 地点篇",\n  "destination": "目的地",\n  "shootDate": "YYYY-MM-DD或空字符串",\n  "season": "季节或日期说明（可省略）",\n  "shootWindow": "可用拍摄时间",\n  "origin": "出发位置（可省略）",\n  "endLocation": "结束位置（可省略）",\n  "camera": "设备说明或空字符串",\n  "orientation": "landscape",\n  "videoResolution": "可为空字符串",\n  "targetVideoMinutes": ${input.targetVideoMinutes},\n  "stylePresetId": "japan-solo-walk",\n  "sourceKind": "imported",\n  "notes": ["策划说明"],\n  "editingTimeline": [["00:00–00:40", "章节内容"]],\n  "sections": [{\n    "id": "section-id", "time": "时间段", "title": "段落标题", "subtitle": "本段目的与计划条数", "tip": "安全或现场提示",\n    "referenceImages": [],\n    "factChecks": [{"text": "需核实事项", "status": "needs-check"}],\n    "shots": [{"id":"shot-id","title":"镜头名","description":"具体站位、主体和拍法","clipCount":1,"recordSeconds":12,"priority":"must","completed":false}]\n  }],\n  "needsVerification": ["需要用户核实的事实"]\n}\n\n同一项目内 section id 和 shot id 不得重复。内容必须因目的地而具体变化；不要只替换标题。`;
}
