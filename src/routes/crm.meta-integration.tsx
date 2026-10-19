import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/crm/meta-integration")({
  beforeLoad: () => {
    throw redirect({ to: "/crm/leads" });
  },
  component: () => null,
});
