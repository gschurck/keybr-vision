import { type KeyId, useKeyboard } from "@keybr/keyboard";
import { type Result } from "@keybr/result";
import { type LineList } from "@keybr/textinput";
import { addKey, deleteKey, emulateLayout } from "@keybr/textinput-events";
import { makeSoundPlayer } from "@keybr/textinput-sounds";
import {
  useDocumentEvent,
  useHotkeys,
  useTimeout,
  useWindowEvent,
} from "@keybr/widget";
import { memo, type ReactNode, useMemo, useRef, useState } from "react";
import { Presenter } from "./Presenter.tsx";
import {
  CalibrationState,
  type LastLesson,
  LessonState,
  makeLastLesson,
  type Progress,
} from "./state/index.ts";

export const Controller = memo(function Controller({
  progress,
  onResult,
}: {
  readonly progress: Progress;
  readonly onResult: (result: Result) => void;
}): ReactNode {
  const [isCalibrated, setIsCalibrated] = useState(false);
  const {
    state,
    handleResetLesson,
    handleSkipLesson,
    handleKeyDown,
    handleKeyUp,
    handleInput,
  } = useLessonState(progress, onResult);
  const {
    calibrationState,
    handleResetCalibration,
    handleSkipCalibration,
    handleCalibrationKeyDown,
    handleCalibrationKeyUp,
    handleCalibrationInput,
  } = useCalibrationState(progress, onResult);
  useHotkeys({
    ["Ctrl+ArrowLeft"]: handleResetLesson,
    ["Ctrl+ArrowRight"]: handleSkipLesson,
    ["Escape"]: handleResetLesson,
  });
  useWindowEvent("focus", handleResetLesson);
  useWindowEvent("blur", handleResetLesson);
  useDocumentEvent("visibilitychange", handleResetLesson);
  if (isCalibrated) {
  return (
    <Presenter
      state={state}
      lines={state.lines}
      depressedKeys={state.depressedKeys}
      onResetLesson={handleResetLesson}
      onSkipLesson={handleSkipLesson}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onInput={handleInput}
    />
  );
  } else {
    return (
      <Presenter
        state={calibrationState}
        lines={calibrationState.lines}
        depressedKeys={calibrationState.depressedKeys}
        onResetLesson={handleResetCalibration}
        onSkipLesson={handleSkipCalibration}
        onKeyDown={handleCalibrationKeyDown}
        onKeyUp={handleCalibrationKeyUp}
        onInput={handleCalibrationInput}
      />
    );
  }
});

function useLessonState(
  progress: Progress,
  onResult: (result: Result) => void,
) {
  const keyboard = useKeyboard();
  const timeout = useTimeout();
  const [key, setKey] = useState(0); // Creates new LessonState instances.
  const [, setLines] = useState<LineList>({ text: "", lines: [] }); // Forces UI update.
  const [, setDepressedKeys] = useState<readonly KeyId[]>([]); // Forces UI update.
  const lastLessonRef = useRef<LastLesson | null>(null);

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  return useMemo(() => {
    // New lesson.
    const state = new LessonState(progress, (result, textInput) => {
      setKey(key + 1);
      lastLessonRef.current = makeLastLesson(result, textInput.steps);
      onResultRef.current(result);
    });
    state.lastLesson = lastLessonRef.current;
    setLines(state.lines);
    setDepressedKeys(state.depressedKeys);
    const handleResetLesson = () => {
      state.resetLesson();
      setLines(state.lines);
      setDepressedKeys((state.depressedKeys = []));
      timeout.cancel();
    };
    const handleSkipLesson = () => {
      state.skipLesson();
      setLines(state.lines);
      setDepressedKeys((state.depressedKeys = []));
      timeout.cancel();
    };
    const playSounds = makeSoundPlayer(state.settings);
    const { onKeyDown, onKeyUp, onInput } = emulateLayout(
      state.settings,
      keyboard,
      {
        onKeyDown: (event) => {
          setDepressedKeys(
            (state.depressedKeys = addKey(state.depressedKeys, event.code)),
          );
        },
        onKeyUp: (event) => {
          setDepressedKeys(
            (state.depressedKeys = deleteKey(state.depressedKeys, event.code)),
          );
        },
        onInput: (event) => {
          // state.lastLesson = null;
          // const feedback = state.onInput(event);
          // setLines(state.lines);
          // playSounds(feedback);
          // timeout.schedule(handleResetLesson, 10000);
        },
      },
    );
    return {
      state,
      handleResetLesson,
      handleSkipLesson,
      handleKeyDown: onKeyDown,
      handleKeyUp: onKeyUp,
      handleInput: onInput,
    };
  }, [progress, keyboard, timeout, key]);
}

function useCalibrationState(
  progress: Progress,
  onResult: (result: Result) => void,
) {
  const keyboard = useKeyboard();
  const timeout = useTimeout();
  const [key, setKey] = useState(0); // Creates new LessonState instances.
  const [, setLines] = useState<LineList>({ text: "", lines: [] }); // Forces UI update.
  const [, setDepressedKeys] = useState<readonly KeyId[]>([]); // Forces UI update.
  const lastLessonRef = useRef<LastLesson | null>(null);

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  return useMemo(() => {
    // New lesson.
    const state = new CalibrationState(progress, (result, textInput) => {
      setKey(key + 1);
      lastLessonRef.current = makeLastLesson(result, textInput.steps);
      onResultRef.current(result);
    });
    state.lastLesson = lastLessonRef.current;
    setLines(state.lines);
    setDepressedKeys(state.depressedKeys);
    const handleResetCalibration = () => {
      state.resetLesson();
      setLines(state.lines);
      setDepressedKeys((state.depressedKeys = []));
      timeout.cancel();
    };
    const handleSkipCalibration = () => {
      state.skipLesson();
      setLines(state.lines);
      setDepressedKeys((state.depressedKeys = []));
      timeout.cancel();
    };
    const playSounds = makeSoundPlayer(state.settings);
    const { onKeyDown, onKeyUp, onInput } = emulateLayout(
      state.settings,
      keyboard,
      {
        onKeyDown: (event) => {
          setDepressedKeys(
            (state.depressedKeys = addKey(state.depressedKeys, event.code)),
          );
        },
        onKeyUp: (event) => {
          setDepressedKeys(
            (state.depressedKeys = deleteKey(state.depressedKeys, event.code)),
          );
        },
        onInput: (event) => {
          state.lastLesson = null;
          const feedback = state.onInput(event);
          setLines(state.lines);
          playSounds(feedback);
          timeout.schedule(handleResetCalibration, 10000);
        },
      },
    );
    return {
      calibrationState: state,
      handleResetCalibration,
      handleSkipCalibration,
      handleCalibrationKeyDown: onKeyDown,
      handleCalibrationKeyUp: onKeyUp,
      handleCalibrationInput: onInput,
    };
  }, [progress, keyboard, timeout, key]);
}
