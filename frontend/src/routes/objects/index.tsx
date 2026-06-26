import { useQuery } from "@tanstack/react-query"
import { Link, createRoute } from "@tanstack/react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listObjects } from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/objects",
  component: ObjectsIndexPage,
})

function ObjectsIndexPage() {
  const objectsQuery = useQuery({
    queryKey: ["objects"],
    queryFn: () => listObjects(),
  })

  if (objectsQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />
  }

  if (objectsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load objects</AlertTitle>
        <AlertDescription>
          {objectsQuery.error instanceof Error
            ? objectsQuery.error.message
            : "MISP did not return objects."}
        </AlertDescription>
      </Alert>
    )
  }

  const objects = objectsQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Objects</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Meta-category</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {objects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No objects available.
                </TableCell>
              </TableRow>
            ) : (
              objects.map((object) => (
                <TableRow key={object.id}>
                  <TableCell>{object.id}</TableCell>
                  <TableCell>{object.event_id}</TableCell>
                  <TableCell>{object.name ?? "-"}</TableCell>
                  <TableCell>{object["meta-category"] ?? "-"}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        to="/objects/view/$objectId"
                        params={{ objectId: object.id }}
                      >
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
