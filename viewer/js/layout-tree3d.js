// layout-tree3d.js — 階層ツリー3Dレイアウト

export class LayoutTree3D {
  constructor() {
    this.levelSpacing = 3.0;
    this.siblingSpacing = 1.5;
    this.subtreeSpacing = 0.8;
  }

  compute(data) {
    const positions = new Map();
    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));
    const childrenMap = new Map();
    const parentMap = new Map();

    data.nodes.forEach(n => childrenMap.set(n.id, []));
    data.links.forEach(link => {
      if (childrenMap.has(link.source)) {
        childrenMap.get(link.source).push(link.target);
        parentMap.set(link.target, link.source);
      }
    });

    const roots = data.nodes.filter(n => !parentMap.has(n.id));
    if (roots.length === 0 && data.nodes.length > 0) {
      roots.push(data.nodes[0]);
    }

    const subtreeWidths = new Map();
    this.computeSubtreeWidths(roots[0]?.id, childrenMap, subtreeWidths);

    let xOffset = 0;
    roots.forEach(root => {
      this.layoutNode(root.id, 0, xOffset, childrenMap, subtreeWidths, positions);
      xOffset += (subtreeWidths.get(root.id) || 1) + this.subtreeSpacing;
    });

    this.centerTree(positions);

    return positions;
  }

  computeSubtreeWidths(nodeId, childrenMap, subtreeWidths) {
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) {
      subtreeWidths.set(nodeId, 1);
      return 1;
    }
    let total = 0;
    children.forEach(childId => {
      total += this.computeSubtreeWidths(childId, childrenMap, subtreeWidths);
    });
    total += (children.length - 1) * this.subtreeSpacing;
    subtreeWidths.set(nodeId, Math.max(total, 1));
    return Math.max(total, 1);
  }

  layoutNode(nodeId, depth, xOffset, childrenMap, subtreeWidths, positions) {
    const children = childrenMap.get(nodeId) || [];
    const subtreeWidth = subtreeWidths.get(nodeId) || 1;

    const x = xOffset + subtreeWidth / 2;
    const y = -depth * this.levelSpacing;
    const z = 0;

    positions.set(nodeId, { x, y, z });

    let childXOffset = xOffset;
    children.forEach(childId => {
      const childWidth = subtreeWidths.get(childId) || 1;
      this.layoutNode(childId, depth + 1, childXOffset, childrenMap, subtreeWidths, positions);
      childXOffset += childWidth + this.subtreeSpacing;
    });
  }

  centerTree(positions) {
    if (positions.size === 0) return;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    positions.forEach(pos => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    });
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    positions.forEach(pos => {
      pos.x -= centerX;
      pos.y -= centerY;
      pos.z = 0;
    });
  }
}
