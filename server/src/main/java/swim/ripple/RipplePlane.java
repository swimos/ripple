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

import java.io.IOException;
import swim.api.SwimRoute;
import swim.api.agent.AgentType;
import swim.api.plane.AbstractPlane;
import swim.api.plane.PlaneContext;
import swim.api.server.ServerContext;
import swim.loader.ServerLoader;

public class RipplePlane extends AbstractPlane {

  @SwimRoute("/mirror/:id")
  final AgentType<?> mirrorAgent = agentClass(MirrorAgent.class);

  public static void main(String[] args) throws IOException, InterruptedException {
    final ServerContext server = ServerLoader.load(RipplePlane.class.getModule()).serverContext();
    final PlaneContext plane = server.getPlane("ripple").planeContext();

    server.start();
    System.out.println("Running RipplePlane...");
    server.run();
  }
}
