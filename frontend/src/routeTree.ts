import { Route as rootRoute } from "@/routes/__root"
import { Route as eventsAddRoute } from "@/routes/events/add"
import { Route as indexRoute } from "@/routes/index"
import { Route as loginRoute } from "@/routes/login"

export const routeTree = rootRoute.addChildren([
  indexRoute,
  eventsAddRoute,
  loginRoute,
])
