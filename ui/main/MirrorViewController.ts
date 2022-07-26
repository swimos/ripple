// Copyright 2015-2022 Swim.inc
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

import {GraphicViewController} from "@swim/view";
import {MirrorView} from "./MirrorView";
import {MirrorViewObserver} from "./MirrorViewObserver";
import {ChargeView} from "./ChargeView";

export class MirrorViewController extends GraphicViewController<MirrorView> implements MirrorViewObserver {
  mirrorDidPressDown(charge: ChargeView, view: MirrorView): void {
    // hook
  }

  mirrorDidPressHold(charge: ChargeView, view: MirrorView): void {
    // hook
  }

  mirrorDidPressMove(charge: ChargeView, view: MirrorView): void {
    // hook
  }

  mirrorDidPressUp(charge: ChargeView, view: MirrorView): void {
    // hook
  }
}
