"use client";

import { useCallback, useState, WheelEvent } from "react";
import { Memo } from "./memo.component";

const numOfLevels = 8;
const maxScale = 8;
const minScale = maxScale / numOfLevels;

/**
 * The Whiteboard. Memo들의 집합.
 * 확대 이동 등의 기능 제공.
 * @returns
 */
export const Board = function () {
  const [scaleLevel, setScaleLevel] = useState(4);
  const [scale, setScale] = useState(scaleLevel * minScale);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  /** Board 영역을 확대/축소 */
  const handleOnWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.ctrlKey) {
        return;
      }

      let newLevel = scaleLevel;
      newLevel += event.deltaY < 0 ? 1 : -1;

      // ScaleLevel 범위 제한
      newLevel = Math.min(Math.max(1, newLevel), numOfLevels);

      setScaleLevel(newLevel);
      setScale(newLevel * minScale);
    },
    [scaleLevel]
  );

  return (
    <div
      className="absolute z-0 h-screen w-screen bg-sky-500 transition-transform"
      onWheel={handleOnWheel}
      onMouseMove={(event) => {
        setMouseX(event.clientX);
        setMouseY(event.clientY);
      }}
      style={{
        transform: `scale(${scale})`,
      }}
    >
      <div className="fixed left-1/2 top-96 z-50 text-9xl">{scaleLevel}</div>
      <Memo />
    </div>
  );
};
