import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { useState } from "react"

import { Toaster } from "@/components/ui/sonner"
import { routeTree } from "@/routeTree"

export function App() {
  const [queryClient] = useState(() => new QueryClient())
  const [router] = useState(() =>
    createRouter({
      routeTree,
      context: {
        queryClient,
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ queryClient }} />
      <Toaster />
    </QueryClientProvider>
  )
}

export default App

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
