import { TeaRecommendationId } from '@/lib/teaRecommendationContent';
import { readJson, writeJson } from './asyncStorage';

const TEA_BOX_KEY = '@wellness_tea_box_v1';

export async function loadTeaBox(): Promise<TeaRecommendationId[]> {
  return readJson<TeaRecommendationId[]>(TEA_BOX_KEY, []);
}

export async function saveTeaBox(teaIds: TeaRecommendationId[]): Promise<boolean> {
  return writeJson(TEA_BOX_KEY, teaIds);
}
