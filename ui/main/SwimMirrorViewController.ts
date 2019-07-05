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

import {AnyValue, Value, Record} from "@swim/structure";
import {Recon} from "@swim/recon";
import {NodeRef, Downlink, EventDownlink, EventDownlinkObserver, MapDownlink, MapDownlinkObserver} from "@swim/client";
import {Transition} from "@swim/transition";
import {MirrorView} from "./MirrorView";
import {MirrorViewController} from "./MirrorViewController";
import {ChargeMode, ChargeView} from "./ChargeView";

export class SwimMirrorViewController extends MirrorViewController implements EventDownlinkObserver, MapDownlinkObserver<Value, Value, AnyValue, AnyValue> {
  nodeRef: NodeRef;
  ripplesDownlink: EventDownlink | null;
  chargesDownlink: MapDownlink<Value, Value, AnyValue, AnyValue> | null;

  constructor(nodeRef: NodeRef) {
    super();
    this.nodeRef = nodeRef;
    this.ripplesDownlink = null;
    this.chargesDownlink = null;
  }

  viewDidMount(view: MirrorView): void {
    this.ripplesDownlink = this.nodeRef.downlink()
        .laneUri("ripples")
        .observe(this)
        .open();
    this.chargesDownlink = this.nodeRef.downlinkMap()
        .laneUri("charges")
        .observe(this)
        .open();
  }

  viewDidUnmount(view: MirrorView): void {
    if (this.ripplesDownlink) {
      this.ripplesDownlink.close();
      this.ripplesDownlink = null;
    }
    if (this.chargesDownlink) {
      this.chargesDownlink.close();
      this.chargesDownlink = null;
    }
  }

  mirrorDidPressDown(charge: ChargeView, view: MirrorView): void {
    const id = charge.id;
    const x = Math.round(charge.originX.state! * 10000) / 10000;
    const y = Math.round(charge.originY.state! * 10000) / 10000;
    const phaseCount = charge._phases.length;
    const phases = Record.create(phaseCount);
    for (let i = 1; i < phaseCount; i += 1) {
      const phase = Math.round(charge._phases[i] * 100) / 100;
      phases.item(phase);
    }
    const color = charge.chargeColor.state!.toString();
    const command = Record.create(5)
        .slot("id", id)
        .slot("x", x)
        .slot("y", y)
        .slot("phases", phases)
        .slot("color", color);
    this.nodeRef.command("ripple", command);
  }

  mirrorDidPressHold(charge: ChargeView, view: MirrorView): void {
    const id = charge.id;
    const x = Math.round(charge.centerX.state! * 10000) / 10000;
    const y = Math.round(charge.centerY.state! * 10000) / 10000;
    const r = charge.chargeRadius.state! / 2;
    const color = charge.chargeColor.state!.toString();
    const command = Record.create(6)
        .attr("hold")
        .slot("id", id)
        .slot("x", x)
        .slot("y", y)
        .slot("r", r)
        .slot("color", color);
    this.nodeRef.command("charge", command);
  }

  mirrorDidPressMove(charge: ChargeView, view: MirrorView): void {
    const id = charge.id;
    const x = Math.round(charge.centerX.state! * 10000) / 10000;
    const y = Math.round(charge.centerY.state! * 10000) / 10000;
    const r = charge.chargeRadius.state! / 2;
    const color = charge.chargeColor.state!.toString();
    const command = Record.create(6)
        .attr("move")
        .slot("id", id)
        .slot("x", x)
        .slot("y", y)
        .slot("r", r)
        .slot("color", color);
    this.nodeRef.command("charge", command);
  }

  mirrorDidPressUp(charge: ChargeView, view: MirrorView): void {
    const id = charge.id;
    const command = Record.create(2)
        .attr("up")
        .slot("id", id);
    this.nodeRef.command("charge", command);
  }

  protected onRemoteRipple(value: Value): void {
    const view = this.view!;
    const id = value.get("id");
    if (document.hidden || id.getItem(0).equals(view.id)) {
      return;
    }
    const originX = value.get("x").numberValue(Math.random());
    const originY = value.get("y").numberValue(Math.random());
    const phases = value.get("phases").toAny() as number[];
    phases.unshift(0);
    const color = value.get("color").stringValue("#00a6ed");
    const mode = ChargeMode.from();
    mode.chargeRadius = 0;
    mode.chargeColor = color;
    if (view.mode.chargeOpacity) {
      mode.chargeOpacity = view.mode.chargeOpacity;
    }
    mode.rippleColor = color;
    if (view.mode.rippleDarken) {
      mode.rippleDarken = view.mode.rippleDarken;
    }
    if (view.mode.rippleOpacity) {
      mode.rippleOpacity = view.mode.rippleOpacity;
    }
    mode.pressDelay = -1;
    const charge = new ChargeView(id, Date.now(), originX, originY, phases, mode);
    view.appendChildView(charge);
  }

  protected onRemoteUpdateCharge(key: Value, value: Value): void {
    const view = this.view!;
    if (key.getItem(0).equals(view.id)) {
      return;
    }
    const id = Recon.toString(key);
    const t0 = value.get("t0").numberValue(Date.now());
    const centerX = value.get("x").numberValue(Math.random());
    const centerY = value.get("y").numberValue(Math.random());
    const chargeRadius = value.get("r").numberValue(0);
    if (!chargeRadius) {
      return;
    }
    const color = value.get("color").stringValue("#00a6ed");
    const tween = Transition.duration<any>(300);
    let charge = view.getChildView(id) as ChargeView | null;
    if (charge) {
      charge.t0 = t0;
      charge.centerX.setState(centerX);
      charge.centerY.setState(centerY);
      charge.chargeColor(color, tween)
            .chargeRadius(chargeRadius, tween)
            .rippleColor(color, tween);
    } else {
      const mode = ChargeMode.from();
      mode.chargeRadius = 0;
      mode.chargeColor = color;
      if (view.mode.chargeDarken) {
        mode.chargeDarken = view.mode.chargeDarken;
      }
      if (view.mode.chargeOpacity) {
        mode.chargeOpacity = view.mode.chargeOpacity;
      }
      mode.rippleColor = color;
      if (view.mode.rippleDarken) {
        mode.rippleDarken = view.mode.rippleDarken;
      }
      if (view.mode.rippleOpacity) {
        mode.rippleOpacity = view.mode.rippleOpacity;
      }
      mode.pressDelay = 0;
      const charge = new ChargeView(key, t0, centerX, centerY, [0], mode);
      charge.chargeRadius(chargeRadius, tween);
      view.setChildView(id, charge);
    }
  }

  protected onRemoteRemoveCharge(key: Value): void {
    const view = this.view!;
    if (key.getItem(0).equals(view.id)) {
      return;
    }
    const id = Recon.toString(key);
    view.setChildView(id, null);
  }

  protected removeAllCharges(): void {
    if (this.chargesDownlink) {
      this.chargesDownlink.forEach(function (key: Value) {
        this.onRemoteRemoveCharge(key);
      }, this);
    }
  }

  onEvent(body: Value, downlink: Downlink): void {
    if (downlink === this.ripplesDownlink) {
      this.onRemoteRipple(body);
    }
  }

  didUpdate(key: Value, newValue: Value, oldValue: Value, downlink: MapDownlink<Value, Value, AnyValue, AnyValue>): void {
    if (downlink === this.chargesDownlink) {
      this.onRemoteUpdateCharge(key, newValue);
    }
  }

  didRemove(key: Value, oldValue: Value, downlink: MapDownlink<Value, Value, AnyValue, AnyValue>): void {
    if (downlink === this.chargesDownlink) {
      this.onRemoteRemoveCharge(key);
    }
  }

  didConnect(downlink: Downlink): void {
    this.removeAllCharges();
  }

  didDisconnect(downlink: Downlink): void {
    this.removeAllCharges();
  }
}
