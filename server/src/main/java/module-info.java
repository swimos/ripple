open module swim.ripple {
  requires swim.recon;
  requires transitive swim.api;
  requires swim.server;

  exports swim.ripple;

  provides swim.api.plane.Plane with swim.ripple.RipplePlane;
}
