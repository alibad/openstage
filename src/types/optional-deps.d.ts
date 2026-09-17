declare module "tldraw" {
  import { ComponentType } from "react";
  export const Tldraw: ComponentType<Record<string, unknown>>;
}

declare module "@rive-app/react-canvas" {
  import { ComponentType } from "react";
  const RiveComponent: ComponentType<Record<string, unknown>>;
  export default RiveComponent;
}

declare module "@splinetool/react-spline" {
  import { ComponentType } from "react";
  const Spline: ComponentType<Record<string, unknown>>;
  export default Spline;
}
