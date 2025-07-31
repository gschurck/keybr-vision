import {Attr, type Char} from "./chars.ts";
import {type Step, TextInput} from "./textinput.ts";

export class CalibrationTextInput extends TextInput {
  override addStep(step: Step, char: Char): void {
    console.log("Adding step:", step, "at position:", this.pos);
    const attrs = step.typo ? Attr.Miss : Attr.Hit;
    this._steps.push({ ...step, char: { ...char, attrs } });
    this.onStep(step);
    const letter = String.fromCodePoint(char.codePoint);

  }
}
