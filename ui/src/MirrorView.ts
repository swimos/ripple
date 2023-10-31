import { GraphicsView } from "@swim/graphics";

export class MirrorView extends GraphicsView {
  _captive: boolean = false;

  constructor() {
    super();
    console.log("MirrorView constructor");
  }

  protected override onMount(): void {
    console.log("MirrorView onMount");
  }
}
