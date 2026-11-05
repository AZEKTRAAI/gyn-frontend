// The jobs the worker knows how to run. Later phases add their own here:
//   send_email, generate_letter, recheck_payment, close_form, reconcile_payments  (docs/backend-plan.md)

import type { Handlers } from "./runner.ts";

export const handlers: Handlers = {
  // Does nothing. Lets an operator check that the whole path (app writes a job, worker runs it) works on a new server.
  noop: async () => {},
};
