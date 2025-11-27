"use client";

import Plasma from './Plasma';

export default function PlasmaBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Plasma
        color="#ff4500"
        speed={0.3}
        direction="forward"
        scale={2.0}
        opacity={0.8}
        mouseInteractive={true}
      />
    </div>
  );
}

