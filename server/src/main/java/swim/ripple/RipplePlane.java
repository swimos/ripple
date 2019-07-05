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

import swim.api.SwimAgent;
import swim.api.SwimRoute;
import swim.api.agent.AgentRoute;
import swim.api.kernel.Kernel;
import swim.api.plane.AbstractPlane;
import swim.server.ServerLoader;

public class RipplePlane extends AbstractPlane {
  @SwimAgent("mirror")
  @SwimRoute("/mirror/:id")
  AgentRoute<MirrorAgent> mirrorAgent;

  public static void main(String[] args) {
    final Kernel kernel = ServerLoader.loadServer();
    final RipplePlane plane = kernel.getPlane("ripple");

    kernel.start();
    System.out.println("Running RipplePlane...");

    kernel.run(); // blocks until termination
  }
}
