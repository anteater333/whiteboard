"use client";

/**
 * The Whiteboard Core Component
 */

import {
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  WheelEvent,
} from "react";
import {
  AddButton,
  OnGoingMemoButton,
  PositionConfirmButton,
} from "./buttons.component";
import { Memo, memoHeight, memoWidth } from "./memo.component";
import { motion } from "framer-motion";
import { MemoEditModal } from "./modal.component";
import { MemoType } from "@/types/types";

const boardWidth = memoWidth * 10;
const boardHeight = memoHeight * 7.5;

const borderPadding = 32;

const numOfLevels = 8;
const maxScale = 8;
const minScale = maxScale / numOfLevels;

/**
 * The Whiteboard. Memo들의 집합.
 * 확대 이동 등의 기능 제공.
 * @returns
 */
export const Board = function () {
  const boardRef = useRef<HTMLDivElement | null>(null);

  const [scaleLevel, setScaleLevel] = useState(1);
  const [scale, setScale] = useState(scaleLevel * minScale);
  const [posX, setPosX] = useState(-(borderPadding / 2));
  const [posY, setPosY] = useState(-(borderPadding / 2));
  const [startMouseX, setStartMouseX] = useState(0);
  const [startMouseY, setStartMouseY] = useState(0);

  const [isDragging, setIsDragging] = useState(false);

  const [showAddList, setShowAddList] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // #region For posting mode
  const [editingMemo, setEditingMemo] = useState<Partial<MemoType>>({});
  const [editingMemoPosX, setEditingMemoPosX] = useState(0);
  const [editingMemoPosY, setEditingMemoPosY] = useState(0);
  const [isPostingMode, setIsPostingMode] = useState(false);
  /** Posting Mode에서 화면 고정 여부 */
  const [isBoardFixed, setIsBoardFixed] = useState(false);
  /** 화면 고정 이후 메모 위치 선택 여부 */
  const [isMemoPasted, setIsMemoPasted] = useState(false);

  /** Posting mode에서 사용하는 자리잡기 용도 메모 컴포넌트 */
  const EditingMemoComponent = useMemo(() => {
    if (!isPostingMode) return;

    return (
      <Memo
        memo={{
          positionX: editingMemoPosX,
          positionY: editingMemoPosY,
          votes: [],
          referencedMemo: [],
          ...editingMemo,
        }}
        isPostingMode={true}
        isBoardFixed={isBoardFixed}
        isMemoPasted={isMemoPasted}
        onPasted={() => {
          if (isMemoPasted) {
            setIsMemoPasted(false);
            return;
          }
          setIsMemoPasted(true);
        }}
      />
    );
  }, [
    editingMemo,
    isPostingMode,
    isBoardFixed,
    editingMemoPosX,
    editingMemoPosY,
    isMemoPasted,
  ]);

  /** 메모 입력 확인 시 Posting mode 진입 */
  useEffect(() => {
    setIsPostingMode(!!editingMemo.content);
  }, [editingMemo.content]);

  /** Posting mode에서 board에 점선 표시 */
  const BoardGrid = useMemo(() => {
    if (!isPostingMode) return;

    return (
      <>
        <>
          {/* 세로줄 */}
          {Array(10 * 4)
            .fill(0)
            .map((_, idx) => {
              return (
                <div
                  key={`grid-vertical-${idx}`}
                  className="absolute border-stone-300"
                  style={{
                    left: `${(memoWidth / 4) * idx}px`,
                    width: `${memoWidth / 4}px`,
                    height: `${boardHeight}px`,
                    borderStyle: idx % 4 === 3 ? `solid` : `dashed`,
                    borderRightWidth: idx % 4 === 3 ? `2px` : `1px`,
                  }}
                />
              );
            })}
          {/* 가로줄 */}
          {Array(7.25 * 4)
            .fill(0)
            .map((_, idx) => {
              return (
                <div
                  key={`grid-horizontal-${idx}`}
                  className="absolute border-stone-300"
                  style={{
                    top: `${(memoHeight / 4) * idx}px`,
                    width: `${boardWidth}px`,
                    height: `${memoHeight / 4}px`,
                    borderStyle: idx % 4 === 3 ? `solid` : `dashed`,
                    borderBottomWidth: idx % 4 === 3 ? `2px` : `1px`,
                  }}
                />
              );
            })}
        </>
      </>
    );
  }, [isPostingMode]);

  const handlePositionOnPostingMode = useCallback(
    (event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
      if (!isPostingMode || isMemoPasted) {
        return;
      }

      const bounds = event.currentTarget.getBoundingClientRect();
      const mouseX =
        event.clientX / scale - bounds.left / scale - memoWidth / 3;
      const mouseY =
        event.clientY / scale - bounds.top / scale - memoHeight / 8;

      const factorX = memoWidth / 4;
      const factorY = memoHeight / 4;

      const posX = factorX * Math.floor(mouseX / factorX);
      const posY = factorY * Math.floor(mouseY / factorY);

      setEditingMemoPosX(posX);
      setEditingMemoPosY(posY);
    },
    [scale, isPostingMode, isMemoPasted]
  );

  /** Posting Mode 종료 */
  const quitPostingMode = useCallback(() => {
    setEditingMemo({});
    setIsBoardFixed(false);
    setIsPostingMode(false);
    setIsMemoPasted(false);
  }, []);

  /** + 버튼을 눌렀을 때의 행동 */
  const handleOnAddButton = useCallback(() => {
    if (!isPostingMode) setShowAddList(!showAddList);
    else if (confirm("작성 중인 메모가 지워집니다.")) {
      quitPostingMode();
    }
  }, [isPostingMode, quitPostingMode, showAddList]);

  /** Posting Mode에서 화면 하단 중앙의 확인 버튼의 행동 */
  const handleOnConfirmButton = useCallback(() => {
    if (!isBoardFixed) {
      // 화면 고정
      setIsDragging(false);
      setIsBoardFixed(true);
    } else if (isMemoPasted) {
      // 메모 위치 고정까지 완료됨
      // TBD : ★ 서버에 메모 저장 로직 ★
      if (!confirm("제출하시겠습니까?")) return;
      alert("posted!");
      quitPostingMode();
      // 이상 임시 동작 처리, 새로고침 해버려도 좋음
    } else {
      // 화면 고정 해제
      setIsBoardFixed(false);
    }
  }, [isBoardFixed, isMemoPasted, quitPostingMode]);
  // #endregion

  // #region Board 이동&확대 관련
  /** 1단계 확대 */
  const scaleUp = useCallback(() => {
    if (scaleLevel >= maxScale || isPostingMode) {
      return;
    }

    const newScale = scaleLevel + 1;
    boardRef.current?.classList.add("transition-transform");
    setScale(newScale * minScale);
    setScaleLevel(newScale);
    boardRef.current?.focus();
  }, [scaleLevel, isPostingMode]);

  /** 1단계 축소 */
  const scaleDown = useCallback(() => {
    if (scaleLevel <= 1 || isPostingMode) {
      return;
    }

    const newScale = scaleLevel - 1;
    boardRef.current?.classList.add("transition-transform");
    setScale(newScale * minScale);
    setScaleLevel(newScale);
    boardRef.current?.focus();
  }, [scaleLevel, isPostingMode]);

  /** Board 이동/확대 초기화 */
  const resetBoard = useCallback(() => {
    setScale(1);
    setScaleLevel(1);
    setPosX(0);
    setPosY(0);
    setIsDragging(false);
    boardRef.current?.focus();
  }, []);

  /** Posting mode 진입 시 화면 확대 초기화 및 고정 */
  useEffect(() => {
    if (isPostingMode) resetBoard();
  }, [isPostingMode, resetBoard]);

  /** Board 영역에 대한 Wheel 행동 처리 */
  const handleBoardOnWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.ctrlKey) {
        return;
      }

      if (event.deltaY < 0) scaleUp();
      else scaleDown();
    },
    [scaleDown, scaleUp]
  );

  const handleBoardOnKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      switch (event.code) {
        case "ArrowLeft":
          setPosX((prev) => prev + 96 / scale);
          break;
        case "ArrowRight":
          setPosX((prev) => prev - 96 / scale);
          break;
        case "ArrowUp":
          setPosY((prev) => prev + 96 / scale);
          break;
        case "ArrowDown":
          setPosY((prev) => prev - 96 / scale);
          break;
        case "Space":
          if (!isPostingMode) return;
          handleOnConfirmButton();
          break;
      }
    },
    [scale, isPostingMode, handleOnConfirmButton]
  );

  const handleBoardOnMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
      if (isBoardFixed) return;

      boardRef.current?.classList.remove("transition-transform");

      setStartMouseX(event.clientX);
      setStartMouseY(event.clientY);
      setIsDragging(true);
    },
    [isBoardFixed]
  );

  const handleBoardOnMouseUp = useCallback(() => {
    setIsDragging(false);
    setShowAddList(false);
  }, []);

  const handleBoardOnMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
      if (!isDragging) {
        return;
      }

      setPosX((prev) => {
        return prev - (startMouseX - event.clientX) / scaleLevel;
      });
      setPosY((prev) => {
        return prev - (startMouseY - event.clientY) / scaleLevel;
      });

      setStartMouseX(event.clientX);
      setStartMouseY(event.clientY);
    },
    [isDragging, scaleLevel, startMouseX, startMouseY]
  );

  /** 이동 범위 제한 */
  useEffect(() => {
    if (isDragging) return;

    const timeoutId = setTimeout(() => {
      boardRef.current?.classList.add("transition-transform");

      const margin = 48 / scale;

      // 좌/상단 제한 수치
      const positiveXThreshold =
        (boardWidth * (scale - 1)) / (2 * scale) + margin;
      const positiveYThreshold =
        (boardHeight * (scale - 1)) / (2 * scale) + margin;

      // 우/하단 제한 수치
      const negativeXThreshold =
        window.innerWidth / scale -
        (boardWidth * (scale + 1)) / (2 * scale) -
        margin -
        borderPadding;
      const negativeYThreshold =
        window.innerHeight / scale -
        (boardHeight * (scale + 1)) / (2 * scale) -
        112 / scale - // Header/Footer 높이 감안
        margin -
        borderPadding;

      if (posX > positiveXThreshold) {
        setPosX(positiveXThreshold);
      }
      if (posY > positiveYThreshold) {
        setPosY(positiveYThreshold);
      }
      if (posX < negativeXThreshold) {
        setPosX(negativeXThreshold);
      }
      if (posY < negativeYThreshold) {
        setPosY(negativeYThreshold);
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [posX, posY, scale, isDragging]);
  // #endregion

  return (
    <>
      {/* <div id="debugger" className="fixed left-1/2 top-1/2 z-50 text-5xl">
        <div className="">{`${posX.toFixed(2)}, ${posY.toFixed(2)}`}</div>
        <div>{`${scale.toFixed(2)}`}</div>
        <div>{`${JSON.stringify(editingMemo)}`}</div>
      </div> */}

      {/* 새 메모 입력 모달 */}
      <MemoEditModal
        visibilityState={[showEditModal, setShowEditModal]}
        memoObjectState={[editingMemo, setEditingMemo]}
      />

      {/* 메모 추가 관련 버튼 */}
      <>
        <div className="absolute bottom-6 right-4 z-40 flex w-fit flex-col items-end">
          {showAddList ? (
            <AddMemoList
              onSelected={(selected) => {
                // 새 메모 작성에 돌입.
                setEditingMemo({ memoType: selected });
                setShowEditModal(true);
                setShowAddList(false);
              }}
            />
          ) : undefined}
          <AddButton
            isActive={showAddList || isPostingMode}
            onClick={handleOnAddButton}
          />
        </div>
        <div className="absolute bottom-6 left-4 z-40 w-fit">
          {editingMemo.content ? (
            <OnGoingMemoButton
              onClick={() => {
                setShowAddList(false);
                setShowEditModal(true);
              }}
            />
          ) : undefined}
        </div>

        {isPostingMode ? (
          <div className="absolute bottom-6 left-0 right-0 z-30 mx-auto w-44">
            <PositionConfirmButton
              texts={{
                keyText: "space",
                state1Text: "화면 고정",
                state2Text:
                  isBoardFixed && isMemoPasted ? "Post-it!" : "고정 취소",
              }}
              isActive={!isBoardFixed}
              onClick={handleOnConfirmButton}
            />
          </div>
        ) : undefined}
      </>

      {isBoardFixed ? undefined : (
        <div
          id="board-controller-container"
          className="absolute right-4 top-2 z-40 flex flex-col text-center font-galmuri text-2xl font-bold"
        >
          <button onClick={() => scaleUp()}>+</button>
          <label className="pb-1 pt-2 text-base">{scaleLevel}</label>
          <button onClick={() => scaleDown()}>-</button>
          <button className="mt-1" onClick={resetBoard}>
            ↻
          </button>
        </div>
      )}
      <div
        id="board"
        tabIndex={1}
        ref={boardRef}
        className="absolute z-0 flex items-center justify-center rounded-lg bg-stone-100 shadow-circle outline-none transition-transform"
        onWheel={handleBoardOnWheel}
        onMouseDown={handleBoardOnMouseDown}
        onMouseUp={handleBoardOnMouseUp}
        onMouseMove={handleBoardOnMouseMove}
        onKeyDown={handleBoardOnKeyDown}
        style={{
          width: `${boardWidth + borderPadding}px`,
          height: `${boardHeight + borderPadding}px`,
          transform: `scale(${scale}) translate(${posX}px, ${posY}px)`,
        }}
      >
        <div
          className="relative overflow-hidden rounded-lg border-2 border-stone-300 bg-stone-100"
          onMouseMove={handlePositionOnPostingMode}
          style={{ width: `${boardWidth}px`, height: `${boardHeight}px` }}
        >
          <>
            {BoardGrid}
            {EditingMemoComponent}

            {/* 이하 테스트 데이터 */}
            <Memo
              memo={{
                user: {
                  nickname: "Tester",
                },
                memoType: 0,
                title: "Title, Deprecated.",
                content:
                  "신新 제논의 역설\n\n일을 끝마칠 때가 가까워 올 수록 진행속도가 느려지는 현상",
                createdAt: Date().toString(),
                votes: [],
                referencedMemo: [],
                positionX: 0,
                positionY: 0,
              }}
            />
            <Memo
              memo={{
                user: {
                  nickname: "Tester",
                },
                memoType: 0,
                title: "Title, Deprecated.",
                content:
                  "신新 제논의 역설\n\n일을 끝마칠 때가 가까워 올 수록 진행속도가 느려지는 현상\n\n신新 제논의 역설\n\n일을 끝마칠 때가 가까워 올 수록 진행속도가 느려지는 현상",
                createdAt: Date().toString(),
                votes: [],
                referencedMemo: [],
                positionX: memoWidth,
                positionY: memoHeight,
              }}
            />
            <Memo
              memo={{
                user: {
                  nickname: "Tester",
                },
                memoType: 0,
                title: "Title, Deprecated.",
                content:
                  "신新 제논의 역설\n\n일을 끝마칠 때가 가까워 올 수록 진행속도가 느려지는 현상\n\n신新 제논의 역설\n\n일을 끝마칠 때가 가까워 올 수록 진행속도가 느려지는 현상",
                createdAt: Date().toString(),
                votes: [],
                referencedMemo: [],
                positionX: memoWidth,
                positionY: 0,
              }}
            />
            <Memo
              memo={{
                user: {
                  nickname: "Tester",
                },
                memoType: 0,
                title: "Title, Deprecated.",
                content:
                  "test\n신新 제논의 역설\n\n일을 끝마칠 때가sfsafasfasfsaf 가까워 올 수록 진행속도가 느려지는 현상\n\n신新 제논의 역설\n일을 끝afsafajdsfjlkdsajflksaㄻㅇ니ㅏㄹ멍ㄴ리ㅏㅁㅇ너ㅣㅏㄻ너리ㅏㅁ너리ㅏㅇㄴ머ㅣㅏㄹㅇㄴ머ㅣㅏㄹㅇㄴ머ㅣㅏ렁ㄴ미ㅏ런미ㅏ렁ㄴ미ㅏㄹ마칠 때가 가까워 올 수록 진행속\n도가 느려지는 adsfasfa 현상afdf",
                createdAt: Date().toString(),
                votes: [],
                referencedMemo: [],
                positionX: 0,
                positionY: memoHeight,
              }}
            />
            <Memo
              memo={{
                user: {
                  nickname: "Tester",
                },
                memoType: 1,
                content:
                  "신新 제논의 역설\n일을 끝마칠 때가 가까워 올 수록 진행속도가 느려지는 현상 가나다라 마바사 아자차카타파하 아야어여오요우유\ntest",
                createdAt: Date().toString(),
                votes: [],
                referencedMemo: [],
                positionX: 200,
                positionY: memoHeight * 2.5,
              }}
            />
            <Memo
              memo={{
                user: {
                  nickname: "Tester",
                },
                memoType: 1,
                content:
                  "신新 제논의 역설\n일을 끝마칠 때가 가까워 올 수록 진행속도가 느려지는 현상 가나다라 마바사 아자차카타파하 아야어여오요우유\ntest",
                createdAt: Date().toString(),
                votes: [],
                referencedMemo: [],
                positionX: 0,
                positionY: memoHeight * 2.5,
              }}
            />
          </>
        </div>
      </div>
    </>
  );
};

type AddMemoListProp = {
  onSelected: (selected: number) => void;
};

const AddMemoList = function ({ onSelected }: AddMemoListProp) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.15 }}
      className="mb-4 flex w-[11.5rem] flex-col rounded-md bg-white p-2 font-galmuri text-lg text-black shadow-circle"
    >
      <button
        onClick={() => {
          onSelected(1);
        }}
        className="mb-1 select-none border-b-2 border-gray-100 py-1 text-right"
      >
        짧은 텍스트 메모
      </button>
      <button
        onClick={() => {
          onSelected(0);
        }}
        className="select-none py-1 text-right"
      >
        텍스트 메모
      </button>
    </motion.div>
  );
};
