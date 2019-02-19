// Copyright 2015-2019 SWIM.AI inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Value} from "@swim/structure";
import {BoxR2} from "@swim/math";
import {AnyColor, Color} from "@swim/color";
import {Transition} from "@swim/transition";
import {RenderingContext} from "@swim/render";
import {MemberAnimator, NumberMemberAnimator, GraphicView, GraphicViewController} from "@swim/view";
import {MirrorView} from "./MirrorView";

export interface ChargeMode {
  chargeColor: AnyColor,
  chargeOpacity: number,
  chargeDarken: number,
  chargeRadius: number,
  chargeJitterRadius: number,
  rippleColor: AnyColor,
  rippleOpacity: number,
  rippleDarken: number,
  rippleDuration: number, // time it takes a ripple to expand
  rippleSpread: number, // time interval over which ripples emit
  pressDelay: number,
}

export const ChargeMode = {
  from(chargeColor: AnyColor = Color.rgb("#80dc1a"),
       chargeOpacity: number = 1,
       chargeDarken: number = 0,
       chargeRadius: number = 40,
       chargeJitterRadius: number = 4,
       rippleColor: AnyColor = Color.rgb("#80dc1a"),
       rippleOpacity: number = 1,
       rippleDarken: number = 0,
       rippleDuration: number = 5000,
       rippleSpread: number = 300,
       pressDelay: number = 500): ChargeMode {
    return {
      chargeColor,
      chargeOpacity,
      chargeDarken,
      chargeRadius,
      chargeJitterRadius,
      rippleColor,
      rippleOpacity,
      rippleDarken,
      rippleDuration,
      rippleSpread,
      pressDelay,
    }
  }
}
MirrorView.ChargeMode = ChargeMode;

export class ChargeView extends GraphicView {
  /** @hidden */
  _viewController: GraphicViewController<ChargeView> | null;
  readonly id: Value;
  t0: number;
  ripples: NumberMemberAnimator<this>[];
  /** @hidden */
  _phases: number[];
  /** @hidden */
  _pressed: boolean;
  /** @hidden */
  _pressTimer: number;

  constructor(id: Value, t0: number, originX: number, originY: number, phases: number[],
              mode: ChargeMode = ChargeMode.from()) {
    super();
    this.onPressDown = this.onPressDown.bind(this);
    this.onChargeJitter = this.onChargeJitter.bind(this);

    this.id = id;
    this.t0 = t0;
    this.originX.setState(originX);
    this.originY.setState(originY);
    this.centerX.setState(originX);
    this.centerY.setState(originY);
    this.chargeColor.setState(Color.fromAny(mode.chargeColor));
    this.chargeOpacity.setState(mode.chargeOpacity);
    this.chargeDarken.setState(mode.chargeDarken);
    this.chargeRadius.setState(mode.chargeRadius);
    this.chargeJitter.setState(0);
    this.chargeJitterRadius.setState(mode.chargeJitterRadius);
    this.rippleColor.setState(Color.fromAny(mode.rippleColor));
    this.rippleOpacity.setState(mode.rippleOpacity);
    this.rippleDarken.setState(mode.rippleDarken);

    const rippleCount = phases.length;
    const ripples = new Array<NumberMemberAnimator<this>>(rippleCount);
    for (let i = 0; i < rippleCount; i += 1) {
      const phase = phases[i];
      const ripple = new NumberMemberAnimator(this, 0);
      const ease = function (t: number): number {
        return Math.min(Math.max(0, 2 * t - (mode.rippleSpread / mode.rippleDuration) * phase), 1);
      }
      ripple.setState(1, Transition.from(2 * mode.rippleDuration, ease));
      ripples[i] = ripple;
    }
    this.ripples = ripples;
    this._phases = phases;

    if (mode.pressDelay > 0) {
      this._pressed = false;
      this._pressTimer = setTimeout(this.onPressDown, mode.pressDelay) as any;
    } else if (mode.pressDelay === 0) {
      this._pressed = true;
      this._pressTimer = 0;
      this.onChargeJitter();
    } else {
      this._pressed = false;
      this._pressTimer = 0;
    }
  }

  get viewController(): GraphicViewController<ChargeView> | null {
    return this._viewController;
  }

  isActive(): boolean {
    return this.ripples.length !== 0;
  }

  isPressed(): boolean {
    return this._pressed;
  }

  setPressed(pressed: boolean): void {
    if (this._pressed !== pressed) {
      this._pressed = pressed;
      if (this._pressed) {
        this.onChargeJitter();
      }
    }
  }

  @MemberAnimator(Number)
  originX: MemberAnimator<this, number>;

  @MemberAnimator(Number)
  originY: MemberAnimator<this, number>;

  @MemberAnimator(Number)
  centerX: MemberAnimator<this, number>;

  @MemberAnimator(Number)
  centerY: MemberAnimator<this, number>;

  @MemberAnimator(Color)
  chargeColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Number)
  chargeOpacity: MemberAnimator<this, number>;

  @MemberAnimator(Number)
  chargeDarken: MemberAnimator<this, number>;

  @MemberAnimator(Number)
  chargeRadius: MemberAnimator<this, number>;

  @MemberAnimator(Number)
  chargeJitter: MemberAnimator<this, number>;

  @MemberAnimator(Number)
  chargeJitterRadius: MemberAnimator<this, number>;

  @MemberAnimator(Color)
  rippleColor: MemberAnimator<this, Color, AnyColor>;

  @MemberAnimator(Number)
  rippleOpacity: MemberAnimator<this, number>;

  @MemberAnimator(Number)
  rippleDarken: MemberAnimator<this, number>;

  protected onUnmount(): void {
    if (this._pressTimer) {
      clearTimeout(this._pressTimer);
      this._pressTimer = 0;
    }
  }

  protected onAnimate(t: number): void {
    this.originX.onFrame(t);
    this.originY.onFrame(t);
    this.centerX.onFrame(t);
    this.centerY.onFrame(t);
    this.chargeColor.onFrame(t);
    this.chargeOpacity.onFrame(t);
    this.chargeDarken.onFrame(t);
    this.chargeRadius.onFrame(t);
    this.chargeJitter.onFrame(t);
    this.chargeJitterRadius.onFrame(t);
    this.rippleColor.onFrame(t);
    this.rippleOpacity.onFrame(t);
    this.rippleDarken.onFrame(t);
    const ripples = this.ripples;
    for (let i = 0, n = ripples.length; i < n; i += 1) {
      ripples[i].onFrame(t);
    }
  }

  protected onRender(context: RenderingContext): void {
    context.save();
    const bounds = this._bounds;
    if (this._pressed) {
      this.renderCharge(context, bounds);
    }
    this.renderRipples(context, bounds);
    context.restore();
    this.setDirty(false);
  }

  protected renderCharge(context: RenderingContext, bounds: BoxR2): void {
    const centerX = this.centerX.value! * bounds.width;
    const centerY = this.centerY.value! * bounds.height;
    const chargeColor = this.chargeColor.value!;
    const radius = Math.max(0, this.chargeRadius.value! + this.chargeJitter.value! * this.chargeJitterRadius.value!);

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.fillStyle = chargeColor.darker(this.chargeDarken.value!).alpha(this.chargeOpacity.value!).toString();
    context.fill();
  }

  protected renderRipples(context: RenderingContext, bounds: BoxR2): void {
    const originX = this.originX.value! * bounds.width;
    const originY = this.originY.value! * bounds.height;
    const rippleColor = this.rippleColor.value!;
    const rippleOpacity = this.rippleOpacity.value!;
    const rippleDarken = this.rippleDarken.value!;
    const maxRadius = Math.max(bounds.width, bounds.height) / 2;

    const ripples = this.ripples;
    let i = 0;
    while (i < ripples.length) {
      const ripple = ripples[i];
      const phase = ripple.value!;
      if (0 < phase && phase < 1) {
        const radius = phase * maxRadius;
        context.beginPath();
        context.arc(originX, originY, radius, 0, 2 * Math.PI);
        context.strokeStyle = rippleColor.darker(rippleDarken).alpha(rippleOpacity - rippleOpacity * phase).toString();
        context.lineWidth = 1;
        context.stroke();
      } else if (phase >= 1) {
        ripples.splice(i, 1);
        continue;
      }
      i += 1;
    }
  }

  protected onPressDown(): void {
    this._pressTimer = 0;
    this._pressed = true;
    const chargeRadius = this.chargeRadius.value!;
    this.chargeRadius.setState(0);
    this.chargeRadius.setState(chargeRadius, Transition.duration<number>(300));
    this.onChargeJitter();

    const parentView = this.parentView;
    if (parentView instanceof MirrorView) {
      parentView.onPressHold(this);
    }
  }

  onChargeJitter(): void {
    const jitter = 0.5 - Math.random();
    this.chargeJitter.setState(jitter, Transition.duration<number>(10).onEnd(this.onChargeJitter));
  }

  onPressMove(centerX: number, centerY: number): void {
    this.centerX.setState(centerX);
    this.centerY.setState(centerY);
    this.animate();
  }

  onPressUp(): void {
    if (this._pressTimer) {
      clearTimeout(this._pressTimer);
      this._pressTimer = 0;
    }
    this._pressed = false;
    this.animate();
  }
}
MirrorView.ChargeView = ChargeView;
