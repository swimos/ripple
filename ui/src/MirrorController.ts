import { CanvasView } from '@swim/graphics';
import { BoardController, BoardView, PanelView } from '@swim/panel';
import { Uri } from '@swim/uri';
import { View, ViewRef } from '@swim/view';

export class MirrorController extends BoardController {
  constructor() {
    super();

    const query = window.location.search;
    const urlParams = new URLSearchParams(query);
    let host = urlParams.get("host");
    if (!host) {
      const baseUri = Uri.parse(document.location.href);
      host = baseUri.base().withScheme(baseUri.schemeName === "https" ? "warps" : "warp").toString();
    }
    this.hostUri.set(host);
  }

  @ViewRef({
    viewType: CanvasView,
    get parentView(): View | null {
      return this.owner.sheet.insertView();
    },
    initView(canvasView: CanvasView): void {
      canvasView.set({
        style: {
          width: '100%',
          height: '100%',
        },
      });
    }
  })
  readonly canvas!: ViewRef<this, CanvasView>;
}
