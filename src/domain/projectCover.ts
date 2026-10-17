import type { ReferenceImage, VlogProject } from './schemas/project';

const TRANSPORT_IMAGE = /机场|空港|车站|站台|电车|列车|铁道|鉄道|出口|返程|交通|airport|station|platform|train|rail/i;

const LANDMARK_WEIGHTS: ReadonlyArray<readonly [RegExp, number]> = [
  [/天际线|skyline/i, 30],
  [/寺|神社|temple|shrine/i, 24],
  [/城|城堡|castle/i, 22],
  [/塔|夜景|地标|tower|night view|landmark/i, 20],
  [/中华街|老街|古街|chinatown|old town/i, 16],
  [/海|港|水岸|海岸|waterfront|harbou?r|coast/i, 14],
  [/公园|庭园|花园|park|garden/i, 12],
  [/历史建筑|古建筑|historic/i, 10],
  [/表参道|街道|街区|步道|avenue|street/i, 8],
];

function landmarkScore(text: string): number {
  return LANDMARK_WEIGHTS.reduce((score, [pattern, weight]) => score + (pattern.test(text) ? weight : 0), 0);
}

export function selectProjectCover(project: VlogProject): ReferenceImage | undefined {
  const middle = (project.sections.length - 1) / 2;
  const candidates = project.sections.flatMap((section, sectionIndex) => section.referenceImages.map((image) => {
    const text = `${section.title} ${image.caption}`;
    const transportPenalty = TRANSPORT_IMAGE.test(text) ? 60 : 0;
    const centrality = Math.max(0, 4 - Math.abs(sectionIndex - middle));
    return { image, score: landmarkScore(text) + centrality - transportPenalty };
  }));

  return candidates.sort((a, b) => b.score - a.score)[0]?.image;
}

export function projectCoverLabel(image: ReferenceImage): string {
  return image.caption.split(/[：:]/, 1)[0]?.trim() || image.caption;
}
