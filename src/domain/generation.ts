export interface TripInput {
  destination: string;
  dateOrSeason: string;
  shootingWindow: string;
  origin: string;
  endLocation: string;
  targetVideoMinutes: number;
  equipment: string;
  contentFocus: string;
  avoidContent: string;
}

export function buildGenerationPrompt(input: TripInput): string {
  return `你是 TabiFrame AI 的旅行 Vlog 策划师。请根据下面的真实条件，生成一份安静、舒缓、自然、第一人称观察视角的旅行拍摄计划。只输出一个 JSON 对象，不要 Markdown 代码块、HTML、脚本、前后说明或提问。

本次条件：
${JSON.stringify(input, null, 2)}

真实性与安全规则：
1. 不得编造交通时刻、开放时间、现场状况、拍摄许可、图片 URL、作者或许可证。无法核实的事实写入 needsVerification；没有可靠图片时 referenceImages 必须为空数组。
2. factChecks 默认使用 needs-check。只有确有可靠 HTTPS 来源并给出 ISO 8601 核实时间时，才可使用 verified，同时提供 sourceUrl 与 checkedAt。
3. 按实际路线和时间自然分段，通常包括出发、沿途变化、核心段落、安静段落和返程；不适合时可以合并，不能机械套模板。
4. 每组镜头有稳定且唯一的 id、明确拍摄动作、正整数 clipCount 和 1–180 的 recordSeconds。
5. 不拍陌生人特写；危险位置不要求行走运镜；室内或宗教仪式需先确认许可。
6. 输出用于策划账本，不代表用户实际拍摄过任何视频。
7. 严格遵守 contentFocus 和 avoidContent；除非用户明确要求，不要自动加入美食、购物、网红打卡或室内消费场景。
8. 镜头数量必须在给定时间内实际可完成，优先少而清楚，不为凑数量重复同类镜头。
9. 每个路线分段优先提供 1 张确有来源、作者和许可证的 HTTPS 参考照片；无法可靠核实时该分段 referenceImages 留空，绝不能编造链接或署名。

JSON 必须严格符合：
{
  "schemaVersion": 1,
  "promptVersion": "prototype-v2.2",
  "projectId": "小写字母数字与连字符组成的稳定ID",
  "title": "简洁、具体的计划名称",
  "destination": "目的地",
  "shootDate": "YYYY-MM-DD或空字符串",
  "season": "季节或日期说明（可省略）",
  "shootWindow": "可用拍摄时间",
  "origin": "出发位置（可省略）",
  "endLocation": "结束位置（可省略）",
  "camera": "设备说明或空字符串",
  "orientation": "landscape",
  "videoResolution": "可为空字符串",
  "targetVideoMinutes": ${input.targetVideoMinutes},
  "stylePresetId": "japan-solo-walk",
  "sourceKind": "imported",
  "travelState": "planned",
  "travelReflection": "",
  "tags": ["地点或主题标签"],
  "notes": ["策划说明"],
  "editingTimeline": [["00:00–00:40", "章节内容"]],
  "sections": [{
    "id": "section-id", "time": "时间段", "title": "段落标题", "subtitle": "本段目的与计划条数", "tip": "安全或现场提示",
    "referenceImages": [],
    "factChecks": [{"text": "需核实事项", "status": "needs-check"}],
    "shots": [{"id":"shot-id","title":"镜头名","description":"具体站位、主体和拍法","clipCount":1,"recordSeconds":12,"priority":"must","completed":false}]
  }],
  "needsVerification": ["需要用户核实的事实"]
}

同一项目内 section id 和 shot id 不得重复。页面需要项目摘要、拍摄基础、分段说明、参考图、镜头清单、提示与剪映文字所需数据，但镜头数量必须由目的地、偏好和可用时间决定。内容必须因目的地而具体变化，不要只替换标题。`;
}
