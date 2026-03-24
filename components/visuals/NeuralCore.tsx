'use client';

import dynamic from 'next/dynamic';

const NeuralCoreScene = dynamic(() => import('@/components/visuals/NeuralCoreScene').then((m) => m.NeuralCoreScene), {
  ssr: false,
  loading: () => <div className="scene-loading">Loading 3D runtime simulation...</div>,
});

export function NeuralCore() {
  return <NeuralCoreScene />;
}
