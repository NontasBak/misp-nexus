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
import { listAttributes } from "@/lib/misp"
import { Route as rootRoute } from "@/routes/__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/attributes",
  component: AttributesIndexPage,
})

function AttributesIndexPage() {
  const attributesQuery = useQuery({
    queryKey: ["attributes"],
    queryFn: () => listAttributes(),
  })

  if (attributesQuery.isLoading) {
    return <Skeleton className="h-72 w-full" />
  }

  if (attributesQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load attributes</AlertTitle>
        <AlertDescription>
          {attributesQuery.error instanceof Error
            ? attributesQuery.error.message
            : "MISP did not return attributes."}
        </AlertDescription>
      </Alert>
    )
  }

  const attributes = attributesQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attributes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {attributes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No attributes available.
                </TableCell>
              </TableRow>
            ) : (
              attributes.map((attribute) => (
                <TableRow key={attribute.id}>
                  <TableCell>{attribute.id}</TableCell>
                  <TableCell>{attribute.event_id}</TableCell>
                  <TableCell>{attribute.category}</TableCell>
                  <TableCell>{attribute.type}</TableCell>
                  <TableCell className="max-w-xl truncate">
                    {attribute.value}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        to="/attributes/view/$attributeId"
                        params={{ attributeId: attribute.id }}
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
