import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

interface DropZoneProps {
  onDrop?: () => void;
  children: React.ReactNode;
  id: string;
  style?: any;
}

export const DropZone: React.FC<DropZoneProps> = ({ onDrop, children, id, style }) => {
  const viewRef = useRef<View>(null);
  const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.measure((x, y, width, height, pageX, pageY) => {
        setLayout({ x: pageX, y: pageY, width, height });
      });
    }
  }, []);

  // Make layout and callback available globally for drag detection
  useEffect(() => {
    if (!global.dropZones) {
      global.dropZones = new Map();
    }
    global.dropZones.set(id, { layout, onDrop });

    return () => {
      global.dropZones?.delete(id);
    };
  }, [id, layout, onDrop]);

  return (
    <View
      ref={viewRef}
      style={style}
      onLayout={() => {
        if (viewRef.current) {
          viewRef.current.measure((x, y, width, height, pageX, pageY) => {
            setLayout({ x: pageX, y: pageY, width, height });
          });
        }
      }}
    >
      {children}
    </View>
  );
};

// Helper function to find which drop zone contains a point
export const findDropZone = (x: number, y: number): string | null => {
  if (!global.dropZones) return null;

  for (const [id, zone] of global.dropZones.entries()) {
    const { layout } = zone;
    if (
      x >= layout.x &&
      x <= layout.x + layout.width &&
      y >= layout.y &&
      y <= layout.y + layout.height
    ) {
      return id;
    }
  }

  return null;
};

// Helper function to trigger drop callback
export const triggerDrop = (zoneId: string) => {
  if (!global.dropZones) return;

  const zone = global.dropZones.get(zoneId);
  if (zone && zone.onDrop) {
    zone.onDrop();
  }
};

declare global {
  var dropZones: Map<string, { layout: { x: number; y: number; width: number; height: number }; onDrop?: () => void }>;
}
