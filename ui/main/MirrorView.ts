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

import {Objects} from "@swim/util";
import {BoxR2} from "@swim/math";
import {Color} from "@swim/color";
import {Value, Record, Data, Text} from "@swim/structure";
import {Interpolator} from "@swim/interpolate";
import {RenderingContext} from "@swim/render";
import {GraphicView, CanvasView} from "@swim/view";
import {ChargeMode, ChargeView} from "./ChargeView";
import {MirrorViewObserver} from "./MirrorViewObserver";
import {MirrorViewController} from "./MirrorViewController";

export interface MirrorMode {
  minRipples: number;
  maxRipples: number;
  chargeOpacity?: number,
  chargeDarken?: number,
  chargeRadius?: number,
  chargeJitterRadius: number,
  rippleDuration: number, // time it takes a ripple to expand
  rippleSpread: number, // time interval over which ripples emit
  rippleOpacity?: number,
  rippleDarken?: number,
}

export const MirrorMode = {
  default: {
    minRipples: 2,
    maxRipples: 5,
    rippleDuration: 5000,
    rippleSpread: 300,
  } as MirrorMode,
};

export class MirrorView extends GraphicView {
  /** @hidden */
  _viewController: MirrorViewController | null;
  /** @hidden */
  readonly id: Value;
  /** @hidden */
  readonly mode: MirrorMode;
  /** @hidden */
  color: Color;
  /** @hidden */
  captive: boolean;
  /** @hidden */
  _touchCount: number;
  /** @hidden */
  _presses: {[id: string]: ChargeView | undefined};

  constructor(id?: Value, mode: MirrorMode = MirrorMode.default) {
    super();
    if (id === void 0) {
      id = Text.from(Data.random(6).toBase64());
    }
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchCancel = this.onTouchCancel.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.id = id;
    this.mode = mode;
    this.color = Color.fromAny(MirrorView.colors[Math.floor(MirrorView.colors.length * Math.random())]);
    this.captive = false;
    this._touchCount = 0;
    this._presses = {};
  }

  get viewController(): MirrorViewController | null {
    return this._viewController;
  }

  get canvasView(): CanvasView {
    let parentView = this.parentView;
    while (parentView) {
      if (parentView instanceof CanvasView) {
        return parentView;
      } else {
        parentView = parentView.parentView;
      }
    }
    throw new Error("not mounted");
  }

  protected onMount(): void {
    const canvasView = this.canvasView;
    canvasView.cursor("default");
    if (typeof TouchEvent !== "undefined") {
      canvasView.on("touchstart", this.onTouchStart);
    }
    canvasView.on("mousedown", this.onMouseDown);
  }

  protected onUnmount(): void {
    const canvasView = this.canvasView;
    if (typeof TouchEvent !== "undefined") {
      canvasView.off("touchstart", this.onTouchStart);
      canvasView.off("touchmove", this.onTouchMove);
      canvasView.off("touchcancel", this.onTouchCancel);
      canvasView.off("touchend", this.onTouchEnd);
    }
    canvasView.off("mousedown", this.onMouseDown);
    canvasView.off("mousemove", this.onMouseMove);
    canvasView.off("mouseup", this.onMouseUp);
  }

  protected onAnimate(t: number): void {
    // stub
  }

  protected onRender(context: RenderingContext): void {
    context.save();
    const bounds = this._bounds;
    this.renderBonds(context, bounds);
    context.restore();
    this.setDirty(false);
  }

  protected renderBonds(context: RenderingContext, bounds: BoxR2): void {
    const childViews = this.childViews;
    const chargeViews = [];
    let chargeCount = 0;
    for (let i = 0, n = childViews.length; i < n; i += 1) {
      const childView = childViews[i];
      if (childView instanceof MirrorView.ChargeView && childView.isPressed()) {
        chargeViews.push(childView);
        chargeCount += 1;
      }
    }

    if (chargeCount >= 2) {
      chargeViews.sort(function (a: ChargeView, b: ChargeView): number {
        return Objects.compare(a.t0, b.t0);
      });
      const now = Date.now();
      const a = chargeViews[0];
      for (let i = 1; i < chargeCount; i += 1) {
        const b = chargeViews[i];
        this.renderBond(context, bounds, a, b, now);
      }
    }
  }

  protected renderBond(context: RenderingContext, bounds: BoxR2, a: ChargeView, b: ChargeView, now: number): void {
    const chargeOpacity = this.mode.chargeOpacity !== void 0 ? this.mode.chargeOpacity : 1;
    const chargeDarken = this.mode.chargeDarken !== void 0 ? this.mode.chargeDarken : 0;
    const ax = a.centerX.value! * bounds.width;
    const ay = a.centerY.value! * bounds.height;
    const aColor = a.chargeColor.value!.darker(chargeDarken).alpha(chargeOpacity);
    const bx = b.centerX.value! * bounds.width;
    const by = b.centerY.value! * bounds.height;
    const bColor = b.chargeColor.value!.darker(chargeDarken).alpha(chargeOpacity);

    const dt = now - a.t0;
    const pulseWidth = 2000;
    const halfPulse = pulseWidth / 2;
    let pulsePhase = (dt % pulseWidth) / halfPulse;
    if (pulsePhase > 1) {
      pulsePhase = 2 - pulsePhase;
    }

    context.lineWidth = 4;
    const gradient = context.createLinearGradient(ax, ay, bx, by);
    gradient.addColorStop(0, aColor.alpha(0).toString());
    if (pulsePhase !== 0 && pulsePhase !== 1) {
      const abColor = Interpolator.color(aColor, bColor).interpolate(pulsePhase);
      gradient.addColorStop(pulsePhase, abColor.toString());
    }
    gradient.addColorStop(1, bColor.alpha(0).toString());
    context.strokeStyle = gradient;

    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.stroke();
  }

  protected didRender(): void {
    const childViews = this.childViews;
    let i = 0;
    while (i < childViews.length) {
      const childView = childViews[i];
      if (childView instanceof MirrorView.ChargeView && !childView.isActive() && !childView.isPressed()) {
        this.removeChildView(childView);
      } else {
        i += 1;
      }
    }
  }

  protected createCharge(id: Value, t0: number, clientX: number, clientY: number, phases?: number[], chargeMode?: ChargeMode): ChargeView {
    const canvasView = this.canvasView;
    const clientRect = canvasView.node.getBoundingClientRect();
    const originX = (clientX - clientRect.left) / (clientRect.width || 1);
    const originY = (clientY - clientRect.top) / (clientRect.height || 1);
    const mode = this.mode;
    const rippleCount = mode.minRipples + Math.round((mode.maxRipples - mode.minRipples) * Math.random());
    if (phases === void 0) {
      phases = new Array<number>(rippleCount);
      phases[0] = 0;
      for (let i = 1; i < rippleCount; i += 1) {
        phases[i] = Math.random();
      }
    }
    if (chargeMode === void 0) {
      chargeMode = MirrorView.ChargeMode.from();
      chargeMode.chargeColor = this.color;
      chargeMode.rippleColor = this.color;
    }
    if (mode.chargeOpacity !== void 0) {
      chargeMode.chargeOpacity = mode.chargeOpacity;
    }
    if (mode.chargeDarken !== void 0) {
      chargeMode.chargeDarken = mode.chargeDarken;
    }
    if (mode.chargeRadius !== void 0) {
      chargeMode.chargeRadius = mode.chargeRadius;
    }
    if (mode.chargeJitterRadius !== void 0) {
      chargeMode.chargeJitterRadius = mode.chargeJitterRadius;
    }
    if (mode.rippleOpacity !== void 0) {
      chargeMode.rippleOpacity = mode.rippleOpacity;
    }
    if (mode.rippleDarken !== void 0) {
      chargeMode.rippleDarken = mode.rippleDarken;
    }
    return new MirrorView.ChargeView(id, t0, originX, originY, phases, chargeMode);
  }

  protected onPressDown(charge: ChargeView): void {
    this.didObserve(function (viewObserver: MirrorViewObserver): void {
      if (viewObserver.mirrorDidPressDown) {
        viewObserver.mirrorDidPressDown(charge, this);
      }
    });
  }

  onPressHold(charge: ChargeView): void {
    this.didObserve(function (viewObserver: MirrorViewObserver): void {
      if (viewObserver.mirrorDidPressHold) {
        viewObserver.mirrorDidPressHold(charge, this);
      }
    });
  }

  protected onPressMove(charge: ChargeView, clientX: number, clientY: number): void {
    const canvasView = this.canvasView;
    const clientRect = canvasView.node.getBoundingClientRect();
    const centerX = (clientX - clientRect.left) / (clientRect.width || 1);
    const centerY = (clientY - clientRect.top) / (clientRect.height || 1);
    charge.onPressMove(centerX, centerY);

    if (charge.isPressed()) {
      this.didObserve(function (viewObserver: MirrorViewObserver): void {
        if (viewObserver.mirrorDidPressMove) {
          viewObserver.mirrorDidPressMove(charge, this);
        }
      });
    }
  }

  protected onPressUp(charge: ChargeView): void {
    const pressed = charge.isPressed();
    charge.onPressUp();

    if (pressed) {
      this.didObserve(function (viewObserver: MirrorViewObserver): void {
        if (viewObserver.mirrorDidPressUp) {
          viewObserver.mirrorDidPressUp(charge, this);
        }
      });
    }
  }

  protected onMouseDown(event: MouseEvent): void {
    if (event.button !== 0 || this._presses["mouse"]) {
      return;
    }

    document.body.addEventListener("mousemove", this.onMouseMove);
    document.body.addEventListener("mouseup", this.onMouseUp);

    const charge = this.createCharge(Record.of(this.id, "mouse"), Date.now(), event.clientX, event.clientY);
    this._presses["mouse"] = charge;
    this.appendChildView(charge);
    this.onPressDown(charge);
  }

  protected onMouseMove(event: MouseEvent): void {
    const charge = this._presses["mouse"];
    if (charge) {
      this.onPressMove(charge, event.clientX, event.clientY);
    }
  }

  protected onMouseUp(event: MouseEvent): void {
    const charge = this._presses["mouse"]!;
    if (charge) {
      delete this._presses["mouse"];
      this.onPressUp(charge);
    }

    document.body.removeEventListener("mousemove", this.onMouseMove);
    document.body.removeEventListener("mouseup", this.onMouseUp);
  }

  protected onTouchStart(event: TouchEvent): void {
    if (this.captive) {
      event.preventDefault();
    }
    const touches = event.changedTouches;
    for (let i = 0, n = touches.length; i < n; i += 1) {
      const touch = touches[i];
      const pressId = "touch" + touch.identifier;
      let charge = this._presses[pressId];
      if (charge === void 0) {
        if (this._touchCount === 0) {
          const canvasView = this.canvasView;
          canvasView.on("touchmove", this.onTouchMove);
          canvasView.on("touchcancel", this.onTouchCancel);
          canvasView.on("touchend", this.onTouchEnd);
        }
        charge = this.createCharge(Record.of(this.id, pressId), Date.now(), touch.clientX, touch.clientY);
        this._presses[pressId] = charge;
        this._touchCount += 1;
        this.appendChildView(charge);
        this.onPressDown(charge);
      }
    }
  }

  protected onTouchMove(event: TouchEvent): void {
    const touches = event.changedTouches;
    for (let i = 0, n = touches.length; i < n; i += 1) {
      const touch = touches[i];
      const pressId = "touch" + touch.identifier;
      const charge = this._presses[pressId];
      if (charge) {
        this.onPressMove(charge, touch.clientX, touch.clientY);
      }
    }
  }

  protected onTouchCancel(event: TouchEvent): void {
    const touches = event.changedTouches;
    for (let i = 0, n = touches.length; i < n; i += 1) {
      const touch = touches[i];
      const pressId = "touch" + touch.identifier;
      const charge = this._presses[pressId];
      if (charge) {
        delete this._presses[pressId];
        this._touchCount -= 1;
        this.onPressUp(charge);
      }
    }
    if (this._touchCount === 0) {
      const canvasView = this.canvasView;
      canvasView.off("touchmove", this.onTouchMove);
      canvasView.off("touchcancel", this.onTouchCancel);
      canvasView.off("touchend", this.onTouchEnd);
    }
  }

  protected onTouchEnd(event: TouchEvent): void {
    const touches = event.changedTouches;
    for (let i = 0, n = touches.length; i < n; i += 1) {
      const touch = touches[i];
      const pressId = "touch" + touch.identifier;
      const charge = this._presses[pressId];
      if (charge) {
        delete this._presses[pressId];
        this._touchCount -= 1;
        this.onPressUp(charge);
      }
    }
    if (this._touchCount === 0) {
      const canvasView = this.canvasView;
      canvasView.off("touchmove", this.onTouchMove);
      canvasView.off("touchcancel", this.onTouchCancel);
      canvasView.off("touchend", this.onTouchEnd);
    }
  }

  /** @hidden */
  static colors: string[] = ["#80dc1a", "#56dbb6", "#c200fa"];

  // Forward type declarations
  /** @hidden */
  static ChargeMode: typeof ChargeMode; // defined by ChargeMode
  /** @hidden */
  static ChargeView: typeof ChargeView; // defined by ChargeView
}
