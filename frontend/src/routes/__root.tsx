import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import { LogOutIcon } from "lucide-react"
import type { QueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { getCurrentUser, logoutSession, type MispCurrentUser } from "@/lib/misp"

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: ["auth", "current-user"],
    queryFn: getCurrentUser,
    staleTime: 60_000,
    retry: false,
  })

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ context, location }) => {
    if (location.pathname === "/login") {
      return
    }

    try {
      await context.queryClient.ensureQueryData(currentUserQueryOptions())
    } catch {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: RootLayout,
})

function RootLayout() {
  const location = useLocation()
  const userQuery = useQuery({
    ...currentUserQueryOptions(),
    enabled: location.pathname !== "/login",
  })

  if (location.pathname === "/login") {
    return (
      <div className="min-h-svh bg-background text-foreground">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="min-w-0 text-sm font-semibold tracking-normal">
            MISP Nexus
          </Link>
          <div className="flex shrink-0 items-center gap-3">
            <nav className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">Events</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/events/add">Add Event</Link>
              </Button>
            </nav>
            <div className="hidden text-xs text-muted-foreground md:block">
              {userQuery.data?.User.email ?? ""}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}

function LogoutButton() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const logoutMutation = useMutation({
    mutationFn: logoutSession,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ["auth"] })
      await navigate({ to: "/login" })
    },
  })

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      <LogOutIcon data-icon="inline-start" />
      Logout
    </Button>
  )
}

export function getCurrentUserFromCache(queryClient: QueryClient) {
  return queryClient.getQueryData<MispCurrentUser>(["auth", "current-user"])
}
