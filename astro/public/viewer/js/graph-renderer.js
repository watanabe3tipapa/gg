// graph-renderer.js — Three.js 描画エンジン（InstancedMesh最適化）

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DEPTH_COLORS = {
  0: new THREE.Color('#6366f1'),
  1: new THREE.Color('#a78bfa'),
  2: new THREE.Color('#2dd4bf'),
  3: new THREE.Color('#fbbf24'),
};
const DEPTH_RADIUS = { 0: 0.4, 1: 0.25, 2: 0.18, 3: 0.12 };
const DEFAULT_COLOR = new THREE.Color('#6366f1');
const DEFAULT_RADIUS = 0.15;

export class GraphRenderer {
  constructor(containerId, canvasId) {
    this.container = document.getElementById(containerId);
    this.canvas = document.getElementById(canvasId);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
    this.supported = true;

    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x11141d, 1);
    } catch (err) {
      this.supported = false;
      this.renderer = null;
      console.warn('gg: WebGL is unavailable, 3D rendering disabled:', err.message);
    }

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.nodeMesh = null;
    this.lineMesh = null;
    this.nodeData = [];
    this.linkData = [];
    this.nodePositions = new Map();
    this.hoveredIndex = -1;
    this.selectedNode = null;
    this.onNodeClick = null;
    this.onNodeHover = null;

    if (!this.supported) return;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 1.2;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 500;

    this.setupLight();
    this.setupEvents();
    this.resize();
  }

  setupLight() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 20, 15);
    this.scene.add(dir);
  }

  setupEvents() {
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    if (!this.supported) return;
    this.renderer.setSize(rect.width, rect.height);
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animate();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    if (!this.supported) return;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  render(data, positions) {
    this.nodeData = data.nodes;
    this.linkData = data.links;
    this.nodePositions.clear();
    if (!this.supported) return;

    this.clearScene();

    const nodeCount = data.nodes.length;

    const geometry = new THREE.SphereGeometry(1, 16, 12);
    const material = new THREE.MeshPhongMaterial({ vertexColors: false });
    this.nodeMesh = new THREE.InstancedMesh(geometry, material, nodeCount);
    this.nodeMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(nodeCount * 3), 3
    );

    const dummy = new THREE.Object3D();
    data.nodes.forEach((node, i) => {
      const pos = positions.get(node.id) || { x: 0, y: 0, z: 0 };
      dummy.position.set(pos.x, pos.y, pos.z);
      const r = DEPTH_RADIUS[node.depth] || DEFAULT_RADIUS;
      dummy.scale.setScalar(r);
      dummy.updateMatrix();
      this.nodeMesh.setMatrixAt(i, dummy.matrix);

      const color = DEPTH_COLORS[node.depth] || DEFAULT_COLOR;
      this.nodeMesh.instanceColor.setXYZ(i, color.r, color.g, color.b);

      this.nodePositions.set(node.id, { index: i, x: pos.x, y: pos.y, z: pos.z, depth: node.depth });
    });

    this.nodeMesh.instanceMatrix.needsUpdate = true;
    this.nodeMesh.instanceColor.needsUpdate = true;
    this.scene.add(this.nodeMesh);

    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    data.links.forEach(link => {
      const from = positions.get(link.source);
      const to = positions.get(link.target);
      if (from && to) {
        linePositions.push(from.x, from.y, from.z, to.x, to.y, to.z);
      }
    });
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x484d5e, transparent: true, opacity: 0.25 });
    this.lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    this.scene.add(this.lineMesh);

    this.fitCamera(positions);
  }

  clearScene() {
    if (this.nodeMesh) { this.scene.remove(this.nodeMesh); this.nodeMesh.geometry.dispose(); }
    if (this.lineMesh) { this.scene.remove(this.lineMesh); this.lineMesh.geometry.dispose(); }
  }

  fitCamera(positions) {
    const box = new THREE.Box3();
    positions.forEach(pos => box.expandByPoint(new THREE.Vector3(pos.x, pos.y, pos.z || 0)));
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5;
    this.controls.target.copy(center);
    this.camera.position.set(center.x, center.y + distance * 0.3, center.z + distance);
    this.camera.lookAt(center);
    this.controls.update();
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.nodeMesh);

    if (intersects.length > 0) {
      const index = intersects[0].instanceId;
      if (index !== undefined && index !== this.hoveredIndex) {
        this.hoveredIndex = index;
        const node = this.nodeData[index];
        if (this.onNodeHover) this.onNodeHover(node, e);
        this.canvas.style.cursor = 'pointer';
      }
    } else {
      this.hoveredIndex = -1;
      this.canvas.style.cursor = 'grab';
    }
  }

  onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.nodeMesh);

    if (intersects.length > 0) {
      const index = intersects[0].instanceId;
      if (index !== undefined) {
        const node = this.nodeData[index];
        this.selectedNode = node;
        this.highlightNode(node);
        if (this.onNodeClick) this.onNodeClick(node);
      }
    }
  }

  highlightNode(center) {
    const neighborIds = new Set([center.id]);
    this.linkData.forEach(l => {
      if (l.source === center.id) neighborIds.add(l.target);
      if (l.target === center.id) neighborIds.add(l.source);
    });

    const dummy = new THREE.Object3D();
    this.nodeData.forEach((node, i) => {
      const pos = this.nodePositions.get(node.id);
      if (!pos) return;
      dummy.position.set(pos.x, pos.y, pos.z);
      const r = DEPTH_RADIUS[node.depth] || DEFAULT_RADIUS;
      if (neighborIds.has(node.id)) {
        dummy.scale.setScalar(node.id === center.id ? r * 1.4 : r);
      } else {
        dummy.scale.setScalar(r * 0.5);
      }
      dummy.updateMatrix();
      this.nodeMesh.setMatrixAt(i, dummy.matrix);
    });
    this.nodeMesh.instanceMatrix.needsUpdate = true;

    if (this.lineMesh) {
      const linePositions = this.lineMesh.geometry.attributes.position.array;
      const lineColors = [];
      for (let i = 0; i < linePositions.length; i += 6) {
        const fromId = this.findNodeByPos(linePositions[i], linePositions[i + 1], linePositions[i + 2]);
        const toId = this.findNodeByPos(linePositions[i + 3], linePositions[i + 4], linePositions[i + 5]);
        const isActive = fromId === center.id || toId === center.id;
        const c = isActive ? new THREE.Color('#6366f1') : new THREE.Color('#484d5e');
        lineColors.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
      this.lineMesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
      this.lineMesh.material.vertexColors = true;
      this.lineMesh.material.opacity = 0.5;
      this.lineMesh.material.needsUpdate = true;
    }
  }

  resetHighlight() {
    const dummy = new THREE.Object3D();
    this.nodeData.forEach((node, i) => {
      const pos = this.nodePositions.get(node.id);
      if (!pos) return;
      dummy.position.set(pos.x, pos.y, pos.z);
      const r = DEPTH_RADIUS[node.depth] || DEFAULT_RADIUS;
      dummy.scale.setScalar(r);
      dummy.updateMatrix();
      this.nodeMesh.setMatrixAt(i, dummy.matrix);
    });
    this.nodeMesh.instanceMatrix.needsUpdate = true;

    if (this.lineMesh) {
      this.lineMesh.geometry.deleteAttribute('color');
      this.lineMesh.material.vertexColors = false;
      this.lineMesh.material.opacity = 0.25;
      this.lineMesh.material.needsUpdate = true;
    }
  }

  findNodeByPos(x, y, z) {
    for (const [id, pos] of this.nodePositions) {
      if (Math.abs(pos.x - x) < 0.01 && Math.abs(pos.y - y) < 0.01 && Math.abs((pos.z || 0) - z) < 0.01) {
        return id;
      }
    }
    return null;
  }

  reset() {
    this.clearScene();
    this.nodeData = [];
    this.linkData = [];
    this.nodePositions.clear();
    this.selectedNode = null;
    this.hoveredIndex = -1;
  }
}
