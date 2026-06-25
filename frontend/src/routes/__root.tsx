import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router"
import { ChevronDownIcon, LogOutIcon } from "lucide-react"
import type { QueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
      <header className="border-b border-neutral-800 bg-neutral-950 text-neutral-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/" className="min-w-0 text-sm font-semibold tracking-normal">
              MISP Nexus
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              <NavMenu
                label="Event Actions"
                items={[
                  { to: "/", label: "List Events" },
                  { to: "/events/add", label: "Add Event" },
                  { to: "/attributes", label: "List Attributes" },
                  { to: "/objects", label: "List Objects" },
                  { disabled: true, label: "Search Attributes" },
                  { disabled: true, label: "List Tags" },
                  { disabled: true, label: "Analyst Data" },
                ]}
              />
              <NavMenu
                label="Galaxies"
                items={[
                  { to: "/galaxies", label: "List Galaxies" },
                  { disabled: true, label: "Attach Cluster" },
                ]}
              />
              <NavMenu
                label="Taxonomies"
                items={[
                  { to: "/taxonomies", label: "List Taxonomies" },
                  { disabled: true, label: "Taxonomy Tags" },
                ]}
              />
              <NavMenu
                label="Global Actions"
                items={[
                  { disabled: true, label: "Dashboard" },
                  { disabled: true, label: "My Profile" },
                  { disabled: true, label: "Automation" },
                ]}
              />
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-xs text-neutral-400 md:block">
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
      className="border-neutral-700 bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
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

type NavItem = {
  label: string
  to?: string
  disabled?: boolean
}

function NavMenu({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-neutral-200 outline-none hover:bg-neutral-800 focus-visible:bg-neutral-800">
          {label}
          <ChevronDownIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {items.map((item) =>
            item.to ? (
              <DropdownMenuItem key={item.label} asChild>
                <Link to={item.to}>{item.label}</Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem key={item.label} disabled={item.disabled}>
                {item.label}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
