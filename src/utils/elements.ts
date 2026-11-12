import { ElementType } from '../extensible/items/itemCatalog';

export interface ElementMeta {
  name: string;
  icon: string;
}

export const ELEMENT_META: Record<ElementType, ElementMeta> = {
  physical: { name: '物理', icon: '⚔️' },
  fire: { name: '炎', icon: '🔥' },
  ice: { name: '氷', icon: '❄️' },
  nature: { name: '自然', icon: '🌿' },
  void: { name: '虚空', icon: '🌀' },
};
