import { BoardController, BoardView } from "@swim/panel";
import { Uri } from "@swim/uri";
import { ControllerRef, TraitViewRef } from "@swim/controller";
import { MirrorController } from "./MirrorController";
import { HtmlView } from "@swim/dom";
import { Trait } from "@swim/model";
import { SheetView } from "@swim/sheet";

export class AppController extends BoardController {
  constructor() {
    super();

    const query = window.location.search;
    const urlParams = new URLSearchParams(query);
    let host = urlParams.get("host");
    if (!host) {
      const baseUri = Uri.parse(document.location.href);
      host = baseUri
        .base()
        .withScheme(baseUri.schemeName === "https" ? "warps" : "warp")
        .toString();
    }
    let node = "mirror/wall";
    this.hostUri.set(host);

    console.log("end constructor AppController");
  }

  protected override willMount(): void {
    console.log("willMount AppController");
  }

  protected override onMount(): void {
    console.log("onMount AppController");

    const fooDiv = HtmlView.fromNode(document.createElement("div")).set({
      text: "FOO DIV in AppController",
    });
    this.sheet.view?.appendChild(fooDiv);

    this.mirrorController.attachController();
  }

  protected override didMount(): void {
    console.log("didMount AppController");
  }

  protected override willUnmount(): void {
    console.log("didUnmount");
  }

  // @TraitViewRef({
  //   viewType: SheetView,
  // })
  // override readonly sheet!: TraitViewRef<this, Trait, BoardView>;

  @ControllerRef({
    controllerType: MirrorController,
  })
  readonly mirrorController!: ControllerRef<this, MirrorController>;
}
