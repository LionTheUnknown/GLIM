"use client";

import Plasma from './Plasma';

export default function PlasmaBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        width: '100%',
        height: '100%',
      }}
    >
      <Plasma
        color="#ff4500"
        speed={0.2}
        direction="forward"
        scale={1.5}
        opacity={0.4}
        mouseInteractive={false}
      />
    </div>
  );
}

