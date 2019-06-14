open module swim.ripple {
  requires transitive swim.server;
  requires swim.loader;

  exports swim.ripple;

  provides swim.api.plane.Plane with swim.ripple.RipplePlane;
}
