import { PanelController } from "@swim/panel";
import { CanvasView } from "@swim/graphics";
import { Uri } from "@swim/uri";
import { View, ViewRef } from "@swim/view";
import { MirrorView } from "./MirrorView";
import { MapDownlink, ValueDownlink } from "@swim/client";
import { Value } from "@swim/structure";

export class MirrorController extends PanelController {
  constructor() {
    super();
    console.log("constructor MirrorController");

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

    console.log("this.ripplesDownlink.didSync: ", this.ripplesDownlink.didSync);
    this.ripplesDownlink.setHostUri(host);
    this.ripplesDownlink.setNodeUri(node);
    this.ripplesDownlink.setLaneUri("ripples");
    const rd = this.ripplesDownlink.open();
    console.log("rd: ", rd);

    this.chargesDownlink.setHostUri(host);
    this.chargesDownlink.setNodeUri(node);
    this.chargesDownlink.setLaneUri("charges");
    const cd = this.chargesDownlink.open();
    console.log("cd: ", cd);

    this.initBoard();

    console.log("end constructor MirrorController");
  }

  initBoard() {
    console.log("initBoard MirrorController");
    const panelView = this.panel.attachView();
    const canvasView = this.canvas.insertView(panelView);
    // console.log("panelView: ", panelView);
    console.log("canvasView: ", canvasView);
    console.log("finish initBoard");
  }

  protected override willMount(): void {
    console.log("willMount MirrorController");
  }

  protected override onMount(): void {
    console.log("onMount MirrorController");
    const panelView = this.panel.insertView();
    const canvasView = this.canvas.insertView(panelView);
    console.log("panelView: ", panelView);
    console.log("canvasView: ", canvasView);
    console.log("finish onMount");
  }

  protected override didMount(): void {
    console.log("didMount");
  }

  protected override willUnmount(): void {
    console.log("didUnmount MirrorController");
  }

  @ViewRef({
    viewType: CanvasView,
    // get parentView(): View | null {
    //   return ;
    // },
    initView(canvasView: CanvasView): void {
      canvasView.set({
        style: {
          width: "100%",
          height: "100%",
        },
      });

      this.owner.mirror.insertView(canvasView);
    },
  })
  readonly canvas!: ViewRef<this, CanvasView>;

  @ViewRef({
    viewType: MirrorView,
  })
  readonly mirror!: ViewRef<this, MirrorView>;

  @ValueDownlink({
    nodeUri: "mirror/wall",
    laneUri: "ripples",
    inherits: true,
    didLink() {
      console.log("didLink ripples");
    },
    didSync() {
      console.log("didSync ripples");
    },
    onEvent(body) {
      console.log("onEvent ripplesDownlink");
      console.log("body.stringValue(): ", body.stringValue());
    },
    onEventMessage(message) {
      console.log("onEventMessage ripplesDownlink");
      console.log("message.body.stringValue(): ", message.body.stringValue());
    },
    didSet(newValue, oldValue): void {
      console.log("didSet ripplesDownlink");
      console.log("newValue.stringValue(): ", newValue.stringValue());
      console.log("oldValue.stringValue(): ", oldValue.stringValue());
    },
  })
  readonly ripplesDownlink!: ValueDownlink<this>;

  @MapDownlink({
    nodeUri: "mirror/wall",
    laneUri: "charges",
    inherits: true,
    consumed: true,
    keyForm: Uri.form(),
    // observe: this,
    didUpdate(key, newValue, oldValue) {
      console.log("didUpdate chargesDownlink");
      console.log("key.stringValue: ", key.stringValue);
      console.log("newValue.stringValue(): ", newValue.stringValue());
      console.log("oldValue.stringValue(): ", oldValue.stringValue());
    },
  })
  readonly chargesDownlink!: MapDownlink<this, Uri, Value>;
}
