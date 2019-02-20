open module swim.ripple {
  requires transitive swim.loader;

  exports swim.ripple;

  provides swim.api.plane.Plane with swim.ripple.RipplePlane;
}
