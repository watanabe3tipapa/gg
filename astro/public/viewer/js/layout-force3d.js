// layout-force3d.js — 力指向3Dレイアウト

export class LayoutForce3D {
  constructor() {
    this.iterations = 300;
    this.repulsion = 2.0;
    this.attraction = 0.01;
    this.damping = 0.9;
    this.centerGravity = 0.005;
  }

  compute(data) {
    const positions = new Map();
    const velocities = new Map();
    const n = data.nodes.length;

    data.nodes.forEach((node, i) => {
      const angle = (i / n) * Math.PI * 2;
      const r = Math.sqrt(n) * 0.5;
      positions.set(node.id, {
        x: Math.cos(angle) * r + (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 2,
        z: Math.sin(angle) * r + (Math.random() - 0.5) * 0.5,
      });
      velocities.set(node.id, { x: 0, y: 0, z: 0 });
    });

    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));

    for (let iter = 0; iter < this.iterations; iter++) {
      const forces = new Map();
      data.nodes.forEach(n => forces.set(n.id, { x: 0, y: 0, z: 0 }));

      for (let i = 0; i < data.nodes.length; i++) {
        for (let j = i + 1; j < data.nodes.length; j++) {
          const a = data.nodes[i];
          const b = data.nodes[j];
          const pa = positions.get(a.id);
          const pb = positions.get(b.id);
          const dx = pb.x - pa.x;
          const dy = pb.y - pa.y;
          const dz = pb.z - pa.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;
          const force = this.repulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          const fz = (dz / dist) * force;
          const fa = forces.get(a.id);
          const fb = forces.get(b.id);
          fa.x -= fx; fa.y -= fy; fa.z -= fz;
          fb.x += fx; fb.y += fy; fb.z += fz;
        }
      }

      data.links.forEach(link => {
        const a = nodeMap.get(link.source);
        const b = nodeMap.get(link.target);
        if (!a || !b) return;
        const pa = positions.get(a.id);
        const pb = positions.get(b.id);
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dz = pb.z - pa.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;
        const force = dist * this.attraction;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;
        const fa = forces.get(a.id);
        const fb = forces.get(b.id);
        fa.x += fx; fa.y += fy; fa.z += fz;
        fb.x -= fx; fb.y -= fy; fb.z -= fz;
      });

      data.nodes.forEach(node => {
        const pos = positions.get(node.id);
        const vel = velocities.get(node.id);
        const force = forces.get(node.id);

        vel.x = (vel.x + force.x) * this.damping;
        vel.y = (vel.y + force.y) * this.damping;
        vel.z = (vel.z + force.z) * this.damping;

        pos.x += vel.x;
        pos.y += vel.y;
        pos.z += vel.z;

        pos.x -= pos.x * this.centerGravity;
        pos.y -= pos.y * this.centerGravity;
        pos.z -= pos.z * this.centerGravity;
      });
    }

    return positions;
  }
}
