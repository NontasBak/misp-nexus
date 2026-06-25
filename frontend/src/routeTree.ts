import { Route as rootRoute } from "@/routes/__root"
import { Route as attributesIndexRoute } from "@/routes/attributes/index"
import { Route as attributesViewRoute } from "@/routes/attributes/view"
import { Route as eventsAddRoute } from "@/routes/events/add"
import { Route as eventsEditRoute } from "@/routes/events/edit"
import { Route as eventsViewRoute } from "@/routes/events/view"
import { Route as galaxiesIndexRoute } from "@/routes/galaxies/index"
import { Route as galaxiesViewRoute } from "@/routes/galaxies/view"
import { Route as indexRoute } from "@/routes/index"
import { Route as loginRoute } from "@/routes/login"
import { Route as objectsIndexRoute } from "@/routes/objects/index"
import { Route as objectsViewRoute } from "@/routes/objects/view"
import { Route as taxonomiesIndexRoute } from "@/routes/taxonomies/index"
import { Route as taxonomiesViewRoute } from "@/routes/taxonomies/view"

export const routeTree = rootRoute.addChildren([
  indexRoute,
  eventsViewRoute,
  eventsAddRoute,
  eventsEditRoute,
  attributesIndexRoute,
  attributesViewRoute,
  objectsIndexRoute,
  objectsViewRoute,
  taxonomiesIndexRoute,
  taxonomiesViewRoute,
  galaxiesIndexRoute,
  galaxiesViewRoute,
  loginRoute,
])
