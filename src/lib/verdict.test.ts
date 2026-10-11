import assert from "node:assert/strict";
import test from "node:test";
import { verdicts, worst } from "./verdict";

test("matching Intel socket is compatible and BIOS stays conditional", () => {
  const list = verdicts({ "cpu-i3-12100": 1, "mb-b760m4": 1 });
  const socket = list.find((row) => row.id === "socket");
  const bios = list.find((row) => row.id === "bios");
  assert.equal(socket?.status, "compatible");
  assert.equal(bios?.status, "conditional");
  assert.match(bios?.missing ?? "", /BIOS/);
});

test("AM4 chip on an LGA1700 board is incompatible", () => {
  const list = verdicts({ "cpu-r5600": 1, "mb-b760m4": 1 });
  const socket = list.find((row) => row.id === "socket");
  assert.equal(socket?.status, "incompatible");
  assert.equal(worst(list), "incompatible");
});

test("DDR5 on a DDR4 board is incompatible, in plain language", () => {
  const list = verdicts({ "mb-b760m4": 1, "ram-d5-32": 1 });
  const ram = list.find((row) => row.id.startsWith("ram-mb"));
  assert.equal(ram?.status, "incompatible");
  assert.match(ram?.why ?? "", /DDR4/);
  assert.match(ram?.why ?? "", /will not fit/);
});

test("air cooler plus memory is unknown, not a green check", () => {
  const list = verdicts({ "cooler-pa120": 1, "ram-d4-16": 1 });
  const row = list.find((item) => item.id === "ram-height");
  assert.equal(row?.status, "unknown");
  assert.equal(worst(list), "unknown");
});
