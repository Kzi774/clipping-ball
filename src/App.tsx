import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { useRef, useState } from "react";
import {
  SUBTRACTION,
  Brush,
  Evaluator,
} from "three-bvh-csg";
import "./App.css";

function CSGScene() {
  const baseBrushRef = useRef();
  const brushRef = useRef();
  const brushZRef = useRef();
  const wireframeRef = useRef();
  const [params] = useState({
    operation: SUBTRACTION,
    useGroups: true,
    wireframe: false,
  });

  const baseBrush = useRef(
    new Brush(
      new THREE.BoxGeometry(3, 3, 3),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        flatShading: true,
        transparent: true,
        opacity: 0.7,
      })
    )
  );

  const brush = useRef(
    new Brush(
      new THREE.SphereGeometry(1.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x80cbc4 })
    )
  );

  const brushZ = useRef(
    new Brush(
      new THREE.SphereGeometry(1.2, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x80cbc4 })
    )
  );

  const evaluatorRef = useRef(new Evaluator());
  const [result, setResult] = useState();

  const { scene } = useThree();

  useFrame(() => {
    const t = window.performance.now() * 0.001;

    const base = baseBrushRef.current;
    const brush = brushRef.current;
    const brushZ = brushZRef.current;
    const evaluator = evaluatorRef.current;

    if (!base || !brush) return;

    // 振り子運動
    const swing = Math.sin(t) * 3;
    brush.position.x = swing;
    brush.updateMatrixWorld();

    brushZ.position.z = Math.sin(t + Math.PI / 2) * 3;
    brushZ.updateMatrixWorld();

    if (result) {
      scene.remove(result);
      result.geometry.dispose();
      if (Array.isArray(result.material)) {
        result.material.forEach((m) => m.dispose());
      } else {
        result.material.dispose();
      }
    }

    evaluator.useGroups = params.useGroups;
    const csgResult = evaluator.evaluate(base, brush, params.operation);
    csgResult.castShadow = true;
    csgResult.receiveShadow = true;
    scene.add(csgResult);

    if (wireframeRef.current) {
      wireframeRef.current.geometry = csgResult.geometry;
      wireframeRef.current.visible = params.wireframe;
    }

    setResult(csgResult);
  });

  return (
    <>
      <ambientLight intensity={3} />
      <directionalLight position={[3, 12, 9]} intensity={0.3} castShadow />
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial transparent opacity={0.075} color={0xd81b60} />
      </mesh>

      <primitive object={baseBrush.current} ref={baseBrushRef} />
      <primitive object={brush.current} ref={brushRef} />
      <primitive object={brushZ.current} ref={brushZRef} />

      <mesh ref={wireframeRef}>
        <meshBasicMaterial color={0x009688} wireframe />
      </mesh>
    </>
  );
}

export default function App() {
  return (
    <>
      <div className="canvas-wrapper">
        <Canvas shadows camera={{ position: [8, 5, 10], fov: 50 }}>
          <CSGScene />
          <OrbitControls minDistance={5} maxDistance={75} />
          <Stats />
        </Canvas>
      </div>
    </>
  );
}
