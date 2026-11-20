/**
 * GET /api/config → { live, marker }
 * The marker is the public affiliate ID (it appears in every booking link anyway).
 */
import { Ctx, json, live } from './_tp';

export const onRequestGet = (ctx: Ctx) =>
  json({ live: live(ctx.env), marker: ctx.env.TP_MARKER ?? '', tripProgram: ctx.env.TP_TRIP_PROGRAM ?? '' }, 200, 300);
