with import <nixpkgs> {};

{ nodeVersion ? "nodejs", pnpmVersion ? "pnpm", name ? "nodejsDevEnv" }:

stdenv.mkDerivation {
  name = "impureNodeEnv";
  buildInputs = [
    pkgs.${nodeVersion}
    pkgs.${pnpmVersion}
  ];
}
