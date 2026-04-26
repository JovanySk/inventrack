/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    userId: number;
    userRole: string;
    userName: string;
    permissions: string[];
  }
}
