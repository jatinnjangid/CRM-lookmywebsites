import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import logoImg from "../assets/Logo.svg";
import { Toaster } from "@/components/ui/sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { applyAppearanceToDOM } from "../lib/theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/crm"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to CRM
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: any; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load. Error: {String(error.message)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LookMyHolidays CRM" },
      { name: "description", content: "LookMyHolidays CRM Portal" },
      { name: "author", content: "LookMyHolidays" },
      { property: "og:title", content: "LookMyHolidays CRM" },
      { property: "og:description", content: "LookMyHolidays CRM Portal" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "" },
    ],
    links: [
      {
        rel: "icon",
        type: "image/jpeg",
        href: logoImg,
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    try {
      const cleared = window.localStorage.getItem("crm_data_cleared_v1");
      if (!cleared) {
        const keysToClear = [
          "crm_bookings",
          "crm_leads_v2",
          "crm_customers_v2",
          "crm_tasks_v1",
          "crm_leaves_v1",
          "crm_attendance_v2",
          "crm_payment_requests_v1",
          "crm_vendors_v2",
          "crm_packages",
          "crm_visa_apps_v2",
          "crm_visa_requirements",
        ];
        keysToClear.forEach((key) => window.localStorage.removeItem(key));
        window.localStorage.setItem("crm_data_cleared_v1", "true");
        window.location.reload();
        return;
      }

      const stored = window.localStorage.getItem("crm-appearance");
      if (stored) {
        applyAppearanceToDOM(appearance);
      }
    } catch (e) {
      console.error("Error applying appearance settings:", e);
    }
  }, []);

  // Use a placeholder clientId so GoogleOAuthProvider never receives an empty string
  // (which causes useGoogleLogin to throw). Real Google Drive login requires VITE_GOOGLE_DRIVE_CLIENT_ID.
  const googleClientId =
    (import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID as string | undefined) ||
    "placeholder-not-configured.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-right" closeButton richColors />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
