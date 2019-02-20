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

package swim.ripple;

import java.util.Map;
import swim.api.SwimLane;
import swim.api.agent.AbstractAgent;
import swim.api.lane.CommandLane;
import swim.api.lane.MapLane;
import swim.api.lane.ValueLane;
import swim.concurrent.TimerRef;
import swim.recon.Recon;
import swim.structure.Record;
import swim.structure.Text;
import swim.structure.Value;

public class MirrorAgent extends AbstractAgent {
  int minRipples;
  int maxRipples;
  TimerRef rippleTimer;

  @SwimLane("mode")
  final ValueLane<Value> mode = this.<Value>valueLane()
      .didSet((Value newValue, Value oldValue) -> {
        System.out.println("mode updated: " + Recon.toString(newValue));
        minRipples = Math.max(newValue.get("minRipples").intValue(2), 1);
        maxRipples = Math.max(Math.max(newValue.get("maxRipples").intValue(5), 1), minRipples);
      });

  @SwimLane("ripple")
  final CommandLane<Value> ripple = this.<Value>commandLane()
      .onCommand(this::onRipple);

  @SwimLane("scoreboard")
  final ValueLane<Value> scoreboard = this.<Value>valueLane();

  void onRipple(Value value) {
    final Value id = value.get("id");
    final double x = value.get("x").doubleValue(Math.random());
    final double y = value.get("y").doubleValue(Math.random());
    Value phases = value.get("phases");
    if (!(phases instanceof Record) || ((Record) phases).isEmpty()) {
      phases = null;
    }
    final String color = value.get("color").stringValue("#80dc1a");
    final Record ripple = createRipple(id, x, y, (Record) phases, color);
    this.ripples.set(ripple);

    Value scoreboard = this.scoreboard.get();
    if ("#80dc1a".equals(color)) {
      Value team = scoreboard.get("green");
      final int oldRippleCount = team.get("rippleCount").intValue(0);
      final int newRippleCount = oldRippleCount + ripple.get("phases").length() + 1;
      team = team.updated("rippleCount", newRippleCount);
      scoreboard = scoreboard.updated("green", team);
      this.scoreboard.set(scoreboard);
    } else if ("#c200fa".equals(color)) {
      Value team = scoreboard.get("magenta");
      final int oldRippleCount = team.get("rippleCount").intValue(0);
      final int newRippleCount = oldRippleCount + ripple.get("phases").length() + 1;
      team = team.updated("rippleCount", newRippleCount);
      scoreboard = scoreboard.updated("magenta", team);
      this.scoreboard.set(scoreboard);
    } else if ("#56dbb6".equals(color)) {
      Value team = scoreboard.get("cyan");
      final int oldRippleCount = team.get("rippleCount").intValue(0);
      final int newRippleCount = oldRippleCount + ripple.get("phases").length() + 1;
      team = team.updated("rippleCount", newRippleCount);
      scoreboard = scoreboard.updated("cyan", team);
      this.scoreboard.set(scoreboard);
    }
    //System.out.println("scoreboard: " + Recon.toString(scoreboard));
  }

  @SwimLane("ripples")
  final ValueLane<Value> ripples = this.<Value>valueLane()
      .didSet(this::didSetRipple);

  void didSetRipple(Value newValue, Value oldValue) {
    System.out.println("latest ripple: " + Recon.toString(newValue));
  }

  @SwimLane("charges")
  final MapLane<Value, Value> charges = this.<Value, Value>mapLane()
      .didRemove(this::onUncharge);

  @SwimLane("charge")
  final CommandLane<Value> charge = this.<Value>commandLane()
      .onCommand(this::onCharge);

  void onCharge(Value value) {
    //System.out.println("onCharge: " + Recon.toString(value));
    final Value id = value.get("id");
    if (id.isDefined()) {
      final String tag = value.tag();
      final long t = System.currentTimeMillis();
      if ("hold".equals(tag)) {
        final double x = value.get("x").doubleValue(Math.random());
        final double y = value.get("y").doubleValue(Math.random());
        final int r = Math.min(Math.max(0, value.get("r").intValue(0)), 100);
        final String color = value.get("color").stringValue("#80dc1a");
        final Record charge = createCharge(t, t, x, y, r, color);
        this.charges.put(id, charge);
      } else if ("move".equals(tag)) {
        final Record charge = (Record) this.charges.get(id).branch();
        final double x = (int) Math.round(value.get("x").doubleValue(Math.random()) * 10000.0) / 10000.0;
        final double y = (int) Math.round(value.get("y").doubleValue(Math.random()) * 10000.0) / 10000.0;
        final int r = Math.min(Math.max(0, value.get("r").intValue(0)), 100);
        final String color = value.get("color").stringValue(null);
        charge.put("t", t);
        charge.put("x", x);
        charge.put("y", y);
        charge.put("r", r);
        if (color != null) {
          charge.put("color", color);
        }
        this.charges.put(id, charge);
      } else {
        this.charges.remove(id);
      }
    }
  }

  void onUncharge(Value key, Value value) {
    //System.out.println("onUncharge " + Recon.toString(key) + ": " + Recon.toString(value));
    final long t1 = System.currentTimeMillis();
    final long t0 = value.get("t0").longValue(0L);
    final long dt = t1 - t0;
    final String color = value.get("color").stringValue(null);

    Value scoreboard = this.scoreboard.get();
    if ("#80dc1a".equals(color) && t0 != 0L) {
      Value team = scoreboard.get("green");
      final long oldChargeTime = team.get("chargeTime").longValue(0L);
      final long newChargeTime = oldChargeTime + dt;
      team = team.updated("chargeTime", newChargeTime);
      scoreboard = scoreboard.updated("green", team);
      this.scoreboard.set(scoreboard);
    } else if ("#c200fa".equals(color) && t0 != 0L) {
      Value team = scoreboard.get("magenta");
      final long oldChargeTime = team.get("chargeTime").longValue(0L);
      final long newChargeTime = oldChargeTime + dt;
      team = team.updated("chargeTime", newChargeTime);
      scoreboard = scoreboard.updated("magenta", team);
      this.scoreboard.set(scoreboard);
    } else if ("#56dbb6".equals(color) && t0 != 0L) {
      Value team = scoreboard.get("cyan");
      final long oldChargeTime = team.get("chargeTime").longValue(0L);
      final long newChargeTime = oldChargeTime + dt;
      team = team.updated("chargeTime", newChargeTime);
      scoreboard = scoreboard.updated("cyan", team);
      this.scoreboard.set(scoreboard);
    }
    //System.out.println("scoreboard: " + Recon.toString(scoreboard));
  }

  void cleanupCharges() {
    final long now = System.currentTimeMillis();
    for (Map.Entry<Value, Value> entry : this.charges) {
      final Value id = entry.getKey();
      final Value charge = entry.getValue();
      final long t = charge.get("t").longValue(0L);
      if (Math.abs(now - t) >= 1L * 60L * 1000L) {
        this.charges.remove(id);
      }
    }
  }

  Record createRipple(Value id, double x, double y, Record phases, String color) {
    final Record ripple = Record.create(5);
    ripple.slot("id", id);
    ripple.slot("x", (int) (x * 10000.0) / 10000.0);
    ripple.slot("y", (int) (y * 10000.0) / 10000.0);
    if (phases == null) {
      final int phaseCount = minRipples + (int) Math.round((maxRipples - minRipples) * Math.random());
      phases = Record.create(phaseCount - 1);
      for (int i = 1; i < phaseCount; i += 1) {
        phases.item((int) (Math.random() * 100.0) / 100.0);
      }
    }
    ripple.slot("phases", phases);
    ripple.slot("color", color);
    return ripple;
  }

  Record createCharge(long t0, long t, double x, double y, int r, String color) {
    final Record charge = Record.create(6);
    charge.slot("t0", t0);
    charge.slot("t", t);
    charge.slot("x", (int) (x * 10000.0) / 10000.0);
    charge.slot("y", (int) (y * 10000.0) / 10000.0);
    charge.slot("r", r);
    charge.slot("color", color);
    return charge;
  }

  void generateRipple() {
    final Record ripple = createRipple(Text.from("swim0"), Math.random(), Math.random(), null, "#00a6ed");
    this.ripples.set(ripple);

    final long minRippleDelay = 500L;
    final long maxRippleDelay = 2000L;
    final long rippleDelay = minRippleDelay + (long) (Math.random() * (maxRippleDelay - minRippleDelay));
    this.rippleTimer = setTimer(rippleDelay, this::generateRipple);

    cleanupCharges();
  }

  @Override
  public void didStart() {
    final Value defaultMode = Record.create(4)
        .slot("minRipples", 2)
        .slot("maxRipples", 5)
        .slot("rippleDuration", 5000)
        .slot("rippleSpread", 300);

    this.mode.set(defaultMode);

    generateRipple();
  }
}
